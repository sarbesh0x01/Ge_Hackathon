from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import time
import logging
from .model import DisasterChatbot

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Initialize the chatbot model - wrapped in try/except for robust initialization
try:
    chatbot = DisasterChatbot()
    is_initialized = True
    logger.info("Chatbot initialized successfully")
except Exception as e:
    logger.error(f"Error initializing chatbot: {e}")
    is_initialized = False
    chatbot = None

class ChatRequest(BaseModel):
    message: str
    use_web_search: bool = False

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

class StatusResponse(BaseModel):
    status: str
    initialized: bool
    device: Optional[str] = None

def initialize_in_background():
    """Function to initialize the model in background if it failed initially"""
    global chatbot, is_initialized
    try:
        chatbot = DisasterChatbot()
        is_initialized = True
        logger.info("Chatbot successfully initialized in background")
    except Exception as e:
        logger.error(f"Background initialization failed: {e}")

@router.get("/status", response_model=StatusResponse)
async def get_status():
    """Check the status of the chatbot"""
    global chatbot, is_initialized
    
    if is_initialized and chatbot:
        return StatusResponse(
            status="ready", 
            initialized=True,
            device=chatbot.device
        )
    else:
        return StatusResponse(
            status="not_initialized", 
            initialized=False
        )

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    """Generate a response to a chat message"""
    global chatbot, is_initialized
    
    # If not initialized, try to initialize in background and return error
    if not is_initialized or not chatbot:
        background_tasks.add_task(initialize_in_background)
        return ChatResponse(
            response="I'm still initializing. Please try again in a moment.",
            web_search_used=False,
            success=False,
            error="Chatbot not initialized"
        )
    
    try:
        start_time = time.time()
        response = chatbot.generate_response(request.message, request.use_web_search)
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
async def get_chat_history():
    """Get the chat history"""
    global chatbot, is_initialized
    
    if not is_initialized or not chatbot:
        return ChatHistoryResponse(history=[], success=False)
    
    try:
        history = [
            ChatHistoryItem(role=item["role"], content=item["content"])
            for item in chatbot.conversation_history
        ]
        return ChatHistoryResponse(history=history, success=True)
    except Exception as e:
        logger.error(f"Error retrieving chat history: {str(e)}")
        return ChatHistoryResponse(history=[], success=False)

@router.post("/chat/clear")
async def clear_chat_history():
    """Clear the chat history"""
    global chatbot, is_initialized
    
    if not is_initialized or not chatbot:
        return {"status": "error", "message": "Chatbot not initialized"}
    
    try:
        chatbot.clear_history()
        return {"status": "success", "message": "Chat history cleared"}
    except Exception as e:
        return {"status": "error", "message": f"Error clearing chat history: {str(e)}"}
