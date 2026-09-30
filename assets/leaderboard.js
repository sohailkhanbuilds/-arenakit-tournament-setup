(() => {
 const API=(window.ARENAKIT_CONFIG||{}).apiBase||"https://arenakit-api.onrender.com";
 const id=Number(new URLSearchParams(location.search).get("id"));
 const root=document.getElementById("leaderboard-root");
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 if(!root)return;
 if(!Number.isInteger(id)||id<1){root.innerHTML='<div class="empty-state">Open a tournament first, then choose its leaderboard.</div>';return;}
 fetch(API+"/api/tournaments/"+id+"/leaderboard").then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load leaderboard");return d;}).then(d=>{
 const rows=d.standings||[];
 root.innerHTML=`<div class="page-intro"><div class="eyebrow">LIVE RESULTS · ${esc(d.tournament.game)}</div><h1>${esc(d.tournament.name)}<br><span class="gradient-text">Leaderboard.</span></h1><p>Standings are calculated from match results entered by the tournament organiser.</p></div><section class="panel leaderboard-panel"><div class="leaderboard-top"><div><span class="eyebrow">STANDINGS</span><h2>Team rankings</h2></div><a class="btn btn-ghost btn-small" href="tournament.html?id=${id}">Event details ↗</a></div><div class="table-scroll"><table class="leaderboard-table"><thead><tr><th>RANK</th><th>TEAM</th><th>MATCHES</th><th>PLACEMENT PTS</th><th>KILLS</th><th>TOTAL</th></tr></thead><tbody>${rows.length?rows.map((r,i)=>`<tr><td><span class="rank rank-${i+1}">${String(i+1).padStart(2,"0")}</span></td><td><b>${esc(r.team)}</b></td><td>${r.matches}</td><td>${r.placement_points}</td><td>${r.kills}</td><td><b>${r.total}</b></td></tr>`).join(""):'<tr><td colspan="6">No match scores entered yet.</td></tr>'}</tbody></table></div><p class="fine-print">${esc(d.scoring)}</p></section>`;
 }).catch(e=>root.innerHTML='<div class="notice notice-warn"><b>Could not load leaderboard</b><span>'+esc(e.message)+'</span></div>');
})();