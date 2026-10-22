/* ========== small chart helpers ========== */
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

/* ========== views ========== */
function vLogin(){
  return `<section class="panel login">
    <h2>Coaches &amp; managers</h2>
    <p class="muted">Sign in with your squad's coach PIN, or the club manager PIN.</p>
    <label class="f">PIN<input id="pin" type="password" inputmode="numeric" autocomplete="current-password" ${ui.busyLogin?'disabled':''}></label>
    ${ui.loginErr?`<p class="errtxt" role="alert">${esc(ui.loginErr)}</p>`:''}
    <button class="btn pri" data-act="login" ${ui.busyLogin?'disabled':''}>${ui.busyLogin?'Signing in…':'Sign in'}</button>
  </section>
  <section class="panel"><h3>Not a coach?</h3><div class="row"><a class="btn" href="/live">Live scores &amp; fixtures</a><a class="btn" href="/me">My player stats</a></div></section>
  <section class="panel"><h3>Have a look first</h3><p class="legend">Try the app with example squads and results. Nothing is shared.</p><div class="row"><button class="btn amb" data-act="demo">Try the demo</button></div></section>`;
}

function vMatch(){
  const m=active();
  if(!m){
    const up=S.fixtures.filter(f=>f.status==='upcoming'||f.status==='live').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,4);
    return `<section class="panel"><h2>Start a match</h2>
      ${up.length?up.map(f=>fxCard(f,true)).join(''):'<p class="muted">No upcoming fixtures. Add them under Fixtures, or start a quick match below.</p>'}</section>
    <section class="panel"><h3>Quick match</h3><div class="row">
      <label class="f">Squad<select id="q-team">${S.teams.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select></label>
      <label class="f">Opposition<input id="q-opp" placeholder="e.g. Shamrock Gaels"></label></div>
      <div class="row"><button class="btn pri" data-act="quick">Start match</button></div></section>`;
  }
  const t=team(m.teamId)||{name:'',players:[]};const c=m.clock;const us=score(m,'us'),th=score(m,'them');const F=footy(m.code),two=F&&m.arc,ko=KO(m.code);
  const runLbl=c.period===0?'Throw-in':c.running?'Time off':'Time on';
  const nextLbl=c.period===0?'Start 1st half':c.period===1?(ui.armed==='next'?'Confirm half time':'Half time'):c.period==='HT'?'Start 2nd half':c.period===2?(ui.armed==='next'?'Confirm full time':'Full time'):'Match over';
  const key=(side,type,cls,label,sm)=>`<button class="key ${cls||''}" data-act="ev" data-side="${side}" data-type="${type}">${label}${sm!==undefined&&sm!==''?`<small>${sm}</small>`:''}</button>`;
  const cnt=(side,type)=>m.events.filter(e=>e.side===side&&e.type===type).length;
  const n=(side,type)=>{const x=cnt(side,type);return x?String(x):''};
  const ms=matchSummary(m,'us'),mt=matchSummary(m,'them');
  const t45=m.events.filter(e=>e.side==='us'&&e.src==='45'&&SHOTS.includes(e.type));
  const log=[...m.events].reverse().map(e=>{
    let who=e.side==='them'?esc(m.opp):esc(pName(t,e.pid)||S.club);
    if(e.type==='sub')who=esc((pName(t,e.pid)||'?')+' off → '+(pName(t,e.onId)||'?')+' on');
    const extra=(e.src&&e.src!=='play'?' · '+esc(srcL(e.src,m.code)):'')+(hasLoc(e)?' · '+Math.round(distM(e))+'m '+sideOf(e).toLowerCase():'');
    const pts=isScore(e.type)?` <b class="num">+${EV[e.type].pts}</b>`:'';
    return `<div class="ev ${e.side}${isScore(e.type)&&e.side==='us'?' sc':''}"><div class="t">${halfTag(e.per)}<b>${e.per===1||e.per===2?minOf(e.sec,m.half):''}</b></div><div class="what"><b>${esc(lbl(e.type,m.code))}</b>${pts}${extra}<br><span>${who}</span></div>
      <button class="btn sm${A('del'+e.id)}" data-act="delEv" data-id="${e.id}" aria-label="Remove event">${ui.armed==='del'+e.id?'Remove?':'✕'}</button></div>`}).join('');
  const sl=m.events.filter(e=>e.side==='us'&&SHOTS.includes(e.type)).map(e=>({e,m}));
  return `<section class="board">
    <div class="sb">
      <div class="us">${crestImg(S.club,'big')}<div class="tn">${esc(S.club)}<small>${esc(t.name)}</small></div><div class="sc">${fmtS(us)}</div><div class="tot">(${us.t})</div></div>
      <div><div class="halfpill ${c.period===1?'h1':c.period===2?'':'ht0'}">${perLabel(c.period)}</div><div id="clk" class="clock${c.running?'':' paused'}">${clockHTML(m)}</div><div id="over" class="over"></div></div>
      <div class="them">${crestImg(m.opp,'big')}<div class="tn">${esc(m.opp)}<small>Opposition</small></div><div class="sc">${fmtS(th)}</div><div class="tot">(${th.t})</div></div>
    </div>
    <div id="alertbar" class="alertbar" hidden></div>
    ${c.period==='FT'?`<div class="row" style="justify-content:space-between"><span class="chip">Full time · result saved</span><button class="btn" data-act="closeMatch">Close match</button></div>`:
    `<div class="ctrl"><button class="btn ${c.running?'run-on':'run-off'}" data-act="run" ${c.period==='HT'?'disabled':''}>${runLbl}</button><button class="btn${A('next')}" data-act="next">${nextLbl}</button></div>
     <div class="row" style="justify-content:space-between"><div class="row"><button class="btn sm" data-act="adj" data-v="-10">−10s</button><button class="btn sm" data-act="adj" data-v="10">+10s</button><button class="btn sm" data-act="adj" data-v="60">+1 min</button></div>
     <label class="row muted" style="font-size:13px">Halves of <input type="number" min="1" max="45" value="${m.half}" data-chg="mhalf" style="width:60px" id="m-half"> min</label></div>`}
  </section>
  <section class="panel pad us">
    <div class="ph"><h2>${esc(S.club)}</h2><span class="muted num">${scores(ms)}/${shots(ms)} shots scored</span></div>
    <div class="grp"><h3>Scores</h3><div class="keys">${key('us','goal','score','Goal','3 pts · '+cnt('us','goal'))}${key('us','point','score','Point','1 pt · '+cnt('us','point'))}${two?key('us','two','score','2-pointer','2 pts · '+cnt('us','two')):''}</div></div>
    <div class="grp"><h3>Missed shots</h3><div class="keys">${key('us','wide','','Wide',n('us','wide'))}${key('us','short','','Short',n('us','short'))}${key('us','saved','','Saved',n('us','saved'))}${key('us','penmiss','','Pen miss',n('us','penmiss'))}</div></div>
    <div class="grp"><h3>${set45(m.code)}s</h3><div class="keys">${key('us','w45','',set45(m.code)+' won',n('us','w45'))}${key('us','t45','set',set45(m.code)+' taken',t45.length?t45.filter(e=>isScore(e.type)).length+'/'+t45.length+' scored':'side, result, taker')}</div></div>
    <div class="grp"><h3>Possession</h3><div class="keys">${key('us','pass','','Pass',n('us','pass'))}${key('us','tow','','TO won',n('us','tow'))}${key('us','tol','','TO lost',n('us','tol'))}${key('us','fwon','','Free won',n('us','fwon'))}${key('us','fcon','','Free given',n('us','fcon'))}</div></div>
    <div class="grp"><h3>Our ${ko}s</h3><div class="keys">${key('us','kow','','Won',n('us','kow'))}${key('us','kol','','Lost',n('us','kol'))}</div></div>
    <div class="grp"><h3>Their ${ko}s</h3><div class="keys">${key('us','okw','','We won',n('us','okw'))}${key('us','okl','','They kept',n('us','okl'))}</div></div>
    <div class="grp"><h3>Keeper</h3><div class="keys">${key('us','save','','Save',n('us','save'))}${key('us','pensave','','Pen saved',n('us','pensave'))}</div></div>
    <div class="grp"><h3>Discipline &amp; subs</h3><div class="keys">${key('us','yellow','y','Yellow',n('us','yellow'))}${hasBlack(m.code)?key('us','black','bk','Black',n('us','black')):''}${key('us','red','r','Red',n('us','red'))}${key('us','sub','sub','Sub',n('us','sub'))}</div></div>
  </section>
  <section class="panel pad them">
    <div class="ph"><h2>${esc(m.opp)}</h2><span class="muted num">${scores(mt)}/${shots(mt)} shots scored</span></div>
    <div class="keys">${key('them','goal','score','Goal',''+cnt('them','goal'))}${key('them','point','score','Point',''+cnt('them','point'))}${two?key('them','two','score','2-pointer',''+cnt('them','two')):''}${key('them','wide','','Wide',n('them','wide'))}${key('them','yellow','y','Yellow',n('them','yellow'))}${hasBlack(m.code)?key('them','black','bk','Black',n('them','black')):''}${key('them','red','r','Red',n('them','red'))}</div>
  </section>
  <section class="panel"><h3>This match</h3>
    <div class="kpis">
      <div class="kpi hi"><b>${pct(scores(ms),shots(ms))}</b><span>Shot conversion (${scores(ms)}/${shots(ms)})</span></div>
      <div class="kpi"><b>${ms.tow}–${ms.tol}</b><span>Turnovers won–lost</span></div>
      <div class="kpi"><b>${ms.kow}–${ms.kol}</b><span>Our ${ko}s won–lost</span></div>
      <div class="kpi"><b>${ms.okw}–${ms.okl}</b><span>Their ${ko}s: we won–they kept</span></div>
    </div>
    ${sl.some(x=>hasLoc(x.e))?`<div class="pitchbox">${pitchSVG({code:m.code,arc:m.arc,dots:shotDots(sl,t)})}</div>${pkey(two)}`:''}
  </section>
  <section class="panel"><div class="ph"><h3>Match log</h3>${c.period!=='FT'?`<button class="btn sm${A('close')}" data-act="closeMatch">${ui.armed==='close'?'Tap again to leave':'Leave match'}</button>`:''}</div>
    <div class="log">${log||'<p class="empty">Nothing logged yet. Tap Throw-in to start the clock, then tap a stat.</p>'}</div></section>`;
}

function fxCard(f,compact){
  const t=team(f.teamId);const d=new Date(f.date+'T12:00');
  if(!compact&&ui.editFx===f.id){
    return `<div class="fx"><div class="dt"><span>Edit</span></div><div class="body">
      <div class="row"><label class="f">Opposition<input id="e-opp-${f.id}" value="${esc(f.opp)}"></label><label class="f">Competition<input id="e-comp-${f.id}" value="${esc(f.comp||'')}"></label></div>
      <div class="row"><label class="f">Date<input id="e-date-${f.id}" type="date" value="${esc(f.date)}"></label><label class="f">Throw-in<input id="e-time-${f.id}" type="time" value="${esc(f.time||'')}"></label>
      <label class="f">Venue<select id="e-venue-${f.id}">${['Home','Away','Neutral'].map(v=>`<option ${f.venue===v?'selected':''}>${v}</option>`).join('')}</select></label></div>
      <div class="row"><button class="btn sm pri" data-act="saveFx" data-id="${f.id}">Save changes</button><button class="btn sm" data-act="editFx" data-id="${f.id}">Close</button>
      ${f.status==='upcoming'?`<button class="btn sm warn${A('cfx'+f.id)}" data-act="cancelFx" data-id="${f.id}">${ui.armed==='cfx'+f.id?'Tap to cancel fixture':'Cancel fixture'}</button>`:''}
      <button class="btn sm warn${A('dfx'+f.id)}" data-act="delFx" data-id="${f.id}">${ui.armed==='dfx'+f.id?'Tap to delete':'Delete'}</button></div>
      <p class="legend">Moving or cancelling a fixture shows up in the parents' updates. Delete removes it (and any stats) completely.</p></div></div>`;
  }
  const res=f.result&&f.status!=='upcoming'&&f.status!=='cancelled'?(()=>{const u=f.result.us,th=f.result.them;const k=u.t>th.t?'w':u.t<th.t?'l':'d';return `<span class="res">${fmtS(u)} (${u.t}) – ${fmtS(th)} (${th.t})</span> ${f.status==='played'?`<span class="chip ${k}">${k==='w'?'Won':k==='l'?'Lost':'Draw'}</span>`:''}`})():'';
  const btn=f.status==='cancelled'?'':f.status==='played'?`<button class="btn sm" data-act="startFx" data-id="${f.id}">Open match</button>`:f.status==='live'?`<button class="btn sm pri" data-act="startFx" data-id="${f.id}">Resume match</button>`:`<button class="btn sm pri" data-act="startFx" data-id="${f.id}">Start match</button>`;
  const moved=f.prev?`<span class="chip d">Moved from ${esc(new Date(f.prev.date+'T12:00').toLocaleDateString('en-IE',{day:'numeric',month:'short'}))}${f.prev.time&&f.prev.time!==f.time?' '+esc(f.prev.time):''}</span>`:'';
  return `<div class="fx${f.status==='cancelled'?' cancelled':''}"><div class="dt"><span>${d.toLocaleDateString('en-IE',{weekday:'short'})}</span><b>${d.getDate()}</b><span>${d.toLocaleDateString('en-IE',{month:'short'})}</span></div>
    <div class="body"><div class="opp">${crestImg(f.opp)}<span>${esc(t?t.name:'?')} v ${esc(f.opp)}</span></div>
    <div class="row"><span class="chip">${esc(f.venue||'')}</span>${f.time?`<span class="chip num">${esc(f.time)}</span>`:''}${f.comp?`<span class="chip">${esc(f.comp)}</span>`:''}${f.status==='live'?'<span class="chip live">Live</span>':''}${f.status==='cancelled'?'<span class="chip l">Cancelled</span>':''}${moved}${f.source?`<span class="chip src">${esc(f.source)}</span>`:''}${f.example?'<span class="chip">Example</span>':''}</div>
    ${f.ground||f.ref?`<p class="legend">${f.ground?esc(f.ground):''}${f.ground&&f.ref?' · ':''}${f.ref?'Ref: '+esc(f.ref):''}</p>`:''}
    ${res?`<div class="row">${res}</div>`:''}
    <div class="row">${btn}${compact?'':f.status==='cancelled'?`<button class="btn sm" data-act="cancelFx" data-id="${f.id}">Put back on</button>`:`<button class="btn sm" data-act="editFx" data-id="${f.id}">Edit</button>`}</div></div></div>`;
}

function vFixtures(){
  const today=ymd(new Date());if(!ui.month)ui.month=today.slice(0,7);
  const [y,mo]=ui.month.split('-').map(Number);const first=new Date(y,mo-1,1);const lead=(first.getDay()+6)%7;const days=new Date(y,mo,0).getDate();
  const list=S.fixtures.filter(f=>ui.teamF==='all'||f.teamId===ui.teamF);const byDay={};list.forEach(f=>{(byDay[f.date]=byDay[f.date]||[]).push(f)});
  let cells='';for(let i=0;i<lead;i++)cells+='<button class="blank" tabindex="-1" aria-hidden="true"></button>';
  for(let dd=1;dd<=days;dd++){const k=ui.month+'-'+pad(dd);const fs=byDay[k]||[];
    cells+=`<button data-act="day" data-v="${k}" class="${k===today?'today':''} ${k===ui.day?'sel':''}" aria-label="${dd}${fs.length?', '+fs.length+' fixtures':''}">${dd}<span class="dots">${fs.slice(0,3).map(f=>`<i class="${f.status==='played'?'p':f.status==='cancelled'?'x':''}"></i>`).join('')}</span></button>`}
  const shown=list.filter(f=>ui.day?f.date===ui.day:f.date.startsWith(ui.month)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  return `<section class="panel">
    <div class="row" style="justify-content:space-between"><button class="btn sm" data-act="month" data-v="-1" aria-label="Previous month">‹</button><h2>${first.toLocaleDateString('en-IE',{month:'long',year:'numeric'})}</h2><button class="btn sm" data-act="month" data-v="1" aria-label="Next month">›</button></div>
    ${S.teams.length>1?`<div class="seg"><button data-act="teamF" data-v="all" aria-pressed="${ui.teamF==='all'}">All squads</button>${S.teams.map(t=>`<button data-act="teamF" data-v="${t.id}" aria-pressed="${ui.teamF===t.id}">${esc(t.name)}</button>`).join('')}</div>`:''}
    <div class="cal">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="dow">${d}</div>`).join('')}${cells}</div>
    <p class="legend">Amber: upcoming. Grey: played. Red: cancelled. Tap a day to see its fixtures.</p></section>
  <section class="panel"><h3>${ui.day?new Date(ui.day+'T12:00').toLocaleDateString('en-IE',{weekday:'long',day:'numeric',month:'long'}):'This month'}</h3>
    ${shown.length?shown.map(f=>fxCard(f,false)).join(''):'<p class="empty">No fixtures here yet.</p>'}</section>
  ${S.mode==='server'&&isMgr()?vImport():''}
  ${S.teams.length?`<section class="panel"><h3>Add fixture</h3>
    <div class="row"><label class="f">Squad<select id="f-team">${S.teams.map(t=>`<option value="${t.id}" ${ui.teamF===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></label><label class="f">Opposition<input id="f-opp" placeholder="e.g. Tubbercurry"></label></div>
    <div class="row"><label class="f">Date<input id="f-date" type="date" value="${ui.day||today}"></label><label class="f">Throw-in<input id="f-time" type="time" value="11:00"></label></div>
    <div class="row"><label class="f">Venue<select id="f-venue"><option>Home</option><option>Away</option><option>Neutral</option></select></label><label class="f">Competition<input id="f-comp" placeholder="League, Cup, Blitz…"></label></div>
    <div class="row"><button class="btn pri" data-act="addFx">Add fixture</button></div></section>`:''}`;
}

function vImport(){
  const im=S.imports||{},last=im.last;const srv=S.mode==='server';
  const when=last?new Date(last.at).toLocaleString('en-IE',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):null;
  const groups={};(last&&last.unmatched||[]).forEach(u=>{(groups[u.key]=groups[u.key]||{comp:u.comp,items:[]}).items.push(u)});
  const keys=Object.keys(groups);
  return `<section class="panel"><div class="ph"><h3>Sligo GAA fixtures</h3><button class="btn sm pri" data-act="importNow" ${ui.importing?'disabled':''}>${ui.importing?'Checking…':'Check now'}</button></div>
    <p class="legend">${srv?`Every morning the site reads the <a href="https://www.sligogaa.ie/FixturesResultsAll.aspx" target="_blank" rel="noopener">Sligo GAA fixtures page</a> and adds ${esc(S.club)} fixtures to the right squad by age grade. Date, time or venue changes are marked as moved for parents.`:'Runs on your Netlify site: every morning it reads the Sligo GAA fixtures page and adds new fixtures to the right squad.'}</p>
    ${last?`<p class="legend">${last.error?`<b style="color:var(--bad)">Last check ${esc(when)} failed:</b> ${esc(last.error)}`:`Last checked ${esc(when)}: ${last.ours} ${esc(S.club)} fixture${last.ours===1?'':'s'} on the site, ${last.added} new, ${last.moved} moved.`}</p>`:srv?'<p class="legend">Not checked yet. Tap Check now.</p>':''}
    ${keys.map((k,i)=>`<div class="grp" style="border-top:1px solid var(--line);padding-top:10px"><b>${esc(groups[k].comp)}</b>
      <p class="legend">${groups[k].items.map(u=>esc(new Date(u.date+'T12:00').toLocaleDateString('en-IE',{day:'numeric',month:'short'})+' v '+u.opp)).join(' · ')}</p>
      <div class="row"><select id="imp-${i}" aria-label="Squad for ${esc(groups[k].comp)}"><option value="">Which squad is this?</option>${S.teams.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select><button class="btn sm" data-act="assignImp" data-i="${i}" data-key="${esc(k)}">Link</button></div></div>`).join('')}
    ${keys.length?'<p class="legend">These competitions didn’t match a squad by age grade. Link each one once and its fixtures will be added automatically from then on.</p>':''}
  </section>`;
}

function vStats(){
  if(!S.teams.length)return '<section class="panel"><p class="empty">No squads yet.</p></section>';
  if(!ui.statsTeam||!team(ui.statsTeam))ui.statsTeam=S.teams[0].id;
  const t=team(ui.statsTeam);const st=teamStats(t.id);const T=st.tot;const F=footy(t.code),two=F&&t.arc,ko=KO(t.code),s45=set45(t.code);
  const P=st.P||1;
  // shots, filtered for the map and breakdowns
  const all=[];for(const m of st.ms)for(const e of m.events)if(e.side==='us'&&SHOTS.includes(e.type))all.push({e,m});
  const fl=all.filter(x=>(ui.mapSrc==='all'||(x.e.src||'play')===ui.mapSrc)&&(ui.mapPl==='all'||x.e.pid===ui.mapPl));
  const located=fl.filter(x=>hasLoc(x.e));
  const bands=BANDS(t.code,two).map((l,i)=>{const r=located.filter(x=>bandOf(x.e,x.m.code)===i);return{l,a:r.length,s:r.filter(x=>isScore(x.e.type)).length}});
  const sides=['Left','Centre','Right'].map(l=>{const r=located.filter(x=>sideOf(x.e)===l);return{l,a:r.length,s:r.filter(x=>isScore(x.e.type)).length}});
  const srcs=Object.keys(SRC).filter(k=>F||k!=='mark').map(k=>{const r=all.filter(x=>(x.e.src||'play')===k);return{k,l:srcL(k,t.code),a:r.length,s:r.filter(x=>isScore(x.e.type)).length}}).filter(r=>r.a);
  const maxB=Math.max(1,...bands.map(b=>b.a));
  // 45s
  const f45=all.filter(x=>x.e.src==='45');
  const s45sides=['Left','Centre','Right'].map(l=>{const r=f45.filter(x=>hasLoc(x.e)&&sideOf(x.e)===l);return{l,a:r.length,s:r.filter(x=>isScore(x.e.type)).length}});
  const takers={};f45.forEach(x=>{const k=x.e.pid||'';(takers[k]=takers[k]||{a:0,s:0}).a++;if(isScore(x.e.type))takers[k].s++});
  // players
  const rows=st.rows.filter(r=>r.games.size).sort((a,b)=>b.ptsTotal-a.ptsTotal||b.goal-a.goal||a.p.num-b.p.num);
  const topMax=Math.max(1,...rows.map(r=>r.ptsTotal));
  const sc=r=>`${r.goal}-${pad(r.point+2*r.two)}`;
  const cols=[['G','goal'],['P','point']].concat(two?[['2P','two'],['2P att','twoAtt']]:[]).concat([['Fr','free'],[s45+'s','t45x'],['Pen','pen'],['Wd','wide'],['Sh','short'],['Svd','saved'],['Pass','pass'],['TOW','tow'],['TOL','tol'],['FW','fwon'],['FG','fcon'],['Save','save'],['Y','yellow']]).concat(hasBlack(t.code)?[['B','black']]:[]).concat([['R','red']]);
  const cell=(r,k)=>k==='t45x'?(r.t45?r.s45+'/'+r.t45:''):(r[k]||'');
  const played=S.fixtures.filter(f=>f.teamId===t.id&&f.status==='played').sort((a,b)=>b.date.localeCompare(a.date));
  const form=st.games.slice(-5);
  return `<section class="panel">
    <div class="ph"><h2>${esc(t.name)}</h2><span class="chip">${esc(assocOf(t).l)} · ${esc(t.grade)}</span></div>
    ${S.teams.length>1?`<div class="seg">${S.teams.map(x=>`<button data-act="statsTeam" data-v="${x.id}" aria-pressed="${x.id===t.id}">${esc(x.name)}</button>`).join('')}</div>`:''}
    <div class="kpis">
      <div class="kpi hi"><b>${st.W}-${st.D}-${st.L}</b><span>Won-drawn-lost · ${st.P} played</span></div>
      <div class="kpi"><b>${st.P?(st.For/st.P).toFixed(1):'–'} <small style="font-size:16px;color:var(--muted)">v ${st.P?(st.Ag/st.P).toFixed(1):'–'}</small></b><span>Avg points scored v conceded</span></div>
      <div class="kpi am"><b>${pct(scores(T),shots(T))}</b><span>Shot conversion (${scores(T)}/${shots(T)})</span></div>
      <div class="kpi"><b>${T.tow-T.tol>0?'+':''}${T.tow-T.tol}</b><span>Turnover difference (${T.tow} won, ${T.tol} lost)</span></div>
    </div>
    ${form.length?`<div class="row"><h3>Form</h3><div class="form">${form.map(g=>`<span class="${g.k}" title="${esc(fmtS(g.u)+' – '+fmtS(g.th)+' v '+g.m.opp)}">${g.k}</span>`).join('')}</div></div>`:''}
  </section>
  <section class="panel"><h3>Scores for and against</h3>${formChart(st.games)}</section>
  <section class="panel"><div class="ph"><h3>Shot map</h3><span class="legend">${located.length} of ${fl.length} shots have a location</span></div>
    <div class="row"><div class="seg">${[['all','All'],['play','From play'],['free','Frees'],['45',s45+'s'],['pen','Penalties']].map(([k,l])=>`<button data-act="mapSrc" data-v="${k}" aria-pressed="${ui.mapSrc===k}">${l}</button>`).join('')}</div>
    <select id="map-pl" data-chg="mapPl" aria-label="Player"><option value="all">All players</option>${t.players.map(p=>`<option value="${p.id}" ${ui.mapPl===p.id?'selected':''}>#${p.num} ${esc(p.name)}</option>`).join('')}</select></div>
    <div class="grid2"><div><div class="pitchbox">${pitchSVG({code:t.code,arc:two,dots:shotDots(fl,t)})}</div>${pkey(two)}</div>
    <div class="bars"><h3>By distance</h3>${bands.map(b=>barRow(b.l,b.a,maxB,b.a?`${b.s}/${b.a} <span class="pc">${pct(b.s,b.a)}</span>`:'–','a')).join('')}
      <h3 style="margin-top:6px">By side</h3>${sides.map(b=>barRow(b.l,b.a,maxB,b.a?`${b.s}/${b.a} <span class="pc">${pct(b.s,b.a)}</span>`:'–')).join('')}</div></div>
  </section>
  <div class="grid2">
    <section class="panel"><h3>Shooting by source</h3>
      <div class="tw"><table><thead><tr><th>Source</th><th>Shots</th><th>Scored</th><th>%</th></tr></thead><tbody>
      ${srcs.map(r=>`<tr><td>${esc(r.l)}</td><td>${r.a}</td><td>${r.s}</td><td>${pct(r.s,r.a)}</td></tr>`).join('')||'<tr><td colspan="4">No shots yet</td></tr>'}
      ${two?`<tr><td><b>2-point attempts</b></td><td>${T.twoAtt}</td><td>${T.two}</td><td>${pct(T.two,T.twoAtt)}</td></tr>`:''}
      </tbody></table></div>
      <p class="legend">${two?'2-point attempts are shots from outside the 40m arc, plus any 2-pointers logged without a location. ':''}Wides ${T.wide} · Short ${T.short} · Saved ${T.saved}${T.penmiss?' · Pens missed '+T.penmiss:''}</p>
    </section>
    <section class="panel"><h3>${s45}s</h3>
      <div class="kpis"><div class="kpi am"><b>${f45.filter(x=>isScore(x.e.type)).length}/${f45.length}</b><span>${s45}s scored (${pct(f45.filter(x=>isScore(x.e.type)).length,f45.length)})</span></div><div class="kpi"><b>${T.w45}</b><span>${s45}s won</span></div></div>
      <div class="bars">${s45sides.map(b=>barRow(b.l+' side',b.a,Math.max(1,...s45sides.map(x=>x.a)),b.a?`${b.s}/${b.a}`:'–','a')).join('')}</div>
      ${Object.keys(takers).length?`<p class="legend">Takers: ${Object.entries(takers).map(([pid,v])=>esc(pid?(pName(t,pid)||'?'):'Not recorded')+' '+v.s+'/'+v.a).join(' · ')}</p>`:'<p class="legend">No '+s45+'s taken yet.</p>'}
    </section>
  </div>
  <section class="panel"><h3>Possession &amp; restarts</h3>
    ${splitBar('Turnovers','Won',T.tow,'Lost',T.tol)}
    ${splitBar('Our '+ko+'s','Won',T.kow,'Lost',T.kol)}
    ${splitBar('Their '+ko+'s','We won',T.okw,'They kept',T.okl)}
    ${splitBar('Frees','Won',T.fwon,'Given',T.fcon)}
    <p class="legend">${T.pass} passes logged (${(T.pass/P).toFixed(1)} a match). Our ${ko} retention ${pct(T.kow,T.kow+T.kol)}; won ${pct(T.okw,T.okw+T.okl)} of theirs.</p>
  </section>
  <section class="panel"><h3>Top scorers</h3><div class="bars">${rows.filter(r=>r.ptsTotal).slice(0,8).map(r=>barRow(esc('#'+r.p.num+' '+r.p.name),r.ptsTotal,topMax,`${sc(r)} <span class="pc">(${r.ptsTotal})</span>`)).join('')||'<p class="empty">No scores yet.</p>'}</div></section>
  <section class="panel"><h3>Player stats</h3>
    ${rows.length?`<div class="tw"><table><thead><tr><th>Player</th><th>Gms</th><th>Score</th><th>Shots</th>${cols.map(c=>`<th>${c[0]}</th>`).join('')}<th>On/Off</th></tr></thead><tbody>
      ${rows.map(r=>`<tr><td>#${r.p.num} ${esc(r.p.name)}</td><td>${r.games.size}</td><td><b>${sc(r)}</b> (${r.ptsTotal})</td><td>${scores(r)}/${shots(r)}<span class="pc">${pct(scores(r),shots(r))}</span></td>${cols.map(c=>`<td>${cell(r,c[1])}</td>`).join('')}<td>${r.subOn||r.subOff?r.subOn+'/'+r.subOff:''}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="legend">Gms = matches with a logged action. Fr and Pen = scores from frees and penalties. ${s45}s = scored/taken. Sh = dropped short, Svd = saved or blocked, FW/FG = frees won/given.</p>`
    :'<p class="empty">No player stats yet for this squad. Start a match to begin logging.</p>'}</section>
  <section class="panel"><h3>Results</h3>${played.length?played.map(f=>fxCard(f,true)).join(''):'<p class="empty">No results yet.</p>'}</section>`;
}

function vClub(){
  const today=ymd(new Date());
  const data=S.teams.map(t=>{const st=teamStats(t.id);return{t,st,top:st.rows.filter(r=>r.ptsTotal).sort((a,b)=>b.ptsTotal-a.ptsTotal)[0],
    next:S.fixtures.filter(f=>f.teamId===t.id&&f.status==='upcoming'&&f.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))[0],
    live:S.fixtures.find(f=>f.teamId===t.id&&f.status==='live')}});
  const tot=data.reduce((a,d)=>({W:a.W+d.st.W,D:a.D+d.st.D,L:a.L+d.st.L,P:a.P+d.st.P}),{W:0,D:0,L:0,P:0});
  return `<section class="panel"><h2>Club overview</h2>
    <div class="kpis"><div class="kpi hi"><b>${tot.W}-${tot.D}-${tot.L}</b><span>All squads · ${tot.P} played</span></div>
      <div class="kpi"><b>${S.teams.length}</b><span>Squads</span></div>
      <div class="kpi am"><b>${S.fixtures.filter(f=>f.status==='upcoming'&&f.date>=today).length}</b><span>Upcoming fixtures</span></div>
      <div class="kpi"><b>${data.filter(d=>d.live).length}</b><span>Live now</span></div></div>
    ${data.length?`<div class="tw"><table class="sq-table"><thead><tr><th>Squad</th><th>P</th><th>W-D-L</th><th>Avg for</th><th>Avg ag</th><th>Shots %</th><th>TO +/-</th><th>Form</th></tr></thead><tbody>
      ${data.map(({t,st})=>`<tr><td>${esc(t.name)}</td><td>${st.P}</td><td>${st.W}-${st.D}-${st.L}</td><td>${st.P?(st.For/st.P).toFixed(1):'–'}</td><td>${st.P?(st.Ag/st.P).toFixed(1):'–'}</td><td>${pct(scores(st.tot),shots(st.tot))}</td><td>${st.tot.tow-st.tot.tol>0?'+':''}${st.tot.tow-st.tot.tol}</td><td>${st.games.slice(-5).map(g=>g.k).join(' ')||'–'}</td></tr>`).join('')}
    </tbody></table></div>`:''}
  </section>
  <div class="grid2">${data.map(({t,st,top,next,live})=>`<article class="panel">
      <div class="ph"><h2>${esc(t.name)}</h2><div class="row">${live?'<span class="chip live">Live now</span>':''}${S.mode==='server'?(t.hasCoachPin?'<span class="chip w">Coach PIN set</span>':'<span class="chip l">No coach PIN</span>'):''}</div></div>
      <p class="legend">${esc(assocOf(t).l)} · ${esc(t.grade)} · ${t.half} min halves${footy(t.code)&&t.arc?' · 2-point arc':''}</p>
      ${st.games.length?`<div class="form">${st.games.slice(-5).map(g=>`<span class="${g.k}">${g.k}</span>`).join('')}</div>`:''}
      <div class="bars">${barRow('Shot conversion',pctN(scores(st.tot),shots(st.tot)),100,pct(scores(st.tot),shots(st.tot)),'a')}${barRow('Own '+KO(t.code)+'s',pctN(st.tot.kow,st.tot.kow+st.tot.kol),100,pct(st.tot.kow,st.tot.kow+st.tot.kol))}</div>
      <p class="legend">${top?'Top scorer: '+esc('#'+top.p.num+' '+top.p.name)+' '+top.goal+'-'+pad(top.point+2*top.two)+'. ':''}${next?'Next: v '+esc(next.opp)+', '+new Date(next.date+'T12:00').toLocaleDateString('en-IE',{weekday:'short',day:'numeric',month:'short'})+(next.time?' '+esc(next.time):''):'No upcoming fixture.'}</p>
      <div class="row"><button class="btn sm pri" data-act="statsTeam" data-v="${t.id}">Full stats</button></div></article>`).join('')||'<section class="panel"><p class="empty">No squads yet. Add one under Squads.</p></section>'}</div>`;
}

function vSquads(){
  if(!ui.squadTeam||!team(ui.squadTeam))ui.squadTeam=S.teams[0]&&S.teams[0].id;
  const t=team(ui.squadTeam);const srv=S.mode==='server';
  const roleTxt=S.mode==='demo'?'Demo mode: example data on this phone only. Nothing is shared.':isMgr()?'Signed in as club manager: all squads.':'Signed in as coach: '+S.teams.map(x=>x.name).join(', ')+'.';
  const a=t&&assocOf(t);const gnote=t&&(a.grades.find(g=>g[0]===t.grade)||[])[2];
  return `<section class="panel"><h3>About this demo</h3>
    <p class="legend">Results, dates, opponents and venues are real 2026 Owenmore Gaels fixtures. Players and the minute-by-minute stats behind each score are invented examples. Everything you change is saved on this device only.</p>
    <div class="row"><a class="btn" href="live.html">Parents' page</a><a class="btn" href="me.html">Player page</a><button class="btn warn${A('reset')}" data-act="resetDemo">${ui.armed==='reset'?'Tap again to reset':'Reset demo'}</button></div></section>
  <section class="panel"><h3>Parents' link</h3><p class="legend">Live score, clock, subs and fixture changes. On the live site you'd share it in the club WhatsApp group.</p>
    <div class="row"><input id="l-link" readonly value="${esc(new URL('live.html',location.href).href)}" style="flex:1 1 200px" aria-label="Parents link"><button class="btn" data-act="copyLink">Copy</button></div></section>
  ${isMgr()?`<section class="panel"><h3>Club</h3>
    <div class="logo-row"><div class="badge">${badgeHTML()}</div>
      <label class="btn">${logoSrc()?'Change badge':'Upload club badge'}<input id="logo-file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" data-chg="logo" hidden></label>
      ${logoSrc()?`<button class="btn sm warn${A('dlogo')}" data-act="delLogo">${ui.armed==='dlogo'?'Tap to remove':'Remove'}</button>`:''}</div>
    <p class="legend">The badge appears on the coach app, the parents' page and player pages. A square PNG with a transparent or white background works best.</p>
    <label class="f">Club name<input id="club" value="${esc(S.club)}" data-chg="club"></label></section>`:''}
  <section class="panel"><div class="seg">${S.teams.map(x=>`<button data-act="squadTeam" data-v="${x.id}" aria-pressed="${t&&x.id===t.id}">${esc(x.name)}</button>`).join('')}${isMgr()?'<button data-act="addTeam">+ Add squad</button>':''}</div></section>
  ${t?`<section class="panel">
    <div class="row"><label class="f">Squad name<input id="t-name" value="${esc(t.name)}" data-chg="team" data-id="${t.id}" data-k="name"></label>
      <label class="f">Association<select id="t-assoc" data-chg="team" data-id="${t.id}" data-k="assoc">${Object.entries(ASSOC).map(([k,v])=>`<option value="${k}" ${t.assoc===k?'selected':''}>${esc(v.l)}</option>`).join('')}</select></label></div>
    <div class="row"><label class="f">Age grade<select id="t-grade" data-chg="team" data-id="${t.id}" data-k="grade">${a.grades.map(g=>`<option ${t.grade===g[0]?'selected':''}>${esc(g[0])}</option>`).join('')}</select></label>
      <label class="f">Half length (min)<input id="t-half" type="number" min="1" max="45" value="${t.half}" data-chg="team" data-id="${t.id}" data-k="half"></label></div>
    ${footy(t.code)?`<label class="row" style="gap:10px"><input id="t-arc" type="checkbox" ${t.arc?'checked':''} data-chg="team" data-id="${t.id}" data-k="arc"> <span>2-point arc in use (scores from outside 40m count 2; ${t.code==='ladies'?'LGFA':'GAA'} 45s scored count 2)</span></label>`:''}
    <p class="legend">${esc(a.l)} ${esc(t.grade)}: default ${gradeHalf(t)} min halves${gnote?' ('+esc(gnote)+')':''}. ${t.assoc==='lgfa'?'LGFA rules set 30-minute halves from U14 up; younger grades follow county and Go Games rules.':'Go Games grades (U7–U11) use short halves and small-sided games.'} Check your county board's rules and change the half length if needed.</p>
    <label class="f">Names on the parents' page<select id="t-names" data-chg="team" data-id="${t.id}" data-k="names"><option value="num" ${(t.names||'num')==='num'?'selected':''}>Numbers only</option><option value="first" ${t.names==='first'?'selected':''}>Number + first name</option><option value="full" ${t.names==='full'?'selected':''}>Number + full name</option></select></label>
    <p class="legend">The parents' page is public, so check the club's safeguarding policy before showing under-age players' names.</p>
    ${isMgr()&&S.mode==='server'?`<div class="grp"><h3>Coach PIN for ${esc(t.name)}</h3>
      <div class="row"><input id="cpin-${t.id}" type="password" inputmode="numeric" placeholder="${t.hasCoachPin?'Set a new PIN (6–10 digits)':'6–10 digits'}" style="flex:1 1 160px" aria-label="Coach PIN"><button class="btn" data-act="setPin" data-id="${t.id}">${t.hasCoachPin?'Change PIN':'Set PIN'}</button></div>
      <p class="legend">${t.hasCoachPin?'A coach PIN is set. Changing it signs other coaches out of this squad.':'Coaches can’t sign in to this squad until you set a PIN.'}</p></div>`:''}
  </section>
  <section class="panel"><div class="ph"><h3>Players (${t.players.length})</h3><div class="row"><button class="btn sm" data-act="copyAllCodes" data-id="${t.id}">Copy all player links</button><button class="btn sm pri" data-act="addPl" data-id="${t.id}">+ Add player</button></div></div>
    <p class="legend">Each player has a private code. Their link opens a page with only their own stats.</p>
    ${t.players.map(p=>`<div class="prow2"><input type="number" min="1" max="99" value="${p.num}" aria-label="Number" data-chg="pl" data-id="${t.id}" data-pid="${p.id}" data-k="num" id="pn-${p.id}"><input class="pname" value="${esc(p.name)}" placeholder="Player name" aria-label="Name" data-chg="pl" data-id="${t.id}" data-pid="${p.id}" data-k="name" id="pm-${p.id}">
      <div class="pcode"><code>${esc(p.code||'')}</code><button class="btn sm" data-act="copyMe" data-id="${t.id}" data-pid="${p.id}">Copy link</button><button class="btn sm${A('nc'+p.id)}" data-act="newCode" data-id="${t.id}" data-pid="${p.id}">${ui.armed==='nc'+p.id?'Replace code?':'New code'}</button><button class="btn sm${A('dp'+p.id)}" data-act="delPl" data-id="${t.id}" data-pid="${p.id}" aria-label="Remove player">${ui.armed==='dp'+p.id?'Remove?':'✕'}</button></div></div>`).join('')||'<p class="empty">No players yet.</p>'}
    ${isMgr()?`<div class="row"><button class="btn warn sm${A('dt'+t.id)}" data-act="delTeam" data-id="${t.id}">${ui.armed==='dt'+t.id?'Tap again: deletes squad, fixtures and stats':'Delete this squad'}</button></div>`:''}
  </section>`:`<section class="panel"><p class="empty">${isMgr()?'No squads yet. Tap + Add squad.':'No squads linked to your PIN.'}</p></section>`}
  <section class="panel"><h3>Backup</h3>
    <p class="legend">${srv?'Everything syncs to the club site. A backup copy is still handy at the end of the season.':'Demo data lives on this phone only.'}</p>
    <textarea id="bk" rows="3" placeholder="Paste a backup here to restore">${esc(ui.backup)}</textarea>
    <div class="row"><button class="btn" data-act="backup">Copy backup</button><button class="btn${A('restore')}" data-act="restore">${ui.armed==='restore'?'Tap again to replace data':'Restore backup'}</button></div></section>`;
}

function render(){
  const signedIn=true;
  const nav=document.getElementById('nav');nav.hidden=!signedIn;
  if(signedIn){
    const tabs=[['match','Match'],['fixtures','Fixtures'],['stats','Stats']].concat(isMgr()?[['club','Club']]:[]).concat([['squads','Squads']]);
    if(!tabs.some(x=>x[0]===S.tab))S.tab='match';
    nav.innerHTML=tabs.map(([v,l])=>`<button data-act="tab" data-v="${v}" aria-current="${S.tab===v?'page':'false'}">${l}</button>`).join('');
  }
  document.getElementById('clubname').textContent=S.club;
  document.getElementById('badge').innerHTML=badgeHTML();
  const m=signedIn&&active();
  document.getElementById('sub').innerHTML=m?'Live: v '+esc(m.opp):'Demo · <a href="live.html">Parents</a> · <a href="me.html">Players</a>';
  const app=document.getElementById('app');
  app.innerHTML=!signedIn?vLogin():S.tab==='fixtures'?vFixtures():S.tab==='stats'?vStats():S.tab==='club'?vClub():S.tab==='squads'?vSquads():vMatch();
  tick();setSync(sync.state,sync.msg);
}

/* ========== boot ========== */
(function boot(){
  S=loadDemo();S.mode='demo';S.role='manager';
  S.teams.forEach(normTeam);
  if(S.active&&!active())S.active=null;
  render();
  if(active()&&active().clock.running)keepAwake(true);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){const m=active();if(m&&m.clock.running){wake=null;keepAwake(true)}}});

})();
