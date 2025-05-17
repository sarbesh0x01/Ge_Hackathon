from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
import time
import os
import inspect

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import the model
from .model import DisasterChatbot

# Import the analysis context handler (if available)
try:
    from .analysis_api import get_analysis_context
    has_analysis_integration = True
    logger.info("Analysis integration available")
except ImportError:
    has_analysis_integration = False
    logger.warning("Analysis integration not available")
    
    # Create dummy function
    def get_analysis_context(analysis_id: Optional[str] = None) -> Dict:
        return {}

# Create router
router = APIRouter()

# Create global chatbot instance
chatbot = None
is_initialized = False

# Pydantic models for request/response validation
class ChatRequest(BaseModel):
    message: str
    use_web_search: bool = False
    analysis_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    web_search_used: bool
    success: bool
    error: Optional[str] = None

class ChatHistoryItem(BaseModel):
    role: str
    content: str

class ChatHistoryResponse(BaseModel):
    history: List[ChatHistoryItem]
    success: bool
    error: Optional[str] = None

# Create a dependency to ensure chatbot is initialized
async def get_initialized_chatbot():
    global chatbot, is_initialized
    
    if not is_initialized:
        raise HTTPException(status_code=503, detail="Chatbot is still initializing")
    
    if not chatbot:
        raise HTTPException(status_code=500, detail="Chatbot failed to initialize")
    
    return chatbot

@router.get("/status")
async def get_status():
    """Get the status of the chatbot"""
    global is_initialized
    return {"initialized": is_initialized, "status": "ready" if is_initialized else "initializing"}

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, bot: DisasterChatbot = Depends(get_initialized_chatbot)):
    """Generate a response to a user message"""
    logger.info(f"Received message request. Use web search: {request.use_web_search}")
    
    start_time = time.time()
    
    try:
        # Check if analysis context is requested
        analysis_context = None
        if has_analysis_integration:
            if request.analysis_id:
                analysis_context = get_analysis_context(request.analysis_id)
                logger.info(f"Retrieved analysis context for ID: {request.analysis_id}")
            else:
                # Try to get the latest analysis
                analysis_context = get_analysis_context()
                if analysis_context:
                    logger.info("Retrieved latest analysis context")

        # Check if generate_response accepts analysis_context parameter
        # This makes our code work with both old and new versions of model.py
        sig = inspect.signature(bot.generate_response)
        
        if 'analysis_context' in sig.parameters:
            # New version of model.py that accepts analysis_context
            response = bot.generate_response(
                request.message, 
                use_web_search=request.use_web_search,
                analysis_context=analysis_context
            )
        else:
            # Old version of model.py without analysis_context
            logger.warning("Using model.py without analysis_context support")
            response = bot.generate_response(
                request.message, 
                use_web_search=request.use_web_search
            )
            
            # If we have analysis context but the model doesn't support it,
            # we can add some basic info to the response here
            if analysis_context:
                extra_info = "\n\nI have some analysis information available, but can't fully integrate it. "
                if "disaster_type" in analysis_context:
                    extra_info += f"The analysis detected a {analysis_context['disaster_type']} event. "
                if "impact_level" in analysis_context:
                    extra_info += f"Impact level: {analysis_context['impact_level']}."
                response += extra_info
        
        end_time = time.time()
        
        logger.info(f"Response generated in {end_time - start_time:.2f} seconds")
        
        return ChatResponse(
            response=response,
            web_search_used=request.use_web_search,
            success=True
        )
    except Exception as e:
        error_msg = f"Error generating response: {str(e)}"
        logger.error(error_msg)
        return ChatResponse(
            response="I encountered a technical issue. Please try again.",
            web_search_used=False,
            success=False,
            error=error_msg
        )

@router.get("/chat/history", response_model=ChatHistoryResponse)
async def get_chat_history(bot: DisasterChatbot = Depends(get_initialized_chatbot)):
    """Get the chat history"""
    try:
        history = [
            ChatHistoryItem(role=item["role"], content=item["content"])
            for item in bot.conversation_history
        ]
        return ChatHistoryResponse(history=history, success=True)
    except Exception as e:
        logger.error(f"Error retrieving chat history: {str(e)}")
        return ChatHistoryResponse(
            history=[], 
            success=False, 
            error=f"Failed to retrieve chat history: {str(e)}"
        )

@router.post("/chat/clear")
async def clear_chat_history(bot: DisasterChatbot = Depends(get_initialized_chatbot)):
    """Clear the chat history"""
    try:
        success = bot.clear_history()
        return {"status": "success", "message": "Chat history cleared"}
    except Exception as e:
        logger.error(f"Error clearing chat history: {str(e)}")
        return {"status": "error", "message": f"Error clearing chat history: {str(e)}"}

# Initialize the chatbot on module import
def initialize_chatbot():
    global chatbot, is_initialized
    
    logger.info("Initializing chatbot...")
    
    try:
        chatbot = DisasterChatbot()
        is_initialized = True
        logger.info("Chatbot initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize chatbot: {str(e)}")
        is_initialized = False

# Initialize when the module is imported
initialize_chatbot()
