from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
import logging
import time
import os
from pydantic import BaseModel

# Import the image analyzer
from .image_analyzer import analyzer, AnalysisResult, DisasterType

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Models for request/response validation
class AnalysisRequest(BaseModel):
    options: Dict[str, Any] = {}

class AnalysisResponse(BaseModel):
    success: bool
    analysis_id: Optional[str] = None
    change_percentage: Optional[float] = None
    impact_level: Optional[str] = None
    impact_description: Optional[str] = None
    images: Optional[Dict[str, str]] = None
    analysis_details: Optional[Dict] = None
    recommendations: Optional[List[str]] = None
    disaster_type: Optional[str] = None
    error: Optional[str] = None

# Store analysis results for sharing with chatbot
# In a production app, this would be a database
analysis_store = {}

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_images(
    pre_image: UploadFile = File(...),
    post_image: UploadFile = File(...),
    options: Optional[str] = Form(None)
):
    """
    Analyze pre and post disaster images and return the analysis results
    """
    try:
        start_time = time.time()
        
        # Parse options if provided
        analysis_options = {}
        if options:
            import json
            try:
                analysis_options = json.loads(options)
            except json.JSONDecodeError:
                logger.warning(f"Invalid options format: {options}")
        
        # Read image files
        pre_image_data = await pre_image.read()
        post_image_data = await post_image.read()
        
        # Analyze the images
        result = await analyzer.analyze_images(
            pre_image_data=pre_image_data,
            post_image_data=post_image_data,
            analysis_options=analysis_options
        )
        
        # Generate a unique ID for this analysis
        import uuid
        analysis_id = str(uuid.uuid4())
        
        # Store the analysis result for the chatbot to access
        chatbot_context = analyzer.get_chatbot_context(result)
        analysis_store[analysis_id] = chatbot_context
        
        # Clean up old analyses
        if len(analysis_store) > 20:  # Keep only the last 20 analyses
            oldest_key = next(iter(analysis_store))
            del analysis_store[oldest_key]
        
        end_time = time.time()
        logger.info(f"Analysis completed in {end_time - start_time:.2f} seconds")
        
        # Return the analysis response
        return AnalysisResponse(
            success=True,
            analysis_id=analysis_id,
            change_percentage=result.change_percentage,
            impact_level=result.impact_level,
            impact_description=result.impact_description,
            images=result.images,
            analysis_details=result.analysis_details,
            recommendations=result.analysis_details["recommendations"],
            disaster_type=result.disaster_type.value
        )
        
    except Exception as e:
        logger.error(f"Error analyzing images: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error analyzing images: {str(e)}"
        )

@router.get("/analysis/{analysis_id}")
async def get_analysis(analysis_id: str):
    """Get a specific analysis result by ID"""
    if analysis_id not in analysis_store:
        raise HTTPException(
            status_code=404,
            detail=f"Analysis with ID {analysis_id} not found"
        )
    
    return JSONResponse(content=analysis_store[analysis_id])

@router.get("/latest-analysis")
async def get_latest_analysis():
    """Get the most recent analysis result"""
    if not analysis_store:
        raise HTTPException(
            status_code=404,
            detail="No analysis results available"
        )
    
    # Get the most recent analysis
    latest_id = list(analysis_store.keys())[-1]
    return JSONResponse(content={
        "analysis_id": latest_id,
        "data": analysis_store[latest_id]
    })

# Method that can be called by the chatbot to get analysis context
def get_analysis_context(analysis_id: Optional[str] = None) -> Dict:
    """Get analysis context for the chatbot"""
    if analysis_id and analysis_id in analysis_store:
        return analysis_store[analysis_id]
    elif analysis_store:
        # Return the most recent analysis
        latest_id = list(analysis_store.keys())[-1]
        return analysis_store[latest_id]
    else:
        return {}       return {}
