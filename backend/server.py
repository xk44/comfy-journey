from fastapi import FastAPI, APIRouter, HTTPException, Body, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
import httpx
import json
import asyncio
import aiofiles
import shutil
import base64
from io import BytesIO
from PIL import Image

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client.get_database(os.environ.get('DB_NAME', 'comfyui_frontend'))

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ComfyUI API configuration
COMFYUI_BASE_URL = os.environ.get('COMFYUI_BASE_URL', 'http://127.0.0.1:8188')

# Set up directories for storing uploaded and generated images
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

GENERATED_DIR = ROOT_DIR / "generated"
GENERATED_DIR.mkdir(exist_ok=True)

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class ParameterMapping(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    node_id: str
    param_name: str
    value_template: str
    description: str

class WorkflowMapping(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action_name: str
    workflow_id: str
    description: str

class GenerateImageRequest(BaseModel):
    prompt: str
    parameters: Optional[Dict[str, Any]] = None
    workflow_id: Optional[str] = None

# ComfyUI API client
class ComfyUIClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=60.0)

    async def get_server_status(self):
        try:
            response = await self.client.get(f"{self.base_url}/system_stats")
            return response.json()
        except Exception as e:
            logging.error(f"Error getting ComfyUI server status: {e}")
            return {"error": str(e)}

    async def get_workflows(self):
        try:
            # This is a placeholder - you need to implement based on the actual ComfyUI API
            # Might need to list files in a workflows directory or use an API endpoint
            return {"workflows": ["workflow1", "workflow2"]}
        except Exception as e:
            logging.error(f"Error getting workflows: {e}")
            return {"error": str(e)}

    async def queue_prompt(self, workflow_data):
        try:
            response = await self.client.post(
                f"{self.base_url}/prompt",
                json=workflow_data
            )
            return response.json()
        except Exception as e:
            logging.error(f"Error queuing prompt: {e}")
            return {"error": str(e)}

    async def get_history(self, prompt_id):
        try:
            response = await self.client.get(f"{self.base_url}/history/{prompt_id}")
            return response.json()
        except Exception as e:
            logging.error(f"Error getting history: {e}")
            return {"error": str(e)}

    async def get_image(self, filename, subfolder="", type="output"):
        try:
            response = await self.client.get(
                f"{self.base_url}/view",
                params={"filename": filename, "subfolder": subfolder, "type": type},
                follow_redirects=True
            )
            return response.content
        except Exception as e:
            logging.error(f"Error getting image: {e}")
            return None

# Initialize ComfyUI client
comfy_client = ComfyUIClient(COMFYUI_BASE_URL)

# API Routes
@api_router.get("/")
async def root():
    return {"message": "ComfyUI Frontend API"}

@api_router.get("/comfyui/status")
async def get_comfyui_status():
    status = await comfy_client.get_server_status()
    return status

@api_router.get("/comfyui/workflows")
async def get_comfyui_workflows():
    workflows = await comfy_client.get_workflows()
    return workflows

@api_router.post("/generate")
async def generate_image(request: GenerateImageRequest):
    try:
        # Prepare the workflow data (simplified - actual implementation depends on ComfyUI's format)
        workflow_data = {
            "prompt": request.prompt,
            "parameters": request.parameters or {},
            "workflow_id": request.workflow_id
        }
        
        result = await comfy_client.queue_prompt(workflow_data)
        return result
    except Exception as e:
        logging.error(f"Error generating image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/result/{prompt_id}")
async def get_result(prompt_id: str):
    try:
        result = await comfy_client.get_history(prompt_id)
        return result
    except Exception as e:
        logging.error(f"Error getting result: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/image/{filename}")
async def get_image(filename: str, subfolder: str = "", type: str = "output"):
    try:
        image_data = await comfy_client.get_image(filename, subfolder, type)
        if image_data:
            # Create a temporary file to serve
            temp_file = Path(f"/tmp/{filename}")
            temp_file.write_bytes(image_data)
            return FileResponse(str(temp_file), media_type="image/png")
        else:
            raise HTTPException(status_code=404, detail="Image not found")
    except Exception as e:
        logging.error(f"Error getting image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Parameter Manager Routes
@api_router.post("/parameters", response_model=ParameterMapping)
async def create_parameter_mapping(mapping: ParameterMapping):
    mapping_dict = mapping.dict()
    result = await db.parameter_mappings.insert_one(mapping_dict)
    mapping_dict["id"] = str(result.inserted_id)
    return mapping_dict

@api_router.get("/parameters", response_model=List[ParameterMapping])
async def get_parameter_mappings():
    mappings = await db.parameter_mappings.find().to_list(1000)
    return [ParameterMapping(**mapping) for mapping in mappings]

@api_router.put("/parameters/{param_id}", response_model=ParameterMapping)
async def update_parameter_mapping(param_id: str, mapping: ParameterMapping):
    mapping_dict = mapping.dict()
    await db.parameter_mappings.update_one(
        {"id": param_id}, {"$set": mapping_dict}
    )
    return mapping_dict

@api_router.delete("/parameters/{param_id}")
async def delete_parameter_mapping(param_id: str):
    await db.parameter_mappings.delete_one({"id": param_id})
    return {"message": "Parameter mapping deleted"}

# Workflow Manager Routes
@api_router.post("/workflows", response_model=WorkflowMapping)
async def create_workflow_mapping(mapping: WorkflowMapping):
    mapping_dict = mapping.dict()
    result = await db.workflow_mappings.insert_one(mapping_dict)
    mapping_dict["id"] = str(result.inserted_id)
    return mapping_dict

@api_router.get("/workflows", response_model=List[WorkflowMapping])
async def get_workflow_mappings():
    mappings = await db.workflow_mappings.find().to_list(1000)
    return [WorkflowMapping(**mapping) for mapping in mappings]

@api_router.put("/workflows/{workflow_id}", response_model=WorkflowMapping)
async def update_workflow_mapping(workflow_id: str, mapping: WorkflowMapping):
    mapping_dict = mapping.dict()
    await db.workflow_mappings.update_one(
        {"id": workflow_id}, {"$set": mapping_dict}
    )
    return mapping_dict

@api_router.delete("/workflows/{workflow_id}")
async def delete_workflow_mapping(workflow_id: str):
    await db.workflow_mappings.delete_one({"id": workflow_id})
    return {"message": "Workflow mapping deleted"}

# Status check routes
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
