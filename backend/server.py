from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
from fabric_data_agent_client import FabricDataAgentClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Fabric Data Agent Client (lazy initialization)
fabric_client = None


def get_fabric_client():
    """Get or initialize the Fabric Data Agent Client."""
    global fabric_client
    if fabric_client is None:
        tenant_id = os.environ.get('TENANT_ID')
        data_agent_url = os.environ.get('DATA_AGENT_URL')
        
        if not tenant_id or not data_agent_url:
            raise ValueError("TENANT_ID and DATA_AGENT_URL must be set in environment variables")
        
        fabric_client = FabricDataAgentClient(tenant_id=tenant_id, data_agent_url=data_agent_url)
    
    return fabric_client


class ExecuteRequest(BaseModel):
    prompt: str
    thread_name: Optional[str] = None


class ExecuteResponse(BaseModel):
    success: bool
    data: dict
    error: Optional[str] = None


@api_router.get("/")
async def root():
    return {"message": "Fabric Data Agent API", "version": "1.0.0"}


@api_router.post("/execute")
async def execute_query(request: ExecuteRequest):
    """
    Execute a query against the Fabric Data Agent.
    
    This endpoint acts as a thin proxy - it sends the user prompt to Fabric
    and returns the raw execution JSON without any modifications.
    """
    try:
        logger.info(f"Executing query: {request.prompt[:100]}...")
        
        client = get_fabric_client()
        
        # Get raw response from Fabric Data Agent
        response = client.get_raw_run_response(
            question=request.prompt,
            timeout=120,
            thread_name=request.thread_name
        )
        
        if not response.get('success', False):
            raise HTTPException(
                status_code=500,
                detail=response.get('error', 'Unknown error occurred')
            )
        
        logger.info(f"Query executed successfully. Status: {response.get('run_status')}")
        
        # Return raw Fabric response as-is
        return JSONResponse(content=response)
        
    except ValueError as e:
        logger.error(f"Configuration error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Error executing query: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Fabric Data Agent API"
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
