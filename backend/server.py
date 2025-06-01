from fastapi import FastAPI, APIRouter, HTTPException, Body, Depends, Request
from .utils import api_response, DEBUG_MODE
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import os
import uuid
from datetime import datetime
import logging
import requests

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# MongoDB connection
mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client.get_database("comfyui_frontend")

# Base URL for the ComfyUI backend
COMFYUI_BASE_URL = os.environ.get("COMFYUI_BASE_URL", "http://localhost:8188")

# Create the main app
app = FastAPI()


@app.exception_handler(HTTPException)
async def handle_http_exception(request: Request, exc: HTTPException):
    debug = {"detail": exc.detail, "status_code": exc.status_code}
    return api_response(success=False, error=exc.detail, debug_info=debug)


@app.exception_handler(Exception)
async def handle_generic_exception(request: Request, exc: Exception):
    debug = {"error_type": type(exc).__name__, "detail": str(exc)}
    return api_response(success=False, error=str(exc), debug_info=debug)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class ParameterMapping(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    node_id: str
    param_name: str
    value_template: str = "{value}"
    description: str = ""
    workflow_id: Optional[str] = None

class WorkflowMapping(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    data: Optional[Dict[str, Any]] = None

# Parameter Manager Routes
@api_router.post("/parameters", response_model=ParameterMapping)
async def create_parameter_mapping(mapping: ParameterMapping):
    mapping_dict = mapping.dict()
    # Store the ID in the _id field for MongoDB
    mapping_dict["_id"] = mapping_dict["id"]
    await db.parameter_mappings.insert_one(mapping_dict)
    return api_response(mapping_dict)

@api_router.get("/parameters", response_model=List[ParameterMapping])
async def get_parameter_mappings():
    mappings = await db.parameter_mappings.find().to_list(1000)
    for mapping in mappings:
        mapping["id"] = str(mapping.get("_id", mapping.get("id", "")))
        if "_id" in mapping:
            del mapping["_id"]
    return api_response(mappings)

@api_router.put("/parameters/{param_id}", response_model=ParameterMapping)
async def update_parameter_mapping(param_id: str, mapping: ParameterMapping):
    mapping_dict = mapping.dict()
    # Remove id for the update
    if "id" in mapping_dict:
        del mapping_dict["id"]
    
    await db.parameter_mappings.update_one(
        {"_id": param_id}, {"$set": mapping_dict}
    )
    return api_response({**mapping_dict, "id": param_id})

@api_router.delete("/parameters/{param_id}")
async def delete_parameter_mapping(param_id: str):
    await db.parameter_mappings.delete_one({"_id": param_id})
    return api_response({"message": "Parameter mapping deleted"})

# Workflow Manager Routes
@api_router.post("/workflows", response_model=WorkflowMapping)
async def create_workflow_mapping(mapping: WorkflowMapping):
    mapping_dict = mapping.dict()
    # Store the ID in the _id field for MongoDB
    mapping_dict["_id"] = mapping_dict["id"]
    await db.workflow_mappings.insert_one(mapping_dict)
    return api_response(mapping_dict)

@api_router.get("/workflows", response_model=List[WorkflowMapping])
async def get_workflow_mappings():
    mappings = await db.workflow_mappings.find().to_list(1000)
    for mapping in mappings:
        mapping["id"] = str(mapping.get("_id", mapping.get("id", "")))
        if "_id" in mapping:
            del mapping["_id"]
    return api_response(mappings)

@api_router.put("/workflows/{workflow_id}", response_model=WorkflowMapping)
async def update_workflow_mapping(workflow_id: str, mapping: WorkflowMapping):
    mapping_dict = mapping.dict()
    # Remove id for the update
    if "id" in mapping_dict:
        del mapping_dict["id"]
    
    await db.workflow_mappings.update_one(
        {"_id": workflow_id}, {"$set": mapping_dict}
    )
    return api_response({**mapping_dict, "id": workflow_id})

@api_router.delete("/workflows/{workflow_id}")
async def delete_workflow_mapping(workflow_id: str):
    await db.workflow_mappings.delete_one({"_id": workflow_id})
    return api_response({"message": "Workflow mapping deleted"})

# Root path response
@api_router.get("/")
async def root():
    return api_response({"message": "ComfyUI Frontend API"})

# Add ComfyUI workflow endpoints that were missing
@api_router.get("/comfyui/workflows")
async def get_comfyui_workflows():
    """Get available ComfyUI workflows"""
    # This is a sample response for the endpoint
    sample_workflows = [
        {
            "id": "workflow1",
            "name": "Basic Text to Image",
            "description": "Simple text to image generation workflow",
            "data": {
                "nodes": {
                    "1": {
                        "id": "1",
                        "type": "text_encoder",
                        "title": "Text Encoder",
                        "properties": {
                            "prompt": "A beautiful landscape",
                            "width": 512,
                            "height": 512,
                            "steps": 20
                        }
                    },
                    "2": {
                        "id": "2",
                        "type": "sampler",
                        "title": "Sampler",
                        "properties": {
                            "sampler_name": "ddim",
                            "steps": 20,
                            "cfg": 7.5
                        }
                    }
                }
            }
        },
        {
            "id": "workflow2",
            "name": "Inpainting Workflow",
            "description": "For inpainting masked regions",
            "data": {
                "nodes": {
                    "1": {
                        "id": "1",
                        "type": "image_loader",
                        "title": "Image Loader",
                        "properties": {
                            "image_path": "",
                            "mask_path": "",
                            "resize_mode": "crop"
                        }
                    },
                    "2": {
                        "id": "2",
                        "type": "inpaint_model",
                        "title": "Inpaint Model",
                        "properties": {
                            "prompt": "A beautiful mountain landscape",
                            "steps": 20,
                            "cfg": 7.5,
                            "denoise": 0.8
                        }
                    }
                }
            }
        }
    ]
    return api_response(sample_workflows)

@api_router.get("/comfyui/status")
async def get_comfyui_status():
    """Get the status of the ComfyUI server"""
    # This is a sample response for the endpoint
    return api_response({
        "status": "running",
        "version": "1.0.0",
        "gpu_info": {
            "name": "Sample GPU",
            "memory_total": 8192,
            "memory_used": 2048
        }
    })

# Add sample workflow endpoint
@api_router.get("/sample-workflows")
async def get_sample_workflows():
    return api_response([
        {
            "id": "workflow1",
            "name": "Basic Text to Image",
            "description": "Simple text to image generation workflow",
            "data": {
                "nodes": {
                    "1": {
                        "id": "1",
                        "type": "text_encoder",
                        "title": "Text Encoder",
                        "properties": {
                            "prompt": "A beautiful landscape",
                            "width": 512,
                            "height": 512,
                            "steps": 20
                        }
                    },
                    "2": {
                        "id": "2",
                        "type": "sampler",
                        "title": "Sampler",
                        "properties": {
                            "sampler_name": "ddim",
                            "steps": 20,
                            "cfg": 7.5
                        }
                    }
                }
            }
        },
        {
            "id": "workflow2",
            "name": "Inpainting Workflow",
            "description": "For inpainting masked regions",
            "data": {
                "nodes": {
                    "1": {
                        "id": "1",
                        "type": "image_loader",
                        "title": "Image Loader",
                        "properties": {
                            "image_path": "",
                            "mask_path": "",
                            "resize_mode": "crop"
                        }
                    },
                    "2": {
                        "id": "2",
                        "type": "inpaint_model",
                        "title": "Inpaint Model",
                        "properties": {
                            "prompt": "A beautiful mountain landscape",
                            "steps": 20,
                            "cfg": 7.5,
                            "denoise": 0.8
                        }
                    }
                }
            }
        }
    ])

# ComfyUI proxy endpoints
@api_router.post("/comfyui/prompt")
async def proxy_comfyui_prompt(payload: Dict[str, Any]):
    """Proxy prompt submission to the ComfyUI backend"""
    resp = requests.post(f"{COMFYUI_BASE_URL}/prompt", json=payload)
    return api_response(resp.json())


@api_router.get("/comfyui/history")
async def proxy_comfyui_history():
    """Proxy generation history from ComfyUI"""
    resp = requests.get(f"{COMFYUI_BASE_URL}/history")
    return api_response(resp.json())


@api_router.get("/comfyui/queue")
async def proxy_comfyui_queue():
    """Proxy queue state from ComfyUI"""
    resp = requests.get(f"{COMFYUI_BASE_URL}/queue")
    return api_response(resp.json())

# Include the router in the main app
app.include_router(api_router)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
