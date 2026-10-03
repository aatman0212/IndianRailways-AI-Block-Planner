"""
Master One-Click Launcher for Indian Railways AI Automatic Block Planner
Starts both FastAPI Backend (port 8000) and Vite Frontend (port 5173) simultaneously.
"""

import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

ROOT_DIR = Path(__file__).parent.resolve()
VENV_PYTHON = ROOT_DIR / "venv" / "Scripts" / "python.exe"
FRONTEND_DIR = ROOT_DIR / "frontend"

if not VENV_PYTHON.exists():
    VENV_PYTHON = sys.executable


def main():
    print("=" * 65)
    print("  INDIAN RAILWAYS — AI-POWERED AUTOMATIC BLOCK PLANNING SYSTEM  ")
    print("=" * 65)
    print("[1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...")

    # Launch Backend
    backend_cmd = [
        str(VENV_PYTHON),
        "-m",
        "uvicorn",
        "backend.app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
    ]
    backend_proc = subprocess.Popen(backend_cmd, cwd=str(ROOT_DIR))

    # Give backend a moment to initialize data and solver
    time.sleep(2)

    print("[2/3] Starting Vite Frontend on http://localhost:5173 ...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen([npm_cmd, "run", "dev"], cwd=str(FRONTEND_DIR))

    time.sleep(2)
    print("[3/3] System Ready! Opening browser at http://localhost:5173 ...")
    print("-" * 65)
    print("Press Ctrl+C in this terminal anytime to stop both services.")
    print("-" * 65)

    try:
        webbrowser.open("http://localhost:5173")
        # Keep running
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping services...")
    finally:
        backend_proc.terminate()
        frontend_proc.terminate()
        print("All services stopped.")


if __name__ == "__main__":
    main()
