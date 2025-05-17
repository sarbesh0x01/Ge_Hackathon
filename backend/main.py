from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
    allow_origins=["*"],  # For development - change to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import the chatbot router
try:
    from chatbot.api import router as chatbot_router
    app.include_router(chatbot_router, prefix="/api/chatbot", tags=["chatbot"])
    logger.info("Chatbot module loaded successfully")
except Exception as e:
    logger.error(f"Failed to import chatbot router: {e}")
    logger.warning("The application will continue without chatbot functionality")

# Import the analysis router
try:
    from chatbot.analysis_api import router as analysis_router
    app.include_router(analysis_router, prefix="/api/chatbot/analysis", tags=["analysis"])
    logger.info("Analysis module loaded successfully")
except Exception as e:
    logger.error(f"Failed to import analysis router: {e}")
    logger.warning("The application will continue without analysis functionality")

@app.get("/")
async def root():
    """Root endpoint to check if the API is running"""
    return {
        "message": "Disaster Assessment API is running", 
        "status": "ok",
        "version": "1.0.0"
    }

@app.get("/healthcheck")
async def healthcheck():
    """Health check endpoint for monitoring"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    
    # Determine port - use environment variable if available, otherwise default to 8000
    port = int(os.environ.get("PORT", 8000))
    
    # Get host from environment or default to 0.0.0.0
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
