# Comfy Journey

Comfy Journey is a web interface that mirrors the Midjourney experience while using ComfyUI as its image generation backend. The project combines a React frontend with a FastAPI service that forwards prompts and workflow actions to a running ComfyUI instance. It tracks generation progress over WebSockets and stores prompts, images and workflows in a relational database.

## Features

- Unified prompt bar with shortcode parsing (e.g. `--ar 16:9`)
- Real-time job updates without polling
- Workflow and action management mapped to custom buttons
- Parameter autocomplete and dynamic mappings
- Secure Civitai integration for browsing prompts and models
- Drag-and-drop and mask-based image editing
- Persistent history with cleanup utilities
- Theme switching and keyboard shortcuts

See `todo.txt` for the full list of implemented tasks.

## Installation

### Prerequisites

- Node.js 20+
- Python 3.11+
- Yarn
- A running ComfyUI server
- MongoDB 6+ running locally (or set `MONGO_URL` to an external instance)

### Quick start on Windows

Run `launch.bat` from a command prompt. The script installs dependencies,
builds the frontend and then starts both the backend API and a local web
server.
Ensure a MongoDB server is available on `localhost:27017` (or update
the `MONGO_URL` environment variable).

### Manual setup (Linux/macOS)

1. Install backend requirements:

```bash
cd backend
pip install -r requirements.txt
```
Make sure a MongoDB server is installed and running on `localhost:27017`.
You can download it from https://www.mongodb.com/try/download/community or
start one via Docker:

```bash
docker run -d -p 27017:27017 mongo
```

2. Install and build the frontend:

```bash
cd ../frontend
yarn install
yarn build
```

3. Configure environment variables (example values):

```bash
export COMFYUI_BASE_URL=http://localhost:8188
export DATABASE_URL=sqlite:///./comfy.db
export MONGO_URL=mongodb://localhost:27017
export SECRET_KEY=change-me
export CIVITAI_API_KEY=<your-key>
# URL where the FastAPI backend is reachable
export REACT_APP_BACKEND_URL=http://localhost:8001
```

4. Start the application:

```bash
cd ..
python launch.py
```


### Docker

Build and run everything in one container:

```bash
docker build -t comfy-journey .
docker run -p 3000:80 -p 8001:8001 \
  -e COMFYUI_BASE_URL=http://localhost:8188 \
  comfy-journey
```

The frontend will be accessible on port `3000` and the backend API on `8001`.
