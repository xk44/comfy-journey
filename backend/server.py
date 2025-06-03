from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
import types
import tempfile
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, AsyncIterator

import requests
from cryptography.fernet import Fernet
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    FastAPI,
    HTTPException,
    Header,
    Request,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from starlette.middleware.cors import CORSMiddleware

from .csrf import CSRFMiddleware
from .external_integrations.civitai import civitai_get, fetch_json as civitai_fetch
from .models import Action, ImageOutput, Prompt, SessionLocal, Workflow, init_db
from .utils import (
    DEBUG_MODE,
    api_response,
    log_backend_call,
    log_frontend_event,
    LOG_BACKEND_PATH,
)


# ---------------------------------------------------------------------------
# Mongo-style collections (used for parameter/action/workflow mappings)
# ---------------------------------------------------------------------------

try:
    from motor.motor_asyncio import AsyncIOMotorClient

    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    _mongo_client = AsyncIOMotorClient(mongo_url)
    db = _mongo_client.get_database("comfyui_frontend")
except Exception:  # pragma: no cover - fallback for tests
    class MemoryCollection:
        def __init__(self) -> None:
            self.store: Dict[str, Dict[str, Any]] = {}

        async def insert_one(self, doc: Dict[str, Any]) -> None:
            self.store[doc["_id"]] = doc

        def find(self):
            class Cursor:
                def __init__(self, data: Dict[str, Dict[str, Any]]) -> None:
                    self._data = list(data.values())

                async def to_list(self, _limit: int) -> List[Dict[str, Any]]:
                    return list(self._data)

            return Cursor(self.store)

        async def update_one(self, query: Dict[str, Any], update: Dict[str, Any], upsert: bool = False) -> None:
            _id = query.get("_id")
            doc = self.store.get(_id, {})
            doc.update(update.get("$set", {}))
            self.store[_id] = doc

        async def delete_one(self, query: Dict[str, Any]) -> None:
            self.store.pop(query.get("_id"), None)

        async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
            return self.store.get(query.get("_id"))

    db = types.SimpleNamespace(
        parameter_mappings=MemoryCollection(),
        workflow_mappings=MemoryCollection(),
        action_mappings=MemoryCollection(),
        civitai_key=MemoryCollection(),
    )


# Sample workflows used for demo and tests
SAMPLE_WORKFLOWS = [
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

# Sample models used for demo and tests
SAMPLE_MODELS = [
    {"id": "sd15", "name": "Stable Diffusion 1.5", "type": "SD1.5"},
    {"id": "sdxl", "name": "Stable Diffusion XL", "type": "SDXL"},
    {"id": "illustrious", "name": "Illustrious", "type": "Illustrious"},
    {"id": "pony", "name": "Pony Diffusion", "type": "Pony"},
    {"id": "flux", "name": "Flux", "type": "Flux"},
]


# ---------------------------------------------------------------------------
# Helpers for encrypted Civitai API key storage
# ---------------------------------------------------------------------------

fernet_secret = os.environ.get("FERNET_SECRET")
if not fernet_secret:
    secret = os.environ.get("SECRET_KEY", "secret-key")
    key_bytes = secret.encode()[:32]
    key_bytes += b"0" * (32 - len(key_bytes))
    fernet_secret = base64.urlsafe_b64encode(key_bytes).decode()
fernet = Fernet(fernet_secret)


async def get_civitai_key() -> Optional[str]:
    if os.environ.get("CIVITAI_API_KEY"):
        return os.environ["CIVITAI_API_KEY"]
    record = await db.civitai_key.find_one({"_id": "global"})
    if record and "key" in record:
        try:
            return fernet.decrypt(record["key"].encode()).decode()
        except Exception:
            return None
    return None


async def store_civitai_key(api_key: str) -> None:
    encrypted = fernet.encrypt(api_key.encode()).decode()
    await db.civitai_key.update_one({"_id": "global"}, {"$set": {"key": encrypted}}, upsert=True)
    os.environ["CIVITAI_API_KEY"] = api_key


# ---------------------------------------------------------------------------
# FastAPI application setup
# ---------------------------------------------------------------------------

COMFYUI_BASE_URL = os.environ.get("COMFYUI_BASE_URL", "http://localhost:8188")

app = FastAPI()
init_db()
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def api_root():
    """Simple root endpoint used for health checks."""
    return api_response({"message": "ComfyUI Frontend API"})

app.add_middleware(CSRFMiddleware, cookie_secure=not DEBUG_MODE)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Utility / dependency functions
# ---------------------------------------------------------------------------


def get_sql_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Progress tracking
# ---------------------------------------------------------------------------

jobs: Dict[str, Dict[str, Any]] = {}
ws_clients: Dict[str, Set[WebSocket]] = {}


async def _notify_websockets(job_id: str) -> None:
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


# ---------------------------------------------------------------------------
# API models
# ---------------------------------------------------------------------------

from pydantic import BaseModel, Field, constr


class WorkflowMapping(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    data: Optional[Dict[str, Any]] = None


class ActionMapping(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    button: str
    name: str
    workflow_id: str
    parameters: Optional[Dict[str, Any]] = None


class GenerateRequest(BaseModel):
    prompt: constr(min_length=1, max_length=2000)
    workflow_id: Optional[str] = None
    init_image: Optional[str] = None
    mask: Optional[str] = None


class CivitaiKey(BaseModel):
    api_key: str = Field(..., min_length=1)


class DownloadRequest(BaseModel):
    url: str
    path: str
    filename: Optional[str] = None


class ParameterMapping(BaseModel):
    """Mapping of a shortcode parameter to a workflow node parameter."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    node_id: str
    param_name: str
    value_template: str = "{value}"
    injection_mode: Optional[str] = None
    description: str = ""


class ModelInfo(BaseModel):
    id: str
    name: str
    type: str


# ---------------------------------------------------------------------------
# Parameter mapping endpoints
# ---------------------------------------------------------------------------


@api_router.post("/parameters", response_model=ParameterMapping)
async def create_parameter(mapping: ParameterMapping):
    doc = mapping.dict()
    doc["_id"] = mapping.id
    await db.parameter_mappings.insert_one(doc)
    return api_response(mapping.dict())


@api_router.get("/parameters", response_model=List[ParameterMapping])
async def get_parameters():
    records = await db.parameter_mappings.find().to_list(1000)
    payload = [
        {
            "id": r.get("_id", r.get("id")),
            "code": r.get("code"),
            "node_id": r.get("node_id"),
            "param_name": r.get("param_name"),
            "value_template": r.get("value_template", "{value}"),
            "injection_mode": r.get("injection_mode"),
            "description": r.get("description", ""),
        }
        for r in records
    ]
    return api_response(payload)


@api_router.put("/parameters/{param_id}", response_model=ParameterMapping)
async def update_parameter(param_id: str, mapping: ParameterMapping):
    doc = mapping.dict()
    doc["_id"] = param_id
    await db.parameter_mappings.update_one({"_id": param_id}, {"$set": doc}, upsert=True)
    return api_response(mapping.dict())


@api_router.delete("/parameters/{param_id}")
async def delete_parameter(param_id: str):
    await db.parameter_mappings.delete_one({"_id": param_id})
    return api_response({"message": "Parameter mapping deleted"})


# ---------------------------------------------------------------------------
# Relational workflow and action endpoints
# ---------------------------------------------------------------------------


@api_router.post("/relational/workflows", response_model=WorkflowMapping)
async def create_rel_workflow(mapping: WorkflowMapping, dbs: Session = Depends(get_sql_db)):
    wf = Workflow(id=mapping.id, name=mapping.name, description=mapping.description, data=json.dumps(mapping.data or {}))
    dbs.add(wf)
    dbs.commit()
    return api_response(mapping.dict())


@api_router.post("/relational/workflows/upload", response_model=WorkflowMapping)
async def upload_rel_workflow(payload: Dict[str, Any], dbs: Session = Depends(get_sql_db)):
    data = payload.get("data")
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="data field required")
    name = payload.get("name", f"workflow-{uuid.uuid4()}.json")
    mapping = WorkflowMapping(name=name, data=data)
    wf = Workflow(id=mapping.id, name=mapping.name, description=mapping.description, data=json.dumps(mapping.data or {}))
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
async def update_rel_workflow(wf_id: str, mapping: WorkflowMapping, dbs: Session = Depends(get_sql_db)):
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


# ----- Action mappings -----


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
async def update_action(action_id: str, mapping: ActionMapping, dbs: Session = Depends(get_sql_db)):
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


# ----- Prompt/output records -----


@api_router.get("/relational/prompts")
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


@api_router.get("/relational/outputs")
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


# ---------------------------------------------------------------------------
# Sample workflows
# ---------------------------------------------------------------------------


@api_router.get("/sample-workflows")
async def sample_workflows():
    """Return a list of example workflows for the frontend demo."""
    return api_response(SAMPLE_WORKFLOWS)


@api_router.get("/models", response_model=List[ModelInfo])
async def get_models():
    """Return a list of available models."""
    return api_response(SAMPLE_MODELS)


# ---------------------------------------------------------------------------
# Generation endpoints and progress streaming
# ---------------------------------------------------------------------------


@api_router.post("/generate")
async def start_generation(payload: GenerateRequest, background_tasks: BackgroundTasks = None, dbs: Session = Depends(get_sql_db)):
    prompt = payload.prompt.strip()
    workflow_id = payload.workflow_id
    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "status": "queued",
        "progress": 0,
        "prompt": prompt,
        "init_image": payload.init_image,
        "mask": payload.mask,
    }

    prm = Prompt(id=job_id, text=prompt, workflow_id=workflow_id)
    dbs.add(prm)
    dbs.commit()

    async def run_job(jid: str) -> None:
        jobs[jid]["status"] = "generating"
        await _notify_websockets(jid)
        for i in range(1, 6):
            await asyncio.sleep(0.1)
            jobs[jid]["progress"] = i * 20
            await _notify_websockets(jid)
        jobs[jid]["status"] = "done"
        await _notify_websockets(jid)
        with SessionLocal() as dbi:
            out = ImageOutput(prompt_id=jid, file_path=f"{jid}.png")
            dbi.add(out)
            dbi.commit()

    if background_tasks is not None:
        background_tasks.add_task(run_job, job_id)
    else:  # pragma: no cover - tests run sync
        asyncio.create_task(run_job(job_id))
    return api_response({"job_id": job_id})


@api_router.websocket("/progress/ws/{job_id}")
async def websocket_progress(ws: WebSocket, job_id: str):
    await ws.accept()
    ws_clients.setdefault(job_id, set()).add(ws)
    try:
        while True:
            job = jobs.get(job_id)
            if not job:
                await ws.send_json({"event": "end", "error": "job_not_found"})
                break
            queue_size = sum(1 for j in jobs.values() if j["status"] != "done")
            await ws.send_json({"job": job, "queue_size": queue_size})
            if job["status"] == "done":
                break
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass
    finally:
        ws_clients[job_id].discard(ws)


@api_router.get("/progress/stream/{job_id}")
async def progress_stream(request: Request, job_id: str):
    """Stream progress updates via Server-Sent Events."""

    async def event_generator() -> AsyncIterator[str]:
        while True:
            job = jobs.get(job_id)
            if not job:
                yield f"data: {json.dumps({'event': 'end', 'error': 'job_not_found'})}\n\n"
                break
            queue_size = sum(1 for j in jobs.values() if j['status'] != 'done')
            payload = json.dumps({'job': job, 'queue_size': queue_size})
            yield f"data: {payload}\n\n"
            if job['status'] == 'done':
                break
            await asyncio.sleep(0.1)
            if await request.is_disconnected():
                break

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ---------------------------------------------------------------------------
# Simple proxy endpoints to ComfyUI
# ---------------------------------------------------------------------------


@api_router.post("/comfyui/prompt")
async def proxy_comfyui_prompt(payload: Dict[str, Any]):
    start = datetime.utcnow().timestamp()
    resp = requests.post(f"{COMFYUI_BASE_URL}/prompt", json=payload)
    data = resp.json()
    log_backend_call("POST", f"{COMFYUI_BASE_URL}/prompt", payload, data, resp.status_code, start)
    return api_response(data)


@api_router.get("/comfyui/history")
async def proxy_comfyui_history():
    start = datetime.utcnow().timestamp()
    resp = requests.get(f"{COMFYUI_BASE_URL}/history")
    data = resp.json()
    log_backend_call("GET", f"{COMFYUI_BASE_URL}/history", None, data, resp.status_code, start)
    return api_response(data)


@api_router.get("/comfyui/queue")
async def proxy_comfyui_queue():
    start = datetime.utcnow().timestamp()
    resp = requests.get(f"{COMFYUI_BASE_URL}/queue")
    data = resp.json()
    log_backend_call("GET", f"{COMFYUI_BASE_URL}/queue", None, data, resp.status_code, start)
    return api_response(data)


@api_router.get("/comfyui/status")
async def comfyui_status():
    """Return basic status information about the configured ComfyUI server."""
    try:
        resp = requests.get(f"{COMFYUI_BASE_URL}/queue", timeout=5)
        resp.raise_for_status()
        return api_response({"status": "online"})
    except Exception as exc:  # pragma: no cover - network failures
        return api_response({"status": "offline", "error": str(exc)})


# ---------------------------------------------------------------------------
# Civitai integration
# ---------------------------------------------------------------------------


@api_router.post("/civitai/key")
async def set_civitai_key(key: CivitaiKey):
    await store_civitai_key(key.api_key)
    return api_response({"message": "API key saved"})


@api_router.get("/civitai/key")
async def has_civitai_key():
    key = await get_civitai_key()
    return api_response({"key_set": bool(key)})


@api_router.get("/civitai/images")
async def civitai_images(limit: int = 20, page: int = 1, query: Optional[str] = None):
    api_key = await get_civitai_key()
    params = {"limit": limit, "page": page}
    if query:
        params["query"] = query
    data = await civitai_fetch("/images", params=params, api_key=api_key)
    return api_response(data)


@api_router.get("/civitai/models")
async def civitai_models(limit: int = 20, page: int = 1, query: Optional[str] = None):
    api_key = await get_civitai_key()
    params = {"limit": limit, "page": page}
    if query:
        params["query"] = query
    data = await civitai_fetch("/models", params=params, api_key=api_key)
    return api_response(data)


# ---------------------------------------------------------------------------
# Maintenance endpoint
# ---------------------------------------------------------------------------


from scripts.cleanup import cleanup as cleanup_task
from scripts.backup import async_backup_file, async_restore_file

CLEAN_PATHS = os.environ.get("CJ_CLEAN_PATHS", "").split(":")
CLEAN_DAYS = int(os.environ.get("CJ_CLEAN_DAYS", "7"))
CLEAN_INTERVAL = int(os.environ.get("CJ_CLEAN_INTERVAL", "0"))


async def _cleanup_worker() -> None:
    if CLEAN_INTERVAL <= 0:
        return
    while True:
        try:
            cleanup_task(CLEAN_PATHS, CLEAN_DAYS)
        except Exception as exc:  # pragma: no cover - log and continue
            logging.exception("Cleanup failed: %s", exc)
        await asyncio.sleep(CLEAN_INTERVAL)


@api_router.post("/maintenance/cleanup")
async def run_cleanup(background_tasks: BackgroundTasks, days: int = CLEAN_DAYS):
    background_tasks.add_task(cleanup_task, CLEAN_PATHS, days)
    return api_response({"message": "Cleanup started"})


@api_router.get("/maintenance/backup")
async def download_backup():
    path = await async_backup_file(db=db)
    return FileResponse(path, filename=os.path.basename(path))


@api_router.post("/maintenance/restore")
async def upload_backup(request: Request):
    data = await request.body()
    tmp = tempfile.NamedTemporaryFile(delete=False)
    try:
        tmp.write(data)
        tmp.close()
        await async_restore_file(tmp.name, db=db)
    finally:
        os.unlink(tmp.name)
    return api_response({"message": "Restore completed"})


@api_router.post("/download")
async def download_file(req: DownloadRequest):
    filename = req.filename or os.path.basename(req.url.split("?")[0])
    os.makedirs(req.path, exist_ok=True)
    dest = os.path.join(req.path, filename)
    try:
        with requests.get(req.url, stream=True, timeout=30) as r:
            r.raise_for_status()
            with open(dest, "wb") as fh:
                for chunk in r.iter_content(chunk_size=8192):
                    if chunk:
                        fh.write(chunk)
    except Exception as exc:  # pragma: no cover - network dependent
        raise HTTPException(status_code=500, detail=str(exc))
    return api_response({"saved_to": dest})


@api_router.post("/logs/frontend")
async def receive_frontend_log(request: Request):
    data = await request.json()
    log_frontend_event({"client": request.client.host if request.client else None, **data})
    return api_response({"logged": True})


# ---------------------------------------------------------------------------
# Mount router and startup/shutdown events
# ---------------------------------------------------------------------------


app.include_router(api_router)

logging.basicConfig(
    level=logging.INFO,
    handlers=[logging.FileHandler(LOG_BACKEND_PATH), logging.StreamHandler()],
)


@app.on_event("startup")
async def startup_tasks() -> None:
    if CLEAN_INTERVAL > 0:
        asyncio.create_task(_cleanup_worker())


@app.on_event("shutdown")
async def shutdown_mongo() -> None:
    if "_mongo_client" in globals():
        _mongo_client.close()
