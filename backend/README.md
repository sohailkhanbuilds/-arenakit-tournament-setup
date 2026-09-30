# ArenaKit API — multi-organiser MVP

## Database: local now, replaceable later

The backend uses **SQLite locally by default**. It creates its own database file inside Flask's instance directory (normally `backend/instance/arenakit-dev.db` when launched with the documented command). The database file is intentionally excluded from Git: each developer keeps their own local data.

- Local development: leave `DATABASE_URL` unset or empty.
- Hosted production: set `DATABASE_URL` to a persistent PostgreSQL connection URL.
- To switch databases later, change the `DATABASE_URL` environment variable only; the app automatically uses PostgreSQL when that variable is set. Existing SQLite data is **not automatically copied** into PostgreSQL.

### Local setup (Windows PowerShell)

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
$env:JWT_SECRET = "replace-this-with-a-long-random-local-secret"
$env:DATABASE_URL = ""
python -m flask --app backend.app run --debug
```

Open `http://127.0.0.1:5000/health`. Expected response: `{"database":"connected","status":"ok"}`.

### Switch to PostgreSQL later

Set this in the hosting provider's environment settings (never commit credentials):

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=<a-long-random-secret-generated-by-your-host>
```

The app accepts Render's `postgres://` and `postgresql://` URL formats and adapts them to psycopg 3. Use the database's **internal** URL when the API is hosted in the same Render region. For local development against a remote DB, use the provider's external URL and keep it private. The switch changes where new data is stored; it does not migrate old SQLite records.

## Endpoints

- `GET /`, `GET /health`
- `POST /api/auth/register` JSON: `{"name":"Organizer","email":"you@example.com","password":"at-least-10-chars"}`
- `POST /api/auth/login` JSON: `{"email":"you@example.com","password":"..."}`
- `GET /api/me` (Bearer token)
- `GET /api/tournaments` public list of open tournaments
- `POST /api/tournaments` (Bearer token) create tournament
- `GET /api/organizer/tournaments` (Bearer token) list only the current organiser's tournaments
- `GET/PATCH/DELETE /api/organizer/tournaments/:id` (Bearer token; owner-only)
- `GET /api/tournaments/:id` public details
- `POST /api/tournaments/:id/registrations` public registration
- `GET /api/organizer/tournaments/:id/registrations` (Bearer token; owner-only)
- `PATCH /api/organizer/registrations/:id` (Bearer token; owner-only status updates)
- `POST /api/organizer/tournaments/:id/matches` (Bearer token; create match)
- `PUT /api/organizer/matches/:id/results` (Bearer token; save scores)
- `GET /api/tournaments/:id/leaderboard` public computed leaderboard

## Environment variables

- `DATABASE_URL`: optional locally (SQLite fallback); required for persistent hosted data.
- `JWT_SECRET`: long random secret, required for account registration and authentication.
- `TOKEN_HOURS`: token lifetime; default 72.
- `CORS_ORIGINS`: comma-separated origin allow-list is recommended for production; default * for initial API MVP.

## Deploy on Render

Build command: `pip install -r backend/requirements.txt`

Start command: `gunicorn --chdir backend --workers 2 --threads 4 --timeout 120 -b 0.0.0.0:$PORT app:app`

Health check path: `/health`

For a temporary smoke-test deployment without PostgreSQL, leave `DATABASE_URL` unset and set `JWT_SECRET`. **Do not use SQLite on Render for real tournament data**: the filesystem can be ephemeral and data may be lost on redeploy/restart. Before real users register, connect a persistent PostgreSQL database and set `DATABASE_URL`.

## Data isolation

Every organiser-owned tournament is filtered by the authenticated user's ID. Registration and match-result mutations check the parent tournament's owner before exposing or changing private records. Public routes expose event details, registration creation and leaderboard totals.

## Current scope / production checklist

This is a functional API MVP, not yet a finished consumer-facing SaaS. The existing static frontend has not yet been wired to these API endpoints. Before accepting real public traffic, add rate limiting/anti-spam, email verification and password reset, stronger audit logging, database migrations/backups, and end-to-end tests. Public registration collects contact details; publish a privacy notice and define retention before collecting real player data.
