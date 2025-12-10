@echo off
echo Starting Bachata Sync...

echo Starting Backend (FastAPI)...
start "Bachata Backend" cmd /k "cd backend && .\venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Starting Frontend (Vite)...
start "Bachata Frontend" cmd /k "cd frontend && npm run dev"

echo ====================================================
echo App is starting!
echo Backend: http://localhost:8000/docs
echo Frontend: http://localhost:5173
echo ====================================================
pause
