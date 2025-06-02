@echo off
REM Launch Comfy Journey on Windows
cd /d "%~dp0"

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

pip install --upgrade pip >nul
pip install -r backend\requirements.txt

if not exist frontend\node_modules (
    echo Installing frontend packages...
    pushd frontend
    yarn install
    popd
)

pushd frontend
yarn build
popd

python launch.py %*
