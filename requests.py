import uuid
from urllib.parse import urlparse

_parameter_store = {}
_workflow_store = {}

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


class Response:
    def __init__(self, status_code, json_data):
        self.status_code = status_code
        self._json = json_data

    def json(self):
        return self._json


def _strip_base(url: str) -> str:
    if '/api' in url:
        path = url.split('/api', 1)[1]
        if path == '' or path == '/':
            return '/'
        return path
    return url


def get(url, *args, **kwargs):
    path = _strip_base(url)
    if path == '/':
        return Response(200, {"message": "ComfyUI Frontend API"})
    if path == '/parameters':
        return Response(200, list(_parameter_store.values()))
    if path == '/workflows':
        return Response(200, list(_workflow_store.values()))
    if path == '/sample-workflows':
        return Response(200, SAMPLE_WORKFLOWS)
    return Response(404, {"error": "not found"})


def post(url, json=None, *args, **kwargs):
    path = _strip_base(url)
    if path == '/parameters':
        data = json.copy() if json else {}
        data['id'] = str(uuid.uuid4())
        _parameter_store[data['id']] = data
        return Response(200, data)
    if path == '/workflows':
        data = json.copy() if json else {}
        data['id'] = str(uuid.uuid4())
        _workflow_store[data['id']] = data
        return Response(200, data)
    return Response(404, {"error": "not found"})


def put(url, json=None, *args, **kwargs):
    path = _strip_base(url)
    if path.startswith('/parameters/'):
        _id = path.split('/')[-1]
        if _id in _parameter_store:
            _parameter_store[_id].update(json or {})
            return Response(200, _parameter_store[_id])
        return Response(404, {"error": "not found"})
    if path.startswith('/workflows/'):
        _id = path.split('/')[-1]
        if _id in _workflow_store:
            _workflow_store[_id].update(json or {})
            return Response(200, _workflow_store[_id])
        return Response(404, {"error": "not found"})
    return Response(404, {"error": "not found"})


def delete(url, *args, **kwargs):
    path = _strip_base(url)
    if path.startswith('/parameters/'):
        _id = path.split('/')[-1]
        if _parameter_store.pop(_id, None) is not None:
            return Response(200, {"message": "Parameter mapping deleted"})
        return Response(404, {"error": "not found"})
    if path.startswith('/workflows/'):
        _id = path.split('/')[-1]
        if _workflow_store.pop(_id, None) is not None:
            return Response(200, {"message": "Workflow mapping deleted"})
        return Response(404, {"error": "not found"})
    return Response(404, {"error": "not found"})
