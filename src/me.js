const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const KEY='owenmore-gaels-player-code';
const st={get(){try{return localStorage.getItem(KEY)||''}catch(e){return ''}},set(v){try{v?localStorage.setItem(KEY,v):localStorage.removeItem(KEY)}catch(e){}}};
const initials=n=>String(n||'').split(/\s+/).filter(w=>/^[A-Za-zÀ-ž]/.test(w)).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'GAA';
let err='',busy=false,demo=false;
const app=document.getElementById('app');
const clean=c=>String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
const footy=c=>c!=='hurling';
const isScore=t=>t==='goal'||t==='point'||t==='two';
/* pitch: metres, attacking goal at top */
function pitchSVG(code,arc,shots){
  const D=footy(code)?55:70,S=4,w=320,h=D*S,X=m=>m*S;
  let s=`<svg class="pitch" viewBox="0 0 ${w} ${h}" role="img" aria-label="Your shots, attacking goal at the top"><rect class="grass" x="0" y="0" width="${w}" height="${h}"/>`;
  s+=`<rect class="ln" x="${X(30.5)}" y="0" width="${X(19)}" height="${X(13)}"/><rect class="ln" x="${X(33)}" y="0" width="${X(14)}" height="${X(4.5)}"/><path class="ln" d="M${X(27)} ${X(20)} A${X(13)} ${X(13)} 0 0 0 ${X(53)} ${X(20)}"/>`;
  for(const m of[13,20,45,65])if(m<D)s+=`<line class="ln" x1="0" y1="${X(m)}" x2="${w}" y2="${X(m)}"/><text class="lbl" x="${w-4}" y="${X(m)-4}" text-anchor="end">${m}m</text>`;
  if(footy(code)&&arc)s+=`<path class="arc" d="M0 0 A${X(40)} ${X(40)} 0 0 0 ${w} 0"/>`;
  s+=`<line class="post" x1="${X(36.75)}" y1="2" x2="${X(43.25)}" y2="2"/>`;
  for(const e of shots)s+=`<circle class="${e.type==='goal'?'dot-g':e.type==='two'?'dot-2':e.type==='point'?'dot-s':'dot-m'}" cx="${e.lx*S}" cy="${e.ly*S}" r="${e.type==='goal'?7:5.5}"/>`;
  return s+'</svg>';
}
function badge(){document.getElementById('badge').innerHTML=`<img src="${OWN_BADGE}" alt="">`}

function vCode(){
  const S=loadDemo();
  app.innerHTML=`<section class="panel"><h2>My stats</h2>
    <p class="legend">On the live site each player opens this page with a private code from their coach and sees only their own stats. In the demo, pick any player or type a code from the coach app (Squads tab).</p>
    <label class="code">Player code<input id="code" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC123"></label>
    ${err?`<p class="err" role="alert">${esc(err)}</p>`:''}
    <div class="row"><button class="btn pri" id="go">Show my stats</button></div></section>
  ${S.teams.map(t=>`<section class="panel"><h3>${esc(t.name)}</h3><div class="pickgrid">${t.players.map(p=>`<button class="pick" data-code="${esc(p.code)}"><b>${p.num}</b><span>${esc(p.name)}</span></button>`).join('')}</div></section>`).join('')}`;
  const i=document.getElementById('code');
  document.getElementById('go').onclick=()=>look(i.value);
  i.onkeydown=e=>{if(e.key==='Enter')look(i.value)};
  app.querySelectorAll('[data-code]').forEach(b=>b.onclick=()=>look(b.dataset.code));
}
function look(code){
  code=clean(code);if(code.length!==6){err='Codes are 6 letters and numbers.';vCode();return}
  const j=demoPlayer(loadDemo(),code);
  if(!j){err='That code doesn\u2019t match a player.';st.set('');vCode();return}
  err='';st.set(code);history.replaceState(null,'','?code='+code);show(j);window.scrollTo(0,0);
}

function show(d){
  document.getElementById('club').textContent=d.club;document.title='My '+d.club+' Stats';badge(d.club,d.logoVer);
  const t=d.total,F=footy(d.code),s45=F?'45':'65',arc=F&&d.arc;
  const shotsTaken=t.goal+t.point+t.two+t.wide+t.short+t.saved+t.penmiss,scoresN=t.goal+t.point+t.two;
  const located=(d.shots||[]).filter(e=>typeof e.lx==='number');
  const line=l=>{const ps=[];
    if(l.goal||l.point||l.two)ps.push(`<span class="pill s">${l.scoreG}-${pad(l.scoreP)}</span>`);
    const add=(n,lab,cls)=>{if(n)ps.push(`<span class="pill ${cls||''}">${n} ${lab}</span>`)};
    add(l.wide,l.wide===1?'wide':'wides');add(l.short,'short');add(l.saved,'saved');add(l.t45,s45+(l.t45===1?'':'s')+' taken');add(l.pass,l.pass===1?'pass':'passes');add(l.tow,'TO won');add(l.tol,'TO lost');
    add(l.fwon,'frees won');add(l.fcon,'frees given');add(l.save+l.pensave,l.save+l.pensave===1?'save':'saves');add(l.yellow,'yellow','y');add(l.black,'black');add(l.red,'red','rd');
    if(l.subOn)ps.push('<span class="pill">Came on</span>');if(l.subOff)ps.push('<span class="pill">Subbed off</span>');
    return ps.join('')||'<span class="pill">Played</span>'};
  app.innerHTML=`<div class="banner"><b>Demo.</b> Real 2026 results; the player and their stats are invented examples.</div>
  <section class="hero">
    <div class="who"><div class="num">${esc(d.player.num)}</div><div><b>${esc(d.player.name||'Player')}</b><span>${esc(d.squad)} · ${d.games} ${d.games===1?'match':'matches'} with stats</span></div></div>
    <div class="season"><b>${t.scoreG}-${pad(t.scoreP)}</b><span>season total · ${t.pts} pts</span></div>
  </section>
  <section class="panel"><div class="kpis">
    <div class="kpi hi"><b>${shotsTaken?Math.round(scoresN*100/shotsTaken)+'%':'–'}</b><span>Shots scored (${scoresN}/${shotsTaken})</span></div>
    ${arc?`<div class="kpi am"><b>${t.two}/${t.twoAtt||0}</b><span>2-pointers scored/tried</span></div>`:''}
    <div class="kpi"><b>${t.s45||0}/${t.t45||0}</b><span>${s45}s scored/taken</span></div>
    <div class="kpi"><b>${t.fromFree}</b><span>Scores from frees</span></div>
    <div class="kpi"><b>${t.wide}</b><span>Wides</span></div>
    <div class="kpi"><b>${t.pass}</b><span>Passes</span></div>
    <div class="kpi"><b>${t.tow}–${t.tol}</b><span>Turnovers won–lost</span></div>
    <div class="kpi"><b>${t.fwon}–${t.fcon}</b><span>Frees won–given</span></div>
    ${t.save+t.pensave?`<div class="kpi"><b>${t.save+t.pensave}</b><span>Saves (${t.pensave} pen)</span></div>`:''}
    <div class="kpi"><b>${t.yellow}/${d.code==='football'?t.black+'/':''}${t.red}</b><span>Cards Y/${d.code==='football'?'B/':''}R</span></div>
  </div></section>
  ${located.length?`<section class="panel"><h3>My shot map</h3><div class="pitchbox">${pitchSVG(d.code,arc,located)}</div>
    <div class="pkey"><span><i class="g"></i>Goal</span><span><i class="s"></i>Point</span>${arc?'<span><i class="two"></i>2-pointer</span>':''}<span><i class="m"></i>Missed</span></div></section>`:''}
  <section class="panel"><h3>Match by match</h3>
    ${d.matches.length?d.matches.map(g=>{const a=g.result.us,b=g.result.them;const k=a.t>b.t?'W':a.t<b.t?'L':'D';
      return `<div class="game"><div class="o"><b>v ${esc(g.opp)}</b><span>${new Date(g.date+'T12:00').toLocaleDateString('en-IE',{weekday:'short',day:'numeric',month:'short'})}${g.comp?' · '+esc(g.comp):''}</span></div>
      <div class="r">${a.g}-${pad(a.p)} – ${b.g}-${pad(b.p)}<span class="w-${g.final?k:'D'}">${g.final?(k==='W'?'Won':k==='L'?'Lost':'Draw'):'In progress'}</span></div><div class="line">${line(g.line)}</div></div>`}).join(''):'<p class="empty">No stats logged for you yet. They appear after your next match.</p>'}
  </section>
  <div class="row"><button class="btn" id="out">Not you? Use a different code</button></div>`;
  document.getElementById('out').onclick=()=>{st.set('');demo=false;err='';history.replaceState(null,'',location.pathname);vCode()};
}
function showDemo(){
  demo=true;const z=()=>({goal:0,point:0,two:0,wide:0,short:0,saved:0,penmiss:0,pass:0,tow:0,tol:0,fwon:0,fcon:0,kow:0,kol:0,okw:0,okl:0,w45:0,save:0,pensave:0,yellow:0,black:0,red:0,sub:0,scoreG:0,scoreP:0,pts:0,fromFree:0,from45:0,fromPen:0,subOn:0,subOff:0,t45:0,s45:0,twoAtt:0});
  const l1=Object.assign(z(),{goal:2,scoreG:2,pts:6,fromPen:1,saved:1}),l2=Object.assign(z(),{point:2,two:1,scoreP:4,pts:4,wide:1,pass:3,tow:1,twoAtt:2,t45:1,s45:1});
  const tot=z();for(const l of[l1,l2])for(const k in tot)tot[k]+=l[k];
  show({club:'Owenmore Gaels',squad:'U14 Boys',code:'football',arc:true,player:{num:14,name:'Example player'},games:2,total:tot,
    shots:[{type:'goal',lx:38,ly:9},{type:'goal',lx:40,ly:11},{type:'saved',lx:45,ly:15},{type:'point',lx:30,ly:22},{type:'point',lx:52,ly:24},{type:'two',lx:62,ly:38},{type:'wide',lx:18,ly:42},{type:'two',lx:20,ly:45}],
    matches:[{date:'2026-10-25',opp:'Coolera/Strandhill',comp:'League',result:{us:{g:1,p:8,t:11},them:{g:1,p:5,t:8}},final:false,line:l2},
      {date:'2026-10-17',opp:'Tourlestrane',comp:'League',result:{us:{g:2,p:10,t:16},them:{g:2,p:4,t:10}},final:true,line:l1}]});
}
badge(null,null);
const q=clean(new URLSearchParams(location.search).get('code'));
const saved=q||st.get();
if(saved)look(saved);else vCode();
