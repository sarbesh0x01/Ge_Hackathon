from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import io
from PIL import Image
import base64
import os
import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create our FastAPI app
app = FastAPI(title="Disaster Assessment API", version="1.0.0")

# Configure CORS to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to import the chatbot - with graceful fallback if it fails
try:
    from chatbot.api import router as chatbot_router
    app.include_router(chatbot_router, prefix="/api/chatbot", tags=["chatbot"])
    logger.info("Chatbot module loaded successfully")
except Exception as e:
    logger.warning(f"Chatbot module failed to load: {e}")
    logger.info("The application will continue without chatbot functionality")

# Rest of your existing code...

@app.get("/")
async def root():
    """Root endpoint to check if the API is running"""
    return {
        "message": "Disaster Assessment API is running", 
        "status": "ok",
        "version": "1.0.0"
    }

@app.post("/api/analyze")
async def analyze_images(
    pre_image: UploadFile = File(...),
    post_image: UploadFile = File(...)
):
    """Analyze pre and post disaster images"""
    try:
        # Read images
        pre_img = await read_image(pre_image)
        post_img = await read_image(post_image)
        
        # Ensure images are the same size for comparison
        # Use a smaller size to save memory
        target_size = (400, 400)
        pre_img = cv2.resize(pre_img, target_size)
        post_img = cv2.resize(post_img, target_size)
        
        # Convert to grayscale for simpler comparison
        pre_gray = cv2.cvtColor(pre_img, cv2.COLOR_BGR2GRAY)
        post_gray = cv2.cvtColor(post_img, cv2.COLOR_BGR2GRAY)
        
        # Calculate absolute difference between images
        diff = cv2.absdiff(pre_gray, post_gray)
        
        # Apply threshold to highlight significant changes
        _, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)
        
        # Calculate percentage of changed pixels
        change_percent = (np.count_nonzero(thresh) / thresh.size) * 100
        
        # Create a colored visualization of the changes
        diff_color = cv2.absdiff(pre_img, post_img)
        
        # Apply color map to enhance visualization
        diff_heat = cv2.applyColorMap(diff, cv2.COLORMAP_JET)
        
        # Create a combined visualization image
        # Resize for display purposes
        display_size = (200, 200)
        pre_display = cv2.resize(pre_img, display_size)
        post_display = cv2.resize(post_img, display_size)
        diff_display = cv2.resize(diff_heat, display_size)
        
        # Stack the images horizontally
        combined = np.hstack((pre_display, post_display, diff_display))
        
        # Convert the images to base64 for display
        pre_encoded = cv2_to_base64(pre_display)
        post_encoded = cv2_to_base64(post_display)
        diff_encoded = cv2_to_base64(diff_display)
        combined_encoded = cv2_to_base64(combined)
        
        # Get impact assessment
        impact_level = get_impact_level(change_percent)
        
        # Generate regions of interest (areas with most change)
        roi_data = identify_regions_of_interest(thresh, diff_color)
        
        return {
            "change_percentage": round(change_percent, 2),
            "impact_level": impact_level["level"],
            "impact_description": impact_level["description"],
            "images": {
                "pre_image": pre_encoded,
                "post_image": post_encoded,
                "diff_image": diff_encoded,
                "combined": combined_encoded
            },
            "analysis_details": {
                "changed_pixels": int(np.count_nonzero(thresh)),
                "total_pixels": thresh.size,
                "average_intensity_change": float(np.mean(diff)),
                "regions_of_interest": roi_data
            },
            "recommendations": get_recommendations(impact_level["level"])
        }
        
    except Exception as e:
        print(f"Error processing images: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing images: {str(e)}"
        )

def get_impact_level(change_percent):
    """Determine the impact level and provide a description"""
    if change_percent < 10:
        return {
            "level": "Low",
            "description": "Minor changes detected. Limited impact observed."
        }
    elif change_percent < 30:
        return {
            "level": "Medium",
            "description": "Moderate changes detected. Significant impact in specific areas."
        }
    else:
        return {
            "level": "High",
            "description": "Major changes detected. Widespread and severe impact observed."
        }

def identify_regions_of_interest(threshold_image, color_diff):
    """Identify regions with significant changes"""
    # Find contours in the threshold image
    contours, _ = cv2.findContours(threshold_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Sort contours by area (largest first)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    
    # Take top 3 ROIs
    roi_list = []
    for i, contour in enumerate(contours[:3]):
        if cv2.contourArea(contour) > 50:  # Only include if area is significant
            x, y, w, h = cv2.boundingRect(contour)
            roi_list.append({
                "id": i + 1,
                "position": {"x": int(x), "y": int(y)},
                "size": {"width": int(w), "height": int(h)},
                "area": int(cv2.contourArea(contour)),
                "severity": "High" if i == 0 else "Medium" if i == 1 else "Low"
            })
    
    return roi_list

def get_recommendations(impact_level):
    """Generate recommendations based on impact level"""
    if impact_level == "Low":
        return [
            "Conduct routine monitoring to ensure no further deterioration",
            "Document the changes for future reference",
            "Implement preventative measures in vulnerable areas"
        ]
    elif impact_level == "Medium":
        return [
            "Prioritize recovery efforts in the most affected regions",
            "Conduct a detailed assessment of structural integrity",
            "Allocate resources for targeted repair and restoration",
            "Implement temporary support or containment measures"
        ]
    else:  # High
        return [
            "Immediate evacuation may be necessary in severely affected areas",
            "Deploy emergency response teams to address critical damage",
            "Establish temporary shelter and essential services",
            "Develop a comprehensive rehabilitation and reconstruction plan",
            "Request additional resources and external assistance"
        ]

async def read_image(file: UploadFile):
    """Read and convert an uploaded image file to OpenCV format"""
    # Read the file contents
    contents = await file.read()
    
    # Convert to numpy array
    image = np.array(Image.open(io.BytesIO(contents)))
    
    # Convert from RGB to BGR (OpenCV format)
    if len(image.shape) == 3 and image.shape[2] == 3:
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    
    return image

def cv2_to_base64(image):
    """Convert an OpenCV image to base64 string for web display"""
    # Convert OpenCV image to base64 string
    _, buffer = cv2.imencode('.png', image)
    return base64.b64encode(buffer).decode('utf-8')

if __name__ == "__main__":
    import uvicorn
    
    # Determine port - use environment variable if available, otherwise default to 8000
    port = int(os.environ.get("PORT", 8000))
    
    print(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
