# Production Optimization Backend (FastAPI)

This backend is a minimal FastAPI implementation for the "Intelligent system for optimization of production processes" described in the project PDFs.

Features included:
- JWT authentication (register + token)
- User model (basic)
- Machines CRUD
- Orders CRUD
- SQLite (SQLModel) for demo

How to run (recommended):

1. Create and activate a virtual environment from the `backend` folder:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Run the app:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. Open docs at `http://localhost:8000/docs`

Next steps:
- Add Alembic migrations
- Implement events ingestion (sensors/SCADA)
- Add analytics/background workers for recommendations
- Add WebSocket endpoint for real-time updates

Docker / Postgres (recommended for closer-to-prod):

1. From repository root run:

```bash
docker compose up --build
```

This will start Postgres and the backend. The backend's entrypoint runs `alembic upgrade head` to create tables and then starts `uvicorn`.

If you change models, create a new Alembic revision in `backend/alembic/versions` or run `alembic revision --autogenerate -m "msg"` from inside the `backend` container and then `alembic upgrade head`.
