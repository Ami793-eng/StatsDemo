/* ========== chart helpers ========== */
const barRow=(label,v,max,shown,cls)=>`<div class="bar"><span class="lab">${label}</span><span class="trk"><i class="${cls||''}" style="width:${max?Math.max(2,Math.round(v*100/max)):0}%"></i></span><span class="v">${shown??v}</span></div>`;
const splitBar=(title,aL,a,bL,b)=>`<div class="split"><div class="hd"><span>${aL} <b>${a}</b></span><span>${title}</span><span><b>${b}</b> ${bL}</span></div><div class="trk"><i style="width:${a+b?a*100/(a+b):50}%"></i><i style="width:${a+b?b*100/(a+b):50}%"></i></div></div>`;
function formChart(games){
  const g=games.slice(-8);if(!g.length)return '<p class="empty">No results yet.</p>';
  const max=Math.max(...g.map(x=>Math.max(x.u.t,x.th.t)),1),W=320,H=150,bw=W/g.length,base=H-30;
  let s=`<svg viewBox="0 0 ${W} ${H}" class="pitch" role="img" aria-label="Points for and against, last ${g.length} matches">`;
  for(const v of[0,.5,1]){const y=base-v*(base-12);s+=`<line x1="0" x2="${W}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`}
  g.forEach((x,i)=>{const cx=i*bw+bw/2,hU=x.u.t/max*(base-12),hT=x.th.t/max*(base-12),w=Math.min(16,bw/3);
    s+=`<rect x="${cx-w-1}" y="${base-hU}" width="${w}" height="${hU}" rx="2" fill="var(--royal)"><title>${esc(fmtS(x.u)+' v '+x.m.opp)}</title></rect>`;
    s+=`<rect x="${cx+1}" y="${base-hT}" width="${w}" height="${hT}" rx="2" fill="var(--amber)"><title>${esc(x.m.opp+' '+fmtS(x.th))}</title></rect>`;
    s+=`<text x="${cx-w/2-1}" y="${base-hU-4}" text-anchor="middle" font-size="10" fill="var(--fg)">${x.u.t}</text><text x="${cx+w/2+1}" y="${base-hT-4}" text-anchor="middle" font-size="10" fill="var(--muted)">${x.th.t}</text>`;
    s+=`<text x="${cx}" y="${H-14}" text-anchor="middle" font-size="10" fill="var(--muted)">${esc(x.m.opp.slice(0,9))}</text><text x="${cx}" y="${H-3}" text-anchor="middle" font-size="10" font-weight="700" fill="${x.k==='W'?'var(--good)':x.k==='L'?'var(--bad)':'var(--amber-text)'}">${x.k}</text>`});
  return s+'</svg><div class="pkey"><span><i style="background:var(--royal);border-radius:3px"></i>Us</span><span><i style="background:var(--amber);border-radius:3px"></i>Opposition</span></div>';
}
const pkey=arc=>`<div class="pkey"><span><i class="g"></i>Goal</span><span><i class="s"></i>Point</span>${arc?'<span><i class="two"></i>2-pointer</span>':''}<span><i class="m"></i>Missed</span></div>`;
const shotDots=(list,t)=>list.filter(x=>hasLoc(x.e)).map(x=>({lx:x.e.lx,ly:x.e.ly,cls:dotCls(x.e.type),t:lbl(x.e.type,x.m.code)+(x.e.src&&x.e.src!=='play'?' ('+srcL(x.e.src,x.m.code)+')':'')+(t&&x.e.pid?' · '+pName(t,x.e.pid):'')+' v '+x.m.opp}));
const halfTag=p=>`<span class="ht ${p===1||p===3?'h1':p===2||p===4?'h2':''}">${esc(OG.perShort(p))}</span>`;
const mapLink=f=>{const g=f.ground||(f.venue==='Home'?HOME_GROUND:'');return `<a href="${OG.mapUrl(g,f.opp)}" target="_blank" rel="noopener">${esc(g||f.opp+' (away)')} ↗</a>`};

/* ========== scorer screen ========== */
function boardHTML(m,t){
  const c=m.clock,us=score(m,'us'),th=score(m,'them'),gg=OG.tierOf(t)==='gogames';
  return `<div class="sb">
      <div class="us">${crestImg(S.club,'big')}<div class="tn">${esc(S.club)}<small>${esc(t.name)}</small></div>${gg?'':`<div class="sc">${fmtS(us)}</div><div class="tot">(${us.t})</div>`}</div>
      <div><div class="halfpill ${c.period===1||c.period===3?'h1':c.period===2||c.period===4?'':'ht0'}">${esc(OG.perShort(c.period))}</div><div id="clk" class="clock${c.running?'':' paused'}">${clockHTML(m)}</div><div id="over" class="over"></div></div>
      <div class="them">${crestImg(m.opp,'big')}<div class="tn">${esc(m.opp)}<small>Opposition</small></div>${gg?'':`<div class="sc">${fmtS(th)}</div><div class="tot">(${th.t})</div>`}</div>
    </div>${gg?'<p class="ggnote">Go Games: no scores are kept. Track minutes and subs only.</p>':''}`;
}
function sbPanel(m,t){
  const sbs=OG.sinbins(m,t).filter(x=>x.left>-30);
  const on=OG.onPitch(m);
  const bloods=m.events.filter(e=>e.type==='sub'&&e.blood&&!m.events.some(r=>r.type==='bloodret'&&r.ref===e.id)&&on.has(e.onId));
  if(!sbs.length&&!bloods.length)return '';
  return `<div class="sbpanel">${sbs.map(x=>`<div class="sbrow"><span class="cardico c-${x.e.type}"></span><span class="who">${esc(x.e.side==='us'?pName(t,x.e.pid)||S.club:m.opp)}</span><b data-sb="${x.e.id}">${x.left>0?mmss(x.left)+' left':'can return'}</b></div>`).join('')}
    ${bloods.map(e=>`<div class="sbrow"><span class="cardico blood"></span><span class="who">Blood sub: ${esc(pName(t,e.onId))} on for ${esc(pName(t,e.pid))}</span>${canScore(m)?`<button class="btn sm" data-act="bloodret" data-id="${e.id}">${esc(OG.first((player(t,e.pid)||{}).name)||'Player')} back on</button>`:''}</div>`).join('')}</div>`;
}
function lastBar(m,t){
  const e=m.events[m.events.length-1];if(!e)return '<div class="lastbar"><span class="muted">Nothing logged yet. Tap a button: it logs at once with the match time.</span></div>';
  return `<div class="lastbar"><span><b>${esc(lbl(e.type,m.code))}</b>${e.side==='them'?' · '+esc(m.opp):e.pid?' · '+esc(pName(t,e.pid)):''} <span class="muted">${isPlaying(e.per)?OG.minOf(e.sec,OG.halfOf(m,e.per)):''}</span></span>
    <span class="row">${e.side==='us'&&PICK_TYPES.includes(e.type)?`<button class="btn sm" data-act="addPlayer" data-id="${e.id}">${e.pid?'Change player':'Add player'}</button>`:''}<button class="btn sm amb" data-act="undo">Undo</button></span></div>`;
}
function vScorer(m){
  const t=team(m.teamId),c=m.clock,two=footy(m.code)&&m.arc,ko=KO(m.code),gg=OG.tierOf(t)==='gogames';const ggPriv=gg&&t.ggScores;
  const runLbl=c.period===0?'Throw-in':c.running?'Time off':'Time on';
  const nextLbl=c.period===0?'Start 1st half':c.period===1?(ui.armed==='next'?'Confirm half time':'Half time'):c.period==='HT'?'Start 2nd half':c.period===2?(ui.armed==='next'?'Confirm full time':'Full time'):c.period===3?(ui.armed==='next'?'Confirm ET half time':'ET half time'):c.period==='ETH'?'Start ET 2nd half':c.period===4?(ui.armed==='next'?'Confirm end of ET':'End extra time'):'';
  let ctrl;
  if(c.period==='FT'||c.period==='AET')ctrl=`<div class="ctrl">${c.period==='FT'&&!gg?`<button class="btn${A('et')}" data-act="et">${ui.armed==='et'?'Confirm extra time':'Extra time'}</button>`:''}<button class="btn run-off${A('finish')}" data-act="finish">${ui.armed==='finish'?'Confirm: finish match':'Finish match'}</button></div>`;
  else ctrl=`<div class="ctrl"><button class="btn ${c.running?'run-on':'run-off'}" data-act="run" ${c.period==='HT'||c.period==='ETH'?'disabled':''}>${runLbl}</button><button class="btn${A('next')}" data-act="next">${nextLbl}</button></div>
    ${isPlaying(c.period)?`<div class="row adj"><button class="btn sm" data-act="adj" data-v="-10">−10s</button><button class="btn sm" data-act="adj" data-v="10">+10s</button><button class="btn sm" data-act="adj" data-v="60">+1 min</button></div>`:''}`;
  const pre=c.period===0?`<section class="panel"><div class="ph"><h3>Starting team</h3><span class="chip ${m.lineup.length===t.onField?'w':'d'}">${m.lineup.length}/${t.onField} picked</span></div>
      <p class="legend">Tap to add or remove. Minutes played are worked out from this and the subs you log.</p>
      <div class="pgrid">${t.players.map(p=>`<button class="pbtn${m.lineup.includes(p.id)?' on':''}" data-act="lineup" data-pid="${p.id}"><b>${p.num}</b><span>${esc(p.name)}</span></button>`).join('')}</div>
      <label class="row muted" style="font-size:13px">Halves of <input type="number" min="1" max="45" value="${m.half}" data-chg="mhalf" style="width:60px" id="m-half"> min</label></section>`:'';
  const col=(side)=>{const sc=score(m,side),name=side==='us'?S.club:m.opp;
    const B=(type,label,cls)=>`<button class="key ${cls||''} k-${type}" data-act="tap" data-side="${side}" data-type="${type}">${label}</button>`;
    return `<div class="scol ${side}"><div class="shead"><span class="cslot">${crestImg(name,'mid')}</span><span class="sname">${esc(name)}</span><span class="sscore">${fmtS(sc)} <small>(${sc.t})</small></span></div>
      <div class="sgrid">${B('goal','Goal','score')}${B('point','Point','score')}${two?B('two','2-Point','score'):''}${B('wide','Wide','miss')}${B('free','Free','set')}${B('card','Card','cardk')}
      ${B('kow','KO won','ko')}${B('kol','KO lost','ko')}${B('tow','TO won','to')}${B('tol','TO lost','to')}</div></div>`};
  return `<section class="board clockbar"><div class="cl"><span class="halfpill ${c.period===1||c.period===3?'h1':c.period===2||c.period===4?'':'ht0'}">${esc(OG.perShort(c.period))}</span><div id="clk" class="clock${c.running?'':' paused'}">${clockHTML(m)}</div><div id="over" class="over"></div></div>
    <div id="alertbar" class="alertbar" hidden></div>${ctrl}</section>
  ${pre}
  ${sbPanel(m,t)}
  ${gg&&!t.ggScores?`<section class="panel ggpanel"><h3>Go Games: no scoring</h3><p class="legend">Go Games are non-competitive under GAA policy, so this screen only tracks subs (for minutes played) and notes. ${isAdmin()?'You can let coaches keep scores privately under Admin → Teams & players.':''}</p>${(()=>{const alt=S.fixtures.find(f=>f.status==='upcoming'&&OG.tierOf(team(f.teamId))!=='gogames'&&canManage(f.teamId));return alt?`<div class="row"><button class="btn pri" data-act="leaveTo" data-id="${alt.id}">Score ${esc(team(alt.teamId).name)} v ${esc(alt.opp)} instead</button></div>`:''})()}</section>`:`<section class="scorepanel">${col('us')}${col('them')}</section>
  ${ggPriv?'<p class="legend center"><b>Private Go Games scores:</b> only coaches see these; they never appear on public pages.</p>':''}<p class="legend center">Each tap logs at once with the match time. For ${esc(S.club)} the player picker opens after; skip it if unsure. KO = ${ko}, TO = turnover.</p>`}
  ${lastBar(m,t)}
  <div class="keys two subnote"><button class="key sub" data-act="sub">Sub</button><button class="key note" data-act="note">Note</button></div>
  <section class="panel"><div class="ph"><h3>Timeline</h3><span class="legend">Tap an event to edit or undo it</span></div>${timeline(m,t,15,true)}</section>
  <section class="panel"><div class="ph"><h3>Scorer</h3><span class="chip w">${esc(me().name)}</span></div>
    <p class="legend">Only you can score this match${(fixture(m.fixtureId)||{}).pin?' (match PIN '+esc(fixture(m.fixtureId).pin)+', expires at full time)':''}. Everyone else sees it live but can't change it. Scoring keeps working with no signal.</p>
    <div class="row"><button class="btn" data-act="handover">Hand over scoring</button><button class="btn" data-act="closeMatch">Back to list</button></div></section>`;
}
function timeline(m,t,limit,editable){
  const evs=[...m.events].sort((a,b)=>OG.abs(m,b.per,b.sec)-OG.abs(m,a.per,a.sec)).slice(0,limit||9999);
  if(!evs.length)return '<p class="empty">Nothing logged yet.</p>';
  return `<div class="log">${evs.map(e=>{
    let who=e.side==='them'?esc(m.opp):esc(pName(t,e.pid)||(e.type==='note'?'':S.club));
    if(e.type==='sub')who=esc((pName(t,e.pid)||'?')+' off → '+(pName(t,e.onId)||'?')+' on'+(e.blood?' (blood)':''));
    if(e.type==='bloodret')who=esc((pName(t,e.onId)||'?')+' back on for '+(pName(t,e.pid)||'?'));
    const extra=(e.src&&e.src!=='play'?' · '+esc(srcL(e.src,m.code)):'')+(hasLoc(e)&&e.src!=='45'?' · '+Math.round(distM(e))+'m':'')+(e.sinbin?' · sin-bin '+e.sinbin/60+' min':'');
    const pts=isScore(e.type)?` <b class="num">+${OG.PTS[e.type]}</b>`:'';
    const body=e.type==='note'?`<b>Note</b><br><span class="notetxt">${esc(e.text)}</span>`:`<b>${esc(lbl(e.type,m.code))}</b>${pts}${extra}<br><span>${who}</span>`;
    const tag=editable?'button':'div';
    return `<${tag} class="ev ${e.side} t-${e.type}${isScore(e.type)&&e.side==='us'?' sc':''}${e.type==='note'?' nt':''}"${editable?` data-act="editEv" data-id="${e.id}"`:''}><div class="t">${halfTag(e.per)}<b>${isPlaying(e.per)?OG.minOf(e.sec,OG.halfOf(m,e.per)):''}</b></div><div class="what">${body}</div></${tag}>`}).join('')}</div>`;
}

/* ========== match centre (view-only live, or after full time) ========== */
const csvBox=()=>`<div class="grp"><p class="legend">Confirm the save when asked. You can also copy it and paste into Excel or Google Sheets.</p><textarea id="csvbox" rows="5" readonly>${esc(ui.csv)}</textarea><div class="row"><button class="btn sm" data-act="copyCsv">Copy CSV</button></div></div>`;
function vMatchCentre(m){
  const t=team(m.teamId),f=fixture(m.fixtureId)||{},gg=OG.tierOf(t)==='gogames',manage=canManage(m.teamId);
  const mins=OG.minutes(m,S.settings);const ms=OG.summary(m,'us');
  const rows=t.players.filter(p=>mins[p.id]>0||m.lineup.includes(p.id)).sort((a,b)=>(mins[b.id]||0)-(mins[a.id]||0));
  const sl=m.events.filter(e=>e.side==='us'&&SHOTS.includes(e.type)).map(e=>({e,m}));
  const live=!m.ended;
  return `<section class="board">${boardHTML(m,t)}
    ${live?`<div class="row" style="justify-content:space-between"><span class="chip">Being scored by ${esc(userName(m.scorer))}</span>${manage?`<button class="btn sm${A('takeover')}" data-act="takeover">${ui.armed==='takeover'?'Tap again to take over':'Take over scoring'}</button>`:''}</div>`
    :`<div class="row" style="justify-content:space-between"><span class="chip">${m.clock.period==='AET'?'Full time (after extra time)':'Full time'}</span><span class="legend" style="color:var(--on-band-muted)">${esc(f.comp||'')}</span></div>`}
  </section>
  <section class="panel"><div class="row">
    <button class="btn" data-act="closeMatch">← Back</button>
    ${m.ended&&!gg?'<button class="btn amb" data-act="share">Share result card</button>':''}
    ${manage?'<button class="btn" data-act="note">Add note</button><button class="btn" data-act="csvMatch">Export CSV</button>':''}
  </div>${ui.csv&&manage?csvBox():''}</section>
  ${m.ended&&manage?`<section class="panel"><div class="ph"><h3>Match report</h3><div class="row"><button class="btn sm" data-act="copyReport" data-pub="0">Copy</button><button class="btn sm" data-act="copyReport" data-pub="1">Copy public version</button></div></div>
    <div class="report">${esc(OG.report(S,m,false)).replace(/\n/g,'<br>')}</div>
    <p class="legend">Written automatically from the match log. The public version leaves out turnovers, subs, cards and notes, and follows the team's privacy setting for names.</p></section>`:''}
  ${manage?`<section class="panel"><h3>Minutes played</h3>
    <div class="tw"><table><thead><tr><th>Player</th><th>Started</th><th>Mins</th>${gg?'':'<th>Score</th>'}</tr></thead><tbody>
    ${rows.map(p=>{let g=0,pp=0;for(const e of m.events)if(e.side==='us'&&e.pid===p.id&&isScore(e.type)){if(e.type==='goal')g++;else pp+=OG.PTS[e.type]}
      return `<tr><td>#${p.num} ${esc(p.name)}</td><td>${m.lineup.includes(p.id)?'Yes':''}</td><td>${Math.round((mins[p.id]||0)/60)}</td>${gg?'':`<td>${g||pp?g+'-'+pad(pp):''}</td>`}</tr>`}).join('')}
    </tbody></table></div>
    <p class="legend">From the starting team and subs log, on playing time (minutes stop when the clock stops). Blood subs ${S.settings.bloodCounts?'count for the player who came on':'don’t count'}; sin-bin time ${S.settings.sinbinCounts?'counts':'doesn’t count'}. Change this under Admin → Data &amp; rules.</p></section>`:''}
  ${manage&&!gg?`<section class="panel"><h3>Match stats</h3><div class="kpis">
      <div class="kpi hi"><b>${pct(ms.scores,ms.shots)}</b><span>Shot conversion (${ms.scores}/${ms.shots})</span></div>
      <div class="kpi"><b>${ms.tow}–${ms.tol}</b><span>Turnovers won–lost</span></div>
      <div class="kpi"><b>${ms.kow}–${ms.kol}</b><span>Our ${KO(m.code)}s won–lost</span></div>
      <div class="kpi"><b>${ms.okw}–${ms.okl}</b><span>Their ${KO(m.code)}s: we won–they kept</span></div></div>
    ${sl.some(x=>hasLoc(x.e))?`<div class="pitchbox">${pitchSVG({code:m.code,arc:m.arc,dots:shotDots(sl,t)})}</div>${pkey(m.arc&&footy(m.code))}`:''}</section>`:''}
  <section class="panel"><div class="ph"><h3>Timeline</h3>${manage&&m.ended?'<span class="legend">Tap an event to correct it</span>':''}</div>${timeline(m,t,0,manage&&m.ended)}</section>
  ${manage?`<section class="panel"><h3>Audit trail</h3><div class="audit">${(m.audit||[]).slice().reverse().map(a=>`<div><span class="muted">${new Date(a.at).toLocaleString('en-IE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span> <b>${esc(a.who)}</b> ${esc(a.action)}</div>`).join('')||'<p class="empty">No changes recorded.</p>'}</div></section>`:''}`;
}

/* ========== live scores (view-only, every role) ========== */
function vLive(){
  const now=Date.now();const pub=demoPublic(S,now);ui.livePub=pub.matches;
  const card=lm=>{const m=S.matches.find(x=>x.id===lm.id)||(lm.example?dmExampleLive(S,now):null);const t=team(m?m.teamId:'')||{};const gg=lm.tier==='gogames';const c=lm.clock;
    const us=m&&OG.summary(m,'us'),th=m&&OG.summary(m,'them');const ko=KO(lm.code),black=lm.code==='football';
    const row=(a,l,b)=>`<div class="l">${a}</div><div class="m">${l}</div><div class="r">${b}</div>`;
    return `<article class="lcard">
      <div class="lhead"><span>${esc(lm.squad)}</span>${lm.example?'<span class="chip">Example</span>':''}<span class="chip live">Live</span></div>
      <div class="lsb">
        <div class="lteam">${crestImg(S.club,'mid')}<b>${esc(S.club)}</b>${gg?'':`<span class="lsc">${fmtS(lm.score.us)}</span><span class="ltot">(${lm.score.us.t})</span>`}</div>
        <div class="lmid"><span class="halfpill ${c.period===1||c.period===3?'h1':c.period===2||c.period===4?'':'ht0'}">${esc(OG.perShort(c.period))}</span><span class="lclk" data-lclk="${esc(lm.id)}">${isPlaying(c.period)?OG.minOf(c.elapsed,c.period<=2?lm.half:lm.etHalf||10):'–'}</span><span class="ladd" data-ladd="${esc(lm.id)}"></span></div>
        <div class="lteam">${crestImg(lm.opp,'mid')}<b>${esc(lm.opp)}</b>${gg?'':`<span class="lsc them">${fmtS(lm.score.them)}</span><span class="ltot">(${lm.score.them.t})</span>`}</div>
      </div>
      ${gg?'<p class="legend" style="text-align:center">Go Games: no scores are kept.</p>':`<div class="cmp">
        ${row(us.scores+'/'+us.shots,'Scores from shots',th.scores+'/'+th.shots)}
        ${row(us.wide,'Wides',th.wide)}
        ${row(us.y+(black?'/'+us.b:'')+'/'+us.r,'Cards Y/'+(black?'B/':'')+'R',th.y+(black?'/'+th.b:'')+'/'+th.r)}
      </div>
      <div class="lours"><span>Their ${ko}s won <b>${us.okw}</b></span><span>Turnovers <b>${us.tow}–${us.tol}</b></span><span>Our ${ko}s <b>${us.kow}/${us.kow+us.kol}</b></span></div>`}
      ${lm.sinbins&&lm.sinbins.length?`<p class="legend">Sin-bin: ${lm.sinbins.map(s=>esc((s.who||S.club)+' '+mmss(s.left))).join(', ')}</p>`:''}
      ${!lm.example&&canManage(t.id)?`<div class="row"><button class="btn sm" data-act="openMatch" data-id="${esc(lm.id)}">Open match</button></div>`:''}
    </article>`};
  const latest=S.fixtures.filter(f=>f.status==='played'&&f.result).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
  return `<section class="panel"><div class="ph"><h2>Live scores</h2><button class="btn sm" data-act="tab" data-v="live">Refresh</button></div>
    ${pub.example?'<p class="legend">No match is being scored right now, so this shows an example. Start a match from the Match tab and it appears here.</p>':''}</section>
    ${pub.matches.map(card).join('')}
    <section class="panel"><h3>Latest results</h3>${latest.map(f=>{const t=team(f.teamId);const u=f.result.us,th=f.result.them;const k=u.t>th.t?'w':u.t<th.t?'l':'d';
      return `<div class="lres">${crestImg(f.opp)}<span class="lrt"><b>${esc(t.name)} v ${esc(f.opp)}</b><span class="muted">${new Date(f.date+'T12:00').toLocaleDateString('en-IE',{day:'numeric',month:'short'})}</span></span><span class="res">${fmtS(u)} – ${fmtS(th)}</span><span class="chip ${k}">${k==='w'?'W':k==='l'?'L':'D'}</span></div>`}).join('')||'<p class="empty">No results yet.</p>'}</section>`;
}

/* ========== match list ========== */
function vMatch(){
  const m=active();
  if(m)return canScore(m)?vScorer(m):vMatchCentre(m);
  const fx=visibleFixtures();
  const live=S.matches.filter(x=>!x.ended&&x.clock.period!==0&&fx.some(f=>f.id===x.fixtureId));
  const up=fx.filter(f=>f.status==='upcoming'||f.status==='live').filter(f=>!live.some(x=>x.fixtureId===f.id)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,6);
  const recent=fx.filter(f=>f.status==='played').sort((a,b)=>b.date.localeCompare(a.date)).slice(0,4);
  return `${isScorer()?`<section class="panel"><h2>Hi ${esc(me().name)}</h2><p class="legend">These are the matches you've been asked to score. At the pitch, open one, pick the starting team, then tap Throw-in.</p></section>`:''}
  ${live.length?`<section class="panel"><h2>Live now</h2>${live.map(x=>{const t=team(x.teamId);const gg=OG.tierOf(t)==='gogames';return `<div class="fx"><div class="dt live"><span>Live</span><b>${gg?'–':score(x,'us').t}</b><span>v ${gg?'–':score(x,'them').t}</span></div><div class="body"><div class="opp">${crestImg(x.opp)}<span>${esc(t.name)} v ${esc(x.opp)}</span></div><p class="legend">Scorer: ${esc(userName(x.scorer))}</p><div class="row"><button class="btn sm pri" data-act="openMatch" data-id="${x.id}">${canScore(x)?'Resume scoring':'Watch'}</button></div></div></div>`}).join('')}</section>`:''}
  <section class="panel"><h2>${isScorer()?'Your matches':'Upcoming'}</h2>${up.length?up.map(f=>fxCard(f,true)).join(''):'<p class="empty">Nothing coming up.</p>'}</section>
  ${recent.length?`<section class="panel"><h2>Recent</h2>${recent.map(f=>fxCard(f,true)).join('')}</section>`:''}`;
}

function fxCard(f,compact){
  const t=team(f.teamId);const d=new Date(f.date+'T12:00');const gg=OG.tierOf(t)==='gogames';const manage=canManage(f.teamId);
  if(!compact&&ui.editFx===f.id&&manage){
    const scorers=S.users.filter(u=>u.role==='scorer'||u.role==='admin'||(u.role==='coach'&&u.teamId===f.teamId));
    return `<div class="fx"><div class="dt"><span>Edit</span></div><div class="body">
      <div class="row"><label class="f">Opposition<input id="e-opp-${f.id}" value="${esc(f.opp)}"></label><label class="f">Competition<input id="e-comp-${f.id}" value="${esc(f.comp||'')}"></label></div>
      <div class="row"><label class="f">Date<input id="e-date-${f.id}" type="date" value="${esc(f.date)}"></label><label class="f">Throw-in<input id="e-time-${f.id}" type="time" value="${esc(f.time||'')}"></label>
      <label class="f">Venue<select id="e-venue-${f.id}">${['Home','Away','Neutral'].map(v=>`<option ${f.venue===v?'selected':''}>${v}</option>`).join('')}</select></label></div>
      <div class="row"><label class="f">Ground<input id="e-ground-${f.id}" value="${esc(f.ground||'')}" placeholder="${f.venue==='Home'?esc(HOME_GROUND):'Pitch name'}"></label><label class="f">Referee<input id="e-ref-${f.id}" value="${esc(f.ref||'')}"></label>
      <label class="f">Scorer<select id="e-scorer-${f.id}"><option value="">Not assigned</option>${scorers.map(u=>`<option value="${u.id}" ${f.scorer===u.id?'selected':''}>${esc(u.label)}</option>`).join('')}</select></label></div>
      <div class="row"><button class="btn sm pri" data-act="saveFx" data-id="${f.id}">Save changes</button><button class="btn sm" data-act="editFx" data-id="${f.id}">Close</button>
      ${f.status==='upcoming'?`<button class="btn sm warn${A('cfx'+f.id)}" data-act="cancelFx" data-id="${f.id}">${ui.armed==='cfx'+f.id?'Tap to cancel fixture':'Cancel fixture'}</button>`:''}
      <button class="btn sm warn${A('dfx'+f.id)}" data-act="delFx" data-id="${f.id}">${ui.armed==='dfx'+f.id?'Tap to delete':'Delete'}</button></div></div></div>`;
  }
  const res=!gg&&f.result&&f.status==='played'?(()=>{const u=f.result.us,th=f.result.them;const k=u.t>th.t?'w':u.t<th.t?'l':'d';return `<span class="res">${fmtS(u)} (${u.t}) – ${fmtS(th)} (${th.t})</span> <span class="chip ${k}">${k==='w'?'Won':k==='l'?'Lost':'Draw'}</span>`})():'';
  const btn=f.status==='cancelled'?'':f.status==='played'?`<button class="btn sm" data-act="startFx" data-id="${f.id}">Open match</button>`:f.status==='live'?`<button class="btn sm pri" data-act="startFx" data-id="${f.id}">Open live match</button>`:(f.scorer===S.me||manage)?`<button class="btn sm pri${A('start'+f.id)}" data-act="startFx" data-id="${f.id}">${ui.armed==='start'+f.id?'Tap again to open it':gg&&!(t&&t.ggScores)?'Track minutes (Go Games)':'Score this match'}</button>`:'';
  const moved=f.prev?`<span class="chip d">Moved from ${esc(new Date(f.prev.date+'T12:00').toLocaleDateString('en-IE',{day:'numeric',month:'short'}))}${f.prev.time&&f.prev.time!==f.time?' '+esc(f.prev.time):''}</span>`:'';
  return `<div class="fx${f.status==='cancelled'?' cancelled':''}"><div class="dt"><span>${d.toLocaleDateString('en-IE',{weekday:'short'})}</span><b>${d.getDate()}</b><span>${d.toLocaleDateString('en-IE',{month:'short'})}</span></div>
    <div class="body"><div class="opp">${crestImg(f.opp)}<span>${esc(t?t.name:'?')} v ${esc(f.opp)}</span></div>
    <div class="row">${f.time?`<span class="chip num">${esc(f.time)}</span>`:''}<span class="chip">${esc(f.venue||'')}</span>${f.comp?`<span class="chip">${esc(f.comp)}</span>`:''}${gg?'<span class="chip">Go Games</span>':''}${f.status==='live'?'<span class="chip live">Live</span>':''}${f.status==='cancelled'?'<span class="chip l">Cancelled</span>':''}${moved}${f.source?`<span class="chip src">${esc(f.source)}</span>`:''}${f.example?'<span class="chip">Example</span>':''}</div>
    <p class="legend">${mapLink(f)}${f.ref?' · Ref: '+esc(f.ref):''}${f.scorer?' · Scorer: '+esc(userName(f.scorer))+(manage&&f.pin&&!f.pinExpired&&f.status!=='played'?' (PIN '+esc(f.pin)+')':''):''}${t&&t.tableUrl&&!gg?` · <a href="${esc(t.tableUrl)}" target="_blank" rel="noopener">League table ↗</a>`:''}</p>
    ${res?`<div class="row">${res}</div>`:''}
    <div class="row">${btn}${compact||!manage?'':f.status==='cancelled'?`<button class="btn sm" data-act="cancelFx" data-id="${f.id}">Put back on</button>`:`<button class="btn sm" data-act="editFx" data-id="${f.id}">Edit</button>`}</div></div></div>`;
}

function vFixtures(){
  const today=ymd(new Date());if(!ui.month)ui.month=today.slice(0,7);
  const [y,mo]=ui.month.split('-').map(Number);const first=new Date(y,mo-1,1);const lead=(first.getDay()+6)%7;const days=new Date(y,mo,0).getDate();
  const teams=myTeams();const list=visibleFixtures().filter(f=>ui.teamF==='all'||f.teamId===ui.teamF);const byDay={};list.forEach(f=>{(byDay[f.date]=byDay[f.date]||[]).push(f)});
  let cells='';for(let i=0;i<lead;i++)cells+='<button class="blank" tabindex="-1" aria-hidden="true"></button>';
  for(let dd=1;dd<=days;dd++){const k=ui.month+'-'+pad(dd);const fs=byDay[k]||[];
    cells+=`<button data-act="day" data-v="${k}" class="${k===today?'today':''} ${k===ui.day?'sel':''}" aria-label="${dd}${fs.length?', '+fs.length+' fixtures':''}">${dd}<span class="dots">${fs.slice(0,3).map(f=>`<i class="${f.status==='played'?'p':f.status==='cancelled'?'x':''}"></i>`).join('')}</span></button>`}
  const shown=list.filter(f=>ui.day?f.date===ui.day:f.date.startsWith(ui.month)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const scorers=S.users.filter(u=>u.role!=='coach'||teams.some(t=>t.id===u.teamId));
  return `<section class="panel">
    <div class="row" style="justify-content:space-between"><button class="btn sm" data-act="month" data-v="-1" aria-label="Previous month">‹</button><h2>${first.toLocaleDateString('en-IE',{month:'long',year:'numeric'})}</h2><button class="btn sm" data-act="month" data-v="1" aria-label="Next month">›</button></div>
    ${teams.length>1?`<div class="seg"><button data-act="teamF" data-v="all" aria-pressed="${ui.teamF==='all'}">All squads</button>${teams.map(t=>`<button data-act="teamF" data-v="${t.id}" aria-pressed="${ui.teamF===t.id}">${esc(t.name)}</button>`).join('')}</div>`:''}
    <div class="cal">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="dow">${d}</div>`).join('')}${cells}</div>
    <p class="legend">Amber: upcoming. Grey: played. Red: cancelled.</p></section>
  <section class="panel"><h3>${ui.day?new Date(ui.day+'T12:00').toLocaleDateString('en-IE',{weekday:'long',day:'numeric',month:'long'}):'This month'}</h3>
    ${shown.length?shown.map(f=>fxCard(f,false)).join(''):'<p class="empty">No fixtures here.</p>'}</section>
  ${teams.length?`<section class="panel"><h3>Add fixture</h3>
    <div class="row"><label class="f">Squad<select id="f-team">${teams.map(t=>`<option value="${t.id}" ${ui.teamF===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label><label class="f">Opposition<input id="f-opp" placeholder="e.g. Tubbercurry"></label></div>
    <div class="row"><label class="f">Date<input id="f-date" type="date" value="${ui.day||today}"></label><label class="f">Throw-in<input id="f-time" type="time" value="11:00"></label><label class="f">Venue<select id="f-venue"><option>Home</option><option>Away</option><option>Neutral</option></select></label></div>
    <div class="row"><label class="f">Ground<input id="f-ground" placeholder="Blank = ${esc(HOME_GROUND)} for home games"></label><label class="f">Competition<input id="f-comp" placeholder="League, Cup, Blitz…"></label></div>
    <div class="row"><label class="f">Referee<input id="f-ref"></label><label class="f">Scorer<select id="f-scorer"><option value="">Not assigned</option>${scorers.map(u=>`<option value="${u.id}">${esc(u.label)}</option>`).join('')}</select></label></div>
    <div class="row"><button class="btn pri" data-act="addFx">Add fixture</button></div>
    <p class="legend">In the full version, fixtures arrive automatically from Foireann (or the Sligo GAA site until the club has an API key).</p></section>`:''}`;
}

/* ========== stats ========== */
function vStats(){
  const teams=myTeams();if(!teams.length)return '<section class="panel"><p class="empty">No squads to show.</p></section>';
  if(!ui.statsTeam||!teams.some(t=>t.id===ui.statsTeam))ui.statsTeam=teams[0].id;
  const t=team(ui.statsTeam);const st=teamStats(t.id);const T=st.tot;const F=footy(t.code),two=F&&t.arc,ko=KO(t.code),s45=set45(t.code),gg=OG.tierOf(t)==='gogames';
  const sel=teams.length>1?`<div class="seg">${teams.map(x=>`<button data-act="statsTeam" data-v="${x.id}" aria-pressed="${x.id===t.id}">${esc(x.name)}</button>`).join('')}</div>`:'';
  const head=`<section class="panel"><div class="ph"><h2>${esc(t.name)}</h2><span class="chip">${esc(assocOf(t).l)} · ${esc(t.grade)} · ${OG.TIERS[OG.tierOf(t)]}</span></div>${sel}`;
  const played=S.fixtures.filter(f=>f.teamId===t.id&&f.status==='played').sort((a,b)=>b.date.localeCompare(a.date));
  const appRows=st.rows.filter(r=>r.apps).sort((a,b)=>b.mins-a.mins);
  const maxMin=Math.max(1,...appRows.map(r=>r.mins));
  const minutesPanel=`<section class="panel"><div class="ph"><h3>Appearances &amp; minutes</h3><button class="btn sm" data-act="csvSeason" data-id="${t.id}">Export CSV</button></div>
    <div class="bars">${appRows.map(r=>barRow(esc('#'+r.p.num+' '+r.p.name),r.mins,maxMin,`${Math.round(r.mins/60)} min <span class="pc">${r.apps} app${r.apps===1?'':'s'}${r.starts?', '+r.starts+' start'+(r.starts===1?'':'s'):''}</span>`)).join('')||'<p class="empty">No matches yet.</p>'}</div>${ui.csv?csvBox():''}</section>`;
  if(gg)return head+`<p class="legend">Go Games are non-competitive: no scores, results or tables. Participation and minutes only.</p></section>${minutesPanel}
    <section class="panel"><h3>Matches</h3>${played.length?played.map(f=>fxCard(f,true)).join(''):'<p class="empty">No matches yet.</p>'}</section>`;
  const P=st.P||1;
  const all=[];for(const m of st.ms)for(const e of m.events)if(e.side==='us'&&SHOTS.includes(e.type))all.push({e,m});
  // shot map filters: source, player, outcome (goal / point / 2-pointer / miss)
  const outOf=e=>e.type==='goal'?'goal':e.type==='point'?'point':e.type==='two'?'two':'miss';
  const OUTS=[['goal','Goals','g'],['point','Points','s']].concat(two?[['two','2-pointers','two']]:[]).concat([['miss','Misses','m']]);
  ui.mapOut=ui.mapOut||{goal:true,point:true,two:true,miss:true};
  const pre=all.filter(x=>(ui.mapSrc==='all'||(x.e.src||'play')===ui.mapSrc)&&(ui.mapPl==='all'||x.e.pid===ui.mapPl));
  const fl=pre.filter(x=>ui.mapOut[outOf(x.e)]!==false);
  const located=fl.filter(x=>hasLoc(x.e));
  const tallyOut=r=>{const o={goal:0,point:0,two:0,miss:0};r.forEach(x=>o[outOf(x.e)]++);return Object.assign(o,{a:r.length,s:r.length-o.miss})};
  const bands=BANDS(t.code,two).map((l,i)=>Object.assign({l},tallyOut(located.filter(x=>bandOf(x.e,x.m.code)===i))));
  const sides=['Left','Centre','Right'].map(l=>Object.assign({l},tallyOut(located.filter(x=>sideOf(x.e)===l))));
  const stackRow=(b,max)=>`<div class="bar"><span class="lab">${b.l}</span><span class="trk stack">${b.a?['goal','point','two','miss'].filter(k=>b[k]).map(k=>`<i class="o-${k}" style="width:${b[k]*100/max}%" title="${b[k]} ${k==='two'?'2-pointer':k}${b[k]===1?'':'s'}"></i>`).join(''):''}</span><span class="v">${b.a?(bothOn()?`${b.s}/${b.a} <span class="pc">${pct(b.s,b.a)}</span>`:`${b.a}`):'–'}</span></div>`;
  function bothOn(){return ui.mapOut.miss!==false&&(ui.mapOut.goal!==false||ui.mapOut.point!==false||ui.mapOut.two!==false)}
  const mapCount=o=>pre.filter(x=>hasLoc(x.e)&&outOf(x.e)===o).length;
  const srcs=Object.keys(SRC).filter(k=>F||k!=='mark').map(k=>{const r=all.filter(x=>(x.e.src||'play')===k);return{l:srcL(k,t.code),a:r.length,s:r.filter(x=>isScore(x.e.type)).length}}).filter(r=>r.a);
  const maxB=Math.max(1,...bands.map(b=>b.a)),maxS=Math.max(1,...sides.map(b=>b.a));
  const f45=all.filter(x=>x.e.src==='45');
  const s45sides=['Left','Centre','Right'].map(l=>{const r=f45.filter(x=>hasLoc(x.e)&&sideOf(x.e)===l);return{l,a:r.length,s:r.filter(x=>isScore(x.e.type)).length}});
  const takers={};f45.forEach(x=>{const k=x.e.pid||'';(takers[k]=takers[k]||{a:0,s:0}).a++;if(isScore(x.e.type))takers[k].s++});
  const scorersRows=st.rows.filter(r=>r.ptsTotal).sort((a,b)=>b.ptsTotal-a.ptsTotal||b.goal-a.goal);
  const topMax=Math.max(1,...scorersRows.map(r=>r.ptsTotal));
  const sc=r=>`${r.goal}-${pad(r.point+2*r.two)}`;
  const cols=[['G','goal'],['P','point']].concat(two?[['2P','two'],['2P att','twoAtt']]:[]).concat([['Fr','free'],[s45+'s','t45x'],['Wd','wide'],['TOW','tow'],['TOL','tol'],['Y','yellow']]).concat(hasBlack(t.code)?[['B','black']]:[]).concat([['R','red']]);
  const cell=(r,k)=>k==='t45x'?(r.t45?r.s45+'/'+r.t45:''):(r[k]||'');
  const form=st.games.slice(-5);
  return head+`<div class="kpis">
      <div class="kpi hi"><b>${st.W}-${st.D}-${st.L}</b><span>Won-drawn-lost · ${st.P} played</span></div>
      <div class="kpi"><b>${st.P?(st.For/st.P).toFixed(1):'–'} <small style="font-size:16px;color:var(--muted)">v ${st.P?(st.Ag/st.P).toFixed(1):'–'}</small></b><span>Avg points scored v conceded</span></div>
      <div class="kpi am"><b>${pct(scores(T),shots(T))}</b><span>Shot conversion (${scores(T)}/${shots(T)})</span></div>
      <div class="kpi"><b>${T.tow-T.tol>0?'+':''}${T.tow-T.tol}</b><span>Turnover difference (${T.tow} won, ${T.tol} lost)</span></div>
    </div>
    ${form.length?`<div class="row"><h3>Form</h3><div class="form">${form.map(g=>`<span class="${g.k}" title="${esc(fmtS(g.u)+' – '+fmtS(g.th)+' v '+g.m.opp)}">${g.k}</span>`).join('')}</div></div>`:''}
  </section>
  <div class="grid2">
    <section class="panel"><h3>Top scorers</h3><div class="bars">${scorersRows.slice(0,8).map(r=>barRow(esc('#'+r.p.num+' '+r.p.name),r.ptsTotal,topMax,`${sc(r)} <span class="pc">(${r.ptsTotal})</span>`,'a')).join('')||'<p class="empty">No scores yet.</p>'}</div></section>
    <section class="panel"><h3>Scores for and against</h3>${formChart(st.games)}</section>
  </div>
  ${minutesPanel}
  <section class="panel"><div class="ph"><h3>Shot map</h3><span class="legend">${located.length} shot${located.length===1?'':'s'} on the map${fl.length>located.length?` (${fl.length-located.length} logged without a location)`:''}</span></div>
    <div class="seg outf">${OUTS.map(([k,l,c])=>`<button data-act="mapOut" data-v="${k}" aria-pressed="${ui.mapOut[k]!==false}"><i class="dotk ${c}"></i>${l} <b>${mapCount(k)}</b></button>`).join('')}</div>
    <div class="row"><div class="seg">${[['all','All'],['play','From play'],['free','Frees'],['45',s45+'s'],['pen','Penalties']].map(([k,l])=>`<button data-act="mapSrc" data-v="${k}" aria-pressed="${ui.mapSrc===k}">${l}</button>`).join('')}</div>
    <select id="map-pl" data-chg="mapPl" aria-label="Player"><option value="all">All players</option>${t.players.map(p=>`<option value="${p.id}" ${ui.mapPl===p.id?'selected':''}>#${p.num} ${esc(p.name)}</option>`).join('')}</select></div>
    <div class="grid2"><div><div class="pitchbox">${pitchSVG({code:t.code,arc:two,dots:shotDots(fl,t)})}</div></div>
    <div class="bars"><div class="ph"><h3>By distance from goal</h3><span class="legend">${bothOn()?'scored / shots':'shots'}</span></div>${bands.map(b=>stackRow(b,maxB)).join('')}
      <h3 style="margin-top:6px">By side of the pitch</h3>${sides.map(b=>stackRow(b,maxS)).join('')}
      <div class="bar total"><span class="lab">Total</span><span></span><span class="v">${(()=>{const sc=located.length-located.filter(x=>outOf(x.e)==='miss').length;return bothOn()?`${sc}/${located.length} <span class="pc">${pct(sc,located.length)}</span>`:`${located.length}`})()}</span></div>
      <p class="legend">Each bar is the shots from that area, split by result in the map's colours. Each group adds up to the dots on the map, and follows the filters above.</p></div></div>
  </section>
  <div class="grid2">
    <section class="panel"><h3>Shooting by source</h3>
      <div class="tw"><table><thead><tr><th>Source</th><th>Shots</th><th>Scored</th><th>%</th></tr></thead><tbody>
      ${srcs.map(r=>`<tr><td>${esc(r.l)}</td><td>${r.a}</td><td>${r.s}</td><td>${pct(r.s,r.a)}</td></tr>`).join('')||'<tr><td colspan="4">No shots yet</td></tr>'}
      ${two?`<tr><td><b>2-point attempts</b></td><td>${T.twoAtt}</td><td>${T.two}</td><td>${pct(T.two,T.twoAtt)}</td></tr>`:''}
      </tbody></table></div>
      <p class="legend">Wides ${T.wide} · Dropped short ${T.short} · Saved or blocked ${T.saved}</p></section>
    <section class="panel"><h3>${s45}s</h3>
      <div class="kpis"><div class="kpi am"><b>${f45.filter(x=>isScore(x.e.type)).length}/${f45.length}</b><span>${s45}s scored (${pct(f45.filter(x=>isScore(x.e.type)).length,f45.length)})</span></div></div>
      <div class="bars">${s45sides.map(b=>barRow(b.l+' side',b.a,Math.max(1,...s45sides.map(x=>x.a)),b.a?`${b.s}/${b.a}`:'–','a')).join('')}</div>
      <p class="legend">${Object.keys(takers).length?'Takers: '+Object.entries(takers).map(([pid,v])=>esc(pid?(pName(t,pid)||'?'):'Not recorded')+' '+v.s+'/'+v.a).join(' · '):'No '+s45+'s taken yet.'}</p></section>
  </div>
  <section class="panel"><h3>Kick-outs &amp; turnovers</h3>
    ${splitBar('Our '+ko+'s','Won',T.kow,'Lost',T.kol)}${splitBar('Their '+ko+'s','We won',T.okw,'They kept',T.okl)}${splitBar('Turnovers','Won',T.tow,'Lost',T.tol)}
    <p class="legend">Our ${ko} retention ${pct(T.kow,T.kow+T.kol)}; we won ${pct(T.okw,T.okw+T.okl)} of theirs. ${(T.tow/P).toFixed(1)} turnovers won a match.</p></section>
  <section class="panel"><h3>Player stats</h3>
    <div class="tw"><table><thead><tr><th>Player</th><th>Apps</th><th>Mins</th><th>Score</th><th>Shots</th>${cols.map(c=>`<th>${c[0]}</th>`).join('')}</tr></thead><tbody>
      ${st.rows.filter(r=>r.apps).sort((a,b)=>b.ptsTotal-a.ptsTotal||b.mins-a.mins).map(r=>`<tr><td>#${r.p.num} ${esc(r.p.name)}</td><td>${r.apps}</td><td>${Math.round(r.mins/60)}</td><td><b>${sc(r)}</b> (${r.ptsTotal})</td><td>${scores(r)}/${shots(r)}<span class="pc">${pct(scores(r),shots(r))}</span></td>${cols.map(c=>`<td>${cell(r,c[1])}</td>`).join('')}</tr>`).join('')}
    </tbody></table></div>
    <p class="legend">Fr = scores from frees. ${s45}s = scored/taken. TOW/TOL = turnovers won/lost.</p></section>
  <section class="panel"><h3>Results</h3>${played.length?played.map(f=>fxCard(f,true)).join(''):'<p class="empty">No results yet.</p>'}</section>`;
}

function vClub(){
  const today=ymd(new Date());
  const data=S.teams.map(t=>({t,st:teamStats(t.id),next:S.fixtures.filter(f=>f.teamId===t.id&&f.status==='upcoming'&&f.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0]}));
  const comp=data.filter(d=>OG.tierOf(d.t)!=='gogames');
  const tot=comp.reduce((a,d)=>({W:a.W+d.st.W,D:a.D+d.st.D,L:a.L+d.st.L,P:a.P+d.st.P}),{W:0,D:0,L:0,P:0});
  return `<section class="panel"><h2>Club overview</h2>
    <div class="kpis"><div class="kpi hi"><b>${tot.W}-${tot.D}-${tot.L}</b><span>Competitive squads · ${tot.P} played</span></div>
      <div class="kpi"><b>${S.teams.length}</b><span>Squads</span></div>
      <div class="kpi am"><b>${S.fixtures.filter(f=>f.status==='upcoming'&&f.date>=today).length}</b><span>Upcoming fixtures</span></div>
      <div class="kpi"><b>${S.teams.reduce((a,t)=>a+t.players.length,0)}</b><span>Players linked</span></div></div>
    <div class="tw"><table class="sq-table"><thead><tr><th>Squad</th><th>Tier</th><th>P</th><th>W-D-L</th><th>Avg for</th><th>Avg ag</th><th>Shots %</th><th>Form</th><th>Next</th></tr></thead><tbody>
      ${data.map(({t,st,next})=>{const gg=OG.tierOf(t)==='gogames';return `<tr><td>${esc(t.name)}</td><td>${OG.TIERS[OG.tierOf(t)]}</td><td>${gg?'–':st.P}</td><td>${gg?'–':st.W+'-'+st.D+'-'+st.L}</td><td>${!gg&&st.P?(st.For/st.P).toFixed(1):'–'}</td><td>${!gg&&st.P?(st.Ag/st.P).toFixed(1):'–'}</td><td>${gg?'–':pct(scores(st.tot),shots(st.tot))}</td><td>${gg?'–':st.games.slice(-5).map(g=>g.k).join(' ')||'–'}</td><td>${next?esc(new Date(next.date+'T12:00').toLocaleDateString('en-IE',{day:'numeric',month:'short'})+' v '+next.opp):'–'}</td></tr>`}).join('')}
    </tbody></table></div>
    <div class="row">${S.teams.map(t=>`<button class="btn sm" data-act="statsTeam" data-v="${t.id}">${esc(t.name)}</button>`).join('')}</div></section>`;
}

/* ========== admin ========== */
function vAdmin(){
  const tabs=[['club','Club'],['data','Data & rules'],['teams','Teams & players'],['people','Scorers & coaches']];
  const nav=`<section class="panel"><div class="seg">${tabs.map(([k,l])=>`<button data-act="adminTab" data-v="${k}" aria-pressed="${ui.adminTab===k}">${l}</button>`).join('')}</div></section>`;
  const st=S.settings;
  if(ui.adminTab==='club')return nav+`<section class="panel"><h3>Club</h3>
    <div class="logo-row"><div class="badge">${badgeHTML()}</div><label class="btn">Change badge<input id="logo-file" type="file" accept="image/png,image/jpeg,image/webp" data-chg="logo" hidden></label></div>
    <label class="f">Club name<input id="club" value="${esc(S.club)}" data-chg="club"></label></section>
  <section class="panel"><h3>Membership</h3>
    <label class="f">Join / Renew link<input id="s-join" value="${esc(st.joinUrl||'')}" data-chg="setting" data-k="joinUrl" placeholder="https://www.foireann.ie"></label>
    <p class="legend">All memberships are on Foireann, so the Join / Renew button on the public and player pages opens this link.</p>
    <label class="f">Club lotto link (optional)<input id="s-lotto" value="${esc(st.lottoUrl||'')}" data-chg="setting" data-k="lottoUrl" placeholder="ClubSpot lotto page"></label></section>
  <section class="panel"><h3>About this demo</h3>
    <p class="legend">Results, dates, opponents and venues are real 2026 Owenmore Gaels fixtures. Players, Foireann numbers and the minute-by-minute events are invented examples. Everything is saved on this device only.</p>
    <div class="row"><a class="btn" href="live.html">Public page</a><a class="btn" href="me.html">Player page</a><button class="btn warn${A('reset')}" data-act="resetDemo">${ui.armed==='reset'?'Tap again to reset':'Reset demo'}</button></div></section>`;
  if(ui.adminTab==='data')return nav+`<section class="panel"><h3>Fixtures &amp; results source</h3>
    <label class="f">Foireann Open Data API key<input id="s-key" value="${esc(st.foireannKey||'')}" data-chg="setting" data-k="foireannKey" placeholder="Request from the Club Secretary" autocomplete="off"></label>
    <p class="legend">${st.foireannKey?'Key saved. In the full version, fixtures and results are read from Foireann each morning (read-only; scores are never sent back to Foireann).':'No key yet. Until the club has one, fixtures come from the Sligo GAA fixtures page each morning (the fallback). League tables link out to the competition page.'}</p></section>
  <section class="panel"><h3>Minutes played rules</h3>
    <label class="row" style="gap:10px"><input type="checkbox" id="s-blood" ${st.bloodCounts?'checked':''} data-chg="setting" data-k="bloodCounts"> <span>Count minutes for players who come on as blood subs</span></label>
    <label class="row" style="gap:10px"><input type="checkbox" id="s-sinbin" ${st.sinbinCounts?'checked':''} data-chg="setting" data-k="sinbinCounts"> <span>Count sin-bin time as minutes played</span></label>
    <p class="legend">Minutes run on playing time: when the scorer stops the clock for a stoppage, minutes stop too. Added time counts.</p></section>`;
  if(ui.adminTab==='people'){
    const coaches=S.users.filter(u=>u.role==='coach'),scorers=S.users.filter(u=>u.role==='scorer');
    return nav+`<section class="panel"><h3>Coaches</h3>${coaches.map(u=>`<div class="prow3 wrap"><b>${esc(u.name)}</b><span class="muted">${esc((team(u.teamId)||{}).name||'')}</span><input id="uc-${u.id}" value="${esc(u.contact||'')}" placeholder="Email or mobile" aria-label="Email or mobile for ${esc(u.name)}"><button class="btn sm" data-act="sendLink" data-id="${u.id}">Send sign-in link</button></div>`).join('')}
      <p class="legend">Coaches sign in with a one-tap link by email or text: no passwords. They see full stats, minutes and notes for their own team only. Admins (PRO/committee) have their own login.</p></section>
    <section class="panel"><h3>Scorers</h3>${scorers.map(u=>`<div class="prow3"><b>${esc(u.name)}</b><span class="muted">${S.fixtures.filter(f=>f.scorer===u.id&&f.status!=='played').length} upcoming</span><button class="btn sm${A('du'+u.id)}" data-act="delUser" data-id="${u.id}">${ui.armed==='du'+u.id?'Remove?':'✕'}</button></div>`).join('')}
      <div class="row"><input id="nu-name" placeholder="Name (e.g. a parent)" style="flex:1 1 160px"><button class="btn" data-act="addUser">Add scorer</button></div>
      <p class="legend">Scorers don't need an account. Assign them on a fixture (Fixtures → Edit) and they get a PIN for that match only; it expires at full time.</p></section>`;
  }
  if(!ui.adminTeam||!team(ui.adminTeam))ui.adminTeam=S.teams[0]&&S.teams[0].id;const t=team(ui.adminTeam);const a=t&&assocOf(t);
  const def=t&&OG.sinbinRule(Object.assign({},t,{sinbinCard:''}));
  return nav+`<section class="panel"><div class="seg">${S.teams.map(x=>`<button data-act="adminTeam" data-v="${x.id}" aria-pressed="${t&&x.id===t.id}">${esc(x.name)}</button>`).join('')}<button data-act="addTeam">+ Add team</button></div></section>
  ${t?`<section class="panel"><h3>Team settings</h3>
    <div class="row"><label class="f">Name<input id="t-name" value="${esc(t.name)}" data-chg="team" data-id="${t.id}" data-k="name"></label>
      <label class="f">Association<select id="t-assoc" data-chg="team" data-id="${t.id}" data-k="assoc">${Object.entries(ASSOC).map(([k,v])=>`<option value="${k}" ${t.assoc===k?'selected':''}>${esc(v.l)}</option>`).join('')}</select></label>
      <label class="f">Age grade<select id="t-grade" data-chg="team" data-id="${t.id}" data-k="grade">${a.grades.map(g=>`<option ${t.grade===g[0]?'selected':''}>${esc(g[0])}</option>`).join('')}</select></label></div>
    <div class="row"><label class="f">Privacy<select id="t-tier" data-chg="team" data-id="${t.id}" data-k="tier">${Object.entries(OG.TIERS).map(([k,l])=>`<option value="${k}" ${OG.tierOf(t)===k?'selected':''}>${l}</option>`).join('')}</select></label>
      <label class="f">Half (min)<input id="t-half" type="number" min="1" max="45" value="${t.half}" data-chg="team" data-id="${t.id}" data-k="half"></label>
      <label class="f">Extra-time half (min)<input id="t-et" type="number" min="1" max="20" value="${t.etHalf||10}" data-chg="team" data-id="${t.id}" data-k="etHalf"></label>
      <label class="f">Players on pitch<input id="t-onf" type="number" min="5" max="15" value="${t.onField}" data-chg="team" data-id="${t.id}" data-k="onField"></label></div>
    <p class="legend tierhelp">${OG.tierOf(t)==='adult'?'<b>Adult:</b> full names and individual stats can be public.':OG.tierOf(t)==='minor'?'<b>Minor:</b> public pages show first name and jersey number only; individual stats are behind the player’s own login.':'<b>Go Games:</b> non-competitive under GAA policy. No public scores, results or tables. Participation and minutes are still tracked.'}</p>
    <div class="row"><label class="f">Sin-bin card<select id="t-sb" data-chg="team" data-id="${t.id}" data-k="sinbinCard"><option value="">Rules default${def?' ('+def.card+', '+def.secs/60+' min)':' (none)'}</option><option value="black" ${t.sinbinCard==='black'?'selected':''}>Black</option><option value="yellow" ${t.sinbinCard==='yellow'?'selected':''}>Yellow</option><option value="none" ${t.sinbinCard==='none'?'selected':''}>No sin-bin</option></select></label>
      <label class="f">League table link<input id="t-table" value="${esc(t.tableUrl||'')}" data-chg="team" data-id="${t.id}" data-k="tableUrl"></label></div>
    ${footy(t.code)?`<label class="row" style="gap:10px"><input id="t-arc" type="checkbox" ${t.arc?'checked':''} data-chg="team" data-id="${t.id}" data-k="arc"> <span>2-point arc in use</span></label>`:''}
    <label class="row" style="gap:10px"><input id="t-loc" type="checkbox" ${t.shotLoc?'checked':''} data-chg="team" data-id="${t.id}" data-k="shotLoc"> <span>Offer shot location on the scoring screen (optional tap)</span></label>
    ${OG.tierOf(t)==='gogames'?`<label class="row" style="gap:10px"><input id="t-gg" type="checkbox" ${t.ggScores?'checked':''} data-chg="team" data-id="${t.id}" data-k="ggScores"> <span>Let coaches keep Go Games scores privately (never shown publicly)</span></label>`:''}
    <label class="row" style="gap:10px"><input id="t-lb" type="checkbox" ${t.leaderboard?'checked':''} data-chg="team" data-id="${t.id}" data-k="leaderboard"> <span>Players can see the team leaderboard (otherwise only their own stats)</span></label>
    <p class="legend">Coach: ${esc(userName(t.coach))}. GAA sin-bin: black card, 10 minutes. LGFA: yellow card from U14 up (10 min with 30-minute halves, 5 min with shorter halves, none up to U13).</p>
  </section>
  <section class="panel"><div class="ph"><h3>Players (${t.players.length})</h3><button class="btn sm pri" data-act="addPl" data-id="${t.id}">+ Add player</button></div>
    <p class="legend">Keyed on Foireann membership number. Only name, jersey number and team are stored: no date of birth or address.</p>
    ${t.players.map(p=>`<div class="prow2"><input type="number" min="1" max="99" value="${p.num}" aria-label="Number" data-chg="pl" data-id="${t.id}" data-pid="${p.id}" data-k="num" id="pn-${p.id}"><input value="${esc(p.name)}" placeholder="Player name" aria-label="Name" data-chg="pl" data-id="${t.id}" data-pid="${p.id}" data-k="name" id="pm-${p.id}">
      <div class="pcode"><input class="fno" value="${esc(p.foireann||'')}" placeholder="Foireann no." aria-label="Foireann number" data-chg="pl" data-id="${t.id}" data-pid="${p.id}" data-k="foireann" id="pf-${p.id}"><code title="Player login code">${esc(p.code)}</code><button class="btn sm" data-act="copyMe" data-id="${t.id}" data-pid="${p.id}">Copy link</button><button class="btn sm${A('nc'+p.id)}" data-act="newCode" data-id="${t.id}" data-pid="${p.id}">${ui.armed==='nc'+p.id?'Replace?':'New code'}</button><button class="btn sm${A('dp'+p.id)}" data-act="delPl" data-id="${t.id}" data-pid="${p.id}" aria-label="Remove player">${ui.armed==='dp'+p.id?'Remove?':'✕'}</button></div></div>`).join('')}
    <details class="grp"><summary><b>Import from registrar export</b></summary>
      <p class="legend">Paste rows from the Foireann registrar export: Foireann number, first name, surname, jersey number (comma or tab separated). Existing players are matched on Foireann number.</p>
      <textarea id="imp-${t.id}" rows="4" placeholder="40123456, Aoife, Brennan, 7"></textarea><div class="row"><button class="btn" data-act="importPl" data-id="${t.id}">Import</button></div></details>
    <div class="row"><button class="btn warn sm${A('dt'+t.id)}" data-act="delTeam" data-id="${t.id}">${ui.armed==='dt'+t.id?'Tap again: deletes team, fixtures and stats':'Delete this team'}</button></div>
  </section>`:''}`;
}

/* ========== render + boot ========== */
function render(){
  const u=me();
  const tabs=(isScorer()?[['live','Live'],['match','Matches']]:[['live','Live'],['match','Match'],['fixtures','Fixtures'],['stats','Stats']]).concat(isAdmin()?[['club','Club'],['admin','Admin']]:[]);
  if(!tabs.some(x=>x[0]===S.tab))S.tab=tabs[0][0];
  const nav=document.getElementById('nav');nav.innerHTML=tabs.map(([v,l])=>`<button data-act="tab" data-v="${v}" aria-current="${S.tab===v?'page':'false'}">${l}</button>`).join('');nav.hidden=false;
  document.getElementById('clubname').textContent=S.club;
  document.getElementById('badge').innerHTML=badgeHTML();
  const sel=document.getElementById('who');
  sel.innerHTML=S.users.map(x=>`<option value="${x.id}" ${x.id===u.id?'selected':''}>${esc(x.label)}</option>`).join('');
  document.getElementById('app').innerHTML=S.tab==='live'?vLive():S.tab==='fixtures'?vFixtures():S.tab==='stats'?vStats():S.tab==='club'?vClub():S.tab==='admin'?vAdmin():vMatch();
  tick();
}
(function boot(){
  S=loadDemo();S.teams.forEach(normTeam);
  if(S.active&&!active())S.active=null;
  render();
  const m=active();if(m&&m.clock.running&&canScore(m))keepAwake(true);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){const m=active();if(m&&m.clock.running&&canScore(m)){wake=null;keepAwake(true)}}});
  setInterval(()=>{if(S.tab==='live'&&document.visibilityState==='visible'&&document.getElementById('sheet').hidden){const keep={me:S.me,tab:S.tab};try{const f=JSON.parse(localStorage.getItem(DEMO_KEY)||'null');if(f&&f.v===S.v)S=Object.assign(f,keep)}catch(e){}render()}},5000);
  try{if('serviceWorker' in navigator&&location.protocol==='https:'&&window.top===window.self)navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}
})();
