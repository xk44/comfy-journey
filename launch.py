import os
import subprocess
import sys
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path


ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
FRONTEND_BUILD = FRONTEND / "build"


def run(cmd, cwd=None):
    """Run a shell command and exit on failure."""
    print(f"> {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd)
    if result.returncode != 0:
        sys.exit(result.returncode)


def ensure_dependencies():
    run("pip install -r requirements.txt", cwd=str(BACKEND))
    if not (FRONTEND / "node_modules").exists():
        run("yarn install", cwd=str(FRONTEND))
    run("yarn build", cwd=str(FRONTEND))


def start_frontend():
    os.chdir(str(FRONTEND_BUILD))
    handler = SimpleHTTPRequestHandler
    server = ThreadingHTTPServer(("0.0.0.0", 3000), handler)
    print("Frontend available on http://localhost:3000")
    server.serve_forever()


def start_backend():
    return subprocess.Popen([
        sys.executable,
        "-m",
        "uvicorn",
        "backend.server:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8001",
    ], cwd=str(ROOT))


def main() -> None:
    ensure_dependencies()
    be_proc = start_backend()
    fe_thread = threading.Thread(target=start_frontend, daemon=True)
    fe_thread.start()
    try:
        be_proc.wait()
    except KeyboardInterrupt:
        print("Stopping...")
        be_proc.terminate()


if __name__ == "__main__":
    main()
