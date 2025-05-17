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
    understanding user queries and a template-based response system.
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
            
            # Set up SerpAPI key - try to get from env or use hardcoded fallback
            self.serpapi_key = os.getenv("SERPAPI_KEY", "e07f47762b7619935d3430ec0f773293594d492e6bee123b6267bc13f88d7dde")
            logger.info(f"SerpAPI key configured: {'Yes' if self.serpapi_key else 'No'}")
            
        except Exception as e:
            logger.error(f"Error initializing model: {e}")
            raise RuntimeError(f"Failed to initialize chatbot: {e}")
    
    def load_response_templates(self):
        """Load disaster assessment response templates and intents"""
        # Define intents and their corresponding templates
        self.intents = {
            "greeting": {
                "patterns": [
                    "hello", "hi", "hey", "greetings", "good morning", "good afternoon", 
                    "good evening", "how are you", "what's up"
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
                    "flood impact", "flood analysis"
                ],
                "responses": [
                    "When assessing flood damage, look for water lines on buildings, debris accumulation, and structural damage. Key metrics include water depth, duration, flow velocity, and affected area size.",
                    "Flood assessment involves documenting water levels, extent of inundation, structural damage, and infrastructure impacts. Would you like me to elaborate on any specific aspect?",
                    "For flood analysis, satellite imagery comparison can help determine the extent of flooding. Ground surveys should document water depth, building damage, and infrastructure impacts."
                ]
            },
            "fire_assessment": {
                "patterns": [
                    "fire damage", "wildfire", "burn assessment", "fire impact", 
                    "forest fire", "fire analysis"
                ],
                "responses": [
                    "Wildfire assessment involves mapping burn severity, vegetation loss, and structural damage. Satellite imagery can help identify areas with complete, partial, or minimal vegetation loss.",
                    "For fire damage assessment, look at burn extent, vegetation type affected, structure damage, soil erosion risk, and regrowth potential. Would you like details on any of these aspects?",
                    "Fire impact analysis typically categorizes damage as high, moderate, or low severity based on vegetation loss and soil impacts. This helps prioritize recovery efforts."
                ]
            },
            "earthquake_assessment": {
                "patterns": [
                    "earthquake damage", "seismic assessment", "earthquake impact", 
                    "structural damage", "building collapse", "earthquake analysis"
                ],
                "responses": [
                    "Earthquake damage assessment involves evaluating structural integrity using rapid visual screening. Buildings are typically categorized as safe, restricted use, or unsafe.",
                    "Post-earthquake analysis should document structural failures, ground displacement, infrastructure damage, and secondary hazards like landslides or fires.",
                    "For earthquake impact assessment, use the Modified Mercalli Intensity scale to categorize damage severity, from minor damage to total destruction."
                ]
            },
            "hurricane_assessment": {
                "patterns": [
                    "hurricane damage", "cyclone impact", "storm damage", "hurricane assessment", 
                    "wind damage", "tropical storm"
                ],
                "responses": [
                    "Hurricane assessment involves documenting wind damage, flooding, storm surge impacts, and infrastructure disruption. Both immediate and long-term impacts should be considered.",
                    "For hurricane damage analysis, compare pre and post-event imagery to identify affected structures, vegetation loss, and coastal erosion.",
                    "Hurricane impact evaluation typically categorizes damage from wind (roof/structural damage), flooding (water lines), and storm surge (coastal erosion/debris)."
                ]
            },
            "general_assessment": {
                "patterns": [
                    "disaster assessment", "damage evaluation", "impact analysis", 
                    "assessment methods", "assessment tools", "damage estimation"
                ],
                "responses": [
                    "Disaster assessment typically follows three phases: initial assessment (24-48 hours), detailed assessment (1-2 weeks), and recovery assessment (ongoing). Each phase requires different data collection methods.",
                    "Key disaster assessment methods include remote sensing (satellite/aerial imagery), field surveys, social media analysis, and community reporting. Each has advantages for different disaster types.",
                    "Modern disaster assessment often combines traditional field surveys with AI-based image analysis, particularly for comparing pre and post-disaster conditions."
                ]
            },
            "recovery": {
                "patterns": [
                    "recovery planning", "disaster recovery", "rebuilding", 
                    "restoration", "rehabilitation", "build back better"
                ],
                "responses": [
                    "Disaster recovery planning should begin with a detailed damage assessment, followed by prioritization of critical infrastructure, housing needs, and environmental restoration.",
                    "The 'Build Back Better' approach to disaster recovery focuses on increased resilience, sustainable development, and reducing future vulnerability through improved design and planning.",
                    "Effective disaster recovery requires coordination between government agencies, NGOs, community organizations, and affected populations to ensure equitable and comprehensive rebuilding."
                ]
            },
            "goodbye": {
                "patterns": [
                    "goodbye", "bye", "see you", "farewell", "thanks", "thank you"
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
    
    def search_web(self, query: str) -> str:
        """Search the web for additional information"""
        try:
            logger.info(f"Searching the web for: {query}")
            
            # Check if API key is available
            if not self.serpapi_key:
                logger.warning("No SerpAPI key configured")
                return "Web search is unavailable (no API key configured)."
            
            # Try an alternative search approach
            logger.info("Trying direct search with requests")
            
            # First, try to ping serpapi.com to check connectivity
            try:
                test_response = requests.get("https://serpapi.com", timeout=5)
                logger.info(f"SerpAPI connectivity test: {test_response.status_code}")
            except Exception as e:
                logger.error(f"Failed to connect to SerpAPI: {e}")
                return "I couldn't connect to the search service. This could be due to network issues or firewall restrictions."
            
            # Get proxy settings from environment if available
            proxies = {}
            http_proxy = os.getenv("HTTP_PROXY")
            https_proxy = os.getenv("HTTPS_PROXY")
            if http_proxy:
                proxies["http"] = http_proxy
            if https_proxy:
                proxies["https"] = https_proxy
            
            # Make request to SerpAPI with increased timeout
            params = {
                "q": query + " disaster assessment",  # Add context to the query
                "api_key": self.serpapi_key,
                "engine": "google",
            }
            
            logger.info(f"Making request to SerpAPI with query: {params['q']}")
            
            # Increase timeout to 30 seconds and use proxies if configured
            response = requests.get(
                "https://serpapi.com/search", 
                params=params, 
                proxies=proxies if proxies else None,
                timeout=30
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
                return f"I couldn't complete the web search. {error_msg}"
            
            try:
                search_results = response.json()
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                logger.debug(f"Response text: {response.text[:500]}")
                return "I couldn't process the search results. The response format was unexpected."
            
            # Debug log the response structure
            logger.debug(f"Search result keys: {list(search_results.keys())}")
            
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
            elif "error" in search_results:
                error_message = search_results.get("error", "Unknown error")
                logger.error(f"SerpAPI returned an error: {error_message}")
                return f"The search service reported an error: {error_message}"
            else:
                # Check if there are any results at all
                all_keys = list(search_results.keys())
                logger.warning(f"No organic results found. Available keys: {all_keys}")
                
                # Try to extract any useful information from other result types
                if "knowledge_graph" in search_results:
                    kg = search_results["knowledge_graph"]
                    title = kg.get("title", "")
                    description = kg.get("description", "")
                    if title and description:
                        return f"Found information about {title}:\n{description}"
                
                # Fall back to a generic message
                return "No relevant search results found for your query about disaster assessment."
        except requests.exceptions.Timeout:
            logger.error("Search request timed out")
            return "The search service is taking too long to respond. This might be due to network issues or the service may be temporarily unavailable."
        except requests.exceptions.ConnectionError:
            logger.error("Connection error during search request")
            return "I couldn't connect to the search service. This could be due to network issues, firewall restrictions, or the service may be down."
        except Exception as e:
            logger.error(f"Error searching the web: {e}", exc_info=True)
            return "I couldn't complete the web search due to a technical issue."
    
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
    
    def generate_response(self, user_message: str, use_web_search: bool = False) -> str:
        """Generate a response to the user's message"""
        try:
            # Add user message to history
            self.conversation_history.append({"role": "user", "content": user_message})
            
            # Find the best matching intent
            intent, confidence = self.find_best_intent(user_message)
            
            # Get response from templates
            if intent in self.intents:
                responses = self.intents[intent]["responses"]
                response = np.random.choice(responses)
            else:
                responses = self.intents["fallback"]["responses"]
                response = np.random.choice(responses)
            
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
