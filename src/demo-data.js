/* ===== Owenmore Gaels demo data =====
   Scorelines, dates, opponents and venues are real 2026 results (Ocean FM, Sligo LGFA, Sligo GAA).
   Players and the minute-by-minute events behind each scoreline are invented examples. */
const DEMO_KEY='owenmore-gaels-demo-v1', DEMO_VER=2;
const DEMO_SQUADS=[
  {id:'sen',name:'Senior Football',assoc:'gaa_f',grade:'Adult',half:30,arc:true,men:true},
  {id:'u20',name:'U20 Football',assoc:'gaa_f',grade:'U20',half:30,arc:true,men:true},
  {id:'lad',name:'Ladies Junior',assoc:'lgfa',grade:'Adult',half:30,arc:true},
  {id:'u16',name:'U16 Girls',assoc:'lgfa',grade:'U16',half:30,arc:true},
  {id:'u13',name:'U13 Girls',assoc:'lgfa',grade:'U13',half:25,arc:false}
];
// Real results
const DEMO_RESULTS=[
  {t:'sen',date:'2026-07-25',time:'19:30',opp:'Geevagh',venue:'Neutral',ground:'Bunninadden',comp:'Division 2 League Final (after extra time)',us:[1,18],them:[1,17]},
  {t:'sen',date:'2026-08-08',time:'18:00',opp:'Coolera/Strandhill',venue:'Home',ground:'Connolly Park',comp:'Junior A Championship, Group 1',us:[2,21],them:[3,6]},
  {t:'sen',date:'2026-09-06',time:'15:00',opp:'Tourlestrane',venue:'Away',ground:'',comp:'Junior A Championship, Group 1',us:[6,15],them:[0,7]},
  {t:'sen',date:'2026-10-04',time:'14:00',opp:"St Michael's",venue:'Neutral',ground:'Markievicz Park',comp:'Junior A Championship Final',us:[1,14],them:[0,16]},
  {t:'lad',date:'2026-09-13',time:'12:00',opp:"St John's",venue:'Home',ground:'',comp:'Junior B Championship',us:[4,16],them:[2,6]},
  {t:'lad',date:'2026-10-03',time:'14:00',opp:"St John's",venue:'Neutral',ground:'Eastern Harps',comp:'Connacht Gold Junior B Championship',us:[8,19],them:[4,4]},
  {t:'u16',date:'2026-09-22',time:'19:00',opp:'St Molaise Gaels',venue:'Home',ground:'',comp:'U16 B Championship',us:[5,14],them:[3,6]},
  {t:'u13',date:'2026-09-23',time:'19:00',opp:'CT Gaels',venue:'Away',ground:'CT Gaels',comp:'U13 Division 2 League',us:[1,7],them:[4,15]}
];
// Upcoming: the U20 game is real (Sligo GAA); the rest are examples to fill the calendar
const DEMO_UPCOMING=[
  {t:'u20',date:'2026-10-24',time:'16:00',opp:'Geevagh/St Michaels',venue:'Home',ground:'Connolly Park',comp:'U20 B Football Championship, Round 1',ref:'M. Duffy',source:'Sligo GAA'},
  {t:'u16',date:'2026-10-31',time:'11:00',opp:'Tourlestrane',venue:'Away',comp:'U16 League',example:true},
  {t:'lad',date:'2026-11-01',time:'12:00',opp:'Curry',venue:'Home',comp:'Ladies League',example:true,prev:{date:'2026-10-31',time:'14:00',venue:'Home'}},
  {t:'u13',date:'2026-11-07',time:'11:00',opp:'Shamrock Gaels',venue:'Home',comp:'U13 League',example:true},
  {t:'u20',date:'2026-11-14',time:'15:00',opp:'Eastern Harps',venue:'Away',comp:'U20 B Football Championship, Round 2',example:true}
];
const DM_MEN=['Ciarán','Darragh','Eoin','Seán','Conor','Pádraig','Niall','Shane','Kevin','Mark','Dylan','Liam','Rory','Aidan','Brian','Declan','Jamie','Oisín','Cathal','Tomás'];
const DM_WOMEN=['Aoife','Saoirse','Ciara','Niamh','Róisín','Éabha','Caoimhe','Orla','Sadhbh','Clodagh','Méabh','Aisling','Gráinne','Laoise','Muireann','Síofra','Ella','Kate','Emma','Leah'];
const DM_INI='BCDFGHKLMNOPRSTWBCDM';
function dmRng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}
const dmPad=n=>String(n).padStart(2,'0');

function dmGenEvents(sq,res,R,players){
  const ev=[],half=sq.half,D=55;let n=0;
  const id=()=>'e'+(++n);
  const when=()=>({per:R()<.5?1:2,sec:Math.floor(R()*(half*60-20))});
  const pid=(w)=>{const pool=[];players.forEach(p=>{const k=p.num===1?(w==='keeper'?20:0):p.num<=7?(w==='att'?.6:2):p.num<=9?2:p.num<=15?(w==='att'?4:1.5):.4;for(let i=0;i<Math.round(k*5);i++)pool.push(p.id)});return pool[Math.floor(R()*pool.length)]};
  const at=(dMin,dMax)=>{for(;;){const d=dMin+R()*(dMax-dMin),a=(R()*2-1)*1.15,lx=40+d*Math.sin(a),ly=d*Math.cos(a);if(lx>2&&lx<78&&ly>1&&ly<D-1)return{lx:Math.round(lx*2)/2,ly:Math.round(ly*2)/2}}};
  const add=(o)=>ev.push(Object.assign({id:id()},when(),o));
  const freeTaker=players[10].id; // #11
  // our scores
  const [g,p]=res.us;let twos=sq.arc?Math.min(Math.floor(p/2),Math.floor(R()*4)):0;let ones=p-2*twos;
  for(let i=0;i<g;i++){const pen=R()<.12;add(Object.assign({side:'us',type:'goal',pid:pen?freeTaker:pid('att'),src:pen?'pen':'play'},pen?{lx:40,ly:11}:at(5,14)))}
  let t45=0;
  for(let i=0;i<twos;i++){const k=R();if(k<.2){t45++;add({side:'us',type:'two',pid:players[0].id,src:'45',lx:R()<.5?14:66,ly:45})}else add(Object.assign({side:'us',type:'two',pid:k<.45?freeTaker:pid('att'),src:k<.45?'free':'play'},at(41,47)))}
  for(let i=0;i<ones;i++){const k=R();const src=k<.3?'free':k<.38&&sq.code!=='hurling'?'mark':'play';add(Object.assign({side:'us',type:'point',pid:src==='free'?freeTaker:pid('att'),src},at(src==='free'?18:12,src==='free'?36:38)))}
  // misses
  const sc=g+p,wides=Math.round(sc*.45+R()*3);
  for(let i=0;i<wides;i++){const fr=R()<.25;add(Object.assign({side:'us',type:'wide',pid:fr?freeTaker:pid('att'),src:fr?'free':'play'},at(14,44)))}
  for(let i=0,k=1+Math.floor(R()*3);i<k;i++)add(Object.assign({side:'us',type:'short',pid:pid('att'),src:'play'},at(30,46)));
  for(let i=0,k=Math.floor(R()*3);i<k;i++)add(Object.assign({side:'us',type:'saved',pid:pid('att'),src:'play'},at(6,16)));
  const miss45=Math.floor(R()*3);for(let i=0;i<miss45;i++){t45++;add({side:'us',type:R()<.6?'wide':'short',pid:players[0].id,src:'45',lx:R()<.5?14:66,ly:45})}
  for(let i=0;i<t45+Math.floor(R()*2);i++)add({side:'us',type:'w45',pid:null});
  // possession, restarts, keeper, discipline
  const many=(type,lo,hi,w)=>{for(let i=0,k=lo+Math.floor(R()*(hi-lo+1));i<k;i++)add({side:'us',type,pid:w===null?null:pid(w)})};
  many('tow',7,14,'any');many('tol',5,11,'any');many('fwon',7,13,'att');many('fcon',5,11,'any');many('pass',14,28,'any');
  many('kow',9,16,null);many('kol',2,6,null);many('okw',3,8,null);many('okl',7,12,null);
  for(let i=0,k=1+Math.floor(R()*3);i<k;i++)add({side:'us',type:'save',pid:players[0].id});
  for(let i=0,k=Math.floor(R()*3);i<k;i++)add({side:'us',type:'yellow',pid:pid('any')});
  if(sq.code==='football'&&R()<.3)add({side:'us',type:'black',pid:pid('any')});
  const offs=players.slice(1,15).sort(()=>R()-.5),ons=players.slice(15).sort(()=>R()-.5);
  for(let i=0,k=3+Math.floor(R()*3);i<k&&i<ons.length;i++)ev.push({id:id(),per:2,sec:Math.floor(300+R()*(half*60-400)),side:'us',type:'sub',pid:offs[i].id,onId:ons[i].id});
  // opposition
  const [og,op]=res.them;const otwo=sq.arc?Math.min(Math.floor(op/2),Math.floor(R()*3)):0;
  for(let i=0;i<og;i++)add({side:'them',type:'goal'});
  for(let i=0;i<otwo;i++)add({side:'them',type:'two'});
  for(let i=0;i<op-2*otwo;i++)add({side:'them',type:'point'});
  for(let i=0,k=Math.round((og+op)*.5+R()*3);i<k;i++)add({side:'them',type:'wide'});
  for(let i=0,k=Math.floor(R()*3);i<k;i++)add({side:'them',type:'yellow'});
  ev.sort((a,b)=>(a.per-b.per)||(a.sec-b.sec));
  return ev;
}
function dmScore(m,side){let g=0,p=0;for(const e of m.events){if(e.side!==side)continue;if(e.type==='goal')g++;else if(e.type==='point')p++;else if(e.type==='two')p+=2}return{g,p,t:g*3+p}}
function buildDemo(){
  const code={gaa_f:'football',gaa_h:'hurling',lgfa:'ladies',camogie:'hurling'};
  const teams=DEMO_SQUADS.map((s,si)=>{const names=s.men?DM_MEN:DM_WOMEN;const R=dmRng(1000+si*77);const codes='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return{id:s.id,name:s.name,assoc:s.assoc,grade:s.grade,half:s.half,code:code[s.assoc],arc:s.arc,names:'first',
      players:names.map((nm,i)=>({id:s.id+'-p'+(i+1),num:i+1,name:nm+' '+DM_INI[(i+si*3)%DM_INI.length]+'.',code:Array.from({length:6},()=>codes[Math.floor(R()*codes.length)]).join('')}))}});
  const fixtures=[],matches=[];
  DEMO_RESULTS.forEach((r,i)=>{const sq=Object.assign({},DEMO_SQUADS.find(s=>s.id===r.t),{code:code[DEMO_SQUADS.find(s=>s.id===r.t).assoc]});const t=teams.find(x=>x.id===r.t);
    const fx={id:'fx-r'+i,teamId:t.id,date:r.date,time:r.time,opp:r.opp,venue:r.venue,ground:r.ground||'',comp:r.comp,status:'played',createdAt:Date.parse(r.date)};
    const m={id:'m-r'+i,fixtureId:fx.id,teamId:t.id,opp:r.opp,date:r.date,half:sq.half,code:sq.code,arc:sq.arc,events:dmGenEvents(sq,{us:r.us,them:r.them},dmRng(5000+i*131),t.players),clock:{period:'FT',running:false,acc:0,since:0,alerted:{1:true,2:true}}};
    fx.matchId=m.id;fx.result={us:dmScore(m,'us'),them:dmScore(m,'them')};fixtures.push(fx);matches.push(m)});
  DEMO_UPCOMING.forEach((u,i)=>fixtures.push(Object.assign({id:'fx-u'+i,teamId:u.t,status:'upcoming',createdAt:Date.now()-86400e3*3},u,u.prev?{changedAt:Date.now()-5*3600e3}:{})));
  fixtures.forEach(f=>delete f.t);
  return{v:3,demoVer:DEMO_VER,mode:'demo',role:'manager',club:'Owenmore Gaels',logo:null,logoVer:null,imports:null,deletedFx:[],teams,fixtures,matches,active:null,tab:'stats',sig:{club:null,t:{},m:{}}};
}
function loadDemo(){try{const s=JSON.parse(localStorage.getItem(DEMO_KEY)||'null');if(s&&s.v===3&&s.demoVer===DEMO_VER)return s}catch(e){}return buildDemo()}
function saveDemo(S){try{localStorage.setItem(DEMO_KEY,JSON.stringify(S))}catch(e){}}

/* ----- what the parents' page and player page see (same rules as the full version's server) ----- */
const DM_LABEL={goal:'Goal',point:'Point',two:'2-pointer',wide:'Wide',short:'Dropped short',saved:'Saved / blocked',penmiss:'Penalty missed',pass:'Pass',tow:'Turnover won',tol:'Turnover lost',fwon:'Free won',fcon:'Free conceded',kow:'Own kick-out won',kol:'Own kick-out lost',okw:'Opp kick-out won',okl:'Opp kick-out lost',w45:'45 won',save:'Save',pensave:'Penalty saved',yellow:'Yellow card',black:'Black card',red:'Red card',sub:'Substitution'};
const DM_PTS={goal:3,point:1,two:2},DM_SHOTS=['goal','point','two','wide','short','saved','penmiss'],DM_SRC={free:'Free','45':'45',pen:'Penalty',mark:'Mark'};
const dmLabel=(t,code)=>{const l=DM_LABEL[t]||t;return code==='hurling'?l.replace('45 won','65 won').replace('kick-out','puck-out'):l};
const dmOutside=(e,m)=>m.code!=='hurling'&&m.arc&&typeof e.lx==='number'&&Math.hypot(e.lx-40,e.ly)>=40;
function dmBlank(){const r={scoreG:0,scoreP:0,pts:0,fromFree:0,from45:0,fromPen:0,subOn:0,subOff:0,t45:0,s45:0,twoAtt:0};for(const k in DM_LABEL)r[k]=0;return r}
function dmTally(r,e,m){if(e.type in r)r[e.type]++;
  if(DM_SHOTS.includes(e.type)){if(e.src==='45'){r.t45++;if(DM_PTS[e.type])r.s45++}if(e.type==='two'||dmOutside(e,m))r.twoAtt++}
  if(DM_PTS[e.type]){r.pts+=DM_PTS[e.type];if(e.type==='goal')r.scoreG++;else r.scoreP+=DM_PTS[e.type];if(e.src==='free')r.fromFree++;if(e.src==='45')r.from45++;if(e.src==='pen')r.fromPen++}}
function dmSummary(m,side){const r=dmBlank();for(const e of m.events)if(e.side===side)dmTally(r,e,m);
  return{scores:r.goal+r.point+r.two,shots:DM_SHOTS.reduce((a,t)=>a+r[t],0),wide:r.wide,tow:r.tow,tol:r.tol,kow:r.kow,kol:r.kol,okw:r.okw,okl:r.okl,fwon:r.fwon,fcon:r.fcon,y:r.yellow,b:r.black,r:r.red,pass:r.pass,save:r.save+r.pensave}}
function dmName(t,id){const p=t&&t.players.find(x=>x.id===id);if(!p)return '';return t.names==='full'?`#${p.num} ${p.name}`:t.names==='first'?`#${p.num} ${String(p.name).split(' ')[0]}`:`#${p.num}`}
function dmPublicMatch(m,t,club,now){
  const c=m.clock||{period:0},el=c.period==='HT'||c.period==='FT'?0:c.acc+(c.running?(now-c.since)/1000:0);
  return{id:m.id,club,squad:t?t.name:'',code:m.code,arc:!!m.arc,opp:m.opp,date:m.date,half:m.half,savedAt:now,clock:{period:c.period,running:!!c.running,elapsed:el},
    score:{us:dmScore(m,'us'),them:dmScore(m,'them')},stats:{us:dmSummary(m,'us'),them:dmSummary(m,'them')},
    events:m.events.map(e=>({per:e.per,sec:e.sec,side:e.side,type:e.type,label:dmLabel(e.type,m.code),pts:DM_PTS[e.type]||0,src:e.src&&e.src!=='play'?(e.src==='45'&&m.code==='hurling'?'65':DM_SRC[e.src]):null,
      who:e.side==='them'?'':e.type==='sub'?`${dmName(t,e.pid)||'?'} off, ${dmName(t,e.onId)||'?'} on`:dmName(t,e.pid)}))}}
// An example live match for the parents' page when nothing is being scored on this device
function dmExampleLive(S,now){
  const t=S.teams.find(x=>x.id==='u20')||S.teams[0];const sq={half:30,code:'football',arc:true};
  const all=dmGenEvents(sq,{us:[1,12],them:[1,9]},dmRng(4242),t.players);
  const start=Math.floor(now/1000)%1800; // loops through a 2nd half every 30 min
  const ev=all.filter(e=>e.per===1||e.sec<=start);
  return{id:'example-live',teamId:t.id,opp:'Geevagh/St Michaels',date:new Date(now).toISOString().slice(0,10),half:30,code:'football',arc:true,events:ev,example:true,
    clock:{period:2,running:true,acc:start,since:now}};
}
function demoPublic(S,now=Date.now()){
  const club=S.club||'Owenmore Gaels',byId=Object.fromEntries(S.teams.map(t=>[t.id,t]));
  let live=S.matches.filter(m=>{const c=m.clock||{};const f=S.fixtures.find(x=>x.id===m.fixtureId);return c.period!=='FT'&&c.period!==0||(f&&f.status==='live')});
  let example=false;if(!live.length){live=[dmExampleLive(S,now)];example=true}
  const fixtures=S.fixtures.map(f=>({id:f.id,squad:(byId[f.teamId]||{}).name||'',opp:f.opp,date:f.date,time:f.time||'',venue:f.venue||'',comp:f.comp||'',status:f.status,result:f.result||null,prev:f.prev||null,changedAt:f.changedAt||null,createdAt:f.createdAt||null,example:!!f.example}));
  const updates=[];
  for(const f of fixtures){
    if(f.status==='cancelled'&&f.changedAt)updates.push({at:f.changedAt,kind:'cancelled',f});
    else if(f.prev&&f.changedAt)updates.push({at:f.changedAt,kind:'moved',f});
    if(f.status==='played'&&f.result&&now-Date.parse(f.date+'T18:00:00Z')<21*86400e3)updates.push({at:Date.parse(f.date+'T18:00:00Z'),kind:'result',f});
  }
  updates.sort((a,b)=>b.at-a.at);
  return{now,club,example,matches:live.map(m=>dmPublicMatch(m,byId[m.teamId],club,now)),fixtures,updates:updates.slice(0,12)};
}
function demoPlayer(S,code){
  code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  let team,player;for(const t of S.teams){const p=t.players.find(x=>x.code===code);if(p){team=t;player=p;break}}
  if(!player)return null;
  const total=dmBlank(),games=[],shots=[];
  for(const m of S.matches.filter(x=>x.teamId===team.id).sort((a,b)=>String(b.date).localeCompare(String(a.date)))){
    const line=dmBlank();let inv=false;
    for(const e of m.events){if(e.side!=='us')continue;
      if(e.type==='sub'){if(e.pid===player.id){line.subOff++;inv=true}if(e.onId===player.id){line.subOn++;inv=true}continue}
      if(e.pid===player.id){dmTally(line,e,m);inv=true;if(DM_SHOTS.includes(e.type)&&typeof e.lx==='number')shots.push({type:e.type,src:e.src||'play',lx:e.lx,ly:e.ly})}}
    if(!inv)continue;for(const k in line)total[k]+=line[k];
    const fx=S.fixtures.find(f=>f.id===m.fixtureId);
    games.push({date:m.date,opp:m.opp,comp:fx?fx.comp:'',result:{us:dmScore(m,'us'),them:dmScore(m,'them')},final:(m.clock||{}).period==='FT',line});
  }
  return{club:S.club,squad:team.name,code:team.code,arc:!!team.arc,player:{num:player.num,name:player.name},games:games.length,total,matches:games,shots};
}
// Hotlinked crest from the Sligo LGFA club list (works on the live site; previews may block outside images)
function crestTag(name,cls,own){const c=crestFor(name);if(!c)return '';const src=c.id===81481&&own!==false?OWN_BADGE:crestUrl(c);return `<img class="crest ${cls||''}" src="${src}" alt="" loading="lazy" onerror="this.remove()">`}
