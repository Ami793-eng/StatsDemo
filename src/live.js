/* ===== public / parents' page ===== */
/* Save a file: in the Claude viewer via the downloads capability (asks the viewer first); on the live site a normal download */
let dlNs;const dlReady=(window.claude&&window.claude.use)?window.claude.use('downloads').then(n=>dlNs=n).catch(()=>dlNs=null):Promise.resolve(null);
async function saveFile(name,data,onMsg){
  await dlReady;
  if(dlNs){try{await dlNs.save({filename:name,data});onMsg&&onMsg('Saved '+name);return true}catch(e){if(e&&e.code==='declined'){onMsg&&onMsg('Download cancelled');return false}if(e&&e.code==='rate_limited'){onMsg&&onMsg('A save is already waiting for you to confirm');return false}}}
  if(window.claude&&window.claude.use&&!dlNs){onMsg&&onMsg('Downloads aren\u2019t available here. Use Copy instead.');return false}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type:'text/csv'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);onMsg&&onMsg('Downloaded '+name);return true}catch(e){onMsg&&onMsg('Download failed. Use Copy instead.');return false}
}

const KEY_TYPES=new Set(['goal','point','two','yellow','black','red','sub','bloodret']);
let data=null,mode={},teamF='all',notifyOn=false,seen={};
try{notifyOn=localStorage.getItem('og-notify')==='1'}catch(e){}
const crestImg=(name,cls)=>crestTag(name,cls);
const halfTag=p=>`<span class="ht ${p===1||p===3?'h1':p===2||p===4?'h2':''}">${esc(OG.perShort(p))}</span>`;
const isPlaying=p=>typeof p==='number'&&p>0;
function clockOf(m){const c=m.clock;return c.running?c.elapsed+(Date.now()-m.savedAt)/1000:c.elapsed}
function clockTxt(m){const c=m.clock;if(!isPlaying(c.period))return c.period===0?'–':OG.perShort(c.period).replace('Half time','HT').replace('Full time','FT');return OG.minOf(clockOf(m),c.period<=2?m.half:m.etHalf||10)}

function matchCard(m){
  const c=m.clock,F=m.code!=='hurling',ko=F?'kick-outs':'puck-outs',gg=m.tier==='gogames';const show=mode[m.id]||'key';
  const evs=[...m.events].reverse().filter(e=>show==='all'||KEY_TYPES.has(e.type));
  const subs=m.events.filter(e=>e.type==='sub'||e.type==='bloodret');
  const black=m.code==='football';
  const row=(a,label,b)=>`<div class="l">${a}</div><div class="m">${label}</div><div class="r">${b}</div>`;
  const u=m.stats&&m.stats.us,t=m.stats&&m.stats.them;
  return `<article class="panel mcard" data-id="${esc(m.id)}">
    <div class="mhead">
      <div class="top2"><span class="sq">${esc(m.squad)}</span><span class="chip" style="background:var(--bad);color:#fff;border-color:var(--bad)">Live</span></div>
      <div class="sb">
        <div class="us">${crestImg(m.club,'big')}<div class="tn">${esc(m.club)}</div>${gg?'':`<div class="sc">${OG.fmt(m.score.us)}</div><div class="tot">(${m.score.us.t})</div>`}</div>
        <div><div class="halfpill ${c.period===1||c.period===3?'h1':c.period===2||c.period===4?'':'o'}">${esc(OG.perShort(c.period))}</div><div class="clk${c.running?'':' paused'}" data-clk="${esc(m.id)}">${clockTxt(m)}</div><div class="added" data-add="${esc(m.id)}"></div></div>
        <div class="them">${crestImg(m.opp,'big')}<div class="tn">${esc(m.opp)}</div>${gg?'':`<div class="sc">${OG.fmt(m.score.them)}</div><div class="tot">(${m.score.them.t})</div>`}</div>
      </div>
      ${gg?'<p class="ggnote">Go Games are non-competitive: no scores are shown.</p>':''}
    </div>
    <div class="mbody">
      ${m.sinbins&&m.sinbins.length?`<div class="subs sinbin"><b>Sin-bin</b>${m.sinbins.map(s=>`<div>${esc(s.who||m.club)} · ${mmss(s.left)} left</div>`).join('')}</div>`:''}
      ${subs.length?`<div class="subs"><b>Substitutions</b>${subs.map(e=>`<div>${halfTag(e.per)} <b style="font-size:15px;color:var(--fg)">${OG.minOf(e.sec,e.per<=2?m.half:m.etHalf)}</b> ${esc(e.who)}${e.blood?' (blood)':''}${e.type==='bloodret'?' (back from blood sub)':''}</div>`).join('')}</div>`:''}
      ${gg?'':`<div class="cmp">
        ${row(u.scores+'/'+u.shots,'Scores from shots',t.scores+'/'+t.shots)}
        ${row(u.wide,'Wides',t.wide)}
        ${row(u.kow+'/'+(u.kow+u.kol),'Own '+ko+' kept',u.okl+'/'+(u.okw+u.okl))}
        ${row(u.y+(black?'/'+u.b:'')+'/'+u.r,'Cards Y/'+(black?'B/':'')+'R',t.y+(black?'/'+t.b:'')+'/'+t.r)}
      </div>
      <div class="ph"><h3>Match events</h3><div class="seg"><button data-mode="key" data-mid="${esc(m.id)}" aria-pressed="${show==='key'}">Key moments</button><button data-mode="all" data-mid="${esc(m.id)}" aria-pressed="${show==='all'}">All</button></div></div>
      <div class="evs">${evs.length?evs.map(e=>`<div class="ev ${e.side} t-${esc(e.type)}${e.pts&&e.side==='us'?' sc':''}"><div class="t">${halfTag(e.per)}<b>${isPlaying(e.per)?OG.minOf(e.sec,e.per<=2?m.half:m.etHalf):''}</b></div>
        <div class="w"><span class="tag ${esc(e.type)}">${esc(e.label)}</span>${e.src?' <small>'+esc(e.src)+'</small>':''}${e.sinbin?' <small>sin-bin</small>':''}<span>${esc(e.side==='them'?m.opp:(e.who||m.club))}</span></div>
        <div class="p">${e.pts?'+'+e.pts:''}</div></div>`).join(''):'<p class="empty">Nothing yet.</p>'}</div>`}
    </div></article>`;
}
const fd=f=>new Date(f.date+'T12:00').toLocaleDateString('en-IE',{weekday:'short',day:'numeric',month:'short'});
function fixtureRow(f,withShare){
  const d=new Date(f.date+'T12:00');let right='';const gg=f.tier==='gogames';
  if(f.status==='played'&&f.result){const u=f.result.us,t=f.result.them;const k=u.t>t.t?'W':u.t<t.t?'L':'D';right=`<div class="res">${OG.fmt(u)} – ${OG.fmt(t)}<i class="w-${k}">${k==='W'?'Won':k==='L'?'Lost':'Draw'}</i></div>`}
  else if(f.status==='played'&&gg)right='<span class="chip">Played</span>';
  else if(f.status==='live')right='<span class="chip live">Live</span>';
  else if(f.status==='cancelled')right='<span class="chip l">Off</span>';
  else right=f.time?`<div class="res">${esc(f.time)}</div>`:'';
  const moved=f.prev&&f.status!=='cancelled'?' · moved from '+new Date(f.prev.date+'T12:00').toLocaleDateString('en-IE',{day:'numeric',month:'short'})+(f.prev.time&&f.prev.time!==f.time?' '+f.prev.time:''):'';
  const where=f.ground||'';
  return `<div class="fx${f.status==='cancelled'?' cx':''}"><div class="dt"><span>${d.toLocaleDateString('en-IE',{weekday:'short'})}</span><b>${d.getDate()}</b><span>${d.toLocaleDateString('en-IE',{month:'short'})}</span></div>
    <div class="o"><b>${crestImg(f.opp)}${esc(f.squad)} v ${esc(f.opp)}</b><span>${[f.comp,gg?'Go Games':''].filter(Boolean).map(esc).join(' · ')}${esc(moved)}</span>
      ${f.status!=='played'?`<span><a href="${OG.mapUrl(where,f.opp)}" target="_blank" rel="noopener">${esc(where||f.opp+' (away)')} ↗</a>${f.ref?' · Ref: '+esc(f.ref):''}</span>`:''}
      ${withShare&&f.result?`<span class="acts"><button class="btn sm" data-share="${esc(f.id)}">Share result</button>${f.tableUrl?` <a class="btn sm" href="${esc(f.tableUrl)}" target="_blank" rel="noopener">League table ↗</a>`:''}</span>`:''}</div>${right}</div>`;
}
function draw(){
  if(!data)return;
  document.getElementById('club').textContent=data.club;document.title=data.club+' Live';
  document.getElementById('badge').innerHTML=`<img src="${OWN_BADGE}" alt="">`;
  const ms=data.matches||[];
  document.getElementById('live').innerHTML=ms.length?`<div style="display:flex;flex-direction:column;gap:16px">${ms.map(matchCard).join('')}</div>`:'<div class="panel"><p class="empty">No match on right now.</p></div>';
  const today=new Date().toISOString().slice(0,10);const fx=data.fixtures||[];
  const squads=[...new Set(fx.map(f=>f.squad))];
  document.getElementById('teamf').innerHTML=['all',...squads].map(s=>`<button data-team="${esc(s)}" aria-pressed="${teamF===s}">${s==='all'?'All teams':esc(s)}</button>`).join('');
  const byTeam=f=>teamF==='all'||f.squad===teamF;
  const up=fx.filter(f=>byTeam(f)&&(f.status==='upcoming'||f.status==='live'||f.status==='cancelled')&&f.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,10);
  const res=fx.filter(f=>byTeam(f)&&f.status==='played'&&f.tier!=='gogames').sort((a,b)=>b.date.localeCompare(a.date));
  const ago=t=>{const m=Math.round((Date.now()-t)/60000);return m<60?Math.max(1,m)+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'};
  const ups=(data.updates||[]).filter(u=>byTeam(u.f)&&!(u.kind==='result'&&u.f.tier==='gogames'));
  document.getElementById('updates').innerHTML=ups.length?ups.map(u=>{const f=u.f;let txt,sub;
    if(u.kind==='cancelled'){txt=`${f.squad} v ${f.opp} is off`;sub='Was '+fd(f)+(f.time?' at '+f.time:'')}
    else if(u.kind==='moved'){txt=`${f.squad} v ${f.opp} now ${fd(f)}${f.time?' at '+f.time:''}`;sub='Was '+fd(f.prev)+(f.prev.time?' at '+f.prev.time:'')}
    else{const a=f.result.us,b=f.result.them;txt=`${f.squad} ${a.t>b.t?'beat':a.t<b.t?'lost to':'drew with'} ${f.opp}`;sub=`${OG.fmt(a)} (${a.t}) – ${OG.fmt(b)} (${b.t}) · ${fd(f)}`}
    return `<div class="up"><span class="k ${u.kind}">${{cancelled:'Off',moved:'Moved',result:'Result'}[u.kind]}</span><div class="x">${esc(txt)}<span>${esc(sub)}${u.kind!=='result'?' · '+ago(u.at):''}</span></div></div>`}).join(''):'<p class="empty">No changes lately.</p>';
  document.getElementById('upcoming').innerHTML=up.length?up.map(f=>fixtureRow(f)).join(''):'<p class="empty">No fixtures posted.</p>';
  // season form per team (competitive teams only)
  const forms=squads.filter(s=>byTeam({squad:s})).map(s=>{const g=fx.filter(f=>f.squad===s&&f.status==='played'&&f.result).sort((a,b)=>a.date.localeCompare(b.date));if(!g.length)return '';
    const k=g.map(f=>f.result.us.t>f.result.them.t?'W':f.result.us.t<f.result.them.t?'L':'D');const w=k.filter(x=>x==='W').length,d=k.filter(x=>x==='D').length,l=k.filter(x=>x==='L').length;
    return `<div class="formrow"><b>${esc(s)}</b><span class="muted">${w}-${d}-${l}</span><div class="form">${k.slice(-6).map(x=>`<span class="${x}">${x}</span>`).join('')}</div></div>`}).join('');
  document.getElementById('form').innerHTML=forms||'<p class="empty">No results yet.</p>';
  document.getElementById('results').innerHTML=res.length?res.map(f=>fixtureRow(f,true)).join(''):'<p class="empty">No results yet.</p>';
  const st=data.settings||{};
  document.getElementById('join').innerHTML=`${st.joinUrl?`<a class="btn amb" href="${esc(st.joinUrl)}" target="_blank" rel="noopener">Join / Renew on Foireann ↗</a>`:''}${st.lottoUrl?`<a class="btn" href="${esc(st.lottoUrl)}" target="_blank" rel="noopener">Club lotto ↗</a>`:''}`;
  document.getElementById('notify').textContent=notifyOn?'Score alerts on':'Get score alerts';
  document.getElementById('notify').setAttribute('aria-pressed',String(notifyOn));
  tick();
}
function tick(){
  if(!data)return;
  for(const m of data.matches||[]){const c=m.clock;if(!isPlaying(c.period))continue;
    const el=document.querySelector(`[data-clk="${CSS.escape(m.id)}"]`);if(!el)continue;
    const e=clockOf(m),h=(c.period<=2?m.half:m.etHalf||10);el.textContent=OG.minOf(e,h);
    const a=document.querySelector(`[data-add="${CSS.escape(m.id)}"]`);if(a)a.textContent=e>h*60?'Added time +'+mmss(e-h*60):mmss(e)}
}
setInterval(tick,500);

function notify(title,body){
  if(!notifyOn||!('Notification' in window)||Notification.permission!=='granted')return;
  try{if(navigator.serviceWorker&&navigator.serviceWorker.controller)navigator.serviceWorker.ready.then(r=>r.showNotification(title,{body,icon:'badge.png'}));else new Notification(title,{body,icon:'badge.png'})}catch(e){}
}
function checkAlerts(next){
  for(const m of next.matches){if(m.tier==='gogames'||m.example)continue;
    const sc=m.events.filter(e=>e.pts).length,prev=seen[m.id];
    if(prev!=null&&sc>prev){const e=[...m.events].reverse().find(x=>x.pts);notify(`${e.side==='us'?m.club:m.opp}: ${e.label}`,`${m.squad}: ${OG.fmt(m.score.us)} – ${OG.fmt(m.score.them)} v ${m.opp}`)}
    seen[m.id]=sc}
}
function poll(){
  const next=demoPublic(loadDemo());checkAlerts(next);data=next;
  const b=document.getElementById('demo');b.hidden=false;
  b.innerHTML=data.example?'<b>Demo.</b> This live match is an example that loops. Start a match in the <a href="index.html">coach app</a> on this device and it shows here instead.':'<b>Demo.</b> Showing the match being scored in the <a href="index.html">coach app</a> on this device.';
  document.getElementById('dot').dataset.s='ok';document.getElementById('upd').textContent='Updated '+new Date().toLocaleTimeString('en-IE');
  draw();
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-mode]');if(b){mode[b.dataset.mid]=b.dataset.mode;draw();return}
  const tf=e.target.closest('[data-team]');if(tf){teamF=tf.dataset.team;draw();return}
  const sh=e.target.closest('[data-share]');if(sh){const f=data.fixtures.find(x=>x.id===sh.dataset.share);if(f)shareCard(f);return}
  if(e.target.id==='notify'){
    if(notifyOn){notifyOn=false}else{
      if(!('Notification' in window)){alertMsg('This browser can’t show alerts. On iPhone, add this page to your Home Screen first.');return}
      let p=Notification.permission;if(p==='default'){try{p=await Notification.requestPermission()}catch(err){}}
      if(p!=='granted'){alertMsg('Alerts are blocked for this site. Allow notifications in your browser settings to turn them on.');return}
      notifyOn=true}
    try{localStorage.setItem('og-notify',notifyOn?'1':'0')}catch(err){}draw();alertMsg(notifyOn?'You’ll get an alert for each score and at full time while this page is open. (The full version sends them even when it’s closed.)':'Score alerts off')}
  if(e.target.closest('[data-close]'))closeModal();
});
function alertMsg(t){const el=document.getElementById('msg');el.textContent=t;el.hidden=false;clearTimeout(alertMsg.t);alertMsg.t=setTimeout(()=>el.hidden=true,4500)}
function closeModal(){const m=document.getElementById('modal');m.hidden=true;m.innerHTML=''}
async function shareCard(f){
  const u=f.result.us,t=f.result.them;
  const c=await OG.resultCard({label:'Full time',us:data.club+' '+f.squad,them:f.opp,usScore:`${OG.fmt(u)} (${u.t})`,themScore:`${OG.fmt(t)} (${t.t})`,sub:[f.comp,fd(f)].filter(Boolean).join(' · ')});
  const url=c.toDataURL('image/png');const m=document.getElementById('modal');
  m.innerHTML=`<div class="sheet-bg" data-close="1"><div class="sheet"><div class="row" style="justify-content:space-between"><h2>Share result</h2><button class="btn sm" data-close="1">Close</button></div><img src="${url}" alt="Result card" class="sharecard"><p class="legend">Long-press the image to save it, or tap Share to send it to WhatsApp.</p><div class="row"><button class="btn pri" id="dosh">Share</button><button class="btn" id="dosv">Save image</button></div></div></div>`;
  m.hidden=false;
  document.getElementById('dosv').onclick=async()=>{const blob=await new Promise(r=>c.toBlob(r,'image/png'));saveFile('owenmore-result.png',blob,alertMsg)};
  document.getElementById('dosh').onclick=async()=>{try{const blob=await new Promise(r=>c.toBlob(r,'image/png'));const file=new File([blob],'result.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],text:`${data.club} ${OG.fmt(u)} – ${OG.fmt(t)} ${f.opp}`});return}if(navigator.share){await navigator.share({text:`${data.club} ${f.squad} ${OG.fmt(u)} – ${OG.fmt(t)} ${f.opp}`});return}}catch(err){}
    alertMsg('Sharing isn’t available here. Long-press the image to save it.')};
}
window.addEventListener('storage',e=>{if(e.key===DEMO_KEY)poll()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')poll()});
setInterval(()=>{if(document.visibilityState==='visible')poll()},3000);
try{if('serviceWorker' in navigator&&location.protocol==='https:'&&window.top===window.self)navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}
poll();
