# ArenaKit API — real multi-organiser MVP

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
- `DATABASE_URL`: PostgreSQL connection URL. Local development falls back to SQLite.
- `JWT_SECRET`: long random secret, required for account registration and authentication.
- `TOKEN_HOURS`: token lifetime; default 72.
- `CORS_ORIGINS`: comma-separated origin allow-list is recommended for production; default * for initial API MVP.

## Deploy on Render
Build command: `pip install -r backend/requirements.txt`
Start command: `gunicorn --chdir backend --workers 2 --threads 4 --timeout 120 -b 0.0.0.0:$PORT app:app`
Health check path: `/health`

Set `DATABASE_URL` to the database's **internal** connection URL and `JWT_SECRET` to a strong random secret in Render environment settings. Do not commit secrets.

## Data isolation
Every organiser-owned tournament is filtered by the authenticated user's ID. Registration and match-result mutations check the parent tournament's owner before exposing or changing private records. Public routes expose only event details, registration creation and leaderboard totals.

## Current scope / production checklist
This is a functional API MVP, not yet a finished consumer-facing SaaS. The existing static frontend has not yet been wired to these API endpoints. Before accepting real public traffic, add rate limiting/anti-spam, email verification and password reset, stronger audit logging, database migrations/backups, and end-to-end tests. Public registration collects contact details; publish a privacy notice and define retention before collecting real player data.
