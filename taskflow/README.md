# TaskFlow

A small but realistic full-stack task manager, built as a **dummy target project** for testing a PR-review agent and a bug-fixing agent.

- **Backend:** Python 3.11+ · FastAPI · SQLAlchemy 2 · SQLite · JWT auth · pytest
- **Frontend:** React 18 · Vite · plain CSS · Vitest

Features: register/login, projects, tasks (status / priority / due date), search & filters, overdue tracking, dashboard stats. Every user only sees their own data.

```
taskflow/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, router wiring
│   │   ├── config.py        # env-based settings
│   │   ├── database.py      # engine / session / Base
│   │   ├── models.py        # User, Project, Task
│   │   ├── schemas.py       # Pydantic request/response models
│   │   ├── security.py      # password hashing + JWT helpers
│   │   ├── deps.py          # get_current_user dependency
│   │   └── routers/         # auth.py, projects.py, tasks.py
│   ├── tests/               # pytest suite (auth, tasks, projects, health)
│   ├── seed.py              # demo data
│   ├── requirements.txt
│   └── pyproject.toml       # ruff config
└── frontend/
    ├── src/
    │   ├── api.js           # fetch wrapper + endpoints
    │   ├── AuthContext.jsx  # login state
    │   ├── utils.js         # pure helpers (unit tested)
    │   ├── utils.test.js    # Vitest tests
    │   ├── pages/           # AuthPage, Dashboard
    │   └── components/      # TaskForm, TaskItem, StatsBar, ProjectSidebar
    ├── package.json
    └── vite.config.js       # dev proxy: /api -> http://localhost:8000
```

## Run it

### 1. Backend (terminal 1)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed.py                       # optional: demo@taskflow.dev / password123
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend (terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 (click **Use demo account** on the login page if you ran `seed.py`).

## Tests and lint

From the repository root, or from `taskflow/`:

```bash
make test            # backend (pytest) and frontend (vitest)
make test-backend    # pytest -q in backend/
make test-frontend   # npm test in frontend/
make lint            # ruff check in backend/
```

The same commands are available as npm scripts inside `taskflow/`:

```bash
cd taskflow
npm test
npm run test:backend
npm run test:frontend
```

Backend tests use `backend/.venv` when that virtualenv exists, otherwise `python3`. Create it once before the first run:

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cd ../frontend && npm install
```

## API overview

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/auth/register` | JSON `{email, full_name, password}` (password ≥ 8 chars) |
| POST | `/api/auth/login` | form-encoded `username` (email) + `password` → `{access_token}` |
| GET | `/api/auth/me` | current user |
| GET/POST | `/api/projects` | list / create |
| PATCH/DELETE | `/api/projects/{id}` | deleting a project unassigns its tasks |
| GET | `/api/tasks` | filters: `status`, `priority`, `project_id`, `search`, `overdue` |
| GET | `/api/tasks/stats` | counts, overdue, completion rate |
| POST | `/api/tasks` | create |
| GET/PATCH/DELETE | `/api/tasks/{id}` | read / partial update / delete |

Task ordering: unfinished before done, then high → low priority, then earliest due date.

## Configuration (environment variables)

| Variable | Default |
| --- | --- |
| `SECRET_KEY` | dev-only value — **change outside local dev** |
| `DATABASE_URL` | `sqlite:///./taskflow.db` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
| `CORS_ORIGINS` | `http://localhost:5173` |

## Using it with a PR-review / bug-fixing agent

- Small, layered codebase (routers → dependencies → models) with real authorization checks, so reviewers have meaningful logic to reason about (ownership checks, partial updates, null handling, date logic).
- Both sides have automated tests, so a bug-fix agent can validate its changes: `make test-backend` (pytest) and `make test-frontend` (`npm test`). `make test` runs both.
- Good places to inject bugs or make PRs against: `routers/tasks.py` (filters, sorting, stats), `security.py` (token handling), `utils.js` (`isOverdue`, `nextStatus`), `Dashboard.jsx` (refresh / debounce logic).
- Tip: introduce a bug on a branch, confirm a test fails, then let the agent fix it.
