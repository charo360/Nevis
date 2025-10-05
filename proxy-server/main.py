from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import httpx
import os
from collections import defaultdict
from datetime import datetime
import json
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Nevis AI Proxy", description="Controlled AI model proxy to prevent unexpected costs")

# In-memory credit tracking (credit-based system)
user_credits = defaultdict(lambda: {"credits": 0, "tier": "free", "last_updated": ""})

# Tier-based credit packages (one-time purchase)
TIER_CREDITS = {
    "free": 10,        # 10 credits - Free trial
    "basic": 40,       # 40 credits - $9.99 package
    "premium": 100,    # 100 credits - $24.99 package
    "pro": 250,        # 250 credits - $59.99 package
    "enterprise": 1000 # 1000 credits - $199.99 package
}

# Cost tracking per generation type
GENERATION_COSTS = {
    "text": 0.00065,    # Text generation cost
    "image": 0.03903,   # Image generation cost
    "complete": 0.03968 # Complete post (text + image)
}

# Allowed models to prevent unexpected model calls - Based on actual Nevis usage
ALLOWED_MODELS = {
    # Primary models used in Revo services (REMOVED gemini-2.5-pro - TOO EXPENSIVE)
    "gemini-2.5-flash-image-preview": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent",
    "gemini-2.5-flash": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    "gemini-2.5-flash-lite": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",

    # Legacy models (only if absolutely needed for fallback)
    "gemini-1.5-flash": "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    # REMOVED ALL EXPERIMENTAL MODELS - POTENTIAL HIGH COSTS:
    # - gemini-2.0-flash-exp-image-generation
    # - gemini-2.5-flash-exp, experimental, thinking-exp variants
    # - gemini-exp-1206, gemini-exp-1121
    # - All versioned models (002, 001, etc.)
    # - gemini-2.0-flash (legacy)
}

# Tier-based model access (optional - restrict models by tier)
TIER_MODELS = {
    "free": ["gemini-2.5-flash-lite"],  # Only cheapest model
    "basic": ["gemini-2.5-flash-lite", "gemini-2.5-flash"],
    "premium": ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.5-flash-image-preview"],
    "pro": list(ALLOWED_MODELS.keys()),  # All approved models
    "enterprise": list(ALLOWED_MODELS.keys())  # All approved models
}

class ImageRequest(BaseModel):
    prompt: str
    user_id: str
    user_tier: Optional[str] = "free"  # User's subscription tier
    model: Optional[str] = "gemini-2.5-flash-image-preview"
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7

class TextRequest(BaseModel):
    prompt: str
    user_id: str
    user_tier: Optional[str] = "free"  # User's subscription tier
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

def validate_tier_model_access(tier: str, model: str) -> bool:
    """Validate that the user's tier has access to the requested model"""
    if tier not in TIER_MODELS:
        logger.warning(f"Unknown tier: {tier}, defaulting to free tier")
        tier = "free"

    allowed_models = TIER_MODELS[tier]
    if model not in allowed_models:
        logger.error(f"Tier {tier} blocked from using model {model}")
        raise HTTPException(
            status_code=403,
            detail=f"Your {tier} tier doesn't have access to {model}. Available models: {allowed_models}"
        )

    return True

def get_tier_credits(tier: str) -> int:
    """Get credit amount for a tier package"""
    return TIER_CREDITS.get(tier, TIER_CREDITS["free"])

def add_credits_to_user(user_id: str, tier: str) -> dict:
    """Add credits to user when they purchase a tier package"""
    credits_to_add = get_tier_credits(tier)
    user_data = user_credits[user_id]

    user_data["credits"] += credits_to_add
    user_data["tier"] = tier
    user_data["last_updated"] = datetime.now().isoformat()

    logger.info(f"Added {credits_to_add} credits to user {user_id} (tier: {tier}). Total: {user_data['credits']}")
    return user_data

def check_user_credits(user_id: str, tier: str = "free") -> None:
    """Check if user has enough credits for the request"""
    user_data = user_credits[user_id]

    # Update tier info
    user_data["tier"] = tier

    if user_data["credits"] <= 0:
        logger.warning(f"User {user_id} ({tier} tier) has no credits remaining: {user_data['credits']}")
        raise HTTPException(
            status_code=429,
            detail=f"No credits remaining. You have {user_data['credits']} credits left. Purchase more credits to continue."
        )

def deduct_user_credit(user_id: str, tier: str = "free", generation_type: str = "complete") -> None:
    """Deduct one credit from user's balance and track cost"""
    user_data = user_credits[user_id]
    user_data["credits"] -= 1
    user_data["tier"] = tier
    user_data["last_updated"] = datetime.now().isoformat()

    # Track actual cost for analytics
    actual_cost = GENERATION_COSTS.get(generation_type, GENERATION_COSTS["complete"])
    if "total_cost" not in user_data:
        user_data["total_cost"] = 0
    user_data["total_cost"] += actual_cost

    logger.info(f"User {user_id} ({tier} tier) used 1 credit ({generation_type}). Cost: ${actual_cost:.5f}. Remaining: {user_data['credits']}")

def get_api_key_for_model(model: str) -> str:
    """Get the appropriate API key based on the model being used"""

    # Map models to specific API keys based on Nevis configuration
    # ONLY COST-EFFECTIVE MODELS ALLOWED
    model_to_key_mapping = {
        # Revo 1.0 models - Main image generation
        "gemini-2.5-flash-image-preview": "GOOGLE_API_KEY_REVO_1_0",

        # Revo 1.5 models - Content generation
        "gemini-2.5-flash": "GOOGLE_API_KEY_REVO_1_5",
        "gemini-2.5-flash-lite": "GOOGLE_API_KEY_REVO_1_5",

        # Legacy models - Fallback only
        "gemini-1.5-flash": "GOOGLE_API_KEY"

        # REMOVED ALL EXPENSIVE/EXPERIMENTAL MODELS:
        # - gemini-2.5-pro (TOO EXPENSIVE)
        # - All experimental models (UNKNOWN COSTS)
        # - All thinking-exp models (POTENTIALLY EXPENSIVE)
    }

    # Get the specific API key for this model
    key_env_name = model_to_key_mapping.get(model, "GOOGLE_API_KEY")
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
    
    # Validate model is allowed
    endpoint = validate_model(request.model)

    # Validate tier has access to this model
    validate_tier_model_access(request.user_tier, request.model)

    # Check user has enough credits
    check_user_credits(request.user_id, request.user_tier)

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
        deduct_user_credit(request.user_id, request.user_tier, "image")
        
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
    """Generate text with tier-based model control"""

    # Validate model is allowed
    endpoint = validate_model(request.model)

    # Validate tier has access to this model
    validate_tier_model_access(request.user_tier, request.model)

    # Check user has enough credits
    check_user_credits(request.user_id, request.user_tier)

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
        deduct_user_credit(request.user_id, request.user_tier, "text")
        
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

@app.get("/credits/{user_id}")
async def get_user_credits(user_id: str):
    """Get user's current credit balance and cost information"""
    user_data = user_credits[user_id]
    tier = user_data.get("tier", "free")
    total_cost = user_data.get("total_cost", 0)

    return {
        "user_id": user_id,
        "tier": tier,
        "credits_remaining": user_data["credits"],
        "total_ai_cost_incurred": f"${total_cost:.4f}",
        "last_updated": user_data.get("last_updated", ""),
        "tier_info": {
            "available_models": TIER_MODELS.get(tier, TIER_MODELS["free"]),
            "credit_package_size": get_tier_credits(tier),
            "cost_per_generation": {
                "text_only": f"${GENERATION_COSTS['text']:.5f}",
                "image_only": f"${GENERATION_COSTS['image']:.5f}",
                "complete_post": f"${GENERATION_COSTS['complete']:.5f}"
            }
        }
    }

# Keep old endpoint for backward compatibility
@app.get("/quota/{user_id}")
async def get_user_quota(user_id: str):
    """Legacy endpoint - redirects to credits"""
    return await get_user_credits(user_id)

@app.post("/purchase-credits/{user_id}")
async def purchase_credits(user_id: str, tier: str):
    """Purchase credit package for user"""
    if tier not in TIER_CREDITS:
        raise HTTPException(status_code=400, detail=f"Invalid tier package: {tier}. Valid packages: {list(TIER_CREDITS.keys())}")

    # Add credits to user account
    user_data = add_credits_to_user(user_id, tier)
    credits_added = get_tier_credits(tier)

    return {
        "user_id": user_id,
        "tier_package": tier,
        "credits_added": credits_added,
        "total_credits": user_data["credits"],
        "available_models": TIER_MODELS.get(tier, TIER_MODELS["free"]),
        "estimated_total_value": f"${user_data['credits'] * 0.039:.2f}"
    }

@app.post("/add-credits/{user_id}")
async def add_credits_manual(user_id: str, credits: int, tier: str = "free"):
    """Manually add credits to user (for admin use)"""
    if credits <= 0:
        raise HTTPException(status_code=400, detail="Credits must be positive")

    user_data = user_credits[user_id]
    user_data["credits"] += credits
    user_data["tier"] = tier
    user_data["last_updated"] = datetime.now().isoformat()

    logger.info(f"Manually added {credits} credits to user {user_id}. Total: {user_data['credits']}")

    return {
        "user_id": user_id,
        "credits_added": credits,
        "total_credits": user_data["credits"],
        "tier": tier
    }

@app.get("/stats")
async def get_stats():
    """Get proxy server statistics with accurate cost tracking"""
    total_users = len(user_credits)
    total_credits_remaining = sum(data["credits"] for data in user_credits.values())
    total_actual_cost = sum(data.get("total_cost", 0) for data in user_credits.values())

    # Tier breakdown with accurate costs
    tier_stats = {}
    for tier in TIER_CREDITS.keys():
        tier_users = [data for data in user_credits.values() if data.get("tier", "free") == tier]
        tier_cost = sum(data.get("total_cost", 0) for data in tier_users)
        tier_stats[tier] = {
            "users": len(tier_users),
            "credit_package_size": TIER_CREDITS[tier],
            "actual_ai_cost": f"${tier_cost:.4f}",
            "max_possible_cost": f"${TIER_CREDITS[tier] * GENERATION_COSTS['complete']:.2f}"
        }

    return {
        "status": "healthy",
        "total_users": total_users,
        "total_credits_remaining": total_credits_remaining,
        "total_actual_ai_cost": f"${total_actual_cost:.4f}",
        "allowed_models": list(ALLOWED_MODELS.keys()),
        "blocked_models": ["gemini-2.5-pro", "all experimental models"],
        "generation_costs": {
            "text_only": f"${GENERATION_COSTS['text']:.5f}",
            "image_only": f"${GENERATION_COSTS['image']:.5f}",
            "complete_post": f"${GENERATION_COSTS['complete']:.5f}"
        },
        "tier_breakdown": tier_stats,
        "credit_packages": TIER_CREDITS
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
