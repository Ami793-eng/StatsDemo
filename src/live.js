const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const mmss=s=>{s=Math.max(0,Math.floor(s));return pad(Math.floor(s/60))+':'+pad(s%60)};
const fmtS=s=>s.g+'-'+pad(s.p);
const minOf=(sec,half)=>{const m=Math.floor(sec/60)+1;return half&&m>half?half+'+'+(m-half)+"'":m+"'"};
const halfTag=p=>p===1?'<span class="ht h1">1st half</span>':p===2?'<span class="ht h2">2nd half</span>':`<span class="ht">${p==='HT'?'Half time':p==='FT'?'Full time':'Pre-match'}</span>`;
const perLabel=p=>p===0?'Starting soon':p===1?'1st half':p==='HT'?'Half time':p===2?'2nd half':'Full time';
const KEY_TYPES=new Set(['goal','point','two','penmiss','yellow','black','red','sub','pensave']);
const initials=n=>String(n||'').split(/\s+/).filter(w=>/^[A-Za-zÀ-ž]/.test(w)).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'GAA';
let data=null,offset=0,mode={},demo=false;
const crestImg=(name,cls)=>crestTag(name,cls);

function clockOf(m){const c=m.clock;if(!c.running)return c.elapsed;return c.elapsed+(Date.now()+offset-m.savedAt)/1000}
function clockHTML(m){const c=m.clock;if(c.period==='HT')return 'HT';if(c.period==='FT')return 'FT';if(c.period===0)return '–';const e=clockOf(m);return minOf(e,m.half)}

function matchCard(m){
  const c=m.clock,F=m.code!=='hurling',ko=F?'kick-outs':'puck-outs';const show=mode[m.id]||'key';
  const evs=[...m.events].reverse().filter(e=>show==='all'||KEY_TYPES.has(e.type));
  const u=m.stats.us,t=m.stats.them;const subs=m.events.filter(e=>e.type==='sub');
  const row=(a,label,b)=>`<div class="l">${a}</div><div class="m">${label}</div><div class="r">${b}</div>`;
  const black=m.code==='football';
  return `<article class="panel mcard" data-id="${esc(m.id)}">
    <div class="mhead">
      <div class="top2"><span class="sq">${esc(m.squad)}</span>${c.period==='FT'?'<span class="chip" style="background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.4)">Full time</span>':c.period===0?'':'<span class="chip" style="background:var(--bad);color:#fff;border-color:var(--bad)">Live</span>'}</div>
      <div class="sb">
        <div class="us">${crestImg(m.club,'big')}<div class="tn">${esc(m.club)}</div><div class="sc">${fmtS(m.score.us)}</div><div class="tot">(${m.score.us.t})</div></div>
        <div><div class="halfpill ${c.period===1?'h1':c.period===2?'':'o'}">${perLabel(c.period)}</div><div class="clk${c.running?'':' paused'}" data-clk="${esc(m.id)}">${clockHTML(m)}</div><div class="added" data-add="${esc(m.id)}"></div></div>
        <div class="them">${crestImg(m.opp,'big')}<div class="tn">${esc(m.opp)}</div><div class="sc">${fmtS(m.score.them)}</div><div class="tot">(${m.score.them.t})</div></div>
      </div>
    </div>
    <div class="mbody">
      ${subs.length?`<div class="subs"><b>Substitutions</b>${subs.map(e=>`<div>${halfTag(e.per)} <b style="font-size:15px;color:var(--fg)">${minOf(e.sec,m.half)}</b> ${esc(e.who)}</div>`).join('')}</div>`:''}
      <div class="cmp">
        ${row(u.scores+'/'+u.shots,'Scores from shots',t.scores+'/'+t.shots)}
        ${row(u.wide,'Wides',t.wide)}
        ${row(u.tow,'Turnovers won',u.tol)}
        ${row(u.kow+'/'+(u.kow+u.kol),'Own '+ko+' kept',(u.okl||0)+'/'+((u.okw||0)+(u.okl||0)))}
        ${row(u.okw||0,'Opposition '+ko+' won',u.kol)}
        ${row(u.y+(black?'/'+u.b:'')+'/'+u.r,'Cards Y/'+(black?'B/':'')+'R',t.y+(black?'/'+t.b:'')+'/'+t.r)}
      </div>
      <div class="ph" style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h3>Match events</h3><div class="seg"><button data-mode="key" data-mid="${esc(m.id)}" aria-pressed="${show==='key'}">Key moments</button><button data-mode="all" data-mid="${esc(m.id)}" aria-pressed="${show==='all'}">All stats</button></div></div>
      <div class="evs">${evs.length?evs.map(e=>`<div class="ev ${e.side}${e.pts&&e.side==='us'?' sc':''}"><div class="t">${halfTag(e.per)}<b>${e.per===1||e.per===2?minOf(e.sec,m.half):''}</b></div>
        <div class="w"><span class="tag ${esc(e.type)}" style="display:inline-block">${esc(e.label)}</span>${e.src?' <small>'+esc(e.src)+'</small>':''}<span>${esc(e.side==='them'?m.opp:(e.who||m.club))}</span></div>
        <div class="p">${e.pts?'+'+e.pts:''}</div></div>`).join(''):'<p class="empty">Nothing yet.</p>'}</div>
    </div>
  </article>`;
}

function fixtureRow(f){
  const d=new Date(f.date+'T12:00');let right='';
  if(f.status==='played'&&f.result){const u=f.result.us,t=f.result.them;const k=u.t>t.t?'W':u.t<t.t?'L':'D';right=`<div class="res">${fmtS(u)} – ${fmtS(t)}<i class="w-${k}">${k==='W'?'Won':k==='L'?'Lost':'Draw'}</i></div>`}
  else if(f.status==='live')right='<span class="chip live">Live</span>';
  else if(f.status==='cancelled')right='<span class="chip l">Cancelled</span>';
  else right=f.time?`<div class="res">${esc(f.time)}</div>`:'';
  const moved=f.prev&&f.status!=='cancelled'?' · moved from '+new Date(f.prev.date+'T12:00').toLocaleDateString('en-IE',{day:'numeric',month:'short'})+(f.prev.time&&f.prev.time!==f.time?' '+f.prev.time:''):'';
  return `<div class="fx${f.status==='cancelled'?' cx':''}"><div class="dt"><span>${d.toLocaleDateString('en-IE',{weekday:'short'})}</span><b>${d.getDate()}</b><span>${d.toLocaleDateString('en-IE',{month:'short'})}</span></div>
    <div class="o"><b>${crestImg(f.opp)}${esc(f.squad)} v ${esc(f.opp)}</b><span>${[f.venue,f.comp].filter(Boolean).map(esc).join(' · ')}${esc(moved)}</span></div>${right}</div>`;
}

function draw(){
  if(!data)return;
  const club=data.club||'Owenmore Gaels';
  document.getElementById('club').textContent=club;document.title=club+' Live';
  document.getElementById('badge').innerHTML=`<img src="${OWN_BADGE}" alt="">`;
  const ms=data.matches||[];
  document.getElementById('live').innerHTML=ms.length?`<div style="display:flex;flex-direction:column;gap:16px">${ms.map(matchCard).join('')}</div>`
    :'<div class="panel"><p class="empty">No match on right now. Check the fixtures below.</p></div>';
  const today=new Date().toISOString().slice(0,10);const fx=data.fixtures||[];
  const up=fx.filter(f=>(f.status==='upcoming'||f.status==='live'||f.status==='cancelled')&&f.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,8);
  const res=fx.filter(f=>f.status==='played').sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8);
  const fd=f=>new Date(f.date+'T12:00').toLocaleDateString('en-IE',{weekday:'short',day:'numeric',month:'short'});
  const ago=t=>{const m=Math.round((Date.now()+offset-t)/60000);return m<60?Math.max(1,m)+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'};
  const ups=data.updates||[];
  document.getElementById('updates').innerHTML=ups.length?ups.map(u=>{const f=u.f;let txt,sub;
    if(u.kind==='cancelled'){txt=`${f.squad} v ${f.opp} is off`;sub='Was '+fd(f)+(f.time?' at '+f.time:'')}
    else if(u.kind==='moved'){txt=`${f.squad} v ${f.opp} now ${fd(f)}${f.time?' at '+f.time:''}`;sub='Was '+new Date(f.prev.date+'T12:00').toLocaleDateString('en-IE',{weekday:'short',day:'numeric',month:'short'})+(f.prev.time?' at '+f.prev.time:'')+(f.prev.venue&&f.prev.venue!==f.venue?', '+f.prev.venue:'')+(f.venue?' · now '+f.venue:'')}
    else if(u.kind==='new'){txt=`New fixture: ${f.squad} v ${f.opp}`;sub=fd(f)+(f.time?' at '+f.time:'')+(f.venue?' · '+f.venue:'')}
    else{const a=f.result.us,b=f.result.them;txt=`${f.squad} ${a.t>b.t?'beat':a.t<b.t?'lost to':'drew with'} ${f.opp}`;sub=`${fmtS(a)} (${a.t}) – ${fmtS(b)} (${b.t}) · ${fd(f)}`}
    return `<div class="up"><span class="k ${u.kind}">${{cancelled:'Off',moved:'Moved',new:'New',result:'Result'}[u.kind]}</span><div class="x">${esc(txt)}<span>${esc(sub)}${u.kind!=='result'?' · '+ago(u.at):''}</span></div></div>`}).join(''):'<p class="empty">No changes in the last two weeks.</p>';
  document.getElementById('upcoming').innerHTML=up.length?up.map(fixtureRow).join(''):'<p class="empty">No fixtures posted.</p>';
  document.getElementById('results').innerHTML=res.length?res.map(fixtureRow).join(''):'<p class="empty">No results yet.</p>';
  tick();
}
function tick(){
  if(!data)return;
  for(const m of data.matches||[]){
    const c=m.clock;if(c.period!==1&&c.period!==2)continue;
    const el=document.querySelector(`[data-clk="${CSS.escape(m.id)}"]`);if(!el)continue;
    const e=clockOf(m);el.textContent=minOf(e,m.half);
    const a=document.querySelector(`[data-add="${CSS.escape(m.id)}"]`);if(a)a.textContent=e>m.half*60?'Added time +'+mmss(e-m.half*60):mmss(e);
  }
}
setInterval(tick,500);

function poll(){
  data=demoPublic(loadDemo());offset=0;
  const b=document.getElementById('demo');b.hidden=false;
  b.innerHTML=data.example?'<b>Demo.</b> This live match is an example that loops. Start a match in the <a href="index.html">coach app</a> on this device and it shows here instead.':'<b>Demo.</b> Showing the match being scored in the <a href="index.html">coach app</a> on this device.';
  document.getElementById('dot').dataset.s='ok';
  document.getElementById('upd').textContent='Updated '+new Date().toLocaleTimeString('en-IE');
  draw();
}
function schedule(){setInterval(()=>{if(document.visibilityState==='visible')poll()},3000)}
window.addEventListener('storage',e=>{if(e.key===DEMO_KEY)poll()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')poll()});
document.addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(!b)return;mode[b.dataset.mid]=b.dataset.mode;draw()});
poll();schedule();
