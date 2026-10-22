/* ===== player / parent page: one player's own stats ===== */
const PKEY='owenmore-gaels-player-code';
const st={get(){try{return localStorage.getItem(PKEY)||''}catch(e){return ''}},set(v){try{v?localStorage.setItem(PKEY,v):localStorage.removeItem(PKEY)}catch(e){}}};
let err='';
const app=document.getElementById('app');
const clean=c=>String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
function pitchSVG(code,arc,shots){
  const D=OG.footy(code)?55:70,Sx=4,w=320,h=D*Sx,X=m=>m*Sx;
  let s=`<svg class="pitch" viewBox="0 0 ${w} ${h}" role="img" aria-label="Your shots, attacking goal at the top"><rect class="grass" x="0" y="0" width="${w}" height="${h}"/>`;
  s+=`<rect class="ln" x="${X(30.5)}" y="0" width="${X(19)}" height="${X(13)}"/><rect class="ln" x="${X(33)}" y="0" width="${X(14)}" height="${X(4.5)}"/><path class="ln" d="M${X(27)} ${X(20)} A${X(13)} ${X(13)} 0 0 0 ${X(53)} ${X(20)}"/>`;
  for(const m of[13,20,45,65])if(m<D)s+=`<line class="ln" x1="0" y1="${X(m)}" x2="${w}" y2="${X(m)}"/><text class="lbl" x="${w-4}" y="${X(m)-4}" text-anchor="end">${m}m</text>`;
  if(OG.footy(code)&&arc)s+=`<path class="arc" d="M0 0 A${X(40)} ${X(40)} 0 0 0 ${w} 0"/>`;
  s+=`<line class="post" x1="${X(36.75)}" y1="2" x2="${X(43.25)}" y2="2"/>`;
  for(const e of shots)s+=`<circle class="${e.type==='goal'?'dot-g':e.type==='two'?'dot-2':e.type==='point'?'dot-s':'dot-m'}" cx="${e.lx*Sx}" cy="${e.ly*Sx}" r="${e.type==='goal'?7:5.5}"/>`;
  return s+'</svg>';
}
function joinRow(s){return `<div class="row">${s&&s.joinUrl?`<a class="btn amb" href="${esc(s.joinUrl)}" target="_blank" rel="noopener">Join / Renew on Foireann ↗</a>`:''}${s&&s.lottoUrl?`<a class="btn" href="${esc(s.lottoUrl)}" target="_blank" rel="noopener">Club lotto ↗</a>`:''}</div>`}
function vCode(){
  const S=loadDemo();
  app.innerHTML=`<section class="panel"><h2>My stats</h2>
    <p class="legend">Each player (or their parent) opens this page with a private code from the coach and sees only their own stats. For minors, nothing here is public.</p>
    <label class="code">Player code<input id="code" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC123"></label>
    ${err?`<p class="err" role="alert">${esc(err)}</p>`:''}
    <div class="row"><button class="btn pri" id="go">Show my stats</button></div></section>
  <section class="panel"><h3>Demo: pick a player</h3><p class="legend">Picking a player here stands in for logging in with their code.</p></section>
  ${S.teams.map(t=>`<section class="panel"><div class="ph"><h3>${esc(t.name)}</h3><span class="chip">${OG.TIERS[OG.tierOf(t)]}</span></div><div class="pickgrid">${t.players.map(p=>`<button class="pick" data-code="${esc(p.code)}"><b>${p.num}</b><span>${esc(p.name)}</span></button>`).join('')}</div></section>`).join('')}`;
  const i=document.getElementById('code');
  document.getElementById('go').onclick=()=>look(i.value);
  i.onkeydown=e=>{if(e.key==='Enter')look(i.value)};
  app.querySelectorAll('[data-code]').forEach(b=>b.onclick=()=>look(b.dataset.code));
}
function look(code){
  code=clean(code);if(code.length!==6){err='Codes are 6 letters and numbers.';vCode();return}
  const j=demoPlayer(loadDemo(),code);
  if(!j){err='That code doesn’t match a player. Check it with your coach.';st.set('');vCode();return}
  err='';st.set(code);try{history.replaceState(null,'','?code='+code)}catch(e){}show(j);window.scrollTo(0,0);
}
function show(d){
  document.getElementById('club').textContent=d.club;document.title='My '+d.club+' Stats';
  const t=d.total,F=OG.footy(d.code),s45=OG.set45(d.code),arc=F&&d.arc,gg=d.tier==='gogames';
  const shotsTaken=OG.SHOTS.reduce((a,k)=>a+t[k],0),scoresN=t.goal+t.point+t.two;
  const line=g=>{const l=g.line,ps=[];
    ps.push(`<span class="pill">${g.mins} min${g.started?'':' (sub)'}</span>`);
    if(!gg){if(l.goal||l.point||l.two)ps.push(`<span class="pill s">${l.scoreG}-${pad(l.scoreP)}</span>`);
      const add=(n,lab,cls)=>{if(n)ps.push(`<span class="pill ${cls||''}">${n} ${lab}</span>`)};
      add(l.wide,l.wide===1?'wide':'wides');add(l.short,'short');add(l.saved,'saved');add(l.t45,s45+(l.t45===1?'':'s')+' taken');add(l.tow,'TO won');add(l.tol,'TO lost');
      add(l.fwon,'frees won');add(l.fcon,'frees given');add(l.save,l.save===1?'save':'saves');add(l.yellow,'yellow','y');add(l.black,'black');add(l.red,'red','rd')}
    return ps.join('')};
  app.innerHTML=`<div class="banner"><b>Demo.</b> Real 2026 results; the player and their stats are invented examples.</div>
  <section class="hero">
    <div class="who"><div class="num">${esc(d.player.num)}</div><div><b>${esc(d.player.name||'Player')}</b><span>${esc(d.squad)}</span></div></div>
    ${gg?`<div class="season"><b>${d.apps}</b><span>${d.apps===1?'match':'matches'} · ${d.mins} minutes played</span></div>`:`<div class="season"><b>${t.scoreG}-${pad(t.scoreP)}</b><span>season total · ${t.pts} pts</span></div>`}
  </section>
  <section class="panel"><div class="kpis">
    <div class="kpi hi"><b>${d.apps}</b><span>Appearances</span></div>
    <div class="kpi"><b>${d.mins}</b><span>Minutes played</span></div>
    ${gg?'':`<div class="kpi am"><b>${shotsTaken?Math.round(scoresN*100/shotsTaken)+'%':'–'}</b><span>Shots scored (${scoresN}/${shotsTaken})</span></div>
    ${arc?`<div class="kpi"><b>${t.two}/${t.twoAtt}</b><span>2-pointers scored/tried</span></div>`:''}
    <div class="kpi"><b>${t.s45}/${t.t45}</b><span>${s45}s scored/taken</span></div>
    <div class="kpi"><b>${t.fromFree}</b><span>Scores from frees</span></div>
    <div class="kpi"><b>${t.tow}–${t.tol}</b><span>Turnovers won–lost</span></div>
    <div class="kpi"><b>${t.fwon}–${t.fcon}</b><span>Frees won–given</span></div>
    ${t.save?`<div class="kpi"><b>${t.save}</b><span>Saves</span></div>`:''}
    <div class="kpi"><b>${t.yellow}/${d.code==='football'?t.black+'/':''}${t.red}</b><span>Cards Y/${d.code==='football'?'B/':''}R</span></div>`}
  </div>${gg?'<p class="legend">Go Games are non-competitive, so no scores are recorded. Every child gets game time.</p>':''}</section>
  ${!gg&&d.shots.length?`<section class="panel"><h3>My shot map</h3><div class="pitchbox">${pitchSVG(d.code,arc,d.shots)}</div>
    <div class="pkey"><span><i class="g"></i>Goal</span><span><i class="s"></i>Point</span>${arc?'<span><i class="two"></i>2-pointer</span>':''}<span><i class="m"></i>Missed</span></div></section>`:''}
  ${d.leaderboard?`<section class="panel"><h3>Team leaderboard</h3><div class="tw"><table><thead><tr><th>Player</th><th>Apps</th><th>Mins</th><th>Score</th></tr></thead><tbody>
    ${d.leaderboard.sort((a,b)=>b.pts-a.pts||b.mins-a.mins).map(r=>`<tr class="${r.me?'meRow':''}"><td>#${r.num} ${esc(r.name)}</td><td>${r.apps}</td><td>${r.mins}</td><td>${r.g}-${pad(r.p)}</td></tr>`).join('')}</tbody></table></div>
    <p class="legend">The coach chooses whether players can see the team leaderboard.</p></section>`:''}
  <section class="panel"><h3>Match by match</h3>
    ${d.matches.length?d.matches.map(g=>{const k=g.result?(g.result.us.t>g.result.them.t?'W':g.result.us.t<g.result.them.t?'L':'D'):null;
      return `<div class="game"><div class="o"><b>v ${esc(g.opp)}</b><span>${new Date(g.date+'T12:00').toLocaleDateString('en-IE',{weekday:'short',day:'numeric',month:'short'})}${g.comp?' · '+esc(g.comp):''}</span></div>
      <div class="r">${g.result?`${OG.fmt(g.result.us)} – ${OG.fmt(g.result.them)}<span class="w-${k}">${g.final?(k==='W'?'Won':k==='L'?'Lost':'Draw'):'In progress'}</span>`:'<span>Go Games</span>'}</div><div class="line">${line(g)}</div></div>`}).join(''):'<p class="empty">No matches yet.</p>'}
  </section>
  <section class="panel joinbox"><h3>Membership</h3><p class="legend">Club membership is on Foireann.</p>${joinRow(d.settings)}</section>
  <div class="row"><button class="btn" id="out">Not you? Use a different code</button></div>`;
  document.getElementById('out').onclick=()=>{st.set('');err='';try{history.replaceState(null,'',location.pathname)}catch(e){}vCode()};
}
document.getElementById('badge').innerHTML=`<img src="${OWN_BADGE}" alt="">`;
const q=clean(new URLSearchParams(location.search).get('code'));
const saved=q||st.get();
if(saved)look(saved);else vCode();
try{if('serviceWorker' in navigator&&location.protocol==='https:'&&window.top===window.self)navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}
