from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import cv2
import numpy as np
import os
import uuid
import shutil
from datetime import datetime
import logging
from PIL import Image
import io
import base64

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Disaster Assessment API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, you should specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories for storing images
os.makedirs("uploads", exist_ok=True)
os.makedirs("results", exist_ok=True)


class ImageComparisonRequest(BaseModel):
    before_image_id: str
    after_image_id: str
    region: Optional[str] = None
    disaster_type: Optional[str] = None


class AnalysisResult(BaseModel):
    comparison_id: str
    before_image_url: str
    after_image_url: str
    difference_image_url: str
    changed_pixels_percentage: float
    damaged_areas: List[Dict[str, Any]]
    building_damage: List[Dict[str, Any]]
    road_damage: List[Dict[str, Any]]
    flooded_areas: List[Dict[str, Any]]
    vegetation_loss: List[Dict[str, Any]]
    created_at: str


@app.post("/api/upload-image", response_model=Dict[str, str])
async def upload_image(file: UploadFile = File(...)):
    """
    Upload a single image file for disaster analysis.
    """
    try:
        # Generate a unique filename
        file_extension = file.filename.split(".")[-1]
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join("uploads", filename)
        
        # Save the file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return {"image_id": filename, "url": f"/api/images/{filename}"}
    
    except Exception as e:
        logger.error(f"Error uploading image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")


@app.get("/api/images/{image_id}")
async def get_image(image_id: str):
    """
    Retrieve an uploaded image by ID.
    """
    file_path = os.path.join("uploads", image_id)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(file_path)


@app.post("/api/analyze", response_model=AnalysisResult)
async def analyze_images(request: ImageComparisonRequest):
    """
    Analyze before and after disaster images to identify changes and damage.
    """
    try:
        before_path = os.path.join("uploads", request.before_image_id)
        after_path = os.path.join("uploads", request.after_image_id)
        
        # Check if images exist
        if not os.path.exists(before_path) or not os.path.exists(after_path):
            raise HTTPException(status_code=404, detail="One or both images not found")
        
        # Generate a unique ID for this comparison
        comparison_id = str(uuid.uuid4())
        
        # Read the images
        before_img = cv2.imread(before_path)
        after_img = cv2.imread(after_path)
        
        # Ensure both images have the same dimensions
        if before_img.shape != after_img.shape:
            # Resize the after image to match the before image dimensions
            after_img = cv2.resize(after_img, (before_img.shape[1], before_img.shape[0]))
        
        # Perform image comparison and damage analysis
        result = compare_images(before_img, after_img, comparison_id, request.disaster_type)
        return result
    
    except Exception as e:
        logger.error(f"Error analyzing images: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


def compare_images(before_img: np.ndarray, after_img: np.ndarray, comparison_id: str, disaster_type: Optional[str]) -> AnalysisResult:
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
    diff_path = os.path.join("results", diff_filename)
    cv2.imwrite(diff_path, diff_color)
    
    # Store original images for reference
    before_filename = f"{comparison_id}_before.jpg"
    after_filename = f"{comparison_id}_after.jpg"
    before_path = os.path.join("results", before_filename)
    after_path = os.path.join("results", after_filename)
    cv2.imwrite(before_path, before_img)
    cv2.imwrite(after_path, after_img)
    
    # Analyze specific types of damage based on the detected changes
    damaged_areas = analyze_damaged_areas(contours, before_img, after_img, disaster_type)
    building_damage = detect_building_damage(before_img, after_img, contours)
    road_damage = detect_road_damage(before_img, after_img, contours)
    flooded_areas = detect_flooded_areas(before_img, after_img)
    vegetation_loss = detect_vegetation_loss(before_img, after_img)
    
    # Prepare the response
    result = AnalysisResult(
        comparison_id=comparison_id,
        before_image_url=f"/api/results/{before_filename}",
        after_image_url=f"/api/results/{after_filename}",
        difference_image_url=f"/api/results/{diff_filename}",
        changed_pixels_percentage=round(changed_percentage, 2),
        damaged_areas=damaged_areas,
        building_damage=building_damage,
        road_damage=road_damage,
        flooded_areas=flooded_areas,
        vegetation_loss=vegetation_loss,
        created_at=datetime.now().isoformat()
    )
    
    return result


def analyze_damaged_areas(contours: List, before_img: np.ndarray, after_img: np.ndarray, disaster_type: Optional[str]) -> List[Dict[str, Any]]:
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
        severity = calculate_severity(before_roi, after_roi)
        
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
    
    return damaged_areas


def calculate_severity(before_roi: np.ndarray, after_roi: np.ndarray) -> str:
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
    texture_diff = calculate_texture_difference(before_roi, after_roi)
    
    # Classification logic
    if disaster_type == "flood" or blue_increase > 30:
        return "Flooding"
    elif texture_diff > 50 and correlation < 0.5:
        return "Building Collapse"
    elif green_decrease > 20:
        return "Vegetation Loss"
    elif correlation < 0.3:
        return "Structural Damage"
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


def detect_building_damage(before_img: np.ndarray, after_img: np.ndarray, contours: List) -> List[Dict[str, Any]]:
    """
    Detect and analyze building damage in the images.
    """
    building_damage = []
    
    # Apply building segmentation (simplified for this example)
    # In a real implementation, you would use a trained building segmentation model
    # For demonstration, we'll use edge detection and contour analysis
    
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
                    
                    building_damage.append({
                        "id": i + 1,
                        "coordinates": [x, y, x+w, y+h],
                        "severity": severity,
                        "confidence": round(random.uniform(0.75, 0.95), 2)  # In a real implementation, this would be model confidence
                    })
                    
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


def detect_road_damage(before_img: np.ndarray, after_img: np.ndarray, contours: List) -> List[Dict[str, Any]]:
    """
    Detect and analyze road damage in the images.
    """
    road_damage = []
    
    # In a real implementation, you would use a trained road segmentation model
    # For simplicity, we'll use color-based segmentation and contour overlap analysis
    
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
                
                road_damage.append({
                    "id": i + 1,
                    "coordinates": [overlap_x, overlap_y, overlap_x+overlap_w, overlap_y+overlap_h],
                    "severity": severity,
                    "confidence": round(random.uniform(0.8, 0.95), 2)
                })
                
                # No break here as we want to find all damaged road sections
    
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


def detect_flooded_areas(before_img: np.ndarray, after_img: np.ndarray) -> List[Dict[str, Any]]:
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
        
        # Extract region for analysis
        after_roi = after_img[y:y+h, x:x+w]
        
        # Estimate water depth based on color intensity
        water_depth = estimate_water_depth(after_roi)
        
        flooded_areas.append({
            "id": i + 1,
            "coordinates": [x, y, x+w, y+h],
            "waterDepth": water_depth,
            "confidence": round(random.uniform(0.85, 0.98), 2)
        })
    
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


def detect_vegetation_loss(before_img: np.ndarray, after_img: np.ndarray) -> List[Dict[str, Any]]:
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
        
        vegetation_loss.append({
            "id": i + 1,
            "coordinates": [x, y, x+w, y+h],
            "area": f"{area_sqm:.1f} sqm",
            "confidence": round(random.uniform(0.8, 0.95), 2)
        })
    
    return vegetation_loss


@app.get("/api/results/{filename}")
async def get_result_image(filename: str):
    """
    Retrieve a result image by filename.
    """
    file_path = os.path.join("results", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Result image not found")
    
    return FileResponse(file_path)


# Add missing imports
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import random

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Add a simple health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
