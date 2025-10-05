from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import httpx
import os
from collections import defaultdict
from datetime import datetime
import json
import logging
from typing import Optional, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Nevis AI Proxy", description="Controlled AI model proxy to prevent unexpected costs")

# In-memory rate limiting (good for <1000 users)
user_quotas = defaultdict(lambda: {"count": 0, "month": ""})

# Allowed models to prevent unexpected model calls - Based on actual Nevis usage
ALLOWED_MODELS = {
    # Primary models used in Revo services
    "gemini-2.5-flash-image-preview": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent",
    "gemini-2.5-flash": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    "gemini-2.5-pro": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
    "gemini-2.5-flash-lite": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",

    # Experimental models found in test files (use with caution)
    "gemini-2.0-flash-exp-image-generation": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent",
    "gemini-2.5-flash-exp": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-exp:generateContent",
    "gemini-2.5-flash-experimental": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-experimental:generateContent",
    "gemini-2.5-flash-thinking-exp": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-thinking-exp:generateContent",
    "gemini-2.5-flash-thinking-exp-01-21": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-thinking-exp-01-21:generateContent",
    "gemini-2.5-flash-thinking-exp-1219": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-thinking-exp-1219:generateContent",
    "gemini-2.5-flash-002": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-002:generateContent",
    "gemini-2.5-flash-001": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-001:generateContent",
    "gemini-exp-1206": "https://generativelanguage.googleapis.com/v1beta/models/gemini-exp-1206:generateContent",
    "gemini-exp-1121": "https://generativelanguage.googleapis.com/v1beta/models/gemini-exp-1121:generateContent",

    # Legacy models (if still needed)
    "gemini-1.5-flash": "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    "gemini-2.0-flash": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
}

class ImageRequest(BaseModel):
    prompt: str
    user_id: str
    model: Optional[str] = "gemini-2.5-flash-image-preview"
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7

class TextRequest(BaseModel):
    prompt: str
    user_id: str
    model: Optional[str] = "gemini-2.5-flash"
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7

def validate_model(model: str) -> str:
    """Validate that the requested model is allowed"""
    if model not in ALLOWED_MODELS:
        logger.warning(f"Blocked unauthorized model request: {model}")
        raise HTTPException(
            status_code=400, 
            detail=f"Model '{model}' not allowed. Allowed models: {list(ALLOWED_MODELS.keys())}"
        )
    return ALLOWED_MODELS[model]

def check_user_quota(user_id: str, limit: int = 40) -> None:
    """Check if user has exceeded their monthly quota"""
    current_month = datetime.now().strftime("%Y-%m")
    user_data = user_quotas[user_id]
    
    if user_data["month"] != current_month:
        user_data = {"count": 0, "month": current_month}
        user_quotas[user_id] = user_data
    
    if user_data["count"] >= limit:
        logger.warning(f"User {user_id} exceeded quota: {user_data['count']}/{limit}")
        raise HTTPException(status_code=429, detail=f"Monthly quota exceeded ({user_data['count']}/{limit})")

def increment_user_quota(user_id: str) -> None:
    """Increment user's quota count"""
    user_quotas[user_id]["count"] += 1
    logger.info(f"User {user_id} quota: {user_quotas[user_id]['count']}/40")

def get_api_key_for_model(model: str) -> str:
    """Get the appropriate API key based on the model being used"""

    # Map models to specific API keys based on Nevis configuration
    model_to_key_mapping = {
        # Revo 1.0 models
        "gemini-2.5-flash-image-preview": "GEMINI_API_KEY_REVO_1_0",

        # Revo 1.5 models
        "gemini-2.5-flash": "GEMINI_API_KEY_REVO_1_5",
        "gemini-2.5-flash-lite": "GEMINI_API_KEY_REVO_1_5",

        # Revo 2.0 models
        "gemini-2.5-pro": "GEMINI_API_KEY_REVO_2_0",
        "gemini-2.0-flash-exp-image-generation": "GEMINI_API_KEY_REVO_2_0",

        # Experimental models - use Revo 2.0 key
        "gemini-2.5-flash-exp": "GEMINI_API_KEY_REVO_2_0",
        "gemini-2.5-flash-experimental": "GEMINI_API_KEY_REVO_2_0",
        "gemini-2.5-flash-thinking-exp": "GEMINI_API_KEY_REVO_2_0",
        "gemini-2.5-flash-thinking-exp-01-21": "GEMINI_API_KEY_REVO_2_0",
        "gemini-2.5-flash-thinking-exp-1219": "GEMINI_API_KEY_REVO_2_0",
        "gemini-2.5-flash-002": "GEMINI_API_KEY_REVO_2_0",
        "gemini-2.5-flash-001": "GEMINI_API_KEY_REVO_2_0",
        "gemini-exp-1206": "GEMINI_API_KEY_REVO_2_0",
        "gemini-exp-1121": "GEMINI_API_KEY_REVO_2_0",

        # Legacy models - use general key
        "gemini-1.5-flash": "GEMINI_API_KEY",
        "gemini-2.0-flash": "GEMINI_API_KEY"
    }

    # Get the specific API key for this model
    key_env_name = model_to_key_mapping.get(model, "GEMINI_API_KEY")
    api_key = os.environ.get(key_env_name)

    # Fallback to general Google API key if specific key not found
    if not api_key:
        api_key = os.environ.get('GOOGLE_API_KEY') or os.environ.get('GEMINI_API_KEY')

    if not api_key:
        logger.error(f"No API key found for model {model}. Tried {key_env_name}, GOOGLE_API_KEY, GEMINI_API_KEY")
        raise HTTPException(status_code=500, detail=f"API key not configured for model {model}")

    logger.info(f"Using API key {key_env_name} for model {model}")
    return api_key

async def call_google_api(endpoint: str, payload: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    """Make controlled call to Google API with exact model specified"""
    
    # Log the exact request being made
    logger.info(f"Making request to: {endpoint}")
    logger.info(f"Payload model check: {payload}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            endpoint,
            headers={
                "x-goog-api-key": api_key,
                "Content-Type": "application/json"
            },
            json=payload
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"Successful response from {endpoint}")
            return {"success": True, "data": result}
        else:
            error_msg = f"Google API failed: {response.status_code} - {response.text}"
            logger.error(error_msg)
            raise Exception(error_msg)

@app.post("/generate-image")
async def generate_image(request: ImageRequest):
    """Generate image with strict model control"""
    
    # Validate model
    endpoint = validate_model(request.model)
    
    # Check quota
    check_user_quota(request.user_id)

    # Get model-specific API key
    api_key = get_api_key_for_model(request.model)
    
    # Prepare payload with strict model specification
    payload = {
        "contents": [{"parts": [{"text": request.prompt}]}],
        "generationConfig": {
            "temperature": request.temperature,
            "maxOutputTokens": request.max_tokens,
            # Only include response_modalities for image models
            **({"responseModalities": ["IMAGE"]} if "image" in request.model else {})
        }
    }
    
    try:
        result = await call_google_api(endpoint, payload, api_key)
        increment_user_quota(request.user_id)
        
        return {
            "success": True,
            "data": result["data"],
            "model_used": request.model,
            "endpoint_used": endpoint,
            "user_quota": user_quotas[request.user_id]["count"]
        }
        
    except Exception as e:
        logger.error(f"Image generation failed: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Image generation failed: {str(e)}")

@app.post("/generate-text")
async def generate_text(request: TextRequest):
    """Generate text with strict model control"""
    
    # Validate model
    endpoint = validate_model(request.model)
    
    # Check quota
    check_user_quota(request.user_id)

    # Get model-specific API key
    api_key = get_api_key_for_model(request.model)
    
    # Prepare payload with strict model specification
    payload = {
        "contents": [{"parts": [{"text": request.prompt}]}],
        "generationConfig": {
            "temperature": request.temperature,
            "maxOutputTokens": request.max_tokens
        }
    }
    
    try:
        result = await call_google_api(endpoint, payload, api_key)
        increment_user_quota(request.user_id)
        
        return {
            "success": True,
            "data": result["data"],
            "model_used": request.model,
            "endpoint_used": endpoint,
            "user_quota": user_quotas[request.user_id]["count"]
        }
        
    except Exception as e:
        logger.error(f"Text generation failed: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Text generation failed: {str(e)}")

@app.get("/health")
async def health():
    return {"status": "healthy", "allowed_models": list(ALLOWED_MODELS.keys())}

@app.get("/quota/{user_id}")
async def get_user_quota(user_id: str):
    """Get user's current quota usage"""
    current_month = datetime.now().strftime("%Y-%m")
    user_data = user_quotas[user_id]
    
    if user_data["month"] != current_month:
        user_data = {"count": 0, "month": current_month}
    
    return {
        "user_id": user_id,
        "current_usage": user_data["count"],
        "monthly_limit": 40,
        "remaining": 40 - user_data["count"],
        "month": current_month
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
