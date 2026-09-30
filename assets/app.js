(() => {
  const config = window.ARENAKIT_CONFIG || { events: [] };
  const events = config.events || [];
  const qs = new URLSearchParams(location.search);
  const byId = id => events.find(event => event.id === id);
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
  const eventCard = event => `<article class="event-card"><div class="event-cover ${event.game === "Valorant" ? "cover-valorant" : event.game.includes("Free Fire") ? "cover-fire" : "cover-bgmi"}"><span class="game-chip">${escapeHtml(event.game)}</span><span class="cover-mark">AK<span>⚡</span></span><span class="cover-status">SAMPLE</span></div><div class="event-card-body"><div class="event-meta"><span>◈ ${escapeHtml(event.format)}</span><span>◷ ${escapeHtml(event.location)}</span></div><h2>${escapeHtml(event.name)}</h2><p>${escapeHtml(event.description)}</p><div class="event-card-footer"><span class="demo-label">DEMO TEMPLATE</span><a class="text-link" href="tournament.html?event=${encodeURIComponent(event.id)}">View event →</a></div></div></article>`;
  if (document.body.dataset.page === "events") {
    const grid = document.getElementById("event-grid");
    if (grid) grid.innerHTML = events.map(eventCard).join("");
  }
  if (document.body.dataset.page === "tournament") {
    const event = byId(qs.get("event")) || events[0];
    const root = document.getElementById("tournament-detail");
    if (!event || !root) return;
    const registration = event.registrationUrl
      ? `<a class="btn btn-primary" href="${escapeHtml(event.registrationUrl)}" target="_blank" rel="noopener">Register your team ↗</a>`
      : `<button class="btn btn-primary" id="register-demo" type="button">Registration not connected</button>`;
    root.innerHTML = `<section class="tournament-hero"><div class="tournament-banner ${event.game === "Valorant" ? "cover-valorant" : event.game.includes("Free Fire") ? "cover-fire" : "cover-bgmi"}"><span class="game-chip">${escapeHtml(event.game)}</span><span class="cover-mark cover-mark-large">AK<span>⚡</span></span><span class="demo-ribbon">SAMPLE TEMPLATE</span></div><div class="tournament-heading"><div class="eyebrow">${escapeHtml(event.status)} · ${escapeHtml(event.location)}</div><h1>${escapeHtml(event.name)}</h1><p>${escapeHtml(event.description)}</p><div class="hero-actions">${registration}<a class="btn btn-ghost" href="${escapeHtml(event.leaderboardUrl)}">View leaderboard →</a></div></div></section><div class="detail-grid"><section class="panel"><div class="eyebrow">EVENT INFORMATION</div><h2>Event details</h2><div class="detail-list"><div><span>Game</span><b>${escapeHtml(event.game)}</b></div><div><span>Format</span><b>${escapeHtml(event.format)}</b></div><div><span>Date</span><b>${escapeHtml(event.date)}</b></div><div><span>Team / player slots</span><b>${escapeHtml(event.slots)}</b></div><div><span>Prize</span><b>${escapeHtml(event.prize)}</b></div></div></section><section class="panel"><div class="eyebrow">BEFORE YOU PLAY</div><h2>Rules & notes</h2><ol class="rules-list">${(event.rules || []).map(rule => `<li>${escapeHtml(rule)}</li>`).join("")}</ol></section></div><div class="notice"><b>Demo template — not a live event</b><span>This page contains sample details. The organiser must configure the actual date, rules, prize information and registration link before sharing this page publicly.</span></div>`;
    const button = document.getElementById("register-demo");
    if (button) button.addEventListener("click", () => alert("This demo has no registration form connected yet. The organiser must add their Google Form URL in assets/config.js."));
  }
  if (document.body.dataset.page === "organizer") {
    const storageKey = "arenakit-local-events-v1";
    const form = document.getElementById("event-form");
    const list = document.getElementById("managed-events");
    const count = document.getElementById("event-count");
    let managed = [];
    try { managed = JSON.parse(localStorage.getItem(storageKey) || "[]"); if (!Array.isArray(managed)) managed = []; } catch { managed = []; }
    const render = () => {
      count.textContent = `${managed.length} event${managed.length === 1 ? "" : "s"}`;
      list.innerHTML = managed.length ? managed.map((event, index) => `<article class="managed-event"><div><span class="demo-label">${escapeHtml(event.game)} · ${escapeHtml(event.format)}</span><h3>${escapeHtml(event.name)}</h3><p>${escapeHtml(event.date)} · ${escapeHtml(event.slots)} slots</p>${event.registrationUrl ? `<a class="text-link" href="${escapeHtml(event.registrationUrl)}" target="_blank" rel="noopener">Open registration form ↗</a>` : '<span class="muted small">Registration URL not added</span>'}</div><button class="btn btn-small btn-ghost" data-remove="${index}" type="button">Remove</button></article>`).join("") : '<div class="empty-state">Your events will appear here after you create one.</div>';
    };
    form.addEventListener("submit", event => {
      event.preventDefault();
      const data = new FormData(form);
      const item = { name: data.get("name").trim(), game: data.get("game"), format: data.get("format"), date: data.get("date"), slots: Number(data.get("slots")), registrationUrl: data.get("registrationUrl").trim(), rules: data.get("rules").trim() };
      managed.unshift(item);
      try { localStorage.setItem(storageKey, JSON.stringify(managed)); } catch { alert("Could not save in this browser. Check browser storage settings."); return; }
      form.reset(); render();
    });
    list.addEventListener("click", event => {
      const button = event.target.closest("[data-remove]");
      if (!button) return;
      managed.splice(Number(button.dataset.remove), 1);
      localStorage.setItem(storageKey, JSON.stringify(managed)); render();
    });
    document.getElementById("clear-events").addEventListener("click", () => {
      if (!confirm("Remove all events saved in this browser?")) return;
      managed = []; localStorage.removeItem(storageKey); render();
    });
    render();
  }
})();