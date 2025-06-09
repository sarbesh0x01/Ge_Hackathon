from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
import cv2
import numpy as np
import os
import uuid
import shutil
from datetime import datetime
import logging
from PIL import Image, ImageOps, ImageEnhance
import io
import base64
import random
import time
import json
from sklearn.cluster import KMeans
from pathlib import Path
import tensorflow as tf
import joblib
import math
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Disaster Assessment API",
    description="API for analyzing before and after disaster images to assess damage",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, you should specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories for storing images
UPLOAD_DIR = Path("uploads")
RESULTS_DIR = Path("results")
CACHE_DIR = Path("cache")
MODEL_DIR = Path("models")

for directory in [UPLOAD_DIR, RESULTS_DIR, CACHE_DIR, MODEL_DIR]:
    directory.mkdir(exist_ok=True)

# Define models
class ImageComparisonRequest(BaseModel):
    before_image_id: str
    after_image_id: str
    region: Optional[str] = None
    disaster_type: Optional[str] = None
    analysis_level: Optional[str] = "standard"  # "basic", "standard", "detailed"
    include_raw_data: Optional[bool] = False
    async_mode: Optional[bool] = True

class AnalysisProgress(BaseModel):
    comparison_id: str
    status: str  # "queued", "processing", "completed", "failed"
    progress: float  # 0-100
    message: Optional[str] = None
    created_at: str
    updated_at: str

class DamagedArea(BaseModel):
    id: int
    coordinates: List[int]
    area: float
    severity: str
    type: str
    confidence: float

class BuildingDamage(BaseModel):
    id: int
    coordinates: List[int]
    severity: str
    type: Optional[str] = None
    confidence: float

class RoadDamage(BaseModel):
    id: int
    coordinates: List[int]
    severity: str
    length: Optional[float] = None
    confidence: float

class FloodedArea(BaseModel):
    id: int
    coordinates: List[int]
    water_depth: str
    area: float
    confidence: float

class VegetationLoss(BaseModel):
    id: int
    coordinates: List[int]
    area: str
    density: Optional[str] = None
    confidence: float

class AnalysisResult(BaseModel):
    comparison_id: str
    before_image_url: str
    after_image_url: str
    difference_image_url: str
    changed_pixels_percentage: float
    severity_score: float
    damage_overview: Dict[str, Any]
    damaged_areas: List[Dict[str, Any]]
    building_damage: List[Dict[str, Any]]
    road_damage: List[Dict[str, Any]]
    flooded_areas: List[Dict[str, Any]]
    vegetation_loss: List[Dict[str, Any]]
    created_at: str
    analysis_level: str
    region: Optional[str] = None
    disaster_type: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None

# Global variables to track analysis jobs
analysis_jobs = {}

# Mock ML models (in a production environment, these would be real models)
def load_models():
    """Load or initialize all required models"""
    logger.info("Loading ML models...")
    
    # In a real implementation, these would be actual trained models
    # For the sake of this example, we're creating mock models
    models = {
        "building_detector": "Building Detector Model",
        "road_detector": "Road Detector Model",
        "damage_classifier": "Damage Classifier Model",
        "water_detector": "Water Detector Model",
        "vegetation_detector": "Vegetation Detector Model"
    }
    
    logger.info("Models loaded successfully")
    return models

# Initialize models
ml_models = load_models()

@app.on_event("startup")
async def startup_event():
    """Initialize resources on startup"""
    global ml_models
    ml_models = load_models()
    logger.info("Application started successfully")

# Add API status endpoint for frontend to check if API is available
@app.get("/api/status")
async def get_api_status():
    """
    Check if the API is available.
    """
    return {
        "status": "available",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/upload-image", response_model=Dict[str, str])
async def upload_image(file: UploadFile = File(...)):
    """
    Upload a single image file for disaster analysis.
    """
    try:
        # Validate file type
        allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".tif", ".tiff"}
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Generate a unique filename
        unique_id = uuid.uuid4()
        filename = f"{unique_id}{file_extension}"
        file_path = UPLOAD_DIR / filename
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create a thumbnail for faster loading (optional)
        create_thumbnail(file_path)
        
        logger.info(f"Image uploaded successfully: {filename}")
        return {"image_id": filename, "url": f"/api/images/{filename}"}
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

def create_thumbnail(file_path, size=(800, 600)):
    """Create a thumbnail version of the uploaded image"""
    try:
        thumbnail_dir = UPLOAD_DIR / "thumbnails"
        thumbnail_dir.mkdir(exist_ok=True)
        
        thumbnail_path = thumbnail_dir / file_path.name
        
        img = Image.open(file_path)
        img.thumbnail(size)
        img.save(thumbnail_path)
    except Exception as e:
        logger.warning(f"Failed to create thumbnail: {str(e)}")

@app.get("/api/images/{image_id}")
async def get_image(image_id: str, thumbnail: bool = False):
    """
    Retrieve an uploaded image by ID.
    """
    if thumbnail:
        file_path = UPLOAD_DIR / "thumbnails" / image_id
        if not file_path.exists():
            # If thumbnail doesn't exist, try to create it
            original_path = UPLOAD_DIR / image_id
            if original_path.exists():
                create_thumbnail(original_path)
            else:
                raise HTTPException(status_code=404, detail="Image not found")
    else:
        file_path = UPLOAD_DIR / image_id
        
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(str(file_path))

@app.post("/api/analyze", response_model=Union[AnalysisResult, AnalysisProgress])
async def analyze_images(
    request: ImageComparisonRequest, 
    background_tasks: BackgroundTasks,
    async_mode: bool = True
):
    """
    Analyze before and after disaster images to identify changes and damage.
    If async_mode is True, returns a job ID and processes in the background.
    Otherwise, processes synchronously and returns the full result.
    """
    try:
        before_path = UPLOAD_DIR / request.before_image_id
        after_path = UPLOAD_DIR / request.after_image_id
        
        # Check if images exist
        if not before_path.exists() or not after_path.exists():
            raise HTTPException(status_code=404, detail="One or both images not found")
        
        # Generate a unique ID for this comparison
        comparison_id = str(uuid.uuid4())
        
        # If async mode, create a job and process in background
        if async_mode or request.async_mode:
            # Create initial job status
            job_status = AnalysisProgress(
                comparison_id=comparison_id,
                status="queued",
                progress=0.0,
                created_at=datetime.now().isoformat(),
                updated_at=datetime.now().isoformat()
            )
            
            # Store job status
            analysis_jobs[comparison_id] = job_status.dict()
            
            # Start background processing
            background_tasks.add_task(
                process_analysis_job, 
                comparison_id=comparison_id,
                before_path=before_path,
                after_path=after_path,
                disaster_type=request.disaster_type,
                region=request.region,
                analysis_level=request.analysis_level,
                include_raw_data=request.include_raw_data
            )
            
            return job_status
        
        # Otherwise, process synchronously
        # Read the images
        before_img = cv2.imread(str(before_path))
        after_img = cv2.imread(str(after_path))
        
        # Ensure both images have the same dimensions
        if before_img.shape != after_img.shape:
            # Resize the after image to match the before image dimensions
            after_img = cv2.resize(after_img, (before_img.shape[1], before_img.shape[0]))
        
        # Perform image comparison and damage analysis
        result = compare_images(
            before_img, 
            after_img, 
            comparison_id, 
            request.disaster_type,
            request.region,
            request.analysis_level,
            request.include_raw_data
        )
        return result
    
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error analyzing images: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

async def process_analysis_job(
    comparison_id: str, 
    before_path: Path, 
    after_path: Path, 
    disaster_type: Optional[str],
    region: Optional[str],
    analysis_level: str,
    include_raw_data: bool
):
    """
    Process an analysis job asynchronously and update its status.
    """
    try:
        # Update job status to "processing"
        update_job_status(comparison_id, "processing", 5.0, "Starting analysis...")
        
        # Read the images
        before_img = cv2.imread(str(before_path))
        update_job_status(comparison_id, "processing", 10.0, "Reading before image...")
        
        after_img = cv2.imread(str(after_path))
        update_job_status(comparison_id, "processing", 15.0, "Reading after image...")
        
        # Ensure both images have the same dimensions
        if before_img.shape != after_img.shape:
            update_job_status(comparison_id, "processing", 20.0, "Resizing images...")
            after_img = cv2.resize(after_img, (before_img.shape[1], before_img.shape[0]))
        
        # Perform image comparison and damage analysis
        update_job_status(comparison_id, "processing", 25.0, "Starting comparison...")
        
        # Perform analysis with progress updates
        result = compare_images_with_progress(
            before_img, 
            after_img, 
            comparison_id, 
            disaster_type,
            region,
            analysis_level,
            include_raw_data
        )
        
        # Update job status to "completed"
        update_job_status(comparison_id, "completed", 100.0, "Analysis completed successfully")
        
        # Store the result
        results_file = RESULTS_DIR / f"{comparison_id}.json"
        with open(results_file, "w") as f:
            # Convert result to dict, excluding non-serializable items
            result_dict = {k: v for k, v in result.dict().items() if k != "raw_data"}
            json.dump(result_dict, f)
        
    except Exception as e:
        logger.error(f"Error processing job {comparison_id}: {str(e)}")
        update_job_status(comparison_id, "failed", 0.0, f"Analysis failed: {str(e)}")

def update_job_status(comparison_id: str, status: str, progress: float, message: Optional[str] = None):
    """
    Update the status of an analysis job.
    """
    if comparison_id in analysis_jobs:
        analysis_jobs[comparison_id].update({
            "status": status,
            "progress": progress,
            "message": message,
            "updated_at": datetime.now().isoformat()
        })

@app.get("/api/analysis-status/{comparison_id}", response_model=AnalysisProgress)
async def get_analysis_status(comparison_id: str):
    """
    Get the status of an analysis job.
    """
    if comparison_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    
    return analysis_jobs[comparison_id]

@app.get("/api/analysis-result/{comparison_id}", response_model=AnalysisResult)
async def get_analysis_result(comparison_id: str):
    """
    Get the result of a completed analysis job.
    """
    # Check if job exists and is completed
    if comparison_id in analysis_jobs and analysis_jobs[comparison_id]["status"] == "completed":
        # Try to load from file
        results_file = RESULTS_DIR / f"{comparison_id}.json"
        if results_file.exists():
            with open(results_file, "r") as f:
                return json.load(f)
    
    # If job exists but not completed
    if comparison_id in analysis_jobs:
        status = analysis_jobs[comparison_id]["status"]
        if status == "failed":
            raise HTTPException(status_code=500, detail="Analysis failed")
        else:
            raise HTTPException(status_code=202, detail=f"Analysis is still {status}")
    
    raise HTTPException(status_code=404, detail="Analysis result not found")

# Add recommendations endpoint
@app.get("/api/recommendations/{comparison_id}")
async def get_recommendations(comparison_id: str, count: int = 5):
    """
    Get recommendations based on analysis results.
    """
    try:
        # Check if the analysis exists
        results_file = RESULTS_DIR / f"{comparison_id}.json"
        if not results_file.exists():
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        # Load analysis results
        with open(results_file, "r") as f:
            analysis_data = json.load(f)
        
        # Generate recommendations based on the analysis
        recommendations = generate_recommendations(analysis_data, count)
        
        return recommendations
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations")

def generate_recommendations(analysis_data: Dict[str, Any], count: int = 5) -> List[str]:
    """
    Generate recommendations based on analysis results.
    """
    recommendations = []
    disaster_type = analysis_data.get("disaster_type", "unknown")
    
    # Add recommendation based on building damage
    if "building_damage" in analysis_data and analysis_data["building_damage"]:
        severe_buildings = [b for b in analysis_data["building_damage"] 
                           if b.get("severity") in ["Collapsed", "Severely Damaged"]]
        
        if severe_buildings:
            recommendations.append(f"Conduct structural assessments of {len(severe_buildings)} severely damaged buildings")
        else:
            recommendations.append("Inspect buildings for non-structural damage")
    
    # Add recommendation based on road damage
    if "road_damage" in analysis_data and analysis_data["road_damage"]:
        recommendations.append("Clear debris from damaged road sections to allow emergency vehicle access")
    
    # Add recommendation based on flooded areas
    if "flooded_areas" in analysis_data and analysis_data["flooded_areas"]:
        recommendations.append("Implement water pumping operations in flooded areas")
    
    # Add recommendation based on vegetation loss
    if "vegetation_loss" in analysis_data and analysis_data["vegetation_loss"]:
        recommendations.append("Assess ecological impact and erosion risk from vegetation loss")
    
    # If we still need more recommendations, add disaster-specific ones
    if len(recommendations) < count:
        additional_recommendations = get_disaster_specific_recommendations(disaster_type)
        recommendations.extend(additional_recommendations)
    
    # Return the requested number of recommendations
    return recommendations[:count]

def get_disaster_specific_recommendations(disaster_type: str) -> List[str]:
    """
    Get disaster-specific recommendations.
    """
    recommendations = {
        "hurricane": [
            "Assess wind damage to roofs and exterior structures",
            "Check for water intrusion in buildings",
            "Inspect for damages to utilities and infrastructure",
            "Monitor for potential secondary flooding",
            "Establish temporary shelter for displaced residents"
        ],
        "flood": [
            "Test water quality in affected areas",
            "Monitor for mold development in water-damaged buildings",
            "Assess foundation stability of affected structures",
            "Clear drainage systems of debris",
            "Implement disease prevention measures"
        ],
        "earthquake": [
            "Check for gas leaks and damaged utility lines",
            "Assess structural integrity of buildings, especially multi-story structures",
            "Clear debris from evacuation routes",
            "Prepare for potential aftershocks",
            "Establish emergency communications systems"
        ],
        "wildfire": [
            "Monitor air quality and distribute protective masks",
            "Assess risk of landslides in burned areas",
            "Inspect remaining structures for heat damage",
            "Evaluate watershed impacts and potential flooding risks",
            "Implement erosion control measures"
        ],
        "tornado": [
            "Secure damaged structures to prevent further collapse",
            "Clear roads of debris for emergency access",
            "Check for damaged utilities, especially gas and electrical lines",
            "Assess structural damage to buildings in tornado path",
            "Establish community support centers"
        ]
    }
    
    # Return recommendations for the specific disaster type, or generic ones if not found
    return recommendations.get(disaster_type, [
        "Conduct immediate safety assessments of damaged structures",
        "Establish temporary shelter for displaced residents",
        "Clear main transportation routes",
        "Assess utility infrastructure damage",
        "Implement emergency communication systems"
    ])

def compare_images_with_progress(
    before_img: np.ndarray, 
    after_img: np.ndarray, 
    comparison_id: str, 
    disaster_type: Optional[str],
    region: Optional[str],
    analysis_level: str,
    include_raw_data: bool
) -> AnalysisResult:
    """
    Compare before and after disaster images with progress updates.
    """
    # Preprocessing
    update_job_status(comparison_id, "processing", 30.0, "Preprocessing images...")
    
    # Image comparison
    update_job_status(comparison_id, "processing", 40.0, "Comparing images...")
    
    # Damage detection
    update_job_status(comparison_id, "processing", 50.0, "Detecting general damage...")
    
    # Building damage analysis
    update_job_status(comparison_id, "processing", 60.0, "Analyzing building damage...")
    
    # Road damage analysis
    update_job_status(comparison_id, "processing", 70.0, "Analyzing road damage...")
    
    # Flood detection
    update_job_status(comparison_id, "processing", 80.0, "Detecting flooded areas...")
    
    # Vegetation analysis
    update_job_status(comparison_id, "processing", 90.0, "Analyzing vegetation loss...")
    
    # Final processing
    update_job_status(comparison_id, "processing", 95.0, "Finalizing results...")
    
    # Perform the actual comparison
    return compare_images(
        before_img, 
        after_img, 
        comparison_id, 
        disaster_type,
        region,
        analysis_level,
        include_raw_data
    )

def compare_images(
    before_img: np.ndarray, 
    after_img: np.ndarray, 
    comparison_id: str, 
    disaster_type: Optional[str],
    region: Optional[str],
    analysis_level: str = "standard",
    include_raw_data: bool = False
) -> AnalysisResult:
    """
    Compare before and after disaster images to identify changes and analyze damage.
    """
    # Convert images to grayscale for comparison
    before_gray = cv2.cvtColor(before_img, cv2.COLOR_BGR2GRAY)
    after_gray = cv2.cvtColor(after_img, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur to reduce noise
    before_gray = cv2.GaussianBlur(before_gray, (5, 5), 0)
    after_gray = cv2.GaussianBlur(after_gray, (5, 5), 0)
    
    # Calculate absolute difference between the images
    diff = cv2.absdiff(before_gray, after_gray)
    
    # Apply threshold to highlight significant changes
    threshold = 30  # Threshold value can be adjusted based on sensitivity needs
    _, thresh = cv2.threshold(diff, threshold, 255, cv2.THRESH_BINARY)
    
    # Apply morphological operations to enhance changes
    kernel = np.ones((5, 5), np.uint8)
    dilated = cv2.dilate(thresh, kernel, iterations=2)
    
    # Find contours in the thresholded difference image
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Create a color difference image to visualize changes
    diff_color = before_img.copy()
    
    # Draw contours on the difference image
    cv2.drawContours(diff_color, contours, -1, (0, 0, 255), 2)
    
    # Calculate percentage of changed pixels
    total_pixels = before_gray.shape[0] * before_gray.shape[1]
    changed_pixels = np.count_nonzero(thresh)
    changed_percentage = (changed_pixels / total_pixels) * 100
    
    # Save the difference image
    diff_filename = f"{comparison_id}_diff.jpg"
    diff_path = RESULTS_DIR / diff_filename
    cv2.imwrite(str(diff_path), diff_color)
    
    # Store original images for reference
    before_filename = f"{comparison_id}_before.jpg"
    after_filename = f"{comparison_id}_after.jpg"
    before_path = RESULTS_DIR / before_filename
    after_path = RESULTS_DIR / after_filename
    cv2.imwrite(str(before_path), before_img)
    cv2.imwrite(str(after_path), after_img)
    
    # Analyze specific types of damage based on the detected changes
    # The level of detail depends on the analysis_level parameter
    damaged_areas = analyze_damaged_areas(contours, before_img, after_img, disaster_type, analysis_level)
    
    # Analysis varies based on the requested level
    if analysis_level == "basic":
        # Basic analysis only includes general damage assessment
        building_damage = []
        road_damage = []
        flooded_areas = []
        vegetation_loss = []
    else:
        # Standard and detailed analysis include specific damage types
        building_damage = detect_building_damage(before_img, after_img, contours, analysis_level)
        road_damage = detect_road_damage(before_img, after_img, contours, analysis_level)
        flooded_areas = detect_flooded_areas(before_img, after_img, analysis_level)
        vegetation_loss = detect_vegetation_loss(before_img, after_img, analysis_level)
    
    # Calculate an overall severity score
    severity_score = calculate_severity_score(
        changed_percentage,
        damaged_areas,
        building_damage,
        road_damage,
        flooded_areas,
        vegetation_loss
    )
    
    # Create a damage overview
    damage_overview = create_damage_overview(
        damaged_areas,
        building_damage,
        road_damage,
        flooded_areas,
        vegetation_loss
    )
    
    # Prepare raw data if requested
    raw_data = None
    if include_raw_data:
        raw_data = {
            "image_dimensions": before_img.shape,
            "changed_pixels": int(changed_pixels),
            "total_pixels": int(total_pixels),
            "contour_count": len(contours),
            # Add more raw data as needed
        }
    
    # Prepare the response
    result = AnalysisResult(
        comparison_id=comparison_id,
        before_image_url=f"/api/results/{before_filename}",
        after_image_url=f"/api/results/{after_filename}",
        difference_image_url=f"/api/results/{diff_filename}",
        changed_pixels_percentage=round(changed_percentage, 2),
        severity_score=severity_score,
        damage_overview=damage_overview,
        damaged_areas=damaged_areas,
        building_damage=building_damage,
        road_damage=road_damage,
        flooded_areas=flooded_areas,
        vegetation_loss=vegetation_loss,
        created_at=datetime.now().isoformat(),
        analysis_level=analysis_level,
        region=region,
        disaster_type=disaster_type,
        raw_data=raw_data
    )
    
    return result

def calculate_severity_score(
    changed_percentage: float,
    damaged_areas: List[Dict[str, Any]],
    building_damage: List[Dict[str, Any]],
    road_damage: List[Dict[str, Any]],
    flooded_areas: List[Dict[str, Any]],
    vegetation_loss: List[Dict[str, Any]]
) -> float:
    """
    Calculate an overall severity score based on all damage metrics.
    """
    # Base score from changed pixels
    base_score = min(changed_percentage * 0.1, 10.0)
    
    # Add scores based on damage severity
    severity_weights = {
        "Critical": 10.0,
        "Collapsed": 10.0,
        "Severe": 8.0,
        "Severely Damaged": 8.0,
        "High": 6.0,
        "Moderate": 4.0,
        "Partially Damaged": 4.0,
        "Medium": 3.0,
        "Low": 1.0,
        "Minor": 1.0,
        "Minor Damage": 1.0,
        "Minor Change": 0.5
    }
    
    # Count occurrences of each severity level
    severity_counts = {level: 0 for level in severity_weights.keys()}
    
    # Check damaged areas
    for area in damaged_areas:
        if area["severity"] in severity_counts:
            severity_counts[area["severity"]] += 1
    
    # Check building damage
    for building in building_damage:
        if building["severity"] in severity_counts:
            severity_counts[building["severity"]] += 1
    
    # Check road damage
    for road in road_damage:
        if road["severity"] in severity_counts:
            severity_counts[road["severity"]] += 1
    
    # Calculate additional score based on severity counts
    severity_score = 0.0
    for severity, count in severity_counts.items():
        if count > 0 and severity in severity_weights:
            # Log-scale score to prevent domination by large numbers of minor damage
            severity_score += severity_weights[severity] * math.log1p(count)
    
    # Additional factors
    # Flooded areas are significant
    flood_factor = min(len(flooded_areas) * 2.0, 10.0)
    
    # Vegetation loss is less critical but still important
    vegetation_factor = min(len(vegetation_loss) * 0.5, 5.0)
    
    # Combine all factors, normalize to 0-10 scale
    total_score = base_score + severity_score + flood_factor + vegetation_factor
    normalized_score = min(max(total_score / 10.0, 0.0), 10.0)
    
    return round(normalized_score, 1)

def create_damage_overview(
    damaged_areas: List[Dict[str, Any]],
    building_damage: List[Dict[str, Any]],
    road_damage: List[Dict[str, Any]],
    flooded_areas: List[Dict[str, Any]],
    vegetation_loss: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Create a summary overview of all detected damage.
    """
    # Count occurrences of each damage type
    damage_types = {}
    for area in damaged_areas:
        if "type" in area:
            damage_type = area["type"]
            if damage_type in damage_types:
                damage_types[damage_type] += 1
            else:
                damage_types[damage_type] = 1
    
    # Severity distribution
    severity_distribution = {
        "Critical": 0,
        "High": 0,
        "Medium": 0,
        "Low": 0
    }
    
    for area in damaged_areas:
        if "severity" in area and area["severity"] in severity_distribution:
            severity_distribution[area["severity"]] += 1
    
    # Building damage summary
    building_summary = {
        "total": len(building_damage),
        "collapsed": len([b for b in building_damage if b.get("severity") == "Collapsed"]),
        "severe": len([b for b in building_damage if b.get("severity") == "Severely Damaged"]),
        "partial": len([b for b in building_damage if b.get("severity") == "Partially Damaged"]),
        "minor": len([b for b in building_damage if b.get("severity") == "Minor Damage"])
    }
    
    # Road damage summary
    road_summary = {
        "total": len(road_damage),
        "severe": len([r for r in road_damage if r.get("severity") == "Severe"]),
        "moderate": len([r for r in road_damage if r.get("severity") == "Moderate"]),
        "minor": len([r for r in road_damage if r.get("severity") == "Minor"])
    }
    
    # Create overall summary
    overview = {
        "total_damaged_areas": len(damaged_areas),
        "damage_types": damage_types,
        "severity_distribution": severity_distribution,
        "building_damage": building_summary,
        "road_damage": road_summary,
        "flooded_areas": len(flooded_areas),
        "vegetation_loss": len(vegetation_loss)
    }
    
    return overview

def analyze_damaged_areas(
    contours: List, 
    before_img: np.ndarray, 
    after_img: np.ndarray, 
    disaster_type: Optional[str],
    analysis_level: str
) -> List[Dict[str, Any]]:
    """
    Analyze the detected changed areas to classify different types of damage.
    """
    damaged_areas = []
    min_area = 100  # Minimum contour area to consider (filters out noise)
    
    for i, contour in enumerate(contours):
        area = cv2.contourArea(contour)
        if area < min_area:
            continue
        
        # Get bounding box for the contour
        x, y, w, h = cv2.boundingRect(contour)
        
        # Extract the region from before and after images
        before_roi = before_img[y:y+h, x:x+w]
        after_roi = after_img[y:y+h, x:x+w]
        
        # Calculate severity based on the difference magnitude
        severity = calculate_damage_severity(before_roi, after_roi)
        
        # Determine damage type based on color and texture analysis
        damage_type = classify_damage_type(before_roi, after_roi, disaster_type)
        
        damaged_areas.append({
            "id": i + 1,
            "coordinates": [x, y, x+w, y+h],
            "area": float(area),
            "severity": severity,
            "type": damage_type,
            "confidence": round(min(0.9 + (area / 10000), 0.99), 2)  # Higher confidence for larger areas
        })
    
    # For detailed analysis, add more information
    if analysis_level == "detailed":
        # Add more detailed classification or metrics
        for area in damaged_areas:
            # Add estimated recovery time based on severity
            if area["severity"] == "Critical":
                area["estimated_recovery"] = "6+ months"
            elif area["severity"] == "High":
                area["estimated_recovery"] = "3-6 months"
            elif area["severity"] == "Medium":
                area["estimated_recovery"] = "1-3 months"
            else:
                area["estimated_recovery"] = "<1 month"
    
    return damaged_areas

def calculate_damage_severity(before_roi: np.ndarray, after_roi: np.ndarray) -> str:
    """
    Calculate the severity of damage based on the difference between before and after regions.
    """
    # Calculate the mean absolute difference between the regions
    diff = cv2.absdiff(before_roi, after_roi)
    mean_diff = np.mean(diff)
    
    # Classify severity based on the mean difference
    if mean_diff > 100:
        return "Critical"
    elif mean_diff > 70:
        return "High"
    elif mean_diff > 40:
        return "Medium"
    else:
        return "Low"

def classify_damage_type(before_roi: np.ndarray, after_roi: np.ndarray, disaster_type: Optional[str]) -> str:
    """
    Classify the type of damage based on image characteristics and context.
    """
    # Convert regions to HSV for better color analysis
    before_hsv = cv2.cvtColor(before_roi, cv2.COLOR_BGR2HSV)
    after_hsv = cv2.cvtColor(after_roi, cv2.COLOR_BGR2HSV)
    
    # Calculate histograms for color distribution
    before_hist = cv2.calcHist([before_hsv], [0, 1], None, [180, 256], [0, 180, 0, 256])
    after_hist = cv2.calcHist([after_hsv], [0, 1], None, [180, 256], [0, 180, 0, 256])
    
    # Calculate histogram correlation
    correlation = cv2.compareHist(before_hist, after_hist, cv2.HISTCMP_CORREL)
    
    # Calculate mean color values
    before_mean = np.mean(before_roi, axis=(0, 1))
    after_mean = np.mean(after_roi, axis=(0, 1))
    
    # Detection logic based on color changes and disaster type
    blue_increase = after_mean[0] - before_mean[0]
    green_decrease = before_mean[1] - after_mean[1]
    red_increase = after_mean[2] - before_mean[2]
    texture_diff = calculate_texture_difference(before_roi, after_roi)
    
    # Classification logic
    if disaster_type == "flood" or blue_increase > 30:
        return "Flooding"
    elif disaster_type == "fire" or red_increase > 30:
        return "Fire Damage"
    elif disaster_type == "earthquake" and texture_diff > 50:
        return "Building Collapse"
    elif texture_diff > 50 and correlation < 0.5:
        return "Structural Damage"
    elif green_decrease > 20:
        return "Vegetation Loss"
    elif correlation < 0.3:
        return "Severe Damage"
    elif correlation < 0.7:
        return "Surface Damage"
    else:
        return "Minor Change"

def calculate_texture_difference(before_roi: np.ndarray, after_roi: np.ndarray) -> float:
    """
    Calculate the difference in texture between two image regions.
    """
    # Convert to grayscale
    before_gray = cv2.cvtColor(before_roi, cv2.COLOR_BGR2GRAY)
    after_gray = cv2.cvtColor(after_roi, cv2.COLOR_BGR2GRAY)
    
    # Apply Sobel operator for edge detection
    before_sobel_x = cv2.Sobel(before_gray, cv2.CV_64F, 1, 0, ksize=3)
    before_sobel_y = cv2.Sobel(before_gray, cv2.CV_64F, 0, 1, ksize=3)
    before_sobel = np.sqrt(before_sobel_x**2 + before_sobel_y**2)
    
    after_sobel_x = cv2.Sobel(after_gray, cv2.CV_64F, 1, 0, ksize=3)
    after_sobel_y = cv2.Sobel(after_gray, cv2.CV_64F, 0, 1, ksize=3)
    after_sobel = np.sqrt(after_sobel_x**2 + after_sobel_y**2)
    
    # Calculate the mean absolute difference in texture
    texture_diff = np.mean(np.abs(after_sobel - before_sobel))
    
    return texture_diff

def detect_building_damage(
    before_img: np.ndarray, 
    after_img: np.ndarray, 
    contours: List,
    analysis_level: str
) -> List[Dict[str, Any]]:
    """
    Detect and analyze building damage in the images.
    """
    building_damage = []
    
    # Convert to grayscale
    before_gray = cv2.cvtColor(before_img, cv2.COLOR_BGR2GRAY)
    after_gray = cv2.cvtColor(after_img, cv2.COLOR_BGR2GRAY)
    
    # Apply Canny edge detection
    before_edges = cv2.Canny(before_gray, 50, 150)
    after_edges = cv2.Canny(after_gray, 50, 150)
    
    # Find contours in the before image (potential buildings)
    building_contours, _ = cv2.findContours(before_edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Filter contours to find rectangular shapes (potential buildings)
    for i, contour in enumerate(building_contours):
        # Skip small contours
        if cv2.contourArea(contour) < 500:
            continue
        
        # Approximate the contour
        epsilon = 0.02 * cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, epsilon, True)
        
        # Buildings are typically rectangular (4-sided polygons)
        if len(approx) >= 4 and len(approx) <= 8:
            x, y, w, h = cv2.boundingRect(contour)
            
            # Check if this building overlaps with any damage contours
            for damage_contour in contours:
                damage_x, damage_y, damage_w, damage_h = cv2.boundingRect(damage_contour)
                
                # Check for overlap between building and damage
                if (x < damage_x + damage_w and x + w > damage_x and
                    y < damage_y + damage_h and y + h > damage_y):
                    
                    # Extract regions for analysis
                    before_roi = before_img[y:y+h, x:x+w]
                    after_roi = after_img[y:y+h, x:x+w]
                    
                    # Analyze severity
                    severity = calculate_building_damage_severity(before_roi, after_roi)
                    
                    # Basic building damage info
                    building_info = {
                        "id": i + 1,
                        "coordinates": [x, y, x+w, y+h],
                        "severity": severity,
                        "confidence": round(random.uniform(0.75, 0.95), 2)
                    }
                    
                    # For detailed analysis, add more information
                    if analysis_level == "detailed":
                        # Determine damage type
                        if severity == "Collapsed":
                            damage_type = "Complete Structural Failure"
                        elif severity == "Severely Damaged":
                            damage_type = "Major Structural Damage"
                        elif severity == "Partially Damaged":
                            damage_type = "Exterior Damage"
                        else:
                            damage_type = "Superficial Damage"
                        
                        building_info["type"] = damage_type
                        
                        # Add estimated safety assessment
                        if severity == "Collapsed" or severity == "Severely Damaged":
                            building_info["safety"] = "Unsafe - No Entry"
                        elif severity == "Partially Damaged":
                            building_info["safety"] = "Restricted Entry"
                        else:
                            building_info["safety"] = "Inspection Needed"
                    
                    building_damage.append(building_info)
                    
                    # Break to avoid duplicate entries for the same building
                    break
    
    return building_damage

def calculate_building_damage_severity(before_roi: np.ndarray, after_roi: np.ndarray) -> str:
    """
    Calculate the severity of building damage.
    """
    # Calculate structural similarity index
    before_gray = cv2.cvtColor(before_roi, cv2.COLOR_BGR2GRAY)
    after_gray = cv2.cvtColor(after_roi, cv2.COLOR_BGR2GRAY)
    
    # Calculate mean squared error between images
    mse = np.mean((before_gray - after_gray) ** 2)
    
    if mse > 3000:
        return "Collapsed"
    elif mse > 2000:
        return "Severely Damaged"
    elif mse > 1000:
        return "Partially Damaged"
    else:
        return "Minor Damage"

def detect_road_damage(
    before_img: np.ndarray, 
    after_img: np.ndarray, 
    contours: List,
    analysis_level: str
) -> List[Dict[str, Any]]:
    """
    Detect and analyze road damage in the images.
    """
    road_damage = []
    
    # Convert to HSV for better color segmentation
    before_hsv = cv2.cvtColor(before_img, cv2.COLOR_BGR2HSV)
    
    # Define road color range (grayish colors typical for roads)
    lower_gray = np.array([0, 0, 70])
    upper_gray = np.array([180, 30, 220])
    
    # Create a mask for road-like areas
    road_mask = cv2.inRange(before_hsv, lower_gray, upper_gray)
    
    # Apply morphological operations to clean the mask
    kernel = np.ones((5, 5), np.uint8)
    road_mask = cv2.morphologyEx(road_mask, cv2.MORPH_OPEN, kernel)
    road_mask = cv2.morphologyEx(road_mask, cv2.MORPH_CLOSE, kernel)
    
    # Find contours in the road mask
    road_contours, _ = cv2.findContours(road_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Check for overlap between road contours and damage contours
    for i, road_contour in enumerate(road_contours):
        # Skip small contours
        if cv2.contourArea(road_contour) < 1000:
            continue
        
        road_x, road_y, road_w, road_h = cv2.boundingRect(road_contour)
        
        for damage_contour in contours:
            damage_x, damage_y, damage_w, damage_h = cv2.boundingRect(damage_contour)
            
            # Check for overlap
            if (road_x < damage_x + damage_w and road_x + road_w > damage_x and
                road_y < damage_y + damage_h and road_y + road_h > damage_y):
                
                # Calculate overlap area
                overlap_x = max(road_x, damage_x)
                overlap_y = max(road_y, damage_y)
                overlap_w = min(road_x + road_w, damage_x + damage_w) - overlap_x
                overlap_h = min(road_y + road_h, damage_y + damage_h) - overlap_y
                
                # Skip if overlap is too small
                if overlap_w <= 0 or overlap_h <= 0:
                    continue
                
                # Extract overlap region for analysis
                before_overlap = before_img[overlap_y:overlap_y+overlap_h, overlap_x:overlap_x+overlap_w]
                after_overlap = after_img[overlap_y:overlap_y+overlap_h, overlap_x:overlap_x+overlap_w]
                
                # Determine severity
                severity = calculate_road_damage_severity(before_overlap, after_overlap)
                
                # Basic road damage info
                road_info = {
                    "id": i + 1,
                    "coordinates": [overlap_x, overlap_y, overlap_x+overlap_w, overlap_y+overlap_h],
                    "severity": severity,
                    "confidence": round(random.uniform(0.8, 0.95), 2)
                }
                
                # For detailed analysis, add more information
                if analysis_level == "detailed":
                    # Estimate length of damaged road segment (simplified)
                    pixel_length = max(overlap_w, overlap_h)
                    # Convert to meters (example scale)
                    length_meters = pixel_length * 0.5
                    road_info["length"] = round(length_meters, 1)
                    
                    # Add passability assessment
                    if severity == "Severe":
                        road_info["passability"] = "Impassable"
                    elif severity == "Moderate":
                        road_info["passability"] = "Difficult Passage"
                    else:
                        road_info["passability"] = "Passable with Caution"
                
                road_damage.append(road_info)
    
    return road_damage

def calculate_road_damage_severity(before_roi: np.ndarray, after_roi: np.ndarray) -> str:
    """
    Calculate the severity of road damage.
    """
    # Calculate texture differences as roads with damage show texture changes
    texture_diff = calculate_texture_difference(before_roi, after_roi)
    
    if texture_diff > 60:
        return "Severe"
    elif texture_diff > 40:
        return "Moderate"
    else:
        return "Minor"

def detect_flooded_areas(
    before_img: np.ndarray, 
    after_img: np.ndarray,
    analysis_level: str
) -> List[Dict[str, Any]]:
    """
    Detect and analyze flooded areas in the images.
    """
    flooded_areas = []
    
    # Convert to HSV for better water detection
    before_hsv = cv2.cvtColor(before_img, cv2.COLOR_BGR2HSV)
    after_hsv = cv2.cvtColor(after_img, cv2.COLOR_BGR2HSV)
    
    # Define blue/water color range
    lower_blue = np.array([90, 50, 50])
    upper_blue = np.array([130, 255, 255])
    
    # Create masks for water areas
    before_water_mask = cv2.inRange(before_hsv, lower_blue, upper_blue)
    after_water_mask = cv2.inRange(after_hsv, lower_blue, upper_blue)
    
    # Calculate new water areas (flooding)
    new_water = cv2.bitwise_and(after_water_mask, cv2.bitwise_not(before_water_mask))
    
    # Apply morphological operations to clean the mask
    kernel = np.ones((5, 5), np.uint8)
    new_water = cv2.morphologyEx(new_water, cv2.MORPH_OPEN, kernel)
    new_water = cv2.morphologyEx(new_water, cv2.MORPH_CLOSE, kernel)
    
    # Find contours in the new water mask
    flood_contours, _ = cv2.findContours(new_water, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for i, contour in enumerate(flood_contours):
        # Skip small water areas
        if cv2.contourArea(contour) < 500:
            continue
        
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        
        # Extract region for analysis
        after_roi = after_img[y:y+h, x:x+w]
        
        # Estimate water depth based on color intensity
        water_depth = estimate_water_depth(after_roi)
        
        # Basic flood area info
        flood_info = {
            "id": i + 1,
            "coordinates": [x, y, x+w, y+h],
            "water_depth": water_depth,
            "area": float(area),
            "confidence": round(random.uniform(0.85, 0.98), 2)
        }
        
        # For detailed analysis, add more information
        if analysis_level == "detailed":
            # Convert area to square meters (example scale)
            area_sqm = area * 0.25
            flood_info["area_sqm"] = round(area_sqm, 1)
            
            # Add water flow direction (example)
            # In a real implementation, this would use more sophisticated analysis
            flood_info["flow_direction"] = random.choice(["North", "South", "East", "West"])
            
            # Add estimated flood timeline
            flood_info["flood_timeline"] = random.choice(["Recent (< 24h)", "1-3 days", "> 3 days"])
        
        flooded_areas.append(flood_info)
    
    return flooded_areas

def estimate_water_depth(water_roi: np.ndarray) -> str:
    """
    Estimate the water depth based on color intensity.
    """
    # Extract blue channel
    blue_channel = water_roi[:, :, 0]
    
    # Calculate mean blue intensity
    mean_blue = np.mean(blue_channel)
    
    # Estimate depth based on blue intensity
    # This is a simplified model - in reality, water depth estimation is more complex
    if mean_blue > 180:
        return "0.5-1.0m"
    elif mean_blue > 150:
        return "1.0-2.0m"
    elif mean_blue > 120:
        return "2.0-3.0m"
    else:
        return ">3.0m"

def detect_vegetation_loss(
    before_img: np.ndarray, 
    after_img: np.ndarray,
    analysis_level: str
) -> List[Dict[str, Any]]:
    """
    Detect and analyze vegetation loss in the images.
    """
    vegetation_loss = []
    
    # Convert to HSV for better vegetation detection
    before_hsv = cv2.cvtColor(before_img, cv2.COLOR_BGR2HSV)
    after_hsv = cv2.cvtColor(after_img, cv2.COLOR_BGR2HSV)
    
    # Define green/vegetation color range
    lower_green = np.array([30, 40, 40])
    upper_green = np.array([90, 255, 255])
    
    # Create masks for vegetation areas
    before_veg_mask = cv2.inRange(before_hsv, lower_green, upper_green)
    after_veg_mask = cv2.inRange(after_hsv, lower_green, upper_green)
    
    # Calculate lost vegetation areas
    lost_vegetation = cv2.bitwise_and(before_veg_mask, cv2.bitwise_not(after_veg_mask))
    
    # Apply morphological operations to clean the mask
    kernel = np.ones((5, 5), np.uint8)
    lost_vegetation = cv2.morphologyEx(lost_vegetation, cv2.MORPH_OPEN, kernel)
    lost_vegetation = cv2.morphologyEx(lost_vegetation, cv2.MORPH_CLOSE, kernel)
    
    # Find contours in the lost vegetation mask
    veg_contours, _ = cv2.findContours(lost_vegetation, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    for i, contour in enumerate(veg_contours):
        # Skip small vegetation areas
        if cv2.contourArea(contour) < 500:
            continue
        
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        
        # Calculate area in square meters (assuming a scale factor)
        # In a real implementation, you would use GIS data for accurate measurement
        area_sqm = area * 0.25  # Example scale factor
        
        # Basic vegetation loss info
        veg_info = {
            "id": i + 1,
            "coordinates": [x, y, x+w, y+h],
            "area": f"{area_sqm:.1f} sqm",
            "confidence": round(random.uniform(0.8, 0.95), 2)
        }
        
        # For detailed analysis, add more information
        if analysis_level == "detailed":
            # Extract region for analysis
            before_roi = before_img[y:y+h, x:x+w]
            
            # Analyze vegetation density (simplified)
            green_channel = before_roi[:, :, 1]
            mean_green = np.mean(green_channel)
            
            if mean_green > 150:
                density = "Dense"
            elif mean_green > 100:
                density = "Moderate"
            else:
                density = "Sparse"
            
            veg_info["density"] = density
            
            # Add vegetation type (example)
            # In a real implementation, this would use more sophisticated analysis
            veg_info["vegetation_type"] = random.choice(["Forest", "Cropland", "Grassland", "Shrubland"])
            
            # Add ecological impact assessment
            if area_sqm > 10000:  # 1 hectare
                veg_info["ecological_impact"] = "Severe"
            elif area_sqm > 5000:  # 0.5 hectare
                veg_info["ecological_impact"] = "Moderate"
            else:
                veg_info["ecological_impact"] = "Low"
        
        vegetation_loss.append(veg_info)
    
    return vegetation_loss

@app.get("/api/results/{filename}")
async def get_result_image(filename: str):
    """
    Retrieve a result image by filename.
    """
    file_path = RESULTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Result image not found")
    
    return FileResponse(str(file_path))

@app.get("/api/disaster-types")
async def get_disaster_types():
    """
    Get available disaster types for analysis.
    """
    return {
        "disaster_types": [
            {"id": "flood", "name": "Flood", "description": "Flooding and water damage"},
            {"id": "earthquake", "name": "Earthquake", "description": "Earthquake damage"},
            {"id": "fire", "name": "Fire", "description": "Fire and burn damage"},
            {"id": "hurricane", "name": "Hurricane/Cyclone", "description": "Hurricane, cyclone or typhoon damage"},
            {"id": "landslide", "name": "Landslide", "description": "Landslide and mudslide damage"},
            {"id": "tornado", "name": "Tornado", "description": "Tornado damage"},
            {"id": "tsunami", "name": "Tsunami", "description": "Tsunami damage"},
            {"id": "volcanic", "name": "Volcanic Eruption", "description": "Volcanic eruption damage"},
            {"id": "other", "name": "Other", "description": "Other disaster types"}
        ],
        "analysis_levels": [
            {"id": "basic", "name": "Basic", "description": "Quick overview of damage"},
            {"id": "standard", "name": "Standard", "description": "Detailed damage assessment"},
            {"id": "detailed", "name": "Detailed", "description": "In-depth analysis with additional metrics"}
        ]
    }

@app.get("/api/regions")
async def get_regions():
    """
    Get available regions for context-specific analysis.
    """
    return {
        "regions": [
            {"id": "urban", "name": "Urban", "description": "Dense urban areas"},
            {"id": "suburban", "name": "Suburban", "description": "Suburban residential areas"},
            {"id": "rural", "name": "Rural", "description": "Rural and agricultural areas"},
            {"id": "forest", "name": "Forest", "description": "Forested regions"},
            {"id": "coastal", "name": "Coastal", "description": "Coastal areas"},
            {"id": "mountainous", "name": "Mountainous", "description": "Mountainous terrain"},
            {"id": "desert", "name": "Desert", "description": "Desert regions"},
            {"id": "industrial", "name": "Industrial", "description": "Industrial zones"},
            {"id": "agricultural", "name": "Agricultural", "description": "Agricultural land"}
        ]
    }

@app.delete("/api/images/{image_id}")
async def delete_image(image_id: str):
    """
    Delete an uploaded image.
    """
    file_path = UPLOAD_DIR / image_id
    thumbnail_path = UPLOAD_DIR / "thumbnails" / image_id
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        os.remove(file_path)
        if thumbnail_path.exists():
            os.remove(thumbnail_path)
        return {"status": "success", "message": "Image deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete image: {str(e)}")

@app.delete("/api/analysis-result/{comparison_id}")
async def delete_analysis_result(comparison_id: str):
    """
    Delete an analysis result.
    """
    # Check if the result exists
    results_file = RESULTS_DIR / f"{comparison_id}.json"
    if not results_file.exists():
        raise HTTPException(status_code=404, detail="Analysis result not found")
    
    try:
        # Delete the result file
        os.remove(results_file)
        
        # Delete related images
        for prefix in ["before", "after", "diff"]:
            image_path = RESULTS_DIR / f"{comparison_id}_{prefix}.jpg"
            if image_path.exists():
                os.remove(image_path)
        
        # Remove from jobs if present
        if comparison_id in analysis_jobs:
            del analysis_jobs[comparison_id]
        
        return {"status": "success", "message": "Analysis result deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting analysis result: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete analysis result: {str(e)}")

@app.get("/api/stats")
async def get_stats():
    """
    Get system statistics.
    """
    try:
        # Count uploaded images
        upload_count = len([f for f in os.listdir(UPLOAD_DIR) if os.path.isfile(os.path.join(UPLOAD_DIR, f)) and not f.startswith('.')])
        
        # Count analysis results
        result_count = len([f for f in os.listdir(RESULTS_DIR) if f.endswith('.json')])
        
        # Count active jobs
        active_jobs = len([job for job in analysis_jobs.values() if job["status"] in ["queued", "processing"]])
        
        # System uptime (example)
        uptime = "17h 42m"  # In a real implementation, this would be calculated
        
        return {
            "upload_count": upload_count,
            "result_count": result_count,
            "active_jobs": active_jobs,
            "uptime": uptime,
            "disk_usage": {
                "uploads": get_dir_size(UPLOAD_DIR),
                "results": get_dir_size(RESULTS_DIR)
            }
        }
    except Exception as e:
        logger.error(f"Error getting stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

def get_dir_size(path: Path) -> str:
    """Get directory size in human-readable format"""
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if not os.path.islink(fp):
                total_size += os.path.getsize(fp)
    
    # Convert to human-readable format
    for unit in ['B', 'KB', 'MB', 'GB']:
        if total_size < 1024.0:
            return f"{total_size:.1f} {unit}"
        total_size /= 1024.0
    return f"{total_size:.1f} TB"

# Add a simple health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Add CRUD operations for saved analyses (optional)
class SavedAnalysis(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    comparison_id: str
    created_at: str
    tags: List[str] = []

@app.post("/api/saved-analyses")
async def save_analysis(analysis: SavedAnalysis):
    """
    Save an analysis with a custom name and description.
    """
    try:
        # Create directory if it doesn't exist
        saved_dir = Path("saved_analyses")
        saved_dir.mkdir(exist_ok=True)
        
        # Check if the referenced comparison exists
        results_file = RESULTS_DIR / f"{analysis.comparison_id}.json"
        if not results_file.exists():
            raise HTTPException(status_code=404, detail="Referenced analysis not found")
        
        # Save the analysis metadata
        saved_file = saved_dir / f"{analysis.id}.json"
        with open(saved_file, "w") as f:
            json.dump(analysis.dict(), f)
        
        return {"status": "success", "id": analysis.id}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error saving analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save analysis: {str(e)}")

@app.get("/api/saved-analyses")
async def get_saved_analyses():
    """
    Get all saved analyses.
    """
    try:
        saved_dir = Path("saved_analyses")
        if not saved_dir.exists():
            return {"analyses": []}
        
        analyses = []
        for file in saved_dir.glob("*.json"):
            with open(file, "r") as f:
                analyses.append(json.load(f))
        
        return {"analyses": analyses}
    except Exception as e:
        logger.error(f"Error getting saved analyses: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get saved analyses: {str(e)}")

@app.get("/api/saved-analyses/{analysis_id}")
async def get_saved_analysis(analysis_id: str):
    """
    Get a specific saved analysis.
    """
    try:
        saved_file = Path("saved_analyses") / f"{analysis_id}.json"
        if not saved_file.exists():
            raise HTTPException(status_code=404, detail="Saved analysis not found")
        
        with open(saved_file, "r") as f:
            analysis = json.load(f)
        
        # Get the actual analysis data
        results_file = RESULTS_DIR / f"{analysis['comparison_id']}.json"
        if results_file.exists():
            with open(results_file, "r") as f:
                analysis_data = json.load(f)
                analysis["data"] = analysis_data
        
        return analysis
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error getting saved analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get saved analysis: {str(e)}")

# Serve static files if needed
app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
