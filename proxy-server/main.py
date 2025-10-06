from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import httpx
import os
from collections import defaultdict
from datetime import datetime
import json
import logging
from typing import Optional, Dict, Any, Tuple, List
from dotenv import load_dotenv
import base64
from io import BytesIO
from PIL import Image
import colorsys
from collections import Counter

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_colors_from_image(image_data_uri: str, num_colors: int = 5) -> Dict[str, Any]:
    """
    Extract dominant colors from a base64 encoded image
    Returns a dictionary with primary, secondary, accent colors and description
    """
    try:
        # Parse the data URI
        if not image_data_uri.startswith('data:image/'):
            return None

        # Extract base64 data
        header, encoded = image_data_uri.split(',', 1)
        image_data = base64.b64decode(encoded)

        # Open image with PIL
        image = Image.open(BytesIO(image_data))

        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Resize image for faster processing (max 200x200)
        image.thumbnail((200, 200), Image.Resampling.LANCZOS)

        # Get all pixels
        pixels = list(image.getdata())

        # Count color frequencies
        color_counts = Counter(pixels)

        # Get most common colors
        most_common = color_counts.most_common(num_colors * 3)  # Get more to filter out grays/whites

        # Filter out very light colors (whites/grays) and very dark colors (blacks)
        filtered_colors = []
        for color, count in most_common:
            r, g, b = color
            # Convert to HSV to check saturation and brightness
            h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)

            # Skip colors that are too light (whites), too dark (blacks), or too gray (low saturation)
            if v > 0.2 and v < 0.95 and s > 0.1:  # Good brightness and saturation
                filtered_colors.append((color, count))

            if len(filtered_colors) >= num_colors:
                break

        # If we don't have enough colors after filtering, add some of the original colors
        if len(filtered_colors) < 3:
            for color, count in most_common:
                if (color, count) not in filtered_colors:
                    filtered_colors.append((color, count))
                if len(filtered_colors) >= 3:
                    break

        # Convert to hex colors
        hex_colors = []
        for color, count in filtered_colors[:num_colors]:
            r, g, b = color
            hex_color = f"#{r:02x}{g:02x}{b:02x}".upper()
            hex_colors.append(hex_color)

        # Ensure we have at least 3 colors
        while len(hex_colors) < 3:
            hex_colors.append("#3B82F6")  # Default blue

        # Create color palette object
        color_palette = {
            "primary": hex_colors[0] if len(hex_colors) > 0 else "#3B82F6",
            "secondary": hex_colors[1] if len(hex_colors) > 1 else "#10B981",
            "accent": hex_colors[2] if len(hex_colors) > 2 else "#8B5CF6",
            "description": f"Color palette extracted from design image with {len(hex_colors)} dominant colors: {', '.join(hex_colors[:3])}"
        }

        logger.info(f"🎨 Extracted colors from image: {color_palette}")
        return color_palette

    except Exception as e:
        logger.error(f"❌ Color extraction failed: {e}")
        return None

def analyze_design_images(design_images: List[str]) -> Dict[str, Any]:
    """
    Analyze multiple design images and extract a unified color palette
    """
    if not design_images:
        return None

    all_colors = []
    successful_extractions = 0

    for i, image_uri in enumerate(design_images):
        logger.info(f"🎨 Analyzing design image {i+1}/{len(design_images)}")
        color_data = extract_colors_from_image(image_uri)
        if color_data:
            all_colors.extend([color_data["primary"], color_data["secondary"], color_data["accent"]])
            successful_extractions += 1

    if successful_extractions == 0:
        logger.warning("⚠️ No colors could be extracted from design images")
        return None

    # Remove duplicates and get most common colors
    color_counts = Counter(all_colors)
    most_common_colors = [color for color, count in color_counts.most_common(5)]

    # Ensure we have at least 3 unique colors
    unique_colors = list(dict.fromkeys(most_common_colors))  # Remove duplicates while preserving order
    while len(unique_colors) < 3:
        unique_colors.append("#3B82F6")  # Add default colors if needed

    unified_palette = {
        "primary": unique_colors[0],
        "secondary": unique_colors[1],
        "accent": unique_colors[2],
        "description": f"Unified color palette extracted from {successful_extractions} design images. Primary colors: {', '.join(unique_colors[:3])}"
    }

    logger.info(f"🎨 Unified color palette: {unified_palette}")
    return unified_palette

app = FastAPI(title="Nevis AI Proxy", description="Controlled AI model proxy to prevent unexpected costs")

# In-memory credit tracking (credit-based system) - Updated with generous free credits
user_credits = defaultdict(lambda: {"credits": 100, "tier": "free", "last_updated": ""})

# Tier-based credit packages (one-time purchase)
TIER_CREDITS = {
    "free": 100,       # 100 credits - Generous free trial (same as premium)
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

# OpenRouter model mapping for fallback system
OPENROUTER_MODEL_MAPPING = {
    # Direct Google model equivalents on OpenRouter
    "gemini-2.5-flash-image-preview": "google/gemini-2.5-flash-image-preview",
    "gemini-2.5-flash": "google/gemini-2.5-flash",
    "gemini-2.5-flash-lite": "google/gemini-2.5-flash-lite",
    "gemini-1.5-flash": "google/gemini-1.5-flash",
}

# Website Analysis Models (Best → Budget fallback order)
WEBSITE_ANALYSIS_MODELS = [
    "anthropic/claude-3-haiku",      # Primary: Best for website analysis, 85% cheaper
    "openai/gpt-4o-mini",            # Secondary: Most reliable, 70% cheaper
    "openai/gpt-3.5-turbo",          # Tertiary: Budget backup, 90% cheaper
]

# Alternative high-quality models for secondary fallback
OPENROUTER_ALTERNATIVE_MODELS = {
    # For text generation, use Claude as high-quality alternative
    "text": "anthropic/claude-3.5-sonnet",
    # For image generation, keep trying Google models
    "image": "google/gemini-2.5-flash-image-preview"
}

# OpenRouter configuration
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY')

# Tier-based model access (updated - free tier gets same access as paid)
TIER_MODELS = {
    "free": list(ALLOWED_MODELS.keys()),  # All approved models (same as paid)
    "basic": list(ALLOWED_MODELS.keys()),  # All approved models
    "premium": list(ALLOWED_MODELS.keys()),  # All approved models
    "pro": list(ALLOWED_MODELS.keys()),  # All approved models
    "enterprise": list(ALLOWED_MODELS.keys())  # All approved models
}

class ImageRequest(BaseModel):
    prompt: str
    user_id: str
    user_tier: Optional[str] = "free"  # User's subscription tier
    model: Optional[str] = "gemini-2.5-flash-image-preview"
    revo_version: Optional[str] = None  # "1.0", "1.5", or "2.0" for API key selection
    max_tokens: Optional[int] = 8192
    temperature: Optional[float] = 0.7
    logoImage: Optional[str] = None  # Logo image data URL for brand integration

class TextRequest(BaseModel):
    prompt: str
    user_id: str
    user_tier: Optional[str] = "free"  # User's subscription tier
    model: Optional[str] = "gemini-2.5-flash"
    revo_version: Optional[str] = None  # "1.0", "1.5", or "2.0" for API key selection
    max_tokens: Optional[int] = 8192
    temperature: Optional[float] = 0.7

class WebsiteAnalysisRequest(BaseModel):
    website_content: str
    website_url: str
    user_id: str
    user_tier: Optional[str] = "free"
    design_images: Optional[List[str]] = None  # Base64 encoded images
    max_tokens: Optional[int] = 8192
    temperature: Optional[float] = 0.3  # Lower temperature for more consistent analysis

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

def get_api_key_for_model(model: str, revo_version: str = None) -> str:
    """Get the appropriate API key based on the model and Revo version being used"""

    # Handle Revo version-specific routing for shared models
    if revo_version:
        if revo_version == "2.0" and model == "gemini-2.5-flash-image-preview":
            # Revo 2.0 uses its own API key for image generation
            key_env_name = "GOOGLE_API_KEY_REVO_2_0"
        elif revo_version == "1.0" and model == "gemini-2.5-flash-image-preview":
            # Revo 1.0 uses its own API key for image generation
            key_env_name = "GOOGLE_API_KEY_REVO_1_0"
        else:
            # Use default mapping for other cases
            key_env_name = get_default_key_for_model(model)
    else:
        # Use default mapping when no Revo version specified
        key_env_name = get_default_key_for_model(model)

    api_key = os.environ.get(key_env_name)

    if not api_key:
        logger.error(f"API key {key_env_name} not found for model {model} (Revo {revo_version})")
        raise HTTPException(
            status_code=500,
            detail=f"API key not configured for model {model}"
        )

    logger.info(f"Using API key {key_env_name} for model {model}")
    return api_key

def get_default_key_for_model(model: str) -> str:
    """Get the default API key mapping for a model"""
    # Map models to specific API keys based on Nevis configuration
    # ONLY COST-EFFECTIVE MODELS ALLOWED
    model_to_key_mapping = {
        # Revo 1.0 models - Main image generation (Enhanced with Gemini 2.5 Flash Image Preview)
        "gemini-2.5-flash-image-preview": "GOOGLE_API_KEY_REVO_1_0",

        # Revo 1.5 models - Content generation (Text-focused models)
        "gemini-2.5-flash": "GOOGLE_API_KEY_REVO_1_5",
        "gemini-2.5-flash-lite": "GOOGLE_API_KEY_REVO_1_5",

        # Legacy models - Fallback only
        "gemini-1.5-flash": "GOOGLE_API_KEY"

        # REMOVED ALL EXPENSIVE/EXPERIMENTAL MODELS:
        # - gemini-2.5-pro (TOO EXPENSIVE)
        # - All experimental models (UNKNOWN COSTS)
        # - All thinking-exp models (POTENTIALLY EXPENSIVE)
    }

    return model_to_key_mapping.get(model, "GOOGLE_API_KEY")

    # Fallback to general Google API key if specific key not found
    if not api_key:
        api_key = os.environ.get('GOOGLE_API_KEY') or os.environ.get('GEMINI_API_KEY')

    if not api_key:
        logger.error(f"No API key found for model {model}. Tried {key_env_name}, GOOGLE_API_KEY, GEMINI_API_KEY")
        raise HTTPException(status_code=500, detail=f"API key not configured for model {model}")

    logger.info(f"Using API key {key_env_name} for model {model}")
    return api_key

def convert_google_to_openai_format(payload: Dict[str, Any], model: str) -> Dict[str, Any]:
    """Convert Google API format to OpenAI-compatible format for OpenRouter"""

    # Extract the prompt from Google format
    content_parts = payload.get("contents", [{}])[0].get("parts", [])
    messages = []

    for part in content_parts:
        if "text" in part:
            messages.append({"role": "user", "content": part["text"]})
        elif "inlineData" in part:
            # Handle image data for multimodal requests
            messages.append({
                "role": "user",
                "content": [
                    {"type": "image_url", "image_url": {"url": f"data:{part['inlineData']['mimeType']};base64,{part['inlineData']['data']}"}}
                ]
            })

    # Convert generation config
    generation_config = payload.get("generationConfig", {})
    openai_payload = {
        "model": OPENROUTER_MODEL_MAPPING.get(model, model),
        "messages": messages,
        "temperature": generation_config.get("temperature", 0.7),
        "max_tokens": generation_config.get("maxOutputTokens", 8192)
    }

    # Add image generation specific parameters
    if "image" in model:
        openai_payload["modalities"] = ["image", "text"]

    return openai_payload

def convert_openai_to_google_format(openai_response: Dict[str, Any]) -> Dict[str, Any]:
    """Convert OpenAI/OpenRouter response back to Google API format"""

    choices = openai_response.get("choices", [])
    if not choices:
        return {"candidates": []}

    choice = choices[0]
    message = choice.get("message", {})
    content = message.get("content", "")

    # Handle different content types
    parts = []
    if isinstance(content, str):
        parts.append({"text": content})
    elif isinstance(content, list):
        for item in content:
            if item.get("type") == "text":
                parts.append({"text": item.get("text", "")})
            elif item.get("type") == "image_url":
                # Handle image responses
                image_url = item.get("image_url", {}).get("url", "")
                if image_url.startswith("data:"):
                    # Extract base64 data
                    parts.append({"inlineData": {"data": image_url.split(",")[1], "mimeType": "image/jpeg"}})

    return {
        "candidates": [{
            "content": {"parts": parts},
            "finishReason": choice.get("finish_reason", "STOP"),
            "index": 0
        }],
        "usageMetadata": openai_response.get("usage", {})
    }

async def call_openrouter_api(model: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Make API call to OpenRouter with format conversion"""

    if not OPENROUTER_API_KEY:
        raise Exception("OpenRouter API key not configured")

    # Convert Google format to OpenAI format
    openai_payload = convert_google_to_openai_format(payload, model)

    logger.info(f"🔄 Making OpenRouter request with model: {openai_payload['model']}")
    logger.info(f"🔄 OpenRouter payload: {json.dumps(openai_payload, indent=2)}")

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://nevis.ai",  # Optional: for OpenRouter analytics
                "X-Title": "Nevis AI Platform"  # Optional: for OpenRouter analytics
            },
            json=openai_payload
        )

        if response.status_code == 200:
            openai_result = response.json()
            # Convert back to Google format
            google_result = convert_openai_to_google_format(openai_result)
            logger.info(f"✅ OpenRouter API successful with model: {openai_payload['model']}")
            return {"success": True, "data": google_result, "provider": "openrouter"}
        else:
            error_msg = f"OpenRouter API failed: {response.status_code} - {response.text}"
            logger.error(error_msg)
            raise Exception(error_msg)

async def call_website_analysis_api(model: str, prompt: str, temperature: float = 0.3, max_tokens: int = 8192) -> dict:
    """Call OpenRouter API specifically for website analysis with structured output"""
    try:
        logger.info(f"🌐 Website Analysis: Using {model}")

        # Structured prompt for website analysis
        system_prompt = """You are an expert brand strategist and business analyst with deep expertise in extracting comprehensive, specific business intelligence from website content. Your task is to perform a thorough analysis and extract detailed, company-specific information.

CRITICAL INSTRUCTIONS:
1. Extract ONLY information explicitly mentioned on the website
2. Use the company's exact wording and terminology wherever possible
3. Be extremely specific and detailed - avoid generic descriptions
4. Search the entire website content thoroughly
5. Return ONLY valid JSON in the exact format specified below

REQUIRED JSON FORMAT:
{
  "businessName": "The EXACT business name, company name, or brand name as it appears on the website. This should be the PROPER NAME like 'Apple Inc.', 'Microsoft Corporation', 'Joe's Pizza', NOT a description of what they do. Look for the company name in headers, logos, titles, 'About Us' sections, or anywhere the business identifies itself. Extract the precise name they use, not their business type or industry.",

  "description": "A comprehensive, detailed summary of the business that includes: what they do, how they do it, their mission/values, their approach, their history, and what makes them unique. Combine information from multiple website sections to create a thorough description. Minimum 3-4 sentences using the company's own words.",

  "businessType": "The specific type/category of business like 'Software Company', 'Restaurant', 'Consulting Firm', 'E-commerce Store' - this describes WHAT they do, not WHO they are. This is different from the business name.",

  "targetAudience": "DETAILED description of the specific target audience, customer base, client types, demographics, business types, industries, or customer characteristics this company mentions they serve. Be very specific and comprehensive. Include customer examples, business sizes, industries, or any specific customer details mentioned on the website.",

  "services": ["Service 1: Detailed description as written on their website including features, benefits, what's included", "Service 2: Detailed description...", "Service 3: Detailed description..."],

  "keyFeatures": ["Feature 1: Specific benefit or capability they highlight", "Feature 2: Another key feature...", "Feature 3: Additional feature..."],

  "competitiveAdvantages": "What THIS specific company says makes them different from competitors. Extract their own competitive claims and differentiators, not generic industry advantages. Use their exact wording.",

  "visualStyle": "A detailed description of THIS company's specific visual style based on their actual website design. Describe the exact colors, typography, layout patterns, imagery style, and aesthetic choices THEY use. Reference specific design elements visible on their website.",

  "writingTone": "The SPECIFIC writing tone and voice THIS company uses in their actual website content. Analyze their actual text, headlines, and copy to describe their unique communication style. Use examples from their content.",

  "contentThemes": "The SPECIFIC themes, topics, and messaging patterns THIS company focuses on in their actual content. Extract the exact topics they discuss and how they position themselves.",

  "brandPersonality": "THIS company's specific brand personality as expressed through their actual content and design choices. Base this on their real communications, not generic assumptions.",

  "colorPalette": {
    "primary": "#HEXCODE - Primary brand color if visible on website",
    "secondary": "#HEXCODE - Secondary brand color if visible",
    "accent": "#HEXCODE - Accent color if visible",
    "description": "Detailed description of the overall color scheme and palette used on the website"
  },

  "typography": {
    "style": "Typography style observed on the website (e.g., modern, classic, playful, professional)",
    "characteristics": "Font characteristics and typography choices observed on the website"
  },

  "contactInfo": {
    "phone": "Main contact phone number if found",
    "email": "Main contact email address if found",
    "address": "Physical business address if mentioned",
    "website": "Additional website URLs or domains mentioned",
    "hours": "Business hours if mentioned on the website"
  },

  "socialMedia": {
    "facebook": "Facebook page URL if found on the website",
    "instagram": "Instagram profile URL if found on the website",
    "twitter": "Twitter profile URL if found on the website",
    "linkedin": "LinkedIn profile URL if found on the website",
    "youtube": "YouTube channel URL if found on the website",
    "other": ["Other social media URLs found"]
  },

  "location": "Geographic location or service area of the business",
  "establishedYear": "Year the business was established if mentioned",
  "teamSize": "Information about team size or company size if mentioned",
  "certifications": ["Professional certifications, awards, or credentials mentioned"],
  "contentStrategy": "Insights into their content marketing strategy based on website content",
  "callsToAction": ["CTA1", "CTA2", "CTA3"],
  "valueProposition": "The main value proposition or promise to customers"
}

ANALYSIS REQUIREMENTS:
- Extract comprehensive, specific details - not generic information
- Use the company's exact terminology and phrasing
- Include pricing, packages, service tiers, features when mentioned
- Look for testimonials, case studies, specific client examples
- Identify unique selling propositions and competitive differentiators
- Extract specific industry terminology and technical details
- Include any certifications, awards, partnerships mentioned
- Capture the company's own voice and communication style
- Be thorough - don't miss any services or important details"""

        openai_payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Analyze this website content:\n\n{prompt}"}
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "response_format": {"type": "json_object"} if "gpt" in model else None
        }

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Nevis AI Website Analysis"
        }

        async with httpx.AsyncClient(timeout=90.0) as client:  # Longer timeout for analysis
            response = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                json=openai_payload,
                headers=headers
            )

            if response.status_code == 200:
                openrouter_response = response.json()
                logger.info(f"✅ Website Analysis successful with {model}")
                return openrouter_response
            else:
                logger.error(f"❌ Website Analysis failed with {model}: {response.status_code} - {response.text}")
                raise Exception(f"Website Analysis API error: {response.status_code}")

    except Exception as e:
        logger.error(f"❌ Website Analysis error with {model}: {e}")
        raise

async def analyze_website_with_fallback(website_content: str, website_url: str, design_images: List[str] = None, temperature: float = 0.3, max_tokens: int = 8192) -> dict:
    """Analyze website using multi-model fallback: Claude 3 Haiku → GPT-4o-mini → GPT-3.5-turbo"""

    # Extract colors from design images if provided
    extracted_colors = None
    if design_images:
        logger.info(f"🎨 Processing {len(design_images)} design images for color extraction")
        extracted_colors = analyze_design_images(design_images)

    for i, model in enumerate(WEBSITE_ANALYSIS_MODELS):
        try:
            logger.info(f"🌐 Attempting website analysis with {model} (attempt {i+1}/{len(WEBSITE_ANALYSIS_MODELS)})")

            # Prepare enhanced prompt with URL context and design image analysis
            design_context = ""
            if extracted_colors:
                design_context = f"""
DESIGN IMAGE ANALYSIS:
The user has provided design examples, and we've extracted the following color palette:
- Primary Color: {extracted_colors['primary']}
- Secondary Color: {extracted_colors['secondary']}
- Accent Color: {extracted_colors['accent']}
- Description: {extracted_colors['description']}

Use these extracted colors in the colorPalette section of your response instead of guessing from the website.
"""

            enhanced_prompt = f"""WEBSITE ANALYSIS TASK:
Analyze the following website content and extract comprehensive, detailed business information. Focus on company-specific details, not generic industry information.

Website URL: {website_url}
{design_context}
WEBSITE CONTENT TO ANALYZE:
{website_content}

ANALYSIS INSTRUCTIONS:
1. Read through ALL the website content carefully
2. Extract the EXACT business name (not a description of what they do)
3. Find comprehensive service descriptions with specific features and benefits
4. Identify the specific target audience they mention serving
5. Look for unique competitive advantages they claim
6. Extract their specific writing tone and brand voice from the actual content
7. Find contact information, social media links, and business details
8. Identify specific calls-to-action used throughout the site
9. Extract their value proposition and what makes them unique
10. Look for certifications, awards, partnerships, or credentials mentioned
11. Find any pricing information, service packages, or tiers mentioned
12. Identify specific customer types, industries, or demographics they serve

Be extremely thorough and specific. Use their exact wording wherever possible. Extract comprehensive details, not generic summaries."""

            result = await call_website_analysis_api(model, enhanced_prompt, temperature, max_tokens)

            # Extract the JSON content from the response
            if "choices" in result and len(result["choices"]) > 0:
                content = result["choices"][0]["message"]["content"]

                # Try to parse JSON response
                try:
                    import json
                    analysis_data = json.loads(content)

                    # Validate required fields
                    required_fields = ["businessName", "businessType", "description"]
                    if all(field in analysis_data for field in required_fields):
                        logger.info(f"✅ Website analysis successful with {model}")
                        return {
                            "success": True,
                            "data": analysis_data,
                            "model_used": model,
                            "provider_used": "openrouter",
                            "attempt": i + 1
                        }
                    else:
                        logger.warning(f"⚠️ {model} returned incomplete data, trying next model")
                        continue

                except json.JSONDecodeError as e:
                    logger.warning(f"⚠️ {model} returned invalid JSON: {e}, trying next model")
                    continue
            else:
                logger.warning(f"⚠️ {model} returned unexpected response format, trying next model")
                continue

        except Exception as e:
            logger.warning(f"⚠️ {model} failed: {e}")
            if i == len(WEBSITE_ANALYSIS_MODELS) - 1:  # Last model
                logger.error("❌ All website analysis models failed")
                raise Exception(f"All website analysis models failed. Last error: {e}")
            continue

    # This should never be reached, but just in case
    raise Exception("Website analysis failed with all models")

async def call_google_api(endpoint: str, payload: Dict[str, Any], api_key: str) -> Dict[str, Any]:
    """Make controlled call to Google API with exact model specified"""

    # Log the exact request being made
    logger.info(f"🔄 Making Google API request to: {endpoint}")
    logger.info(f"🔍 Google API payload: {json.dumps(payload, indent=2)}")

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
            logger.info(f"✅ Google API successful from {endpoint}")
            return {"success": True, "data": result, "provider": "google"}
        else:
            error_msg = f"Google API failed: {response.status_code} - {response.text}"
            logger.error(error_msg)
            raise Exception(error_msg)

async def call_primary_api_with_fallback(endpoint: str, payload: Dict[str, Any], api_key: str, model: str) -> Tuple[Dict[str, Any], str]:
    """
    Call Google API first, fallback to OpenRouter on failure
    Returns: (response_data, provider_used)
    """

    # Define error conditions that trigger fallback
    fallback_conditions = [429, 503, 500]  # Quota exceeded, unavailable, internal error

    try:
        # Try Google API first
        logger.info(f"🎯 Attempting Google API for model: {model}")
        result = await call_google_api(endpoint, payload, api_key)
        return result, "google"

    except Exception as google_error:
        logger.warning(f"⚠️ Google API failed for {model}: {str(google_error)}")

        # Check if we should fallback to OpenRouter
        should_fallback = True
        error_str = str(google_error).lower()

        # Always fallback on these conditions
        if any(str(code) in str(google_error) for code in fallback_conditions):
            should_fallback = True
        elif "timeout" in error_str or "connection" in error_str:
            should_fallback = True
        elif "quota" in error_str or "limit" in error_str:
            should_fallback = True

        if should_fallback and model in OPENROUTER_MODEL_MAPPING:
            try:
                logger.info(f"🔄 Falling back to OpenRouter for model: {model}")
                result = await call_openrouter_api(model, payload)
                return result, "openrouter"

            except Exception as openrouter_error:
                logger.error(f"❌ OpenRouter fallback also failed: {str(openrouter_error)}")
                # If both fail, raise the original Google error
                raise google_error
        else:
            # No fallback available or not configured
            logger.error(f"❌ No fallback available for model: {model}")
            raise google_error

@app.post("/generate-image")
async def generate_image(request: ImageRequest):
    """Generate image with strict model control"""
    
    # Validate model is allowed
    endpoint = validate_model(request.model)

    # Validate tier has access to this model
    validate_tier_model_access(request.user_tier, request.model)

    # Check user has enough credits
    check_user_credits(request.user_id, request.user_tier)

    # Get model-specific API key (with Revo version support)
    api_key = get_api_key_for_model(request.model, request.revo_version)
    
    # Prepare payload with strict model specification
    parts = [{"text": request.prompt}]

    # Add logo image data if provided (for brand integration)
    if request.logoImage and request.logoImage.startswith('data:image/'):
        try:
            # Extract base64 data and mime type from data URL
            logo_match = request.logoImage.split(',', 1)
            if len(logo_match) == 2:
                mime_info = logo_match[0].split(';')[0].split(':')[1]  # Extract mime type
                base64_data = logo_match[1]

                parts.append({
                    "inlineData": {
                        "mimeType": mime_info,
                        "data": base64_data
                    }
                })
                logger.info(f"Added logo image data to request for user {request.user_id}")
        except Exception as logo_error:
            logger.warning(f"Failed to process logo image: {logo_error}")

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": request.temperature,
            "maxOutputTokens": request.max_tokens,
            # Only include response_modalities for image models
            **({"responseModalities": ["IMAGE"]} if "image" in request.model else {})
        }
    }
    
    try:
        result, provider_used = await call_primary_api_with_fallback(endpoint, payload, api_key, request.model)
        deduct_user_credit(request.user_id, request.user_tier, "image")

        return {
            "success": True,
            "data": result["data"],
            "model_used": request.model,
            "provider_used": provider_used,
            "endpoint_used": endpoint if provider_used == "google" else "openrouter",
            "user_credits": user_credits[request.user_id]["credits"]
        }

    except Exception as e:
        logger.error(f"Image generation failed on both providers: {str(e)}")
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

    # Get model-specific API key (with Revo version support)
    api_key = get_api_key_for_model(request.model, request.revo_version)
    
    # Prepare payload with strict model specification
    payload = {
        "contents": [{"parts": [{"text": request.prompt}]}],
        "generationConfig": {
            "temperature": request.temperature,
            "maxOutputTokens": request.max_tokens
        }
    }
    
    try:
        result, provider_used = await call_primary_api_with_fallback(endpoint, payload, api_key, request.model)
        deduct_user_credit(request.user_id, request.user_tier, "text")

        return {
            "success": True,
            "data": result["data"],
            "model_used": request.model,
            "provider_used": provider_used,
            "endpoint_used": endpoint if provider_used == "google" else "openrouter",
            "user_credits": user_credits[request.user_id]["credits"]
        }

    except Exception as e:
        logger.error(f"Text generation failed on both providers: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Text generation failed: {str(e)}")

@app.post("/analyze-website")
async def analyze_website_endpoint(request: WebsiteAnalysisRequest):
    """Analyze website content using multi-model fallback system"""
    try:
        logger.info(f"🌐 Website analysis request from user: {request.user_id}")
        logger.info(f"📄 Content length: {len(request.website_content)} characters")
        logger.info(f"🔗 Website URL: {request.website_url}")

        # Check user has enough credits (website analysis costs 2 credits due to complexity)
        check_user_credits(request.user_id, request.user_tier)

        # Validate content length
        if len(request.website_content) < 100:
            raise HTTPException(
                status_code=400,
                detail="Website content too short. Minimum 100 characters required."
            )

        if len(request.website_content) > 50000:
            # Truncate content to prevent token limit issues
            request.website_content = request.website_content[:50000] + "..."
            logger.info("📄 Content truncated to 50,000 characters")

        # Perform website analysis with multi-model fallback
        result = await analyze_website_with_fallback(
            request.website_content,
            request.website_url,
            request.design_images,
            request.temperature,
            request.max_tokens
        )

        if result["success"]:
            # Deduct credits (2 credits for website analysis - deduct twice)
            deduct_user_credit(request.user_id, request.user_tier, "website_analysis")
            deduct_user_credit(request.user_id, request.user_tier, "website_analysis")

            logger.info(f"✅ Website analysis completed successfully")
            logger.info(f"🤖 Model used: {result['model_used']}")
            logger.info(f"🔧 Provider: {result['provider_used']}")

            return {
                "success": True,
                "data": result["data"],
                "model_used": result["model_used"],
                "provider_used": result["provider_used"],
                "attempt": result["attempt"],
                "user_credits": user_credits[request.user_id]["credits"],
                "analysis_type": "website_analysis"
            }
        else:
            raise HTTPException(status_code=503, detail="Website analysis failed")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Website analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Website analysis failed: {str(e)}")

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "allowed_models": list(ALLOWED_MODELS.keys()),
        "openrouter_configured": bool(OPENROUTER_API_KEY),
        "fallback_models": list(OPENROUTER_MODEL_MAPPING.keys()),
        "website_analysis_models": WEBSITE_ANALYSIS_MODELS,
        "website_analysis_enabled": bool(OPENROUTER_API_KEY)
    }

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
        "openrouter_fallback": {
            "configured": bool(OPENROUTER_API_KEY),
            "model_mappings": OPENROUTER_MODEL_MAPPING,
            "alternative_models": OPENROUTER_ALTERNATIVE_MODELS
        },
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
