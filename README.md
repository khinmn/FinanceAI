# FinanceAI

A personal finance dashboard built with a Flask backend, PostgreSQL database, and React + Vite frontend.

## What this project includes

- Backend APIs for auth, transactions, categories, dashboard summaries, gap analysis, reports, and AI chatbot.
- Frontend pages for login/register, dashboard, transactions, gap analysis, reports, chat, and settings.
- PostgreSQL integration with automatic database creation in development.
- JWT authentication and secure password storage.

## Setup

1. Copy environment variables:

```powershell
cd backend
copy .env.example .env
```

2. Update `backend/.env` with your PostgreSQL and OpenRouter credentials.

3. Create and activate a Python virtual environment:

```powershell
cd ..
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
```

4. Install backend dependencies:

```powershell
pip install -r backend/requirements.txt
```

## Run locally

### Backend

```powershell
python backend/app.py
```

The backend runs on `http://127.0.0.1:5000`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api` requests to the backend.

## Notes

- Do not commit `backend/.env` or any local virtual environments.
- Use `backend/.env.example` as the template for environment variables.
- If the frontend is not rendering API-backed data, make sure the backend is running.

## Recommended next steps

- Add database migrations with Flask-Migrate or Alembic.
- Add CI for backend tests and frontend builds.
- Use Docker / docker-compose to simplify local development.
