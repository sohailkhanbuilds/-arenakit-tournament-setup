# ArenaKit — tournament setup toolkit

ArenaKit is a static GitHub Pages MVP for an esports tournament setup service. It includes a sales landing page, multiple sample event pages, per-event sample leaderboards, and a local organizer workspace prototype.

## Pages
- `index.html` — service landing page and intro offer
- `events.html` — event demo gallery
- `tournament.html?event=drop-zone-showdown` — reusable event template
- `leaderboard.html?event=drop-zone-showdown` — per-event sample leaderboard
- `organizer.html` — browser-local workspace prototype

## Configure an event
Edit `assets/config.js`. Add an object to `events` with a unique `id`, event details, rules, a real `registrationUrl` (for example a Google Form URL), `leaderboardUrl`, and scores. Then share the matching URL:
- `/tournament.html?event=YOUR-EVENT-ID`
- `/leaderboard.html?event=YOUR-EVENT-ID`

Before sharing with players, replace sample names, dates, rules, prize details and scores. Do not imply that demo events are real.

## Deploy with GitHub Pages
Repository Settings → Pages → Build and deployment → Source: **Deploy from a branch** → Branch: `main` → Folder: `/(root)` → Save. This project is plain HTML/CSS/JavaScript and does not need a build step.

## Important MVP limitations
This repository is a **static front-end prototype**, not a complete multi-tenant SaaS. The organizer workspace saves data only in the current browser's localStorage. It has no login, shared database, server-side registration storage, permissions, live Google Sheets sync, payment processing or automatic result ingestion. A Google Form link can collect entries in the organiser's own form; connect and test it before the event. To provide real multi-client accounts and private data, add a backend/database or a properly secured Google Apps Script integration before using it as a production system.

## Intro offer displayed
₹2,500 per event setup is an introductory service offer, not a guarantee of revenue. Scope and any third-party costs should be agreed with each organiser first.
