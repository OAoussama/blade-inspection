# Blade Inspection

Wind turbine blade damage detection from drone imagery.

Users upload drone photos, the API analyses them and returns the detected
damage (cracks, erosion) with an estimated severity, drawn directly on
the images.

Internship project — PICS AI LTD, Oussama Aaraba.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind |
| Backend | FastAPI, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL 16 (Docker) |
| Model | YOLOv8 (Ultralytics) — *not integrated yet* |

---

## Requirements

- Python 3.12
- Node.js 20+
- Docker Desktop

---

## Setup

### 1. Clone and configure

```bash
git clone <repository-url>
cd blade-inspection
```

Create the environment files from the provided examples:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

> There are **two** `.env` files: the one at the root is read by Docker
> Compose, the one in `backend/` by the application itself.

### 2. Database

```bash
docker compose up -d
```

### 3. Backend

```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
```

### 4. Frontend

```bash
cd frontend
npm install
```

---

## Running the application

Three terminals.

**Terminal 1 — database**

```bash
docker compose up -d
```

**Terminal 2 — backend**

```bash
cd backend
.\.venv\Scripts\Activate.ps1     # Windows
uvicorn app.main:app --reload --port 8000
```

→ API: http://localhost:8000
→ Interactive docs: http://localhost:8000/docs

**Terminal 3 — frontend**

```bash
cd frontend
npm run dev
```

→ Application: http://localhost:3000

On Windows, `.\dev.ps1` at the root starts all three at once.

---

## First run

The `turbines` table starts empty. Create a test turbine:

```bash
docker compose exec db psql -U postgres -d blades -c \
  "INSERT INTO turbines (id, tag, site_name, created_at) \
   VALUES (gen_random_uuid(), 'T-01', 'Test site', now()) RETURNING id;"
```

Paste the returned id into `frontend/src/app/page.tsx`, then upload a few
images from http://localhost:3000.

---

## Project structure

```
blade-inspection/
├─ backend/
│  ├─ app/
│  │  ├─ main.py            entry point, router mounting
│  │  ├─ config.py          environment variables
│  │  ├─ database.py        engine, session, Base
│  │  ├─ models.py          SQLAlchemy tables
│  │  ├─ api/routes/        HTTP endpoints
│  │  ├─ schemas/           Pydantic contracts (input / output)
│  │  ├─ services/          business logic, no FastAPI dependency
│  │  └─ storage/           file abstraction (local, MinIO planned)
│  ├─ alembic/              migrations
│  └─ storage/              uploaded files (not versioned)
├─ frontend/src/
│  ├─ lib/api.ts            centralised HTTP client
│  ├─ lib/services/         typed API calls
│  ├─ hooks/                state and polling
│  └─ components/           user interface
└─ docker-compose.yml
```

---

## API

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Service status |
| `POST` | `/inspections` | Upload images — returns `202` and an id |
| `GET` | `/inspections/{id}` | Inspection status and results |
| `GET` | `/images/{id}/file` | Image file |

Analysis is **asynchronous**. `POST /inspections` responds immediately
with status `queued`; the client then polls `GET /inspections/{id}` until
it returns `done` or `failed`.

Bounding box coordinates are **normalised between 0 and 1**. To display
them, multiply by the rendered image size.

---

## Database

Six tables: `turbines`, `users`, `inspections`, `images`, `detections`,
`reports`.

Images are not stored in the database. Only a relative key
(`inspections/{id}/{image_id}.jpg`) is recorded, resolved by the storage
layer.

After any change to `models.py`:

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

Check that code and database are in sync:

```bash
alembic check
```

---

## Current status

**Done** — full pipeline: upload, storage, asynchronous processing,
persistence and result display.

**In progress** — the detection model is not trained yet. The inference
service returns stub detections in the final output format. Since the
contract is fixed, integrating YOLOv8 will only change the `predict()`
function in `app/services/inference.py`.

**Planned** — model training, turbine selection in the interface,
per-turbine report view, MinIO storage.

---

## Troubleshooting

**`ModuleNotFoundError: No module named 'app'`**
Run from `backend/` using `uvicorn app.main:app`, not from another
directory.

**`password authentication failed`**
Another PostgreSQL instance is using the port. Check `docker compose ps`
and the port configured in both `.env` files.

**Status stuck on `processing`**
The error appears in the backend logs and in the `error_message` column
of the `inspections` table.

**Frontend cannot reach the API**
Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local`, and that
`cors_origins` allows `http://localhost:3000`.
