# ArenaKit Tournament Setup Demo

Static demo for esports organisers: event landing page, configurable registration link, and sample leaderboard.

## Run locally
Open `index.html` in a browser, or run `python -m http.server 8000` and visit `http://localhost:8000`.

## Configure for a real organiser
1. Create a Google Form owned by the organiser and link responses to an organiser-owned Google Sheet.
2. Set `registrationUrl` in `assets/config.js` to the public form URL.
3. Replace fictional event details in `index.html` and fictional rows in `assets/leaderboard.js` with verified results.
4. Test form submission, Sheet response, mobile layout, and results before launch.
5. Keep demo labels until all sample content is replaced and the organiser approves the page.

## Limitations
- Static demo only; no database, admin login, or multi-user SaaS backend.
- Registration data goes to the configured external form, not this site.
- Leaderboard is hard-coded and does not sync live with Google Sheets.
- Never put passwords, private room IDs, player phone numbers, or API keys in public files.
- No entry fees or prize money are handled by this demo.

## Hosting
Can be hosted on GitHub Pages or Netlify. Hosting must be enabled in the repository/account. Verify the live URL after deployment.