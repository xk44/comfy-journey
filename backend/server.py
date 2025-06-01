from fastapi import (
    FastAPI,
    APIRouter,
    HTTPException,
    Body,
    Depends,
    Request,
    WebSocket,
    WebSocketDisconnect,
    BackgroundTasks,
)
from fastapi.responses import StreamingResponse
from .utils import api_response, DEBUG_MODE, log_backend_call
from .security import csrf_protect
from .external_integrations.civitai import civitai_get, fetch_json as civitai_fetch
from cryptography.fernet import Fernet
import base64
from sqlalchemy.orm import Session
from .models import (
    SessionLocal,
    init_db,
    Workflow,
    Action,
    Prompt,
    ImageOutput,
)
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, constr
from typing import List, Dict, Any, Optional, Set
import os
import uuid
from datetime import datetime
import logging
import asyncio
import json
import requests
from scripts.cleanup import cleanup as cleanup_task

# Load environment variables
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client.get_database("comfyui_frontend")

# In-memory collection fallback for tests or when MongoDB is unavailable
class _MemoryCursor:
    def __init__(self, data):
        self._data = list(data)

    async def to_list(self, *_args, **_kwargs):
        return list(self._data)


class _MemoryCollection:
    def __init__(self):
        self.store = {}

    async def insert_one(self, doc):
        self.store[doc["_id"]] = doc

    def find(self):
        return _MemoryCursor(self.store.values())

    async def update_one(self, query, update):
        _id = query.get("_id")
        if _id in self.store:
            self.store[_id].update(update.get("$set", {}))

    async def delete_one(self, query):
        _id = query.get("_id")
        if _id in self.store:
            del self.store[_id]

    async def find_one(self, query):
        _id = query.get("_id")
        return self.store.get(_id)


if not hasattr(db, "action_mappings"):
    db.action_mappings = _MemoryCollection()
if not hasattr(db, "workflow_mappings"):
    db.workflow_mappings = _MemoryCollection()
if not hasattr(db, "parameter_mappings"):
    db.parameter_mappings = _MemoryCollection()
if not hasattr(db, "civitai_key"):
    db.civitai_key = _MemoryCollection()

# Base URL for the ComfyUI backend
COMFYUI_BASE_URL = os.environ.get("COMFYUI_BASE_URL", "http://localhost:8188")

# Encryption setup for storing sensitive keys
fernet_secret = os.environ.get("FERNET_SECRET")
if not fernet_secret:
    secret = os.environ.get("SECRET_KEY", "default-secret-key")
    key_bytes = secret.encode()[:32]
    if len(key_bytes) < 32:
        key_bytes = key_bytes + b"0" * (32 - len(key_bytes))
    fernet_secret = base64.urlsafe_b64encode(key_bytes).decode()
fernet = Fernet(fernet_secret)

async def get_civitai_key() -> str | None:
    if os.environ.get("CIVITAI_API_KEY"):
        return os.environ["CIVITAI_API_KEY"]
    record = await db.civitai_key.find_one({"_id": "global"})
    if record and "key" in record:
        try:
            return fernet.decrypt(record["key"].encode()).decode()
        except Exception:
            return None
    return None

# Load Civitai API key from environment or DB at startup
if not os.environ.get("CIVITAI_API_KEY"):
    try:
        loop = asyncio.get_event_loop()
        key = loop.run_until_complete(get_civitai_key())
        if key:
            os.environ["CIVITAI_API_KEY"] = key
    except Exception:
        pass

# Cleanup configuration
CLEAN_PATHS = os.environ.get("CJ_CLEAN_PATHS", "").split(":")
CLEAN_DAYS = int(os.environ.get("CJ_CLEAN_DAYS", "7"))
CLEAN_INTERVAL = int(os.environ.get("CJ_CLEAN_INTERVAL", "0"))

# Create the main app
app = FastAPI()
init_db()

# Simple in-memory job store for demo progress streaming
jobs: Dict[str, Dict[str, Any]] = {}
ws_clients: Dict[str, Set[WebSocket]] = {}
action_store: Dict[str, Dict[str, Any]] = {}


async def _notify_websockets(job_id: str) -> None:
    """Send job progress updates to all connected WebSocket clients."""
    job = jobs.get(job_id)
    if not job:
        return
    queue_size = sum(1 for j in jobs.values() if j["status"] != "done")
    data = {"job": job, "queue_size": queue_size}
    connections = ws_clients.get(job_id, set()).copy()
    for ws in connections:
        try:
            await ws.send_json(data)
        except Exception:
            ws_clients[job_id].discard(ws)

async def _cleanup_worker() -> None:
    """Periodically clean temporary files based on environment settings."""
    if CLEAN_INTERVAL <= 0:
        return
    while True:
        try:
            cleanup_task(CLEAN_PATHS, CLEAN_DAYS)
        except Exception as exc:  # pragma: no cover - log but continue
            logging.exception("Cleanup failed: %s", exc)
        await asyncio.sleep(CLEAN_INTERVAL)


def get_sql_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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

class ActionMapping(BaseModel):
    """Map a UI action button to a workflow"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    workflow_id: str
    description: str = ""
    parameters: Optional[Dict[str, Any]] = None


class ActionMapping(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    button: str
    name: str
    workflow_id: str
    parameters: Optional[Dict[str, Any]] = None


class PromptRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    workflow_id: Optional[str] = None
    created_at: Optional[str] = None


class ImageOutputRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    prompt_id: str
    file_path: str
    created_at: Optional[str] = None


class GenerateRequest(BaseModel):
    prompt: constr(min_length=1, max_length=500)
    workflow_id: Optional[str] = None


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

    await db.parameter_mappings.update_one({"_id": param_id}, {"$set": mapping_dict})
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

    await db.workflow_mappings.update_one({"_id": workflow_id}, {"$set": mapping_dict})
    return api_response({**mapping_dict, "id": workflow_id})


@api_router.delete("/workflows/{workflow_id}")
async def delete_workflow_mapping(workflow_id: str):
    await db.workflow_mappings.delete_one({"_id": workflow_id})
    return api_response({"message": "Workflow mapping deleted"})

# Action Manager Routes
@api_router.post("/actions", response_model=ActionMapping)
async def create_action_mapping(mapping: ActionMapping):
    mapping_dict = mapping.dict()
    mapping_dict["_id"] = mapping_dict["id"]
    if hasattr(db, "action_mappings"):
        await db.action_mappings.insert_one(mapping_dict)
    else:
        action_store[mapping_dict["id"]] = mapping_dict
    return api_response(mapping_dict)

@api_router.get("/actions", response_model=List[ActionMapping])
async def get_action_mappings():
    if hasattr(db, "action_mappings"):
        mappings = await db.action_mappings.find().to_list(1000)
    else:
        mappings = list(action_store.values())
    for m in mappings:
        m["id"] = str(m.get("_id", m.get("id", "")))
        if "_id" in m:
            del m["_id"]
    return api_response(mappings)

@api_router.put("/actions/{action_id}", response_model=ActionMapping)
async def update_action_mapping(action_id: str, mapping: ActionMapping):
    mapping_dict = mapping.dict()
    if "id" in mapping_dict:
        del mapping_dict["id"]
    if hasattr(db, "action_mappings"):
        await db.action_mappings.update_one({"_id": action_id}, {"$set": mapping_dict})
    else:
        if action_id in action_store:
            action_store[action_id].update(mapping_dict)
    return api_response({**mapping_dict, "id": action_id})

@api_router.delete("/actions/{action_id}")
async def delete_action_mapping(action_id: str):
    await db.action_mappings.delete_one({"_id": action_id})

    if hasattr(db, "action_mappings"):
        await db.action_mappings.delete_one({"_id": action_id})
    else:
        action_store.pop(action_id, None)
    return api_response({"message": "Action mapping deleted"})

# Relational Workflow Endpoints using SQLAlchemy
@api_router.post("/relational/workflows", response_model=WorkflowMapping)
async def create_rel_workflow(
    mapping: WorkflowMapping, dbs: Session = Depends(get_sql_db)
):
    wf = Workflow(
        id=mapping.id,
        name=mapping.name,
        description=mapping.description,
        data=json.dumps(mapping.data or {}),
    )
    dbs.add(wf)
    dbs.commit()
    return api_response(mapping.dict())


@api_router.post("/relational/workflows/upload", response_model=WorkflowMapping)
async def upload_rel_workflow(
    payload: Dict[str, Any], dbs: Session = Depends(get_sql_db)
):
    """Upload a workflow JSON payload and store it."""
    data = payload.get("data")
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="data field required")
    name = payload.get("name", f"workflow-{uuid.uuid4()}.json")
    mapping = WorkflowMapping(name=name, data=data)
    wf = Workflow(
        id=mapping.id,
        name=mapping.name,
        description=mapping.description,
        data=json.dumps(mapping.data or {}),
    )
    dbs.add(wf)
    dbs.commit()
    return api_response(mapping.dict())


@api_router.get("/relational/workflows", response_model=List[WorkflowMapping])
async def get_rel_workflows(dbs: Session = Depends(get_sql_db)):
    wfs = dbs.query(Workflow).all()
    payload = [
        {
            "id": w.id,
            "name": w.name,
            "description": w.description,
            "data": json.loads(w.data) if w.data else None,
        }
        for w in wfs
    ]
    return api_response(payload)


@api_router.put("/relational/workflows/{wf_id}", response_model=WorkflowMapping)
async def update_rel_workflow(
    wf_id: str, mapping: WorkflowMapping, dbs: Session = Depends(get_sql_db)
):
    wf = dbs.query(Workflow).filter(Workflow.id == wf_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    wf.name = mapping.name
    wf.description = mapping.description
    wf.data = json.dumps(mapping.data or {})
    dbs.commit()
    return api_response(mapping.dict())


@api_router.delete("/relational/workflows/{wf_id}")
async def delete_rel_workflow(wf_id: str, dbs: Session = Depends(get_sql_db)):
    wf = dbs.query(Workflow).filter(Workflow.id == wf_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    dbs.delete(wf)
    dbs.commit()
    return api_response({"message": "Workflow deleted"})


# ----- Action endpoints -----
@api_router.post("/relational/actions", response_model=ActionMapping)
async def create_action(mapping: ActionMapping, dbs: Session = Depends(get_sql_db)):
    action = Action(
        id=mapping.id,
        button=mapping.button,
        name=mapping.name,
        workflow_id=mapping.workflow_id,
        parameters=json.dumps(mapping.parameters or {}),
    )
    dbs.add(action)
    dbs.commit()
    return api_response(mapping.dict())


@api_router.get("/relational/actions", response_model=List[ActionMapping])
async def get_actions(dbs: Session = Depends(get_sql_db)):
    actions = dbs.query(Action).all()
    payload = [
        {
            "id": a.id,
            "button": a.button,
            "name": a.name,
            "workflow_id": a.workflow_id,
            "parameters": json.loads(a.parameters) if a.parameters else None,
        }
        for a in actions
    ]
    return api_response(payload)


@api_router.put("/relational/actions/{action_id}", response_model=ActionMapping)
async def update_action(
    action_id: str, mapping: ActionMapping, dbs: Session = Depends(get_sql_db)
):
    action = dbs.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    action.button = mapping.button
    action.name = mapping.name
    action.workflow_id = mapping.workflow_id
    action.parameters = json.dumps(mapping.parameters or {})
    dbs.commit()
    return api_response(mapping.dict())


@api_router.delete("/relational/actions/{action_id}")
async def delete_action(action_id: str, dbs: Session = Depends(get_sql_db)):
    action = dbs.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    dbs.delete(action)
    dbs.commit()
    return api_response({"message": "Action mapping deleted"})


# ----- Prompt and output endpoints -----
@api_router.get("/relational/prompts", response_model=List[PromptRecord])
async def get_prompts(dbs: Session = Depends(get_sql_db)):
    prompts = dbs.query(Prompt).all()
    payload = [
        {
            "id": p.id,
            "text": p.text,
            "workflow_id": p.workflow_id,
            "created_at": p.created_at,
        }
        for p in prompts
    ]
    return api_response(payload)


@api_router.get("/relational/outputs", response_model=List[ImageOutputRecord])
async def get_outputs(dbs: Session = Depends(get_sql_db)):
    outputs = dbs.query(ImageOutput).all()
    payload = [
        {
            "id": o.id,
            "prompt_id": o.prompt_id,
            "file_path": o.file_path,
            "created_at": o.created_at,
        }
        for o in outputs
    ]
    return api_response(payload)


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
                            "steps": 20,
                        },
                    },
                    "2": {
                        "id": "2",
                        "type": "sampler",
                        "title": "Sampler",
                        "properties": {"sampler_name": "ddim", "steps": 20, "cfg": 7.5},
                    },
                }
            },
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
                            "resize_mode": "crop",
                        },
                    },
                    "2": {
                        "id": "2",
                        "type": "inpaint_model",
                        "title": "Inpaint Model",
                        "properties": {
                            "prompt": "A beautiful mountain landscape",
                            "steps": 20,
                            "cfg": 7.5,
                            "denoise": 0.8,
                        },
                    },
                }
            },
        },
    ]
    return api_response(sample_workflows)


@api_router.get("/comfyui/status")
async def get_comfyui_status():
    """Get the status of the ComfyUI server"""
    # This is a sample response for the endpoint
    return api_response(
        {
            "status": "running",
            "version": "1.0.0",
            "gpu_info": {
                "name": "Sample GPU",
                "memory_total": 8192,
                "memory_used": 2048,
            },
        }
    )


# Add sample workflow endpoint
@api_router.get("/sample-workflows")
async def get_sample_workflows():
    return api_response(
        [
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
                                "steps": 20,
                            },
                        },
                        "2": {
                            "id": "2",
                            "type": "sampler",
                            "title": "Sampler",
                            "properties": {
                                "sampler_name": "ddim",
                                "steps": 20,
                                "cfg": 7.5,
                            },
                        },
                    }
                },
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
                                "resize_mode": "crop",
                            },
                        },
                        "2": {
                            "id": "2",
                            "type": "inpaint_model",
                            "title": "Inpaint Model",
                            "properties": {
                                "prompt": "A beautiful mountain landscape",
                                "steps": 20,
                                "cfg": 7.5,
                                "denoise": 0.8,
                            },
                        },
                    }
                },
            },
        ]
    )


# Simple workflow execution and progress streaming
@api_router.post("/generate")
async def start_generation(
    data: GenerateRequest,
    background_tasks: BackgroundTasks = None,
    dbs: Session = Depends(get_sql_db),
    _csrf: None = Depends(csrf_protect),
):
    """Create a fake generation job and simulate progress."""
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "queued", "progress": 0, "prompt": data.prompt}

    # store prompt record
    prm = Prompt(id=job_id, text=data.prompt, workflow_id=data.workflow_id)
    dbs.add(prm)
    dbs.commit()

    async def run_job(jid: str):
        jobs[jid]["status"] = "generating"
        await _notify_websockets(jid)
        for i in range(1, 6):
            await asyncio.sleep(0.1)
            jobs[jid]["progress"] = i * 20
            await _notify_websockets(jid)
        jobs[jid]["status"] = "done"
        await _notify_websockets(jid)

        # store output record when done
        with SessionLocal() as dbi:
            out = ImageOutput(
                prompt_id=jid,
                file_path=f"{jid}.png",
            )
            dbi.add(out)
            dbi.commit()

    if background_tasks is not None:
        background_tasks.add_task(run_job, job_id)
    else:
        asyncio.create_task(run_job(job_id))
    return api_response({"job_id": job_id})


@api_router.get("/progress/{job_id}")
async def get_progress(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return api_response(job)


@api_router.get("/progress/stream/{job_id}")
async def stream_progress(job_id: str):
    async def event_generator():
        while True:
            job = jobs.get(job_id)
            if not job:
                payload = {"success": False, "error": "job_not_found"}
                yield f"event: end\ndata: {json.dumps(payload)}\n\n"
                break
            queue_size = sum(1 for j in jobs.values() if j["status"] != "done")
            data = {
                "success": True,
                "payload": {"job": job, "queue_size": queue_size},
            }
            yield f"data: {json.dumps(data)}\n\n"
            if job["status"] == "done":
                break
            await asyncio.sleep(0.1)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@api_router.websocket("/progress/ws/{job_id}")
async def websocket_progress(websocket: WebSocket, job_id: str):
    await websocket.accept()
    ws_clients.setdefault(job_id, set()).add(websocket)
    try:
        while True:
            job = jobs.get(job_id)
            if not job:
                await websocket.send_json({"event": "end", "error": "job_not_found"})
                break
            queue_size = sum(1 for j in jobs.values() if j["status"] != "done")
            await websocket.send_json({"job": job, "queue_size": queue_size})
            if job["status"] == "done":
                break
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass
    finally:
        ws_clients[job_id].discard(websocket)


# ComfyUI proxy endpoints
@api_router.post("/comfyui/prompt")
async def proxy_comfyui_prompt(payload: Dict[str, Any]):
    """Proxy prompt submission to the ComfyUI backend"""
    start = datetime.utcnow().timestamp()
    resp = requests.post(f"{COMFYUI_BASE_URL}/prompt", json=payload)
    data = resp.json()
    log_backend_call("POST", f"{COMFYUI_BASE_URL}/prompt", payload, data, resp.status_code, start)
    return api_response(data)


@api_router.get("/comfyui/history")
async def proxy_comfyui_history():
    """Proxy generation history from ComfyUI"""
    start = datetime.utcnow().timestamp()
    resp = requests.get(f"{COMFYUI_BASE_URL}/history")
    data = resp.json()
    log_backend_call("GET", f"{COMFYUI_BASE_URL}/history", None, data, resp.status_code, start)
    return api_response(data)


@api_router.get("/comfyui/queue")
async def proxy_comfyui_queue():
    """Proxy queue state from ComfyUI"""
    start = datetime.utcnow().timestamp()
    resp = requests.get(f"{COMFYUI_BASE_URL}/queue")
    data = resp.json()
    log_backend_call("GET", f"{COMFYUI_BASE_URL}/queue", None, data, resp.status_code, start)
    return api_response(data)


# --- Civitai API key management ---
@api_router.post("/civitai/key")
async def set_civitai_key(
    data: Dict[str, str], _csrf: None = Depends(csrf_protect)
):
    """Store the Civitai API key encrypted in the database"""
    api_key = data.get("api_key")
    if not api_key:
        raise HTTPException(status_code=400, detail="api_key required")
    encrypted = fernet.encrypt(api_key.encode()).decode()
    await db.civitai_key.update_one(
        {"_id": "global"}, {"$set": {"key": encrypted}}, upsert=True
    )
    os.environ["CIVITAI_API_KEY"] = api_key
    return api_response({"message": "API key saved"})


@api_router.get("/civitai/key")
async def has_civitai_key():
    """Check if a Civitai API key has been stored"""
    key = await get_civitai_key()
    return api_response({"key_set": bool(key)})


@api_router.get("/civitai/{path:path}")
async def civitai_proxy(path: str, request: Request):
    """Proxy GET requests to the Civitai API with caching and throttling."""
    params = dict(request.query_params)
    try:
        data = await civitai_get(f"/{path}", params)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=str(exc))

@api_router.get("/civitai/images")
async def civitai_images(limit: int = 20, page: int = 1, query: str | None = None):
    """Fetch images from Civitai with basic caching and rate limiting."""
    api_key = await get_civitai_key()
    params = {"limit": limit, "page": page}
    if query:
        params["query"] = query
    data = await civitai_fetch("/images", params=params, api_key=api_key)
    return api_response(data)


@api_router.get("/civitai/models")
async def civitai_models(limit: int = 20, page: int = 1, query: str | None = None):
    """Fetch models from Civitai with basic caching and rate limiting."""
    api_key = await get_civitai_key()
    params = {"limit": limit, "page": page}
    if query:
        params["query"] = query
    data = await civitai_fetch("/models", params=params, api_key=api_key)
    return api_response(data)


@api_router.post("/maintenance/cleanup")
async def run_cleanup(background_tasks: BackgroundTasks, days: int = CLEAN_DAYS):
    """Trigger background cleanup of temporary files."""
    background_tasks.add_task(cleanup_task, CLEAN_PATHS, days)
    return api_response({"message": "Cleanup started"})


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
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


@app.on_event("startup")
async def startup_tasks() -> None:
    """Launch background maintenance tasks."""
    if CLEAN_INTERVAL > 0:
        asyncio.create_task(_cleanup_worker())


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
