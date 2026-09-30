(() => {
  const API = (window.ARENAKIT_CONFIG || {}).apiBase || "https://arenakit-api.onrender.com";
  const qs = new URLSearchParams(location.search);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const date = v => v ? esc(v) : "Date to be announced";
  async function request(path, options={}) {
    const headers = {"Content-Type":"application/json", ...(options.headers || {})};
    const token = localStorage.getItem("arenakit-token");
    if (token) headers.Authorization = "Bearer " + token;
    const res = await fetch(API + path, {...options, headers});
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed (" + res.status + ")");
    return data;
  }
  const gameClass = game => String(game).toLowerCase().includes("valorant") ? "cover-valorant" : String(game).toLowerCase().includes("free fire") ? "cover-fire" : "cover-bgmi";
  const card = e => `<article class="event-card"><div class="event-cover ${gameClass(e.game)}"><span class="game-chip">${esc(e.game)}</span><span class="cover-mark">AK<span>⚡</span></span><span class="cover-status">${e.registration_open ? "REGISTRATION OPEN" : "CLOSED"}</span></div><div class="event-card-body"><div class="event-meta"><span>◈ ${esc(e.format)}</span><span>◷ ${esc(e.location)}</span></div><h2>${esc(e.name)}</h2><p>${esc(e.description || "Tournament hosted on ArenaKit.")}</p><div class="event-card-footer"><span class="demo-label">${esc(e.registration_count || 0)} registered · ${esc(e.slots)} slots</span><a class="text-link" href="tournament.html?id=${e.id}">View tournament →</a></div></div></article>`;
  function showError(root, err) { root.innerHTML = `<div class="notice notice-warn"><b>Could not load data</b><span>${esc(err.message)}. Please refresh in a moment.</span></div>`; }
  if (document.body.dataset.page === "events") {
    const root = document.getElementById("event-grid");
    if (root) request("/api/tournaments").then(items => {
      root.innerHTML = items.length ? items.map(card).join("") : '<div class="empty-state">No live tournaments yet. Organisers can sign in to create the first event.</div>';
      const notice = document.querySelector(".page-intro p");
      if (notice) notice.textContent = "Live tournaments published by ArenaKit organisers. Open an event to see details and register your team.";
      const n = document.querySelector(".notice"); if (n) n.remove();
    }).catch(err => showError(root, err));
  }
  if (document.body.dataset.page === "tournament") {
    const root = document.getElementById("tournament-detail");
    const id = Number(qs.get("id"));
    if (!root) return;
    if (!Number.isInteger(id) || id < 1) { root.innerHTML = '<div class="empty-state">Tournament ID missing. Open a tournament from the events page.</div>'; return; }
    request("/api/tournaments/" + id).then(e => {
      root.innerHTML = `<section class="tournament-hero"><div class="tournament-banner ${gameClass(e.game)}"><span class="game-chip">${esc(e.game)}</span><span class="cover-mark cover-mark-large">AK<span>⚡</span></span><span class="demo-ribbon">${e.registration_open ? "REGISTRATION OPEN" : "REGISTRATION CLOSED"}</span></div><div class="tournament-heading"><div class="eyebrow">${esc(e.location)} · ${esc(e.registration_count)} registered</div><h1>${esc(e.name)}</h1><p>${esc(e.description || "")}</p><div class="hero-actions"><a class="btn btn-ghost" href="leaderboard.html?id=${e.id}">View leaderboard →</a></div></div></section><div class="detail-grid"><section class="panel"><div class="eyebrow">TOURNAMENT INFORMATION</div><h2>Event details</h2><div class="detail-list"><div><span>Game</span><b>${esc(e.game)}</b></div><div><span>Format</span><b>${esc(e.format)}</b></div><div><span>Date</span><b>${date(e.event_date)}</b></div><div><span>Slots</span><b>${esc(e.slots)}</b></div><div><span>Prize</span><b>${esc(e.prize)}</b></div><div><span>Rules</span><b>${esc(e.rules || "See organiser instructions")}</b></div></div></section><section class="panel"><div class="eyebrow">JOIN THE EVENT</div><h2>Register your team</h2>${e.registration_open ? `<form id="registration-form" class="form-stack"><label>Team name<input name="team_name" required maxlength="100"></label><label>Captain name<input name="captain_name" required maxlength="100"></label><label>Email<input name="email" type="email" required></label><label>Contact number<input name="contact" maxlength="40"></label><label>Player IDs / roster<textarea name="player_ids" rows="3" placeholder="Enter player IDs, separated by commas"></textarea></label><button class="btn btn-primary btn-full" type="submit">Submit registration</button><p id="registration-message" class="fine-print" role="status"></p></form>` : '<p>Registration is currently closed by the organiser.</p>'}</section></div>`;
      const form = document.getElementById("registration-form");
      if (form) form.addEventListener("submit", async ev => {
        ev.preventDefault(); const button = form.querySelector("button"); const msg = document.getElementById("registration-message"); button.disabled = true; msg.textContent = "Submitting…";
        const body = Object.fromEntries(new FormData(form).entries());
        try { await request("/api/tournaments/" + id + "/registrations", {method:"POST", body:JSON.stringify(body)}); form.innerHTML = '<div class="notice"><b>Registration received</b><span>Your team details have been submitted. Contact the organiser for further instructions.</span></div>'; }
        catch(err) { msg.textContent = err.message; button.disabled = false; }
      });
    }).catch(err => showError(root, err));
  }
  if (document.body.dataset.page === "organizer") initOrganizer(request, esc);
  async function initOrganizer(api, escape) {
    const auth = document.getElementById("auth-panel"), dashboard = document.getElementById("dashboard-panel"), msg = document.getElementById("auth-message");
    const form = document.getElementById("auth-form"), eventForm = document.getElementById("event-form"), list = document.getElementById("managed-events");
    const token = localStorage.getItem("arenakit-token");
    function message(el, text) { if (el) el.textContent = text; }
    function signedIn() { auth.hidden = true; dashboard.hidden = false; loadEvents(); }
    async function loadEvents() {
      try {
        const events = await api("/api/organizer/tournaments");
        document.getElementById("event-count").textContent = events.length + " event" + (events.length === 1 ? "" : "s");
        list.innerHTML = events.length ? events.map(e => `<article class="managed-event"><div><span class="demo-label">${escape(e.game)} · ${escape(e.format)}</span><h3>${escape(e.name)}</h3><p>${escape(e.event_date || "Date not set")} · ${escape(e.registration_count)} registrations / ${escape(e.slots)} slots</p><p><a class="text-link" href="tournament.html?id=${e.id}" target="_blank">Public page ↗</a></p><button class="btn btn-small btn-ghost" data-registrations="${e.id}" type="button">View registrations</button><div id="regs-${e.id}"></div></div><button class="btn btn-small btn-ghost" data-close="${e.id}" data-open="${!e.registration_open}" type="button">${e.registration_open ? "Close registration" : "Open registration"}</button></article>`).join("") : '<div class="empty-state">No tournaments yet. Create your first event using the form.</div>';
      } catch(err) { list.innerHTML = '<div class="notice notice-warn">' + escape(err.message) + '</div>'; }
    }
    if (!auth || !dashboard) return;
    if (token) { try { await api("/api/me"); signedIn(); } catch { localStorage.removeItem("arenakit-token"); } }
    form.addEventListener("submit", async ev => {
      ev.preventDefault(); const data = Object.fromEntries(new FormData(form).entries()); const action = data.action; delete data.action;
      try { const result = await api("/api/auth/" + action, {method:"POST", body:JSON.stringify(data)}); localStorage.setItem("arenakit-token", result.token); message(msg, ""); signedIn(); }
      catch(err) { message(msg, err.message); }
    });
    eventForm.addEventListener("submit", async ev => {
      ev.preventDefault(); const data = Object.fromEntries(new FormData(eventForm).entries()); data.slots = Number(data.slots);
      try { await api("/api/tournaments", {method:"POST", body:JSON.stringify(data)}); eventForm.reset(); message(document.getElementById("create-message"), "Tournament created and published."); loadEvents(); }
      catch(err) { message(document.getElementById("create-message"), err.message); }
    });
    document.getElementById("logout-button").addEventListener("click", () => { localStorage.removeItem("arenakit-token"); location.reload(); });
    list.addEventListener("click", async ev => {
      const regs = ev.target.closest("[data-registrations]"), toggle = ev.target.closest("[data-close]");
      try {
        if (toggle) { await api("/api/organizer/tournaments/" + toggle.dataset.close, {method:"PATCH", body:JSON.stringify({registration_open:toggle.dataset.open === "true"})}); loadEvents(); }
        if (regs) {
          const id = regs.dataset.registrations, holder = document.getElementById("regs-" + id);
          const rows = await api("/api/organizer/tournaments/" + id + "/registrations");
          holder.innerHTML = rows.length ? rows.map(r => `<div class="managed-event"><div><b>${escape(r.team_name)}</b><p>${escape(r.captain_name)} · ${escape(r.email)} · ${escape(r.contact)}</p><span class="muted small">Status: ${escape(r.status)}</span></div><select data-status="${r.id}" aria-label="Registration status"><option ${r.status==="pending"?"selected":""}>pending</option><option ${r.status==="approved"?"selected":""}>approved</option><option ${r.status==="rejected"?"selected":""}>rejected</option><option ${r.status==="waitlisted"?"selected":""}>waitlisted</option></select></div>`).join("") : '<p>No registrations yet.</p>';
        }
        const select = ev.target.closest("[data-status]");
        if (select) { await api("/api/organizer/registrations/" + select.dataset.status, {method:"PATCH", body:JSON.stringify({status:select.value})}); }
      } catch(err) { alert(err.message); }
    });
  }
})();