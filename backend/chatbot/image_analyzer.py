import os
import cv2
import numpy as np
import torch
from PIL import Image
import io
import base64
import logging
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum
import json

# Configure logging
logger = logging.getLogger(__name__)

class DisasterType(Enum):
    """Types of disasters that can be analyzed"""
    FLOOD = "flood"
    FIRE = "fire"
    EARTHQUAKE = "earthquake"
    HURRICANE = "hurricane"
    LANDSLIDE = "landslide"
    UNKNOWN = "unknown"

@dataclass
class AnalysisResult:
    """Structured result of disaster image analysis"""
    change_percentage: float
    impact_level: str
    impact_description: str
    regions_of_interest: List[Dict]
    metadata: Dict
    disaster_type: DisasterType
    confidence_score: float
    images: Dict[str, str]  # Base64 encoded images
    analysis_details: Dict

class DisasterImageAnalyzer:
    """
    Advanced disaster image analysis module that uses computer vision
    techniques to compare pre and post disaster images.
    """
    
    def __init__(self, use_gpu: bool = True):
        """Initialize the analyzer with optional GPU support"""
        # Check for available hardware
        self.device = "cuda" if torch.cuda.is_available() and use_gpu else "cpu"
        logger.info(f"Image analyzer using device: {self.device}")
        
        # Initialize models if using deep learning
        self.initialize_models()
        
        # Set default parameters
        self.default_target_size = (400, 400)
        self.default_display_size = (200, 200)
        self.threshold_value = 30  # Default threshold for change detection
        
        logger.info("Disaster image analyzer initialized successfully")
    
    def initialize_models(self):
        """Initialize computer vision models for analysis"""
        try:
            # Here you would load any ML models needed for analysis
            # For example, a segmentation model for disaster area detection
            
            # Placeholder for segmentation model
            self.seg_model = None
            
            # Placeholder for classification model
            self.classifier = None
            
            # Load classification model if available
            model_path = os.getenv("DISASTER_CLASSIFIER_MODEL", "")
            if model_path and os.path.exists(model_path):
                # Here you'd load your model
                # self.classifier = YourModelClass(model_path)
                logger.info(f"Loaded disaster classification model from {model_path}")
                
        except Exception as e:
            logger.error(f"Error initializing models: {e}")
            logger.warning("Continuing with basic image processing only")
    
    async def analyze_images(
        self, 
        pre_image_data: bytes, 
        post_image_data: bytes,
        analysis_options: Optional[Dict] = None
    ) -> AnalysisResult:
        """
        Analyze pre and post disaster images to detect changes and assess impact
        
        Args:
            pre_image_data: Raw bytes of pre-disaster image
            post_image_data: Raw bytes of post-disaster image
            analysis_options: Optional configuration parameters
            
        Returns:
            AnalysisResult object containing analysis findings
        """
        try:
            # Parse options or use defaults
            options = analysis_options or {}
            target_size = options.get("target_size", self.default_target_size)
            display_size = options.get("display_size", self.default_display_size)
            threshold = options.get("threshold", self.threshold_value)
            
            # Convert bytes to OpenCV format
            pre_img = self._bytes_to_cv2(pre_image_data)
            post_img = self._bytes_to_cv2(post_image_data)
            
            # Resize images for analysis
            pre_img = cv2.resize(pre_img, target_size)
            post_img = cv2.resize(post_img, target_size)
            
            # Basic analysis - Convert to grayscale for comparison
            pre_gray = cv2.cvtColor(pre_img, cv2.COLOR_BGR2GRAY)
            post_gray = cv2.cvtColor(post_img, cv2.COLOR_BGR2GRAY)
            
            # Calculate absolute difference between images
            diff = cv2.absdiff(pre_gray, post_gray)
            
            # Apply threshold to highlight significant changes
            _, thresh = cv2.threshold(diff, threshold, 255, cv2.THRESH_BINARY)
            
            # Calculate percentage of changed pixels
            change_percent = (np.count_nonzero(thresh) / thresh.size) * 100
            
            # Create a colored visualization of the changes
            diff_color = cv2.absdiff(pre_img, post_img)
            
            # Apply color map to enhance visualization
            diff_heat = cv2.applyColorMap(diff, cv2.COLORMAP_JET)
            
            # Create a combined visualization image
            # Resize for display purposes
            pre_display = cv2.resize(pre_img, display_size)
            post_display = cv2.resize(post_img, display_size)
            diff_display = cv2.resize(diff_heat, display_size)
            
            # Stack the images horizontally
            combined = np.hstack((pre_display, post_display, diff_display))
            
            # Convert the images to base64 for display
            pre_encoded = self._cv2_to_base64(pre_display)
            post_encoded = self._cv2_to_base64(post_display)
            diff_encoded = self._cv2_to_base64(diff_display)
            combined_encoded = self._cv2_to_base64(combined)
            
            # Use advanced analysis if available
            disaster_type, confidence = self._classify_disaster_type(pre_img, post_img, diff_color)
            
            # Get impact assessment
            impact_level = self._get_impact_level(change_percent)
            
            # Generate regions of interest (areas with most change)
            roi_data = self._identify_regions_of_interest(thresh, diff_color)
            
            # Create detailed analysis metadata 
            metadata = {
                "analysis_timestamp": self._get_timestamp(),
                "threshold_used": threshold,
                "resolution": f"{target_size[0]}x{target_size[1]}",
                "processing_device": self.device
            }
            
            # Generate recommendations based on analysis
            recommendations = self._get_recommendations(impact_level["level"], disaster_type)
            
            # Compile analysis details
            analysis_details = {
                "changed_pixels": int(np.count_nonzero(thresh)),
                "total_pixels": thresh.size,
                "average_intensity_change": float(np.mean(diff)),
                "regions_of_interest": roi_data,
                "recommendations": recommendations
            }
            
            # Create result object
            result = AnalysisResult(
                change_percentage=round(change_percent, 2),
                impact_level=impact_level["level"],
                impact_description=impact_level["description"],
                regions_of_interest=roi_data,
                metadata=metadata,
                disaster_type=disaster_type,
                confidence_score=confidence,
                images={
                    "pre_image": pre_encoded,
                    "post_image": post_encoded,
                    "diff_image": diff_encoded,
                    "combined": combined_encoded
                },
                analysis_details=analysis_details
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing images: {str(e)}")
            raise RuntimeError(f"Failed to analyze images: {str(e)}")
    
    def _bytes_to_cv2(self, image_data: bytes) -> np.ndarray:
        """Convert image bytes to OpenCV format"""
        # Convert to numpy array
        image = np.array(Image.open(io.BytesIO(image_data)))
        
        # Convert from RGB to BGR (OpenCV format)
        if len(image.shape) == 3 and image.shape[2] == 3:
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        
        return image
    
    def _cv2_to_base64(self, image: np.ndarray) -> str:
        """Convert an OpenCV image to base64 string for web display"""
        # Convert OpenCV image to base64 string
        _, buffer = cv2.imencode('.png', image)
        return base64.b64encode(buffer).decode('utf-8')
    
    def _get_timestamp(self) -> str:
        """Get current timestamp string"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def _classify_disaster_type(
        self, 
        pre_img: np.ndarray, 
        post_img: np.ndarray, 
        diff: np.ndarray
    ) -> Tuple[DisasterType, float]:
        """
        Determine disaster type from images
        
        This is a placeholder for a more sophisticated model-based approach.
        In a real implementation, this would use a trained classifier.
        """
        # Here you'd use your classifier model
        if self.classifier:
            # Use the model for classification
            # result = self.classifier(post_img)
            # return result.class, result.confidence
            pass
        
        # Simple heuristic as fallback
        # Check for water-like color changes (blue/dark tones) for flood
        blue_increase = np.mean(post_img[:,:,0]) - np.mean(pre_img[:,:,0])
        
        # Check for brown/orange color increases for fire/burn
        orange_increase = (
            np.mean(post_img[:,:,1]) - np.mean(pre_img[:,:,1]) +
            np.mean(post_img[:,:,2]) - np.mean(pre_img[:,:,2])
        )
        
        # Check for structural collapse patterns (vertical lines become irregular)
        # This is a simplified placeholder for actual structural analysis
        edges_pre = cv2.Canny(pre_img, 100, 200)
        edges_post = cv2.Canny(post_img, 100, 200)
        edge_diff = cv2.absdiff(edges_pre, edges_post)
        edge_change = np.count_nonzero(edge_diff) / edge_diff.size
        
        # Simple decision tree
        confidence = 0.6  # Base confidence
        
        if blue_increase > 20 and np.mean(diff) > 30:
            disaster_type = DisasterType.FLOOD
            confidence = 0.7
        elif orange_increase > 30:
            disaster_type = DisasterType.FIRE
            confidence = 0.65
        elif edge_change > 0.4:
            disaster_type = DisasterType.EARTHQUAKE
            confidence = 0.6
        else:
            disaster_type = DisasterType.UNKNOWN
            confidence = 0.5
            
        return disaster_type, confidence
    
    def _get_impact_level(self, change_percent: float) -> Dict:
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
    
    def _identify_regions_of_interest(self, threshold_image: np.ndarray, color_diff: np.ndarray) -> List[Dict]:
        """Identify regions with significant changes"""
        # Find contours in the threshold image
        contours, _ = cv2.findContours(threshold_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Sort contours by area (largest first)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        
        # Take top ROIs
        roi_list = []
        for i, contour in enumerate(contours[:3]):
            if cv2.contourArea(contour) > 50:  # Only include if area is significant
                x, y, w, h = cv2.boundingRect(contour)
                
                # Calculate mean color in this region for additional insights
                region = color_diff[y:y+h, x:x+w]
                mean_color = np.mean(region, axis=(0,1))
                
                roi_list.append({
                    "id": i + 1,
                    "position": {"x": int(x), "y": int(y)},
                    "size": {"width": int(w), "height": int(h)},
                    "area": int(cv2.contourArea(contour)),
                    "severity": "High" if i == 0 else "Medium" if i == 1 else "Low",
                    "mean_color_change": [float(c) for c in mean_color]
                })
        
        return roi_list
    
    def _get_recommendations(self, impact_level: str, disaster_type: DisasterType) -> List[str]:
        """Generate recommendations based on impact level and disaster type"""
        general_recommendations = {
            "Low": [
                "Conduct routine monitoring to ensure no further deterioration",
                "Document the changes for future reference",
                "Implement preventative measures in vulnerable areas"
            ],
            "Medium": [
                "Prioritize recovery efforts in the most affected regions",
                "Conduct a detailed assessment of structural integrity",
                "Allocate resources for targeted repair and restoration",
                "Implement temporary support or containment measures"
            ],
            "High": [
                "Immediate evacuation may be necessary in severely affected areas",
                "Deploy emergency response teams to address critical damage",
                "Establish temporary shelter and essential services",
                "Develop a comprehensive rehabilitation and reconstruction plan",
                "Request additional resources and external assistance"
            ]
        }
        
        # Add disaster-specific recommendations
        specific_recommendations = {
            DisasterType.FLOOD: [
                "Assess water contamination levels before reoccupation",
                "Check electrical systems for water damage before restoring power",
                "Implement proper drainage before reconstruction",
                "Monitor for mold growth in affected structures"
            ],
            DisasterType.FIRE: [
                "Evaluate structural integrity of fire-damaged buildings",
                "Assess soil erosion risk in burned areas",
                "Monitor for potential landslides in steep, burned terrain",
                "Implement erosion control measures before rainy season"
            ],
            DisasterType.EARTHQUAKE: [
                "Inspect for structural damage, particularly to load-bearing walls",
                "Check for gas leaks and damaged utility lines",
                "Assess buildings for lateral stability and foundation damage",
                "Monitor for aftershock impacts to already-damaged structures"
            ],
            DisasterType.HURRICANE: [
                "Inspect roofs and building envelopes for wind damage",
                "Check for water intrusion through damaged roofs and windows",
                "Assess trees and overhead hazards around structures",
                "Evaluate coastal erosion and sea defenses"
            ],
            DisasterType.LANDSLIDE: [
                "Monitor slope stability for continuing movement",
                "Assess drainage patterns that may contribute to further slides",
                "Evaluate neighboring areas for similar risk factors",
                "Consider slope reinforcement or terracing during reconstruction"
            ],
            DisasterType.UNKNOWN: [
                "Conduct a multi-hazard assessment to determine disaster type",
                "Document all observed changes in detail for expert analysis",
                "Use caution when approaching affected areas",
                "Consult with disaster assessment specialists"
            ]
        }
        
        # Combine general and specific recommendations
        recommendations = general_recommendations.get(impact_level, [])
        
        if disaster_type in specific_recommendations:
            # Add 2-3 specific recommendations based on disaster type
            disaster_recs = specific_recommendations[disaster_type]
            recommendations.extend(disaster_recs[:3])
        
        return recommendations
    
    def get_analysis_as_json(self, result: AnalysisResult) -> str:
        """Convert analysis result to JSON for storage or API response"""
        # Convert to dictionary format
        result_dict = {
            "change_percentage": result.change_percentage,
            "impact_level": result.impact_level,
            "impact_description": result.impact_description,
            "regions_of_interest": result.regions_of_interest,
            "metadata": result.metadata,
            "disaster_type": result.disaster_type.value,
            "confidence_score": result.confidence_score,
            "images": result.images,
            "analysis_details": result.analysis_details
        }
        
        # Convert to JSON string
        return json.dumps(result_dict, indent=2)
    
    def get_chatbot_context(self, result: AnalysisResult) -> Dict:
        """
        Extract relevant information from analysis result that can be
        shared with the chatbot as context
        """
        context = {
            "disaster_type": result.disaster_type.value,
            "impact_level": result.impact_level,
            "impact_description": result.impact_description,
            "change_percentage": result.change_percentage,
            "key_findings": [
                f"Impact level: {result.impact_level}",
                f"Detected disaster type: {result.disaster_type.value.capitalize()} (confidence: {int(result.confidence_score*100)}%)",
                f"Changed area: {result.change_percentage}% of the image"
            ],
            "regions_of_interest": [
                {
                    "id": roi["id"],
                    "severity": roi["severity"],
                    "area": roi["area"]
                } for roi in result.regions_of_interest
            ],
            "recommendations": result.analysis_details["recommendations"]
        }
        
        return context

# Create a singleton instance for the module
analyzer = DisasterImageAnalyzer()
