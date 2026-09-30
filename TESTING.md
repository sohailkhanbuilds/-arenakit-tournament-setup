# Manual smoke-test checklist

## Public pages
- [ ] Open `index.html` on mobile and desktop; check navigation and contact links.
- [ ] Open `events.html`; three sample event cards should appear.
- [ ] Open each event card; the event name, format, details and rules should match the selected sample.
- [ ] Click the registration button while no form URL is configured; a clear demo notice should appear.
- [ ] Open the leaderboard from each event; sample standings should render.
- [ ] Check horizontal scrolling of the leaderboard table on a narrow screen.

## Organizer workspace prototype
- [ ] Open `organizer.html`; create an event with required fields.
- [ ] Confirm it appears in the list and remains after refreshing the same browser.
- [ ] Remove one event; confirm the other event remains.
- [ ] Use “Clear local demo”; confirm the list empties.

## Before a real client event
- [ ] Replace all sample content in `assets/config.js`.
- [ ] Add and test the real registration form URL.
- [ ] Confirm organiser owns the registration form and participant sheet.
- [ ] Confirm leaderboard scoring rules with organiser and replace fictional scores.
- [ ] Test all links on mobile.
- [ ] Do not collect payments or sensitive data through this static demo.

Automated browser/end-to-end tests have not been run by this repository update. The organizer workspace is local browser storage only; it is not a shared database.
