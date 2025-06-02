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

### Quick start on Windows

Run `launch.bat` from a command prompt. The script installs dependencies,
builds the frontend and then starts both the backend API and a local web
server.

### Manual setup (Linux/macOS)

1. Install backend requirements:

```bash
cd backend
pip install -r requirements.txt
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
export SECRET_KEY=change-me
export CIVITAI_API_KEY=<your-key>
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
