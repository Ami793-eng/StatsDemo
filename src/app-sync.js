/* ========== server sync ========== */
const sync={busy:false,again:false,timer:null,state:'off',msg:''};
async function api(action,body){
  try{
    const r=await fetch('/api/live',{method:'POST',headers:{'content-type':'application/json','x-pin':auth.pin},body:JSON.stringify(Object.assign({action},body||{}))});
    let data=null;try{data=await r.json()}catch(e){}
    if(!data)return{ok:false,status:404,error:'The club server isn’t set up on this site yet. Sign-in works once the app is on your Netlify site; try the demo below for now.'};
    return{ok:r.ok,status:r.status,data,error:data&&data.error};
  }catch(e){return{ok:false,status:0,error:'No signal'}}
}
function setSync(state,msg){sync.state=state;sync.msg=msg;const d=document.getElementById('livedot');if(d){d.dataset.s=S&&S.mode==='server'?state:'off';d.title=msg}const s=document.getElementById('syncmsg');if(s)s.textContent=msg}
const teamOut=t=>({id:t.id,name:t.name,assoc:t.assoc,grade:t.grade,half:t.half,code:t.code,arc:!!t.arc,names:t.names||'num',players:t.players});
const sigT=t=>JSON.stringify([teamOut(t),S.fixtures.filter(f=>f.teamId===t.id)]);
const sigM=m=>JSON.stringify(m);
function liveClock(m){const c=m.clock;return{period:c.period,running:!!c.running,elapsed:(c.period==='HT'||c.period==='FT')?0:Math.round(elapsed(m)*10)/10}}
function schedule(ms){if(!S||S.mode!=='server'||!auth.pin)return;clearTimeout(sync.timer);sync.timer=setTimeout(pushDirty,ms??600)}
async function pushDirty(){
  if(S.mode!=='server'||!auth.pin)return true;
  if(sync.busy){sync.again=true;return false}
  sync.busy=true;let ok=true;
  const must=async(action,body)=>{const r=await api(action,body);if(!r.ok)throw r;return r};
  try{
    if(isMgr()&&S.sig.club!==S.club){await must('saveClub',{club:S.club});S.sig.club=S.club}
    for(const t of S.teams){
      if(S.sig.t[t.id]===sigT(t))continue;
      const r=await must('saveTeam',{team:teamOut(t),fixtures:S.fixtures.filter(f=>f.teamId===t.id),deleted:S.deletedFx||[]});
      if(r.data&&r.data.team)r.data.team.players.forEach(sp=>{const p=t.players.find(x=>x.id===sp.id);if(p&&p.code!==sp.code)p.code=sp.code});
      S.sig.t[t.id]=sigT(t);
    }
    for(const id of Object.keys(S.sig.t))if(!team(id)){if(isMgr())await must('deleteTeam',{id});delete S.sig.t[id]}
    for(const m of S.matches){const g=sigM(m);if(S.sig.m[m.id]===g)continue;await must('saveMatch',{match:m,live:liveClock(m)});S.sig.m[m.id]=g}
    for(const id of Object.keys(S.sig.m))if(!S.matches.some(m=>m.id===id)){await must('deleteMatch',{id});delete S.sig.m[id]}
    S.deletedFx=[];persist();setSync('ok','Synced '+new Date().toLocaleTimeString('en-IE'));
  }catch(r){
    ok=false;
    if(r.status===401)setSync('err','Your PIN no longer works. Sign out and sign in again.');
    else if(r.status===403||r.status===400)setSync('err',r.error||'The server refused a change.');
    else{setSync('err',(r.status===0?'No signal':(r.error||'Sync failed'))+'. Saved on this phone, retrying.');clearTimeout(sync.timer);sync.timer=setTimeout(pushDirty,10000)}
  }
  sync.busy=false;if(sync.again){sync.again=false;schedule(100)}
  return ok;
}
function applyPull(d){
  const keepTab=S.tab,keepActive=S.active;
  S=emptyState('server');S.role=d.role;S.club=d.club;S.logoVer=d.logoVer||null;S.imports=d.imports||null;S.tab=keepTab||'match';
  S.teams=d.teams.map(t=>normTeam({id:t.id,name:t.name,assoc:t.assoc,grade:t.grade,half:t.half,code:t.code,arc:t.arc,names:t.names||'num',players:t.players||[],hasCoachPin:!!t.hasCoachPin}));
  S.fixtures=d.teams.flatMap(t=>t.fixtures||[]);
  S.matches=d.matches.map(x=>{const{live,savedAt,...m}=x;if(m.clock&&m.clock.running&&live){m.clock.acc=live.elapsed+(d.now-savedAt)/1000;m.clock.since=Date.now()}return m});
  S.active=S.matches.some(m=>m.id===keepActive)?keepActive:null;
  S.sig={club:S.club,t:{},m:{}};S.teams.forEach(t=>S.sig.t[t.id]=sigT(t));S.matches.forEach(m=>S.sig.m[m.id]=sigM(m));
  persist();
}
async function refresh(quiet){
  if(S.mode!=='server')return;
  setSync('wait','Syncing…');
  const pushed=await pushDirty();if(!pushed)return;
  const r=await api('pull');
  if(!r.ok){setSync('err',r.status===401?'Your PIN no longer works. Sign out and sign in again.':(r.error||'Could not load club data')+'.');return}
  applyPull(r.data);render();setSync('ok','Synced '+new Date().toLocaleTimeString('en-IE'));if(!quiet)toast('Up to date');
}

/* ========== clock ========== */
function elapsed(m){const c=m.clock;return c.acc+(c.running?(Date.now()-c.since)/1000:0)}
let audio=null;
function ensureAudio(){try{if(!audio){const A=window.AudioContext||window.webkitAudioContext;if(A)audio=new A()}if(audio&&audio.state==='suspended')audio.resume()}catch(e){}}
function whistle(){
  try{if(audio){const t=audio.currentTime;[0,.35,.7].forEach(d=>{const o=audio.createOscillator(),g=audio.createGain();o.type='square';o.frequency.value=2900;g.gain.setValueAtTime(.0001,t+d);g.gain.exponentialRampToValueAtTime(.25,t+d+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d+.28);o.connect(g).connect(audio.destination);o.start(t+d);o.stop(t+d+.3)})}}catch(e){}
  try{navigator.vibrate&&navigator.vibrate([400,150,400,150,400])}catch(e){}
}
let wake=null;
async function keepAwake(on){try{if(on&&!wake&&navigator.wakeLock){wake=await navigator.wakeLock.request('screen');wake.addEventListener('release',()=>wake=null)}else if(!on&&wake){await wake.release();wake=null}}catch(e){}}
const perLabel=p=>p===0?'Before throw-in':p===1?'1st half':p==='HT'?'Half time':p===2?'2nd half':'Full time';
function clockHTML(m){const c=m.clock;if(c.period==='HT')return 'HT';if(c.period==='FT')return 'FT';const e=elapsed(m);return `${minOf(e,m.half)}<span class="sec">${pad(Math.floor(e)%60)}s</span>`}
function tick(){
  if(!S)return;const m=active();if(!m||S.tab!=='match')return;
  const el=document.getElementById('clk');if(!el)return;
  const c=m.clock,e=elapsed(m),lim=m.half*60;
  el.innerHTML=clockHTML(m);el.classList.toggle('paused',!c.running);
  const ov=document.getElementById('over');if(ov)ov.textContent=(c.period===1||c.period===2)&&e>lim?'Added time: +'+mmss(e-lim):(c.period===1||c.period===2)?mmss(e)+' of '+m.half+':00':'';
  if(c.running&&(c.period===1||c.period===2)&&e>=lim&&!c.alerted[c.period]){
    c.alerted[c.period]=true;persist();whistle();
    const ab=document.getElementById('alertbar');
    if(ab){const w=c.period===1?'Half time':'Full time';ab.hidden=false;ab.textContent=w+' is due ('+m.half+' minutes played). Tap '+w+' when the ref blows.';ab.classList.remove('flash');void ab.offsetWidth;ab.classList.add('flash')}
  }
}
setInterval(tick,250);

/* ========== actions ========== */
function armed(key){const now=Date.now();if(ui.armed===key&&now-ui.armT<3500){ui.armed=null;return true}ui.armed=key;ui.armT=now;render();setTimeout(()=>{if(ui.armed===key&&Date.now()-ui.armT>=3400){ui.armed=null;render()}},3600);return false}
const A=n=>ui.armed===n?' armed':'';
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,1900)}
async function copy(text,okMsg,inputId){try{await navigator.clipboard.writeText(text);toast(okMsg)}catch(e){const i=inputId&&document.getElementById(inputId);if(i){i.focus();i.select()}toast('Selected, copy it')}}

function syncResult(m){const f=S.fixtures.find(x=>x.id===m.fixtureId);if(!f)return;f.result={us:score(m,'us'),them:score(m,'them')};if(m.clock.period==='FT')f.status='played'}
function addEvent(o,note){
  const m=active();if(!m)return;const per=m.clock.period;
  const ev=Object.assign({id:uid(),per,sec:Math.floor(per==='HT'||per==='FT'?0:elapsed(m))},o);
  m.events.push(ev);syncResult(m);save();schedule(150);render();
  const t=team(m.teamId);toast((note?note+' · ':'')+lbl(ev.type,m.code)+(ev.pid?' · '+pName(t,ev.pid):'')+(ev.side==='them'?' · '+m.opp:''));
}
function startMatch(fx){
  const t=team(fx.teamId);
  const m={id:uid(),fixtureId:fx.id,teamId:t.id,opp:fx.opp,date:fx.date,half:t.half,code:t.code,arc:!!t.arc,events:[],clock:{period:0,running:false,acc:0,since:0,alerted:{}}};
  S.matches.push(m);fx.matchId=m.id;fx.status='live';S.active=m.id;S.tab='match';save();render();
}
function resizeImage(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onerror=rej;fr.onload=()=>{const img=new Image();img.onerror=rej;img.onload=()=>{const k=Math.min(1,256/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);res(c.toDataURL('image/png'))};img.src=fr.result};fr.readAsDataURL(file)})}

const acts={
  tab:d=>{S.tab=d.v;persist();render();window.scrollTo(0,0)},
  login:async()=>{
    const pin=document.getElementById('pin').value.trim();if(!pin){ui.loginErr='Enter your PIN.';render();return}
    ui.busyLogin=true;ui.loginErr='';render();auth.pin=pin;
    const r=await api('pull');ui.busyLogin=false;
    if(!r.ok){auth.pin='';ui.loginErr=r.status===401?'That PIN isn’t recognised. Check it with the club manager.':r.status===0?'No signal. Try again when you have coverage.':(r.error||'Sign-in failed.');render();return}
    auth.role=r.data.role;store.set(AUTHKEY,JSON.stringify(auth));store.set(MODEKEY,'server');
    S=emptyState('server');applyPull(r.data);render();setSync('ok','Synced '+new Date().toLocaleTimeString('en-IE'));
    toast(r.data.role==='manager'?'Signed in as manager':'Signed in as coach');
  },
  demo:()=>{store.set(MODEKEY,'demo');S=JSON.parse(store.get(KEY+'-demo')||'null');if(!S||S.v!==3)S=seed();S.mode='demo';persist();render()},
  resetDemo:()=>{if(!armed('reset'))return;S=buildDemo();ui.statsTeam=null;ui.squadTeam=null;persist();render();toast('Demo reset to the example season')},
  signout:()=>{
    if(S.mode==='demo'){store.set(MODEKEY,'server');S=(auth.pin&&JSON.parse(store.get(KEY)||'null'))||emptyState('server');S.mode='server';render();if(auth.pin)refresh(true);return}
    const dirty=S.teams.some(t=>S.sig.t[t.id]!==sigT(t))||S.matches.some(m=>S.sig.m[m.id]!==sigM(m));
    if(!armed('signout')){if(dirty)toast('Some changes haven’t synced yet. Tap again to sign out anyway.');return}
    auth={pin:'',role:null};store.del(AUTHKEY);store.del(KEY);S=emptyState('server');ui.loginErr='';setSync('off','');render()},
  refresh:()=>refresh(false),
  run:()=>{const m=active();const c=m.clock;if(c.period==='HT'||c.period==='FT')return;
    if(c.period===0){c.period=1;c.acc=0}
    if(c.running){c.acc=elapsed(m);c.running=false;keepAwake(false)}else{c.since=Date.now();c.running=true;keepAwake(true)}
    save();schedule(100);render()},
  next:()=>{const m=active(),c=m.clock;
    if(c.period===0){acts.run();return}
    if(c.period===1){if(!armed('next'))return;c.h1=elapsed(m);c.running=false;c.acc=0;c.period='HT'}
    else if(c.period==='HT'){c.period=2;c.acc=0;c.since=Date.now();c.running=true;keepAwake(true)}
    else if(c.period===2){if(!armed('next'))return;c.h2=elapsed(m);c.running=false;c.acc=0;c.period='FT';keepAwake(false);syncResult(m)}
    save();schedule(100);render()},
  adj:d=>{const m=active();const c=m.clock;const e=elapsed(m);c.acc=Math.max(0,e+Number(d.v));if(c.running)c.since=Date.now();save();tick()},
  ev:d=>{const m=active();
    if(d.side==='them'){addEvent({side:'them',type:d.type});return}
    if(['kow','kol','okw','okl','w45'].includes(d.type)){addEvent({side:'us',type:d.type});return}
    if(d.type==='t45'){openShot(m,'t45');return}
    if(SHOTS.includes(d.type)){openShot(m,d.type);return}
    openPlain(m,d.type)},
  delEv:d=>{if(!armed('del'+d.id))return;const m=active();m.events=m.events.filter(e=>e.id!==d.id);syncResult(m);save();render()},
  closeMatch:()=>{const m=active();if(m&&m.clock.period!=='FT'){if(!armed('close'))return;const f=S.fixtures.find(x=>x.id===m.fixtureId);if(f&&f.status==='live')f.status=m.events.length?'played':'upcoming'}S.active=null;keepAwake(false);save();render()},
  startFx:d=>{const f=S.fixtures.find(x=>x.id===d.id);if(!f)return;if(f.matchId&&S.matches.find(m=>m.id===f.matchId)){S.active=f.matchId;S.tab='match';save();render();return}startMatch(f)},
  quick:()=>{const tid=document.getElementById('q-team').value,opp=document.getElementById('q-opp').value.trim();if(!tid){toast('No squad to score for yet');return}if(!opp){toast('Type the opposition name');document.getElementById('q-opp').focus();return}
    const f={id:uid(),teamId:tid,date:ymd(new Date()),time:new Date().toTimeString().slice(0,5),opp,venue:'Home',comp:'Friendly',status:'upcoming',createdAt:Date.now()};S.fixtures.push(f);startMatch(f)},
  month:d=>{const [y,mo]=ui.month.split('-').map(Number);const dt=new Date(y,mo-1+Number(d.v),1);ui.month=dt.getFullYear()+'-'+pad(dt.getMonth()+1);ui.day=null;render()},
  day:d=>{ui.day=ui.day===d.v?null:d.v;render()},
  teamF:d=>{ui.teamF=d.v;render()},
  addFx:()=>{const g=id=>document.getElementById(id).value.trim();const f={id:uid(),teamId:g('f-team'),date:g('f-date'),time:g('f-time'),opp:g('f-opp'),venue:g('f-venue'),comp:g('f-comp'),status:'upcoming',createdAt:Date.now()};
    if(!f.teamId){toast('No squad to add fixtures for');return}if(!f.date||!f.opp){toast('Fixtures need a date and an opposition');return}
    S.fixtures.push(f);ui.month=f.date.slice(0,7);ui.day=f.date;save();render();toast('Fixture added')},
  editFx:d=>{ui.editFx=ui.editFx===d.id?null:d.id;render()},
  saveFx:d=>{const f=S.fixtures.find(x=>x.id===d.id);if(!f)return;const g=k=>document.getElementById('e-'+k+'-'+f.id).value.trim();
    const nd={date:g('date'),time:g('time'),venue:g('venue')};if(!nd.date){toast('A fixture needs a date');return}
    const moved=nd.date!==f.date||nd.time!==(f.time||'')||nd.venue!==(f.venue||'');
    if(moved&&f.status==='upcoming'){if(!f.prev)f.prev={date:f.date,time:f.time||'',venue:f.venue||''};f.changedAt=Date.now()}
    Object.assign(f,nd,{opp:g('opp')||f.opp,comp:g('comp')});
    if(f.prev&&f.prev.date===f.date&&f.prev.time===f.time&&f.prev.venue===f.venue)delete f.prev;
    ui.editFx=null;save();render();toast(moved?'Fixture moved. Parents will see the change.':'Fixture saved')},
  cancelFx:d=>{const f=S.fixtures.find(x=>x.id===d.id);if(!f)return;
    if(f.status==='cancelled'){f.status='upcoming';f.changedAt=Date.now();save();render();toast('Fixture back on');return}
    if(!armed('cfx'+f.id))return;f.status='cancelled';f.changedAt=Date.now();ui.editFx=null;save();render();toast('Fixture cancelled. Parents will see it.')},
  delFx:d=>{if(!armed('dfx'+d.id))return;const f=S.fixtures.find(x=>x.id===d.id);S.fixtures=S.fixtures.filter(x=>x!==f);if(f&&f.ext)(S.deletedFx=S.deletedFx||[]).push(f.id);if(f&&f.matchId){S.matches=S.matches.filter(m=>m.id!==f.matchId);if(S.active===f.matchId)S.active=null}ui.editFx=null;save();render()},
  importNow:async()=>{if(S.mode!=='server'){toast('The Sligo GAA import runs on your Netlify site');return}
    ui.importing=true;render();const ok=await pushDirty();const r=ok?await api('importNow'):{ok:false,error:'Sync first (check signal)'};ui.importing=false;
    if(!r.ok){render();toast(r.error||'Import failed');return}
    await refresh(true);const sm=r.data.summary;toast(sm.error?sm.error:`Checked Sligo GAA: ${sm.added} new, ${sm.moved} moved`)},
  assignImp:async d=>{const sel=document.getElementById('imp-'+d.i);if(!sel||!sel.value){toast('Pick a squad first');return}
    const r=await api('assignImport',{key:d.key,teamId:sel.value});if(!r.ok){toast(r.error||'Could not link');return}
    await refresh(true);toast('Linked. Future fixtures in that competition go to '+(team(sel.value)||{}).name)},
  statsTeam:d=>{ui.statsTeam=d.v;ui.mapPl='all';S.tab='stats';persist();render();window.scrollTo(0,0)},
  mapSrc:d=>{ui.mapSrc=d.v;render()},
  squadTeam:d=>{ui.squadTeam=d.v;render()},
  addTeam:()=>{const t=normTeam({id:uid(),name:'New squad',assoc:'gaa_f',grade:'U12',half:25,names:'num',players:[]});S.teams.push(t);ui.squadTeam=t.id;save();render();const n=document.getElementById('t-name');if(n){n.focus();n.select()}},
  delTeam:d=>{if(!armed('dt'+d.id))return;S.teams=S.teams.filter(t=>t.id!==d.id);const ids=new Set(S.fixtures.filter(f=>f.teamId===d.id).map(f=>f.matchId));S.fixtures=S.fixtures.filter(f=>f.teamId!==d.id);S.matches=S.matches.filter(m=>m.teamId!==d.id&&!ids.has(m.id));if(S.active&&!active())S.active=null;ui.squadTeam=null;save();render()},
  setPin:async d=>{const i=document.getElementById('cpin-'+d.id);const pin=i.value.trim();if(!/^\d{6,10}$/.test(pin)){toast('Coach PINs need 6 to 10 digits');return}
    if(S.mode!=='server'){toast('Coach PINs work once the app is on your Netlify site');return}
    const ok=await pushDirty();if(!ok){toast('Sync the squad first (check signal)');return}
    const r=await api('setCoachPin',{teamId:d.id,pin});if(!r.ok){toast(r.error||'Could not set PIN');return}
    const t=team(d.id);t.hasCoachPin=true;i.value='';persist();render();toast('Coach PIN set. Give it to the '+t.name+' coaches.')},
  delLogo:async()=>{if(!armed('dlogo'))return;if(S.mode==='demo'){S.logo=null;persist();render();return}
    const r=await api('saveLogo',{logo:''});if(!r.ok){toast(r.error||'Could not remove badge');return}S.logoVer=null;persist();render();toast('Badge removed')},
  addPl:d=>{const t=team(d.id);const n=t.players.reduce((a,p)=>Math.max(a,p.num),0)+1;t.players.push({id:uid(),num:n,name:'',code:newCode()});save();render();const ins=document.querySelectorAll('.pname');ins[ins.length-1]&&ins[ins.length-1].focus()},
  delPl:d=>{if(!armed('dp'+d.pid))return;const t=team(d.id);t.players=t.players.filter(p=>p.id!==d.pid);save();render()},
  newCode:d=>{if(!armed('nc'+d.pid))return;const p=player(team(d.id),d.pid);p.code=newCode();save();render();toast('New code made. The old link stops working.')},
  copyMe:d=>{const p=player(team(d.id),d.pid);copy(new URL('me.html?code='+p.code,location.href).href,'Link for #'+p.num+' copied')},
  copyAllCodes:d=>{const t=team(d.id);copy(t.name+' player stats links\n'+t.players.map(p=>'#'+p.num+' '+p.name+': '+new URL('me.html?code='+p.code,location.href).href).join('\n'),'All links copied')},
  copyLink:()=>copy(new URL('live.html',location.href).href,'Parents’ link copied','l-link'),
  backup:async()=>{ui.backup=JSON.stringify(S);render();copy(ui.backup,'Backup copied','bk')},
  restore:()=>{const v=document.getElementById('bk').value.trim();try{const o=JSON.parse(v);if(!o.teams||!o.fixtures||!o.matches)throw 0;if(!armed('restore'))return;
    o.teams.forEach(normTeam);
    if(S.mode==='server'){const mine=new Set(S.teams.map(t=>t.id));if(!isMgr()){o.teams=o.teams.filter(t=>mine.has(t.id));o.fixtures=o.fixtures.filter(f=>mine.has(f.teamId));o.matches=o.matches.filter(m=>mine.has(m.teamId))}
      Object.assign(S,{teams:o.teams,fixtures:o.fixtures,matches:o.matches,active:null})}else{S=o;S.mode='demo';S.v=3}
    ui.backup='';save();render();toast('Backup restored')}catch(e){toast('That text is not a valid backup')}}
};

document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;ensureAudio();const f=acts[b.dataset.act];if(f)f(b.dataset,b)});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='pin')acts.login()});
document.addEventListener('change',async e=>{
  const el=e.target,d=el.dataset;if(!d.chg)return;
  if(d.chg==='team'){const t=team(d.id);
    if(d.k==='half')t.half=Math.max(1,Number(el.value)||t.half);
    else if(d.k==='arc')t.arc=el.checked;
    else t[d.k]=el.value;
    if(d.k==='assoc'){normTeam(Object.assign(t,{arc:undefined}));const h=gradeHalf(t);if(h)t.half=h}
    if(d.k==='grade'){const h=gradeHalf(t);if(h)t.half=h;t.arc=defaultArc(t)}
    normTeam(t);save();render()}
  if(d.chg==='pl'){const t=team(d.id),p=player(t,d.pid);if(!p)return;if(d.k==='num')p.num=Number(el.value)||p.num;else p.name=el.value;t.players.sort((a,b)=>a.num-b.num);save()}
  if(d.chg==='mhalf'){const m=active();m.half=Math.max(1,Number(el.value)||m.half);save();render()}
  if(d.chg==='club'){S.club=el.value.trim()||'Owenmore Gaels';save();render()}
  if(d.chg==='mapPl'){ui.mapPl=el.value;render()}
  if(d.chg==='logo'){const f=el.files&&el.files[0];if(!f)return;
    let data;try{data=await resizeImage(f)}catch(err){toast('That file isn’t an image we can read. Try a PNG or JPG.');return}
    if(S.mode==='demo'){S.logo=data;persist();render();toast('Badge added');return}
    const r=await api('saveLogo',{logo:data});if(!r.ok){toast(r.error||'Could not save the badge');return}
    S.logoVer=r.data.logoVer;persist();render();toast('Badge saved for every page')}
});

/* ========== sheets: shot (with pitch), 45/65, plain player picker ========== */
function closeSheet(){const sh=document.getElementById('sheet');sh.hidden=true;sh.innerHTML='';sh.onclick=null}
function pgridHTML(t,offId){return t.players.length?`<div class="pgrid">${t.players.map(p=>`<button class="pbtn${p.id===offId?' off':''}" data-pid="${p.id}" ${p.id===offId?'disabled':''}><b>${p.num}</b><span>${esc(p.name||'—')}</span></button>`).join('')}</div>`:`<p class="muted">No players in this squad yet. Add them under Squads.</p>`}
function openShot(m,type){
  const t=team(m.teamId);const sh=document.getElementById('sheet');const is45=type==='t45';
  const D=DEPTH(m.code),line=footy(m.code)?45:65;
  let loc=is45?{lx:40,ly:line}:null,src=type==='penmiss'?'pen':is45?'45':'play',out=null;
  const finalType=()=>{
    if(is45)return out==='scored'?(footy(m.code)&&m.arc?'two':'point'):out;
    if(loc&&footy(m.code)&&m.arc&&src!=='pen'){if(type==='point'&&outsideArc(loc,m.code,m.arc))return 'two';if(type==='two'&&!outsideArc(loc,m.code,m.arc))return 'point'}
    return type};
  const draw=()=>{
    const title=is45?(set45(m.code)+' taken'):lbl(type,m.code);
    const ft=finalType();
    let where=is45?`<span>${sideOf(loc)} side of the ${line}m line</span>`:loc?`<span><b>${Math.round(distM(loc))}m</b> · ${BANDS(m.code,m.arc)[bandOf(loc,m.code)]}, ${sideOf(loc).toLowerCase()}</span>`:'<span class="muted">Tap where it was taken from (optional)</span>';
    if(!is45&&ft!==type&&isScore(type))where+=`<span class="chip d">Logged as ${ft==='two'?'2 points':'1 point'}</span>`;
    if(is45&&out==='scored')where+=`<span class="chip d">${ft==='two'?'2 points':'1 point'}</span>`;
    const srcs=is45||type==='penmiss'?[]:Object.keys(SRC).filter(k=>k!=='45'&&!(type==='two'&&k==='pen')&&!(!footy(m.code)&&k==='mark'));
    sh.innerHTML=`<div class="sheet-bg" data-close="1"><div class="sheet" role="dialog" aria-label="${esc(title)}">
      <div class="row" style="justify-content:space-between"><h2>${esc(title)}</h2><button class="btn sm" data-close="1">Cancel</button></div>
      <div class="where">${where}</div>
      <div class="pitchbox">${pitchSVG({code:m.code,arc:m.arc,mark:loc,hl45:is45,id:'shotpitch',label:'Tap the pitch where the shot was taken'})}</div>
      ${is45?`<div class="grp"><h3>Result</h3><div class="seg out">${[['scored','Scored'],['wide','Wide'],['short','Dropped short']].map(([k,l])=>`<button data-out="${k}" aria-pressed="${out===k}">${l}</button>`).join('')}</div></div>`:''}
      ${srcs.length?`<div class="grp"><h3>From</h3><div class="seg">${srcs.map(k=>`<button data-src="${k}" aria-pressed="${k===src}">${esc(srcL(k,m.code))}</button>`).join('')}</div></div>`:''}
      <div class="grp"><h3>${is45?'Who took it':'Player'}</h3>${pgridHTML(t)}</div>
      <button class="btn" data-pid="">No player / not sure</button>
    </div></div>`;
    const svg=document.getElementById('shotpitch');
    if(svg)svg.addEventListener('click',ev=>{const r=svg.getBoundingClientRect();if(!r.width)return;
      const lx=Math.max(0,Math.min(PW,(ev.clientX-r.left)/r.width*PW)),ly=Math.max(0,Math.min(D,(ev.clientY-r.top)/r.height*D));
      loc=is45?{lx:Math.round(lx*2)/2,ly:line}:{lx:Math.round(lx*2)/2,ly:Math.round(ly*2)/2};draw()});
  };
  draw();sh.hidden=false;
  sh.onclick=e=>{
    if(e.target.dataset.close){closeSheet();return}
    const o=e.target.closest('[data-out]');if(o){out=o.dataset.out;draw();return}
    const s=e.target.closest('[data-src]');if(s){src=s.dataset.src;draw();return}
    const b=e.target.closest('[data-pid]');if(!b)return;
    if(is45&&!out){toast('Pick the result first');return}
    const ft=finalType();const ev={side:'us',type:ft,pid:b.dataset.pid||null,src};if(loc){ev.lx=loc.lx;ev.ly=loc.ly}
    closeSheet();addEvent(ev,is45?set45(m.code):null);
  };
}
function openPlain(m,type){
  const t=team(m.teamId);const sh=document.getElementById('sheet');let step='main',offId=null;
  const draw=()=>{const title=type==='sub'?(step==='main'?'Player coming off':'Player coming on'):lbl(type,m.code);
    sh.innerHTML=`<div class="sheet-bg" data-close="1"><div class="sheet" role="dialog" aria-label="${esc(title)}">
      <div class="row" style="justify-content:space-between"><h2>${esc(title)}</h2><button class="btn sm" data-close="1">Cancel</button></div>
      ${pgridHTML(t,offId)}${type!=='sub'?'<button class="btn" data-pid="">No player / not sure</button>':''}</div></div>`};
  draw();sh.hidden=false;
  sh.onclick=e=>{
    if(e.target.dataset.close){closeSheet();return}
    const b=e.target.closest('[data-pid]');if(!b)return;const pid=b.dataset.pid||null;
    if(type==='sub'){if(step==='main'){offId=pid;step='on';draw();return}closeSheet();addEvent({side:'us',type:'sub',pid:offId,onId:pid});return}
    closeSheet();addEvent({side:'us',type,pid});
  };
}
