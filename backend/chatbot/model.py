import os
import json
import numpy as np
import torch
from transformers import DistilBertTokenizer, DistilBertModel
from sklearn.metrics.pairwise import cosine_similarity
import logging
import requests
from typing import List, Dict, Tuple, Optional, Any
from dotenv import load_dotenv
import random
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging_level = os.getenv("LOG_LEVEL", "INFO")
logging.basicConfig(
    level=getattr(logging, logging_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

class DisasterChatbot:
    """
    A disaster assessment chatbot that uses a small DistilBERT model for 
    understanding user queries and a template-based response system with
    local knowledge base for disaster assessment.
    """
    
    def __init__(self):
        # Check for available hardware
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        
        # Report GPU memory if available
        if self.device == "cuda":
            if hasattr(torch.cuda, 'mem_get_info'):
                free_memory, total_memory = torch.cuda.mem_get_info()
                logger.info(f"GPU memory: {free_memory / 1024**3:.2f}GB free of {total_memory / 1024**3:.2f}GB total")
        
        try:
            # Load a small DistilBERT model and tokenizer
            model_name = "distilbert-base-uncased"
            logger.info(f"Loading model: {model_name}")
            
            self.tokenizer = DistilBertTokenizer.from_pretrained(model_name)
            self.model = DistilBertModel.from_pretrained(model_name)
            
            # Move model to GPU if available
            self.model = self.model.to(self.device)
            self.model.eval()  # Set model to evaluation mode
            logger.info("Model loaded successfully")
            
            # Initialize conversation history
            self.conversation_history = []
            
            # Load predefined responses and intents
            self.load_response_templates()
            
            # Load local knowledge base
            self.load_knowledge_base()
            
            # Load historical disaster facts
            self.load_historical_disasters()
            
            # Set up SerpAPI key - try to get from env or use hardcoded fallback
            self.serpapi_key = os.getenv("SERPAPI_KEY", "e07f47762b7619935d3430ec0f773293594d492e6bee123b6267bc13f88d7dde")
            logger.info(f"SerpAPI key configured: {'Yes' if self.serpapi_key else 'No'}")
            
            # Set web search as optional/fallback
            self.use_web_search_fallback = os.getenv("USE_WEB_SEARCH_FALLBACK", "1").lower() in ("1", "true", "yes")
            
        except Exception as e:
            logger.error(f"Error initializing model: {e}")
            raise RuntimeError(f"Failed to initialize chatbot: {e}")

    def load_historical_disasters(self):
        """Load information about major historical disaster events"""
        self.historical_disasters = {
            # Format: Event name/identifier -> Information dict
            "nepal_earthquake_2015": {
                "name": "2015 Nepal Earthquake (Gorkha Earthquake)",
                "date": "April 25, 2015",
                "type": "earthquake",
                "magnitude": "7.8 Mw",
                "location": "Gorkha District, Nepal",
                "description": "The 2015 Nepal earthquake (also called the Gorkha earthquake) killed nearly 9,000 people and injured nearly 22,000. It was the worst natural disaster to strike Nepal since the 1934 Nepal-Bihar earthquake.",
                "impacts": [
                    "Nearly 9,000 people killed and 22,000 injured",
                    "Hundreds of thousands of buildings destroyed or damaged",
                    "Entire villages flattened, particularly in rural areas",
                    "UNESCO World Heritage sites severely damaged in Kathmandu Valley",
                    "Triggered avalanches on Mount Everest, killing 21 people"
                ],
                "assessment_methods": [
                    "Post-earthquake reconnaissance by engineering teams",
                    "Satellite-based damage mapping from multiple international space agencies",
                    "Drone surveys of affected areas, particularly in remote villages",
                    "Ground-based surveys using the Applied Technology Council's ATC-20 methodology",
                    "Community-based damage reporting through mobile applications"
                ],
                "recovery": [
                    "The Nepali government established the National Reconstruction Authority",
                    "Over 800,000 houses were rebuilt or retrofitted in the subsequent years",
                    "'Build Back Better' principles were applied to increase earthquake resilience",
                    "International donors pledged over $4 billion for reconstruction",
                    "Recovery efforts faced challenges including political changes, logistics in remote areas, and material shortages"
                ],
                "references": [
                    "National Planning Commission, Government of Nepal (2015). Nepal Earthquake 2015: Post Disaster Needs Assessment.",
                    "United States Geological Survey (USGS). M 7.8 - 36 km E of Khudi, Nepal.",
                    "National Reconstruction Authority (NRA) of Nepal."
                ]
            },
            "haiti_earthquake_2010": {
                "name": "2010 Haiti Earthquake",
                "date": "January 12, 2010",
                "type": "earthquake",
                "magnitude": "7.0 Mw",
                "location": "Near Port-au-Prince, Haiti",
                "description": "A catastrophic magnitude 7.0 earthquake struck Haiti near the capital of Port-au-Prince, causing massive damage and casualties in an already vulnerable nation.",
                "impacts": [
                    "Estimated 100,000-316,000 people killed (figures vary widely)",
                    "More than 300,000 injured and 1.5 million displaced",
                    "250,000+ residences and 30,000+ commercial buildings collapsed or severely damaged",
                    "Critical infrastructure including hospitals, transportation, and government buildings destroyed",
                    "Total damage estimated at $7.8-8.5 billion, exceeding Haiti's annual GDP"
                ],
                "assessment_methods": [
                    "Remote sensing analysis including satellite imagery and aerial photography",
                    "Structural damage surveys by international engineering teams",
                    "PDNA (Post-Disaster Needs Assessment) framework implementation",
                    "GIS-based mapping of affected areas and infrastructure",
                    "Mobile data collection through UN and NGO assessment teams"
                ]
            },
            "japan_tsunami_2011": {
                "name": "2011 Tohoku Earthquake and Tsunami",
                "date": "March 11, 2011",
                "type": "earthquake_tsunami",
                "magnitude": "9.0-9.1 Mw",
                "location": "Off the Pacific coast of Tohoku, Japan",
                "description": "The most powerful earthquake ever recorded in Japan triggered a massive tsunami with waves up to 40 meters high, causing widespread destruction and the Fukushima nuclear disaster.",
                "impacts": [
                    "Nearly 20,000 people died, primarily from the tsunami",
                    "Fukushima Daiichi nuclear disaster - the most severe nuclear accident since Chernobyl",
                    "Over 120,000 buildings destroyed and 278,000 damaged",
                    "Extensive damage to roads, railways, and other infrastructure",
                    "Economic impact estimated at $235 billion, making it the costliest natural disaster in history"
                ]
            }
        }
        
        logger.info(f"Loaded information on {len(self.historical_disasters)} historical disaster events")
        
        # Create combined knowledge for similarity search
        self.disaster_names = list(self.historical_disasters.keys())
        self.disaster_descriptions = [f"{data['name']} {data['date']} {data['description']}"
                                      for data in self.historical_disasters.values()]
    
    def load_knowledge_base(self):
        """Load comprehensive disaster assessment knowledge base"""
        self.knowledge_base = {
            "earthquake_assessment": [
                "Earthquake damage assessment uses the Modified Mercalli Intensity (MMI) scale to categorize damage severity from I (not felt) to XII (total destruction). The scale focuses on observed effects rather than instrumental measurements.",
                "Post-earthquake building safety assessments typically use a three-category tagging system: green (safe for occupancy), yellow (restricted use), and red (unsafe, do not enter).",
                "The ATC-20 (Applied Technology Council) methodology is widely used for rapid post-earthquake building evaluation, providing standardized protocols for safety assessment.",
                "Satellite-based InSAR (Interferometric Synthetic Aperture Radar) can detect ground deformation from earthquakes with centimeter-level accuracy, helping identify fault ruptures and areas of potential damage.",
                "Earthquake-induced secondary hazards like landslides, liquefaction, and tsunamis often cause more damage than ground shaking and must be included in comprehensive assessment."
            ],
            "flood_assessment": [
                "Flood damage assessment categorizes impacts by water depth, typically using classes such as minor (<0.5m), moderate (0.5-1.5m), and severe (>1.5m), with different damage functions for each building type.",
                "Satellite-based flood mapping using SAR (Synthetic Aperture Radar) imagery can penetrate clouds and darkness, enabling all-weather flood extent monitoring crucial during ongoing events.",
                "Post-flood building assessment examines structural integrity, foundation scouring, contamination levels, and electrical system damage to determine habitability.",
                "Flood damage curves relate water depth to percentage of structure value lost, with critical thresholds where damage accelerates (e.g., when water reaches electrical outlets or second stories).",
                "Rapid flood assessment often uses the 'waterline' method, measuring the highest visible mark left by floodwaters on structures to map flood depth across affected areas."
            ],
            "satellite_imagery": [
                "Satellite imagery analysis is crucial for disaster assessment, using both optical and radar data. Optical imagery provides visual information in cloud-free conditions, while radar can penetrate clouds and operate at night.",
                "Change detection techniques compare pre- and post-disaster satellite imagery to identify damaged areas. This is particularly effective for floods, wildfires, and large-scale structural damage.",
                "Modern satellite constellations like Planet, Maxar WorldView, and Sentinel provide rapid revisit capabilities - often daily - allowing for near real-time disaster monitoring.",
                "Synthetic Aperture Radar (SAR) from satellites like SENTINEL-1 can detect subtle ground movement as small as a centimeter, helping to monitor landslides, subsidence, and earthquake deformation.",
                "The International Charter 'Space and Major Disasters' provides free satellite imagery to affected regions during major disasters, pooling resources from multiple space agencies."
            ],
            "damage_assessment_methods": [
                "The Post-Disaster Needs Assessment (PDNA) framework, developed by the UN, World Bank and EU, is a comprehensive approach that evaluates damage, losses, and recovery needs across multiple sectors.",
                "Ground truth verification combines field surveys with remote sensing data for more accurate damage assessment, particularly in urban areas where satellite resolution may be insufficient.",
                "Damage assessment typically classifies structures into categories: no damage, minor damage, major damage, or destroyed, with specific criteria for each disaster type.",
                "Citizen science approaches using mobile apps allow affected communities to contribute to damage assessment by uploading geotagged photos and descriptions of damage.",
                "Rapid visual assessment techniques like ATC-20 (for earthquakes) and FEMA's Substantial Damage Estimator provide standardized methodologies for quickly evaluating building safety."
            ],
            "disaster_data_sources": [
                "The Global Disaster Alert and Coordination System (GDACS) provides near real-time alerts about natural disasters around the world and tools for response coordination.",
                "MODIS and VIIRS sensors aboard NASA satellites provide daily wildfire detection at 1km and 375m resolution respectively, tracking active fires globally.",
                "The Dartmouth Flood Observatory maintains a global record of large floods from 1985 to present, using satellite imagery and news reports.",
                "Social media analysis has emerged as a valuable disaster data source, with platforms like Twitter providing real-time information about disaster impacts and needs.",
                "The USGS Earthquake Hazards Program provides real-time earthquake data, including ShakeMaps that model ground motion and potential damage."
            ],
            "technology_trends": [
                "AI and machine learning are increasingly used to automate damage detection in satellite imagery, with neural networks achieving over 90% accuracy in some disaster contexts.",
                "Drone technology enables rapid, high-resolution assessment of areas that may be inaccessible or dangerous for ground teams, with automated flight paths and real-time data transmission.",
                "LiDAR (Light Detection and Ranging) technology creates highly accurate 3D models that can detect subtle structural damage and be compared pre/post disaster.",
                "Mobile-based rapid damage assessment apps with offline capabilities allow field teams to collect standardized data even in areas with compromised communications infrastructure.",
                "Digital twins of critical infrastructure are being developed to simulate disaster impacts and optimize resilience planning before events occur."
            ],
            "recovery_planning": [
                "The Sendai Framework for Disaster Risk Reduction 2015-2030 emphasizes 'Building Back Better' to increase community resilience through improved reconstruction.",
                "Recovery planning typically follows phases: emergency response (0-2 weeks), early recovery (2 weeks-3 months), and long-term recovery (3 months-years).",
                "Participatory planning approaches that involve affected communities in recovery decisions lead to more sustainable outcomes and higher satisfaction with rebuilding efforts.",
                "Economic impact analysis should consider both direct damages (physical destruction) and indirect losses (business interruption, ecosystem services, etc.) when planning recovery.",
                "Nature-based solutions like restored wetlands, mangroves, and urban green spaces can provide cost-effective disaster mitigation compared to traditional infrastructure."
            ],
            "nepal_specific": [
                "Nepal's mountainous terrain presents unique challenges for disaster assessment, often requiring a combination of satellite imagery, helicopter surveys, and ground teams to reach remote villages.",
                "The National Disaster Risk Reduction and Management Authority (NDRRMA) of Nepal was established after the 2015 earthquake to coordinate disaster response and assessment activities.",
                "Nepal's traditional construction methods, particularly non-engineered stone and mud-mortar buildings in rural areas, present specific vulnerabilities during earthquakes that require specialized assessment approaches.",
                "Nepal has developed a multi-hazard risk assessment approach that considers the country's vulnerability to earthquakes, floods, landslides, and glacial lake outburst floods (GLOFs).",
                "Post-2015 earthquake, Nepal implemented a mobile-based damage assessment system that standardized data collection across affected districts using trained engineers."
            ]
        }
        
        # Create combined knowledge for similarity search
        self.knowledge_texts = []
        self.knowledge_categories = []
        
        for category, texts in self.knowledge_base.items():
            for text in texts:
                self.knowledge_texts.append(text)
                self.knowledge_categories.append(category)
        
        logger.info(f"Loaded knowledge base with {len(self.knowledge_texts)} entries across {len(self.knowledge_base)} categories")
    
    def load_response_templates(self):
        """Load disaster assessment response templates and intents"""
        # Define intents and their corresponding templates
        self.intents = {
            "greeting": {
                "patterns": [
                    "hello", "hi", "hey", "greetings", "good morning", "good afternoon", 
                    "good evening", "how are you", "what's up", "नमस्ते", "नमस्कार"
                ],
                "responses": [
                    "Hello! I'm your disaster assessment assistant. How can I help you today?",
                    "Hi there! I'm here to help with disaster assessment questions. What would you like to know?",
                    "Hello! I can provide information about disaster assessment. What specific area are you interested in?"
                ]
            },
            "flood_assessment": {
                "patterns": [
                    "flood damage", "flood assessment", "water damage", "flooding", 
                    "flood impact", "flood analysis", "बाढी"
                ],
                "responses": [
                    "When assessing flood damage, look for water lines on buildings, debris accumulation, and structural damage. Key metrics include water depth, duration, flow velocity, and affected area size.",
                    "Flood assessment involves documenting water levels, extent of inundation, structural damage, and infrastructure impacts. Would you like me to elaborate on any specific aspect?",
                    "For flood analysis, satellite imagery comparison can help determine the extent of flooding. Ground surveys should document water depth, building damage, and infrastructure impacts."
                ]
            },
            "earthquake_assessment": {
                "patterns": [
                    "earthquake damage", "seismic assessment", "earthquake impact", 
                    "structural damage", "building collapse", "earthquake analysis", "भूकम्प"
                ],
                "responses": [
                    "Earthquake damage assessment involves evaluating structural integrity using rapid visual screening. Buildings are typically categorized as safe, restricted use, or unsafe.",
                    "Post-earthquake analysis should document structural failures, ground displacement, infrastructure damage, and secondary hazards like landslides or fires.",
                    "For earthquake impact assessment, use the Modified Mercalli Intensity scale to categorize damage severity, from minor damage to total destruction."
                ]
            },
            "specific_disaster": {
                "patterns": [
                    "nepal earthquake", "gorkha earthquake", "2015 earthquake", "nepal 2015",
                    "2010 haiti", "haiti earthquake", "japan tsunami", "tohoku", "fukushima"
                ],
                "responses": [
                    "I have information about that specific disaster event. Let me provide you with details about what happened and the assessment methods used.",
                    "That was a significant disaster event. I can tell you about its impacts, the assessment approaches used, and recovery efforts.",
                    "I have data on that disaster. Would you like to know about the impacts, assessment methods used, or recovery efforts?"
                ]
            },
            "satellite_imagery": {
                "patterns": [
                    "satellite imagery", "remote sensing", "satellite data", "earth observation",
                    "satellite monitoring", "space technology", "भू-उपग्रह"
                ],
                "responses": [
                    "Satellite imagery has revolutionized disaster assessment by providing rapid, large-scale views of affected areas. Both optical and radar satellites are used, with radar having the advantage of seeing through clouds and darkness.",
                    "For disaster assessment, analysts typically compare pre- and post-event satellite imagery to identify changes. This change detection can be automated using AI techniques for faster response.",
                    "Modern satellite constellations can provide daily imagery of disaster zones, enabling near real-time monitoring of evolving situations like floods, wildfires, and volcanic eruptions."
                ]
            },
            "recovery": {
                "patterns": [
                    "recovery planning", "disaster recovery", "rebuilding", 
                    "restoration", "rehabilitation", "build back better", "पुनर्निर्माण"
                ],
                "responses": [
                    "Disaster recovery planning should begin with a detailed damage assessment, followed by prioritization of critical infrastructure, housing needs, and environmental restoration.",
                    "The 'Build Back Better' approach to disaster recovery focuses on increased resilience, sustainable development, and reducing future vulnerability through improved design and planning.",
                    "Effective disaster recovery requires coordination between government agencies, NGOs, community organizations, and affected populations to ensure equitable and comprehensive rebuilding."
                ]
            },
            "goodbye": {
                "patterns": [
                    "goodbye", "bye", "see you", "farewell", "thanks", "thank you", "धन्यवाद"
                ],
                "responses": [
                    "Goodbye! Feel free to return if you have more questions about disaster assessment.",
                    "Thank you for chatting. I'm here if you need more information about disaster assessment in the future.",
                    "You're welcome! If you need more disaster assessment information later, don't hesitate to ask."
                ]
            },
            "fallback": {
                "responses": [
                    "I'm not sure I understand your question about disaster assessment. Could you rephrase it?",
                    "I don't have specific information about that aspect of disaster management. Could you ask about flood, fire, earthquake, or hurricane assessment instead?",
                    "That's beyond my current knowledge. I can help with questions about disaster assessment methods, impact analysis, and recovery planning."
                ]
            }
        }
        
        logger.info("Response templates loaded successfully")
    
    def find_historical_disaster(self, query: str) -> Optional[Dict]:
        """Find information about a specific historical disaster event mentioned in the query"""
        query_embedding = self.get_embedding(query)
        
        best_match = None
        best_score = 0.6  # Threshold for a good match
        
        for i, desc in enumerate(self.disaster_descriptions):
            desc_embedding = self.get_embedding(desc)
            similarity = cosine_similarity(query_embedding, desc_embedding)[0][0]
            
            if similarity > best_score:
                best_score = similarity
                best_match = self.disaster_names[i]
        
        if best_match:
            logger.info(f"Found historical disaster match: {best_match} with score {best_score}")
            return self.historical_disasters[best_match]
        
        return None
    
    def search_knowledge_base(self, query: str, top_n: int = 2) -> List[Dict]:
        """Search internal knowledge base for relevant information"""
        try:
            query_embedding = self.get_embedding(query)
            
            # Calculate similarity scores
            scores = []
            for text in self.knowledge_texts:
                text_embedding = self.get_embedding(text)
                similarity = cosine_similarity(query_embedding, text_embedding)[0][0]
                scores.append(similarity)
            
            # Get top N matches
            if not scores:
                return []
                
            top_indices = np.argsort(scores)[-top_n:][::-1]
            top_scores = [scores[i] for i in top_indices]
            
            # Only include results with reasonable similarity
            results = []
            for i, score in zip(top_indices, top_scores):
                if score > 0.5:  # Only include if similarity is reasonable
                    results.append({
                        "text": self.knowledge_texts[i],
                        "category": self.knowledge_categories[i],
                        "score": float(score)
                    })
            
            logger.info(f"Found {len(results)} relevant knowledge base entries")
            return results
            
        except Exception as e:
            logger.error(f"Error searching knowledge base: {e}")
            return []
    
    def search_web(self, query: str) -> str:
        """Search the web for additional information"""
        try:
            logger.info(f"Searching the web for: {query}")
            
            # Check if API key is available
            if not self.serpapi_key:
                logger.warning("No SerpAPI key configured")
                return "Web search is unavailable (no API key configured)."
            
            # Make request to SerpAPI
            params = {
                "q": query + " disaster assessment",  # Add context to the query
                "api_key": self.serpapi_key,
                "engine": "google",
            }
            
            logger.info(f"Making request to SerpAPI with query: {params['q']}")
            
            # Use a shorter timeout to prevent long waits
            response = requests.get(
                "https://serpapi.com/search", 
                params=params, 
                timeout=15
            )
            
            # Log response status
            logger.info(f"SerpAPI response status: {response.status_code}")
            
            if response.status_code != 200:
                error_msg = f"Search error: HTTP {response.status_code}"
                if response.text:
                    try:
                        error_data = response.json()
                        if "error" in error_data:
                            error_msg += f" - {error_data['error']}"
                    except:
                        error_msg += f" - {response.text[:100]}"
                
                logger.error(error_msg)
                return f"I couldn't complete the web search. Using internal knowledge instead."
            
            try:
                search_results = response.json()
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                logger.debug(f"Response text: {response.text[:500]}")
                return "I couldn't process the search results. Using internal knowledge instead."
            
            # Extract and format results
            if "organic_results" in search_results and search_results["organic_results"]:
                results = search_results["organic_results"][:2]  # Get top 2 results
                logger.info(f"Found {len(results)} organic results")
                
                formatted_results = "Here's what I found online:\n\n"
                for idx, result in enumerate(results, 1):
                    title = result.get("title", "No title")
                    snippet = result.get("snippet", "No description")
                    link = result.get("link", "#")
                    formatted_results += f"{idx}. {title}\n{snippet}\n{link}\n\n"
                return formatted_results
            else:
                return "No relevant online results found. Using internal knowledge instead."
                
        except requests.exceptions.Timeout:
            logger.error("Search request timed out")
            return "The search service is taking too long to respond. Using internal knowledge instead."
        except requests.exceptions.ConnectionError:
            logger.error("Connection error during search request")
            return "I couldn't connect to the search service. Using internal knowledge instead."
        except Exception as e:
            logger.error(f"Error searching the web: {e}", exc_info=True)
            return "I couldn't complete the web search due to a technical issue. Using internal knowledge instead."
    
    def get_embedding(self, text: str) -> np.ndarray:
        """Get embedding vector for a text using DistilBERT"""
        try:
            # Tokenize the text
            inputs = self.tokenizer(
                text, 
                return_tensors="pt", 
                padding=True, 
                truncation=True, 
                max_length=128
            ).to(self.device)
            
            # Get model output
            with torch.no_grad():
                outputs = self.model(**inputs)
            
            # Use [CLS] token embedding as the sentence embedding
            embedding = outputs.last_hidden_state[:, 0, :].cpu().numpy()
            
            return embedding
        except Exception as e:
            logger.error(f"Error getting embedding: {e}")
            # Return a zero vector as fallback
            return np.zeros((1, 768))
    
    def find_best_intent(self, query: str) -> Tuple[str, float]:
        """Find the best matching intent for a user query"""
        try:
            query_embedding = self.get_embedding(query)
            
            best_match = "fallback"
            best_score = -1
            
            # Compare query with each intent pattern
            for intent, data in self.intents.items():
                if intent == "fallback":
                    continue
                    
                for pattern in data["patterns"]:
                    pattern_embedding = self.get_embedding(pattern)
                    similarity = cosine_similarity(query_embedding, pattern_embedding)[0][0]
                    
                    if similarity > best_score:
                        best_score = similarity
                        best_match = intent
            
            # Use fallback if confidence is too low
            if best_score < 0.6:
                best_match = "fallback"
                
            logger.info(f"Best intent match: {best_match} with score {best_score}")
            return best_match, best_score
            
        except Exception as e:
            logger.error(f"Error finding intent: {e}")
            return "fallback", 0.0
    
    def generate_response(self, user_message: str, use_web_search: bool = False, analysis_context: Optional[Dict] = None) -> str:

        """Generate a response to the user's message"""
        try:
            # Add user message to history
            self.conversation_history.append({"role": "user", "content": user_message})
            
            # Find the best matching intent
            intent, confidence = self.find_best_intent(user_message)
            
            # Check for specific historical disaster
            historical_disaster = None
            if hasattr(self, 'find_historical_disaster'):
                historical_disaster = self.find_historical_disaster(user_message)
                if historical_disaster and confidence < 0.8:
                    # Override the intent
                    intent = "specific_disaster"
                    confidence = 0.9
            
            # Get response from templates
            if intent in self.intents:
                responses = self.intents[intent]["responses"]
                response = np.random.choice(responses)
            else:
                responses = self.intents["fallback"]["responses"]
                response = np.random.choice(responses)
            
            # Handle specific historical disaster
            if intent == "specific_disaster" and historical_disaster:
                disaster_info = historical_disaster
                response = f"{disaster_info['name']} occurred on {disaster_info['date']} in {disaster_info['location']}. It was a {disaster_info['magnitude']} {disaster_info['type']}. {disaster_info['description']}\n\n"
                
                # Add impacts
                response += "Key impacts:\n"
                for impact in disaster_info['impacts'][:3]:
                    response += f"• {impact}\n"
                
                # Add assessment methods
                response += "\nAssessment methods used:\n"
                for method in disaster_info['assessment_methods'][:3]:
                    response += f"• {method}\n"
                
                # Add recovery info if available
                if 'recovery' in disaster_info:
                    response += "\nRecovery efforts:\n"
                    for recovery in disaster_info['recovery'][:2]:
                        response += f"• {recovery}\n"
            
            # Enhance response with analysis context if available
            if analysis_context:
                # Add analysis context information to the response
                if "disaster_type" in analysis_context and analysis_context["disaster_type"]:
                    disaster_type = analysis_context["disaster_type"].capitalize()
                    impact_level = analysis_context.get("impact_level", "unknown").lower()
                    
                    # Add context-specific information
                    if "impact_level" in analysis_context:
                        response += f"\n\nBased on the image analysis, I can see this is a {disaster_type} event with {impact_level} impact."
                    
                    # Add key findings if available
                    if "key_findings" in analysis_context and analysis_context["key_findings"]:
                        response += "\n\nKey findings from the analysis:"
                        for finding in analysis_context["key_findings"][:2]:
                            response += f"\n• {finding}"
                    
                    # Add recommendations if available
                    if "recommendations" in analysis_context and analysis_context["recommendations"]:
                        response += "\n\nBased on this analysis, here are my recommendations:"
                        for rec in analysis_context["recommendations"][:2]:
                            response += f"\n• {rec}"
            
            # Otherwise enhance response with knowledge base information
            elif hasattr(self, 'search_knowledge_base'):
                # Search knowledge base for relevant information
                knowledge_results = self.search_knowledge_base(user_message)
                
                # Add knowledge base information if available
                if knowledge_results:
                    # Find the most relevant entry based on intent
                    relevant_categories = []
                    if intent == "earthquake_assessment":
                        relevant_categories = ["earthquake_assessment", "damage_assessment_methods"]
                    elif intent == "flood_assessment":
                        relevant_categories = ["flood_assessment", "damage_assessment_methods"]
                    elif intent == "satellite_imagery":
                        relevant_categories = ["satellite_imagery", "technology_trends"]
                    elif intent == "recovery":
                        relevant_categories = ["recovery_planning"]
                    
                    # If using Nepal-related query, prioritize Nepal info
                    if "nepal" in user_message.lower():
                        relevant_categories.insert(0, "nepal_specific")
                    
                    # Filter knowledge by relevant categories if possible
                    filtered_knowledge = [k for k in knowledge_results if k["category"] in relevant_categories]
                    if filtered_knowledge:
                        knowledge_results = filtered_knowledge
                    
                    # Add the most relevant knowledge
                    response += f"\n\nAdditional information: {knowledge_results[0]['text']}"
                    
                    # Add a second piece of knowledge if available and different
                    if len(knowledge_results) > 1:
                        response += f"\n\nFurthermore: {knowledge_results[1]['text']}"
            
            # Add web search results if enabled
            if use_web_search:
                logger.info(f"Web search requested. Confidence: {confidence}")
                
                # Always search if explicitly requested, otherwise only search for low confidence
                if confidence < 0.8 or len(self.conversation_history) % 3 == 0:
                    logger.info("Performing web search")
                    web_results = self.search_web(user_message)
                    if "Here's what I found" in web_results:
                        response += "\n\n" + web_results
                    else:
                        # If no good results, log the issue but don't add the error message
                        logger.warning(f"No good search results returned: {web_results}")
                        # Optionally add a note about the search
                        response += "\n\nI tried searching for more information, but couldn't find relevant results online."
            
            # Add assistant response to history
            self.conversation_history.append({"role": "assistant", "content": response})
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            error_response = "I'm having technical difficulties right now. Please try again in a moment."
            self.conversation_history.append({"role": "assistant", "content": error_response})
            return error_response
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
        return True
