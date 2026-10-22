/* ========== clock ========== */
let audio=null,wake=null;
function ensureAudio(){try{if(!audio){const A=window.AudioContext||window.webkitAudioContext;if(A)audio=new A()}if(audio&&audio.state==='suspended')audio.resume()}catch(e){}}
function beep(times){
  try{if(audio){const t=audio.currentTime;for(let i=0;i<times;i++){const d=i*.35,o=audio.createOscillator(),g=audio.createGain();o.type='square';o.frequency.value=2900;g.gain.setValueAtTime(.0001,t+d);g.gain.exponentialRampToValueAtTime(.25,t+d+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d+.28);o.connect(g).connect(audio.destination);o.start(t+d);o.stop(t+d+.3)}}}catch(e){}
  try{navigator.vibrate&&navigator.vibrate(Array(times).fill(0).flatMap(()=>[350,150]))}catch(e){}
}
async function keepAwake(on){try{if(on&&!wake&&navigator.wakeLock){wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>wake=null)}else if(!on&&wake){await wake.release();wake=null}}catch(e){}}
const elapsed=m=>OG.elapsed(m);
const isPlaying=p=>typeof p==='number'&&p>0;
function clockHTML(m){const c=m.clock;if(!isPlaying(c.period))return c.period===0?'0:00':OG.perShort(c.period).replace('Half time','HT').replace('Full time','FT').replace('ET half time','ET HT').replace('After ET','AET');
  const e=elapsed(m);return `${OG.minOf(e,OG.halfOf(m,c.period))}<span class="sec">${pad(Math.floor(e)%60)}s</span>`}
function tick(){
  if(!S)return;const m=active();if(!m||S.tab!=='match')return;
  const el=document.getElementById('clk');if(el){el.innerHTML=clockHTML(m);el.classList.toggle('paused',!m.clock.running)}
  const c=m.clock,e=elapsed(m),lim=OG.halfOf(m,c.period)*60;
  const ov=document.getElementById('over');if(ov)ov.textContent=isPlaying(c.period)?(e>lim?'Added time +'+mmss(e-lim):mmss(e)+' of '+OG.halfOf(m,c.period)+':00'):'';
  // sin-bin countdowns
  const t=team(m.teamId);document.querySelectorAll('[data-sb]').forEach(n=>{const sb=OG.sinbins(m,t).find(x=>x.e.id===n.dataset.sb);if(!sb)return;
    if(sb.left<=0){n.textContent='can return';n.parentElement.classList.add('done');if(!n.dataset.beeped&&canScore(m)){n.dataset.beeped='1';beep(2)}}else n.textContent=mmss(sb.left)+' left'});
  if(canScore(m)&&c.running&&isPlaying(c.period)&&e>=lim&&!c.alerted[c.period]){
    c.alerted[c.period]=true;persist();beep(3);
    const ab=document.getElementById('alertbar');const w=c.period===1?'Half time':c.period===2?'Full time':c.period===3?'ET half time':'End of extra time';
    if(ab){ab.hidden=false;ab.textContent=w+' is due ('+OG.halfOf(m,c.period)+' minutes played). Tap the button when the ref blows.';ab.classList.remove('flash');void ab.offsetWidth;ab.classList.add('flash')}
  }
}
setInterval(tick,250);

/* ========== helpers ========== */
function armed(key){const now=Date.now();if(ui.armed===key&&now-ui.armT<3500){ui.armed=null;return true}ui.armed=key;ui.armT=now;render();setTimeout(()=>{if(ui.armed===key&&Date.now()-ui.armT>=3400){ui.armed=null;render()}},3600);return false}
const A=n=>ui.armed===n?' armed':'';
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2000)}
async function copy(text,okMsg,inputId){try{await navigator.clipboard.writeText(text);toast(okMsg)}catch(e){const i=inputId&&document.getElementById(inputId);if(i){i.focus();i.select()}toast('Selected, copy it')}}
/* Save a file: in the Claude viewer via the downloads capability (asks the viewer first); on the live site a normal download */
let dlNs;const dlReady=(window.claude&&window.claude.use)?window.claude.use('downloads').then(n=>dlNs=n).catch(()=>dlNs=null):Promise.resolve(null);
async function saveFile(name,data,onMsg){
  await dlReady;
  if(dlNs){try{await dlNs.save({filename:name,data});onMsg&&onMsg('Saved '+name);return true}catch(e){if(e&&e.code==='declined'){onMsg&&onMsg('Download cancelled');return false}if(e&&e.code==='rate_limited'){onMsg&&onMsg('A save is already waiting for you to confirm');return false}}}
  if(window.claude&&window.claude.use&&!dlNs){onMsg&&onMsg('Downloads aren\u2019t available here. Use Copy instead.');return false}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type:'text/csv'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);onMsg&&onMsg('Downloaded '+name);return true}catch(e){onMsg&&onMsg('Download failed. Use Copy instead.');return false}
}

function syncResult(m){const f=fixture(m.fixtureId);if(!f)return;const t=team(m.teamId);if(OG.tierOf(t)!=='gogames')f.result={us:score(m,'us'),them:score(m,'them')};if(m.ended)f.status='played';else if(m.clock.period!==0)f.status='live'}
const PLAYER_TYPES=['goal','point','two','wide','short','saved','tow','tol','fwon','fcon','save','yellow','black','red'];
function addEvent(o,note){
  const m=active();if(!canScore(m))return;const per=m.clock.period;
  const e=Object.assign({id:uid(),per,sec:Math.floor(isPlaying(per)?elapsed(m):0),by:me().name,at:Date.now()},o);
  m.events.push(e);syncResult(m);persist();render();
  const t=team(m.teamId);toast((note?note+' · ':'')+lbl(e.type,m.code)+(e.pid?' · '+pName(t,e.pid):'')+(e.side==='them'?' · '+m.opp:''));
  return e;
}
function startMatch(fx){
  const t=team(fx.teamId);
  const m={id:uid(),fixtureId:fx.id,teamId:t.id,opp:fx.opp,date:fx.date,half:t.half,etHalf:t.etHalf||10,code:t.code,arc:!!t.arc,
    lineup:t.players.slice(0,t.onField).map(p=>p.id),events:[],audit:[],scorer:S.me,ended:false,clock:{period:0,running:false,acc:0,since:0,durs:{},alerted:{}}};
  S.matches.push(m);fx.matchId=m.id;fx.scorer=S.me;audit(m,'Started scoring');S.active=m.id;S.tab='match';persist();render();
}
function endPeriod(m){const c=m.clock;c.durs[c.period]=elapsed(m);c.running=false;c.acc=0}
function finishMatch(m){m.ended=true;m.clock.running=false;keepAwake(false);syncResult(m);audit(m,'Finished match');persist();render();toast('Full time. Result saved.')}

/* ========== actions ========== */
const acts={
  tab:d=>{S.tab=d.v;S.active=d.v==='match'?S.active:S.active;persist();render();window.scrollTo(0,0)},
  who:(d,el)=>{},
  run:()=>{const m=active();if(!canScore(m))return;const c=m.clock;if(!isPlaying(c.period)&&c.period!==0)return;
    if(c.period===0){if((m.lineup||[]).length===0){toast('Pick the starting team first');return}c.period=1;c.acc=0;audit(m,'Throw-in')}
    if(c.running){c.acc=elapsed(m);c.running=false;keepAwake(false)}else{c.since=Date.now();c.running=true;keepAwake(true)}
    persist();render()},
  next:()=>{const m=active();if(!canScore(m))return;const c=m.clock;
    if(c.period===0){acts.run();return}
    if(c.period===1||c.period===3){if(!armed('next'))return;endPeriod(m);c.period=c.period===1?'HT':'ETH';audit(m,OG.perShort(c.period))}
    else if(c.period==='HT'||c.period==='ETH'){c.period=c.period==='HT'?2:4;c.acc=0;c.since=Date.now();c.running=true;keepAwake(true);audit(m,'Start '+OG.perShort(c.period))}
    else if(c.period===2||c.period===4){if(!armed('next'))return;endPeriod(m);c.period=c.period===2?'FT':'AET';keepAwake(false);audit(m,OG.perShort(c.period))}
    syncResult(m);persist();render()},
  et:()=>{const m=active();if(!canScore(m)||m.clock.period!=='FT')return;if(!armed('et'))return;const c=m.clock;c.period=3;c.acc=0;c.since=Date.now();c.running=true;keepAwake(true);audit(m,'Extra time started');persist();render()},
  finish:()=>{const m=active();if(!canScore(m))return;if(!armed('finish'))return;finishMatch(m)},
  adj:d=>{const m=active();if(!canScore(m))return;const c=m.clock;const e=elapsed(m);c.acc=Math.max(0,e+Number(d.v));if(c.running)c.since=Date.now();persist();tick()},
  lineup:d=>{const m=active();if(!canScore(m)||m.clock.period!==0)return;const t=team(m.teamId);const i=m.lineup.indexOf(d.pid);
    if(i>=0)m.lineup.splice(i,1);else{if(m.lineup.length>=t.onField){toast(t.onField+' already picked. Tap a player to take them out first.');return}m.lineup.push(d.pid)}persist();render()},
  quick:d=>{const m=active();if(!canScore(m))return;addEvent({side:d.side||'us',type:d.type},d.note)},
  shot:d=>{const m=active();if(!canScore(m))return;openShot(m,d.type)},
  t45:()=>{const m=active();if(!canScore(m))return;openShot(m,'t45')},
  them:d=>{const m=active();if(!canScore(m))return;addEvent({side:'them',type:d.type})},
  card:d=>{const m=active();if(!canScore(m))return;openCard(m,d.side)},
  sub:()=>{const m=active();if(!canScore(m))return;openSub(m)},
  bloodret:d=>{const m=active();if(!canScore(m))return;const s=m.events.find(e=>e.id===d.id);if(!s)return;addEvent({side:'us',type:'bloodret',pid:s.onId,onId:s.pid,ref:s.id})},
  note:()=>{const m=active();if(!m||(!canScore(m)&&!canManage(m.teamId)))return;openNote(m)},
  undo:()=>{const m=active();if(!canScore(m)||!m.events.length)return;const e=m.events.pop();audit(m,'Undid '+describe(m,e));syncResult(m);persist();render();toast('Undone: '+lbl(e.type,m.code))},
  addPlayer:d=>{const m=active();const e=m&&m.events.find(x=>x.id===d.id);if(!e)return;openEdit(m,e,true)},
  editEv:d=>{const m=active();const e=m&&m.events.find(x=>x.id===d.id);if(!e)return;openEdit(m,e,false)},
  handover:()=>{const m=active();if(!m)return;openHandover(m)},
  takeover:()=>{const m=active();if(!m||!canManage(m.teamId))return;if(!armed('takeover'))return;const was=userName(m.scorer);m.scorer=S.me;const f=fixture(m.fixtureId);if(f)f.scorer=S.me;audit(m,`Took over scoring from ${was}`);persist();render();toast('You are now scoring this match')},
  closeMatch:()=>{S.active=null;keepAwake(false);persist();render()},
  startFx:d=>{const f=fixture(d.id);if(!f)return;
    if(f.matchId&&S.matches.find(m=>m.id===f.matchId)){S.active=f.matchId;S.tab='match';persist();render();window.scrollTo(0,0);return}
    if(f.scorer&&f.scorer!==S.me){if(!canManage(f.teamId)){toast('This match is assigned to '+userName(f.scorer));return}
      if(!armed('start'+f.id)){toast('Assigned to '+userName(f.scorer)+'. Tap again to score it yourself.');return}}
    startMatch(f)},
  openMatch:d=>{S.active=d.id;S.tab='match';persist();render();window.scrollTo(0,0)},
  month:d=>{const [y,mo]=ui.month.split('-').map(Number);const dt=new Date(y,mo-1+Number(d.v),1);ui.month=dt.getFullYear()+'-'+pad(dt.getMonth()+1);ui.day=null;render()},
  day:d=>{ui.day=ui.day===d.v?null:d.v;render()},
  teamF:d=>{ui.teamF=d.v;render()},
  addFx:()=>{const g=id=>document.getElementById(id).value.trim();const f={id:uid(),teamId:g('f-team'),date:g('f-date'),time:g('f-time'),opp:g('f-opp'),venue:g('f-venue'),ground:g('f-ground'),comp:g('f-comp'),ref:g('f-ref'),scorer:g('f-scorer')||null,status:'upcoming',createdAt:Date.now()};
    if(!f.teamId){toast('No squad to add fixtures for');return}if(!f.date||!f.opp){toast('Fixtures need a date and an opposition');return}
    if(!f.ground&&f.venue==='Home')f.ground=HOME_GROUND;S.fixtures.push(f);ui.month=f.date.slice(0,7);ui.day=f.date;persist();render();toast('Fixture added')},
  editFx:d=>{ui.editFx=ui.editFx===d.id?null:d.id;render()},
  saveFx:d=>{const f=fixture(d.id);if(!f)return;const g=k=>document.getElementById('e-'+k+'-'+f.id).value.trim();
    const nd={date:g('date'),time:g('time'),venue:g('venue')};if(!nd.date){toast('A fixture needs a date');return}
    const moved=nd.date!==f.date||nd.time!==(f.time||'')||nd.venue!==(f.venue||'');
    if(moved&&f.status==='upcoming'){if(!f.prev)f.prev={date:f.date,time:f.time||'',venue:f.venue||''};f.changedAt=Date.now()}
    Object.assign(f,nd,{opp:g('opp')||f.opp,comp:g('comp'),ground:g('ground'),ref:g('ref'),scorer:g('scorer')||null});
    if(f.prev&&f.prev.date===f.date&&f.prev.time===f.time&&f.prev.venue===f.venue)delete f.prev;
    ui.editFx=null;persist();render();toast(moved?'Fixture moved. Parents will see the change.':'Fixture saved')},
  cancelFx:d=>{const f=fixture(d.id);if(!f)return;
    if(f.status==='cancelled'){f.status='upcoming';f.changedAt=Date.now();persist();render();toast('Fixture back on');return}
    if(!armed('cfx'+f.id))return;f.status='cancelled';f.changedAt=Date.now();ui.editFx=null;persist();render();toast('Fixture cancelled. Parents will see it.')},
  delFx:d=>{if(!armed('dfx'+d.id))return;const f=fixture(d.id);S.fixtures=S.fixtures.filter(x=>x!==f);if(f&&f.matchId){S.matches=S.matches.filter(m=>m.id!==f.matchId);if(S.active===f.matchId)S.active=null}ui.editFx=null;persist();render()},
  statsTeam:d=>{ui.statsTeam=d.v;ui.mapPl='all';S.tab='stats';persist();render();window.scrollTo(0,0)},
  mapSrc:d=>{ui.mapSrc=d.v;render()},
  adminTab:d=>{ui.adminTab=d.v;render()},
  adminTeam:d=>{ui.adminTeam=d.v;render()},
  addTeam:()=>{const t=normTeam({id:uid(),name:'New squad',assoc:'gaa_f',grade:'U14',half:30,players:[]});S.teams.push(t);ui.adminTeam=t.id;ui.adminTab='teams';persist();render()},
  delTeam:d=>{if(!armed('dt'+d.id))return;S.teams=S.teams.filter(t=>t.id!==d.id);S.fixtures=S.fixtures.filter(f=>f.teamId!==d.id);S.matches=S.matches.filter(m=>m.teamId!==d.id);if(S.active&&!active())S.active=null;ui.adminTeam=null;persist();render()},
  addPl:d=>{const t=team(d.id);const n=t.players.reduce((a,p)=>Math.max(a,p.num),0)+1;t.players.push({id:uid(),num:n,name:'',foireann:'',code:newCode()});persist();render()},
  delPl:d=>{if(!armed('dp'+d.pid))return;const t=team(d.id);t.players=t.players.filter(p=>p.id!==d.pid);persist();render()},
  newCode:d=>{if(!armed('nc'+d.pid))return;const p=player(team(d.id),d.pid);p.code=newCode();persist();render();toast('New code made. The old link stops working.')},
  copyMe:d=>{const p=player(team(d.id),d.pid);copy(new URL('me.html?code='+p.code,location.href).href,'Link for #'+p.num+' copied')},
  importPl:d=>{const t=team(d.id);const txt=document.getElementById('imp-'+t.id).value.trim();if(!txt){toast('Paste the registrar export first');return}
    let added=0,updated=0;for(const line of txt.split(/\r?\n/)){const c=line.split(/[,\t;]/).map(x=>x.trim().replace(/^"|"$/g,''));if(!c[0]||!/\d{5,}/.test(c[0]))continue;
      const [fn,first,last,num]=c;const name=[first,last].filter(Boolean).join(' ');const ex=t.players.find(p=>p.foireann===fn);
      if(ex){if(name)ex.name=name;if(num)ex.num=Number(num)||ex.num;updated++}else{t.players.push({id:uid(),num:Number(num)||t.players.reduce((a,p)=>Math.max(a,p.num),0)+1,name,foireann:fn,code:newCode()});added++}}
    t.players.sort((a,b)=>a.num-b.num);persist();render();toast(`${added} added, ${updated} updated`)},
  addUser:()=>{const n=document.getElementById('nu-name').value.trim();if(!n){toast('Type a name');return}S.users.push({id:'u-'+uid(),name:n,role:'scorer',label:n+' · scorer'});persist();render();toast(n+' can now be assigned matches')},
  delUser:d=>{if(!armed('du'+d.id))return;S.users=S.users.filter(u=>u.id!==d.id);persist();render()},
  resetDemo:()=>{if(!armed('reset'))return;const keep=S.me;S=buildDemo();S.me=S.users.some(u=>u.id===keep)?keep:'u-mary';ui.statsTeam=null;ui.adminTeam=null;persist();render();toast('Demo reset to the example season')},
  csvMatch:()=>{const m=active();if(!m)return;const t=team(m.teamId);const rows=[['Half','Minute','Side','Event','Player','Foireann no.','Source','Distance (m)','Note','Logged by']];
    for(const e of [...m.events].sort((a,b)=>OG.abs(m,a.per,a.sec)-OG.abs(m,b.per,b.sec))){const p=player(t,e.pid);rows.push([OG.perShort(e.per),OG.minOf(e.sec,OG.halfOf(m,e.per)),e.side==='us'?S.club:m.opp,lbl(e.type,m.code)+(e.blood?' (blood)':''),e.type==='sub'||e.type==='bloodret'?pName(t,e.pid)+' off, '+pName(t,e.onId)+' on':pName(t,e.pid),p?p.foireann:'',e.src?srcL(e.src,m.code):'',hasLoc(e)?Math.round(distM(e)):'',e.text||'',e.by||''])}
    ui.csv=OG.csv(rows);render();saveFile(`${t.name} v ${m.opp} ${m.date}.csv`.replace(/[\/\\:*?"<>|]/g,'-'),ui.csv,toast)},
  csvSeason:d=>{const t=team(d.id);const st=teamStats(t.id);const rows=[['No.','Player','Foireann no.','Apps','Starts','Minutes','Goals','Points','2-pointers','Total','Shots','Wides','From frees',set45(t.code)+'s scored','Turnovers won','Turnovers lost','Frees won','Frees conceded','Saves','Yellow','Black','Red']];
    for(const r of st.rows.sort((a,b)=>a.p.num-b.p.num))rows.push([r.p.num,r.p.name,r.p.foireann||'',r.apps,r.starts,Math.round(r.mins/60),r.goal,r.point,r.two,r.ptsTotal,shots(r),r.wide,r.free,r.s45,r.tow,r.tol,r.fwon,r.fcon,r.save,r.yellow,r.black,r.red]);
    ui.csv=OG.csv(rows);render();saveFile(`${t.name} season stats.csv`,ui.csv,toast)},
  copyCsv:()=>copy(ui.csv,'CSV copied','csvbox'),
  copyReport:d=>{const m=active();copy(OG.report(S,m,d.pub==='1'),'Match report copied')},
  share:async()=>{const m=active();if(!m)return;const t=team(m.teamId);const f=fixture(m.fixtureId)||{};const u=score(m,'us'),th=score(m,'them');
    const c=await OG.resultCard({label:m.ended?(m.clock.period==='AET'?'Full time (after extra time)':'Full time'):OG.perShort(m.clock.period),us:S.club+' '+t.name,them:m.opp,usScore:`${fmtS(u)} (${u.t})`,themScore:`${fmtS(th)} (${th.t})`,sub:[f.comp,new Date(m.date+'T12:00').toLocaleDateString('en-IE',{day:'numeric',month:'short',year:'numeric'})].filter(Boolean).join(' · ')});
    openShare(c,`${S.club} ${fmtS(u)} – ${fmtS(th)} ${m.opp}`)},
  setMeUser:d=>{}
};

document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;ensureAudio();const f=acts[b.dataset.act];if(f)f(b.dataset,b)});
document.addEventListener('change',async e=>{
  const el=e.target,d=el.dataset;
  if(el.id==='who'){S.me=el.value;S.active=null;S.tab=isScorer()?'match':'stats';ui.statsTeam=null;persist();render();window.scrollTo(0,0);toast('Viewing as '+me().label);return}
  if(!d.chg)return;
  if(d.chg==='team'){const t=team(d.id);
    if(['half','etHalf','onField','sinbinMins'].includes(d.k))t[d.k]=Math.max(1,Number(el.value)||t[d.k]);
    else if(['arc','shotLoc','leaderboard'].includes(d.k))t[d.k]=el.checked;
    else t[d.k]=el.value;
    if(d.k==='assoc'){t.arc=undefined;normTeam(t);const h=gradeHalf(t);if(h)t.half=h}
    if(d.k==='grade'){const h=gradeHalf(t);if(h)t.half=h;t.arc=defaultArc(t);t.tier=defaultTier(t);t.onField=t.tier==='gogames'?11:15}
    normTeam(t);persist();render()}
  if(d.chg==='pl'){const t=team(d.id),p=player(t,d.pid);if(!p)return;if(d.k==='num')p.num=Number(el.value)||p.num;else p[d.k]=el.value.trim();t.players.sort((a,b)=>a.num-b.num);persist()}
  if(d.chg==='mhalf'){const m=active();if(!canScore(m))return;m.half=Math.max(1,Number(el.value)||m.half);persist();render()}
  if(d.chg==='club'){S.club=el.value.trim()||'Owenmore Gaels';persist();render()}
  if(d.chg==='setting'){S.settings[d.k]=el.type==='checkbox'?el.checked:el.value.trim();persist();render();toast('Saved')}
  if(d.chg==='mapPl'){ui.mapPl=el.value;render()}
  if(d.chg==='logo'){const f=el.files&&el.files[0];if(!f)return;const fr=new FileReader();fr.onload=()=>{const img=new Image();img.onload=()=>{const k=Math.min(1,256/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);S.logo=c.toDataURL('image/png');persist();render();toast('Badge updated')};img.src=fr.result};fr.readAsDataURL(f)}
});

/* ========== sheets ========== */
function sheet(html,onclick){const sh=document.getElementById('sheet');sh.innerHTML=`<div class="sheet-bg" data-close="1"><div class="sheet" role="dialog">${html}</div></div>`;sh.hidden=false;
  sh.onclick=e=>{if(e.target.dataset.close){closeSheet();return}onclick&&onclick(e)}}
function closeSheet(){const sh=document.getElementById('sheet');sh.hidden=true;sh.innerHTML='';sh.onclick=null}
const sheetHead=title=>`<div class="row" style="justify-content:space-between"><h2>${esc(title)}</h2><button class="btn sm" data-close="1">Cancel</button></div>`;
function pgrid(t,ids,mark){const ps=ids.map(id=>player(t,id)).filter(Boolean).sort((a,b)=>a.num-b.num);
  return ps.length?`<div class="pgrid">${ps.map(p=>`<button class="pbtn${mark&&mark.has(p.id)?' on':''}" data-pid="${p.id}"><b>${p.num}</b><span>${esc(p.name||'—')}</span></button>`).join('')}</div>`:'<p class="muted">No players to pick.</p>'}
function describe(m,e){const t=team(m.teamId);return `${lbl(e.type,m.code)} at ${OG.minOf(e.sec,OG.halfOf(m,e.per))} (${OG.perShort(e.per)})${e.pid?' by '+pName(t,e.pid):''}${e.side==='them'?' ('+m.opp+')':''}`}

function openShot(m,type){
  const t=team(m.teamId);const is45=type==='t45';const onIds=[...OG.onPitch(m)];
  let src=is45?'45':'play',out=is45?null:(type==='miss'?'wide':type),side=null,loc=null;
  const finalType=()=>{let ft=out;if(is45&&out==='scored')ft=footy(m.code)&&m.arc?'two':'point';
    if(!is45&&loc&&m.arc&&footy(m.code)&&src!=='pen'){if(ft==='point'&&outsideArc(loc,m.code,m.arc))ft='two';else if(ft==='two'&&!outsideArc(loc,m.code,m.arc))ft='point'}return ft};
  const draw=()=>{
    const title=is45?set45(m.code)+' taken':type==='miss'?'Missed shot':lbl(type,m.code);
    const srcs=is45?[]:Object.keys(SRC).filter(k=>k!=='45'&&!(type!=='goal'&&type!=='miss'&&k==='pen')&&!(type==='goal'&&k==='mark')&&!(!footy(m.code)&&k==='mark')&&!(type==='two'&&k==='pen'));
    const ft=finalType();
    sheet(`${sheetHead(title)}
      ${is45?`<div class="grp"><h3>Result</h3><div class="seg big out">${[['scored','Scored'],['wide','Wide'],['short','Dropped short']].map(([k,l])=>`<button data-out="${k}" aria-pressed="${out===k}">${l}</button>`).join('')}</div></div>
        <div class="grp"><h3>Side</h3><div class="seg">${['Left','Centre','Right'].map(k=>`<button data-side="${k}" aria-pressed="${side===k}">${k}</button>`).join('')}</div></div>`:''}
      ${type==='miss'?`<div class="grp"><h3>Result</h3><div class="seg big out">${[['wide','Wide'],['short','Dropped short'],['saved','Saved / blocked']].map(([k,l])=>`<button data-out="${k}" aria-pressed="${out===k}">${l}</button>`).join('')}</div></div>`:''}
      ${srcs.length?`<div class="grp"><h3>From</h3><div class="seg">${srcs.map(k=>`<button data-src="${k}" aria-pressed="${k===src}">${esc(srcL(k,m.code))}</button>`).join('')}</div></div>`:''}
      ${!is45&&t.shotLoc?`<details class="locbox"${loc?' open':''}><summary>${loc?`Location: ${Math.round(distM(loc))}m, ${sideOf(loc).toLowerCase()}${ft!==out&&isScore(out)?` · logged as ${ft==='two'?'2 points':'1 point'}`:''}`:'Add where it was taken from (optional)'}</summary><div class="pitchbox">${pitchSVG({code:m.code,arc:m.arc,mark:loc,id:'shotpitch'})}</div></details>`:''}
      ${is45&&out==='scored'?`<p class="legend">Counts ${ft==='two'?'2 points (arc rules)':'1 point'}.</p>`:''}
      <div class="grp"><h3>${is45?'Who took it':'Player'}</h3>${pgrid(t,onIds)}</div>
      <button class="btn" data-pid="">No player / not sure</button>`,e=>{
        const o=e.target.closest('[data-out]');if(o){out=o.dataset.out;draw();return}
        const sd=e.target.closest('[data-side]');if(sd){side=sd.dataset.side;draw();return}
        const s=e.target.closest('[data-src]');if(s){src=s.dataset.src;draw();return}
        const b=e.target.closest('[data-pid]');if(!b)return;
        if(is45&&!out){toast('Pick the result first');return}
        const ev={side:'us',type:finalType(),pid:b.dataset.pid||null,src};if(is45){const lx=side==='Left'?14:side==='Right'?66:40;ev.lx=lx;ev.ly=footy(m.code)?45:65}else if(loc){ev.lx=loc.lx;ev.ly=loc.ly}
        closeSheet();addEvent(ev,is45?set45(m.code):null)});
    const svg=document.getElementById('shotpitch');
    if(svg)svg.addEventListener('click',ev=>{const r=svg.getBoundingClientRect();if(!r.width)return;const D=DEPTH(m.code);
      loc={lx:Math.round(Math.max(0,Math.min(PW,(ev.clientX-r.left)/r.width*PW))*2)/2,ly:Math.round(Math.max(0,Math.min(D,(ev.clientY-r.top)/r.height*D))*2)/2};draw()});
  };
  draw();
}
function openCard(m,side){
  const t=team(m.teamId);let card='yellow';const rule=OG.sinbinRule(t);
  const draw=()=>{const sb=rule&&rule.card===card;
    sheet(`${sheetHead(side==='them'?'Card for '+m.opp:'Card')}
      <div class="seg big cards">${['yellow'].concat(hasBlack(m.code)?['black']:[]).concat(['red']).map(k=>`<button class="c-${k}" data-card="${k}" aria-pressed="${card===k}">${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div>
      <p class="legend">${sb?`Sin-bin: ${rule.secs/60} minutes of playing time. A countdown appears on the scoring screen.`:card==='red'?'Sent off for the rest of the match.':'No sin-bin for this card in this grade.'}</p>
      ${side==='them'?'<button class="btn pri" data-pid="">Log card</button>':`<div class="grp"><h3>Player</h3>${pgrid(t,[...OG.onPitch(m)])}</div><button class="btn" data-pid="">No player / not sure</button>`}`,e=>{
      const c=e.target.closest('[data-card]');if(c){card=c.dataset.card;draw();return}
      const b=e.target.closest('[data-pid]');if(!b)return;const ev={side:side||'us',type:card,pid:b.dataset.pid||null};if(sb)ev.sinbin=rule.secs;closeSheet();addEvent(ev)})};
  draw();
}
function openSub(m){
  const t=team(m.teamId);const on=OG.onPitch(m);const sentOff=new Set(m.events.filter(e=>e.type==='red'&&e.side==='us').map(e=>e.pid));
  let off=null,blood=false;
  const draw=()=>{const bench=t.players.filter(p=>!on.has(p.id)&&!sentOff.has(p.id)).map(p=>p.id);
    sheet(`${sheetHead(off?'Player coming on':'Player coming off')}
      <label class="row" style="gap:10px"><input type="checkbox" id="bloodchk" ${blood?'checked':''}> <span>Blood sub (the player can come back on)</span></label>
      ${off?`<p class="legend">Off: ${esc(pName(t,off))}</p>${pgrid(t,bench)}`:pgrid(t,[...on])}`,e=>{
      if(e.target.id==='bloodchk'){blood=e.target.checked;return}
      const b=e.target.closest('[data-pid]');if(!b||!b.dataset.pid)return;
      if(!off){off=b.dataset.pid;draw();return}
      closeSheet();addEvent({side:'us',type:'sub',pid:off,onId:b.dataset.pid,blood})})};
  draw();
}
function openNote(m){
  sheet(`${sheetHead('Add note')}
    <p class="legend">Type, or tap the microphone on your phone's keyboard to dictate. The note is stamped with the match time and shows on the match timeline.</p>
    <textarea id="notetxt" rows="4" placeholder="e.g. Switch #4 onto their #11"></textarea>
    <div class="row"><button class="btn pri" data-save="1">Save note</button></div>`,e=>{
    if(!e.target.dataset.save)return;const txt=document.getElementById('notetxt').value.trim();if(!txt){toast('Type a note first');return}
    closeSheet();if(canScore(m))addEvent({side:'us',type:'note',text:txt.slice(0,500)});
    else{m.events.push({id:uid(),per:m.clock.period==='AET'?4:m.clock.period==='FT'?2:isPlaying(m.clock.period)?m.clock.period:1,sec:0,side:'us',type:'note',text:txt.slice(0,500),by:me().name,at:Date.now()});audit(m,'Added note');persist();render();toast('Note added')}});
  setTimeout(()=>{const n=document.getElementById('notetxt');n&&n.focus()},50);
}
function openEdit(m,e,justPlayer){
  const t=team(m.teamId);const canEdit=canScore(m)||(m.ended&&canManage(m.teamId));
  if(!canEdit){toast('Only the scorer (or a coach after full time) can change events');return}
  const pidTypes=PLAYER_TYPES.includes(e.type)&&e.side==='us';
  sheet(`${sheetHead(justPlayer?'Who was it?':'Change event')}
    <p class="legend">${esc(describe(m,e))}</p>
    ${pidTypes?pgrid(t,t.players.map(p=>p.id),new Set([e.pid])):''}
    ${!justPlayer?`<div class="row"><button class="btn warn${A('delev')}" data-del="1">Delete event</button></div>`:''}
    <p class="legend">Changes are recorded in the match audit trail.</p>`,ev=>{
    const b=ev.target.closest('[data-pid]');
    if(b&&b.dataset.pid){const was=pName(t,e.pid)||'no player';e.pid=b.dataset.pid;audit(m,`Changed player on ${lbl(e.type,m.code)} at ${OG.minOf(e.sec,OG.halfOf(m,e.per))} (${OG.perShort(e.per)}) from ${was} to ${pName(t,e.pid)}`);closeSheet();syncResult(m);persist();render();toast('Updated');return}
    if(ev.target.dataset.del){m.events=m.events.filter(x=>x!==e);audit(m,'Deleted '+describe(m,e));closeSheet();syncResult(m);persist();render();toast('Deleted')}});
}
function openHandover(m){
  const t=team(m.teamId);const opts=S.users.filter(u=>u.id!==m.scorer&&(u.role==='scorer'||u.role==='admin'||(u.role==='coach'&&u.teamId===t.id)));
  sheet(`${sheetHead('Hand over scoring')}
    <p class="legend">Only one person scores a match at a time. Pick who takes over; your screen becomes view-only.</p>
    <div class="pgrid">${opts.map(u=>`<button class="pbtn" data-uid="${u.id}"><b>${esc(u.name[0])}</b><span>${esc(u.label)}</span></button>`).join('')}</div>`,e=>{
    const b=e.target.closest('[data-uid]');if(!b)return;const was=userName(m.scorer);m.scorer=b.dataset.uid;const f=fixture(m.fixtureId);if(f)f.scorer=m.scorer;
    audit(m,`Handed scoring from ${was} to ${userName(m.scorer)}`);closeSheet();persist();render();toast('Handed over to '+userName(m.scorer)+'. Switch "Viewing as" to carry on as them.')});
}
function openShare(canvas,text){
  const url=canvas.toDataURL('image/png');
  sheet(`${sheetHead('Share result')}<img src="${url}" alt="${esc(text)}" class="sharecard"><p class="legend">On a phone, long-press the image to save it, or use Share to send it to WhatsApp.</p><div class="row"><button class="btn pri" data-sh="1">Share</button><button class="btn" data-sv="1">Save image</button></div>`,async e=>{
    if(e.target.dataset.sv){const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));saveFile('owenmore-result.png',blob,toast);return}
    if(!e.target.dataset.sh)return;
    try{const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));const file=new File([blob],'result.png',{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],text});return}
      if(navigator.share){await navigator.share({text});return}}catch(err){}
    toast('Sharing isn’t available here. Long-press the image to save it.')});
}
