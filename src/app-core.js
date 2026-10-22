/* ========== basics ========== */
const KEY='owenmore-gaels-coach-v2', AUTHKEY='owenmore-gaels-auth', MODEKEY='owenmore-gaels-mode';
const uid=()=>Math.random().toString(36).slice(2,10);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const mmss=s=>{s=Math.max(0,Math.floor(s));return pad(Math.floor(s/60))+':'+pad(s%60)};
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode=()=>Array.from({length:6},()=>CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]).join('');

/* Associations and age grades. Half lengths: GAA Go Games guidance (U7–U11), county under-age rules (U10–U20),
   LGFA Rule 351 (30 min halves from U14 up; U12 and below set by county). All editable per squad. */
const ASSOC={
  gaa_f:{l:'GAA football',code:'football',arcAge:13,grades:[['U7',10,'Go Games'],['U8',12,'Go Games'],['U9',15,'Go Games'],['U10',20,''],['U11',20,'Go Games'],['U12',25,''],['U13',30,''],['U14',30,''],['U15',30,''],['U16',30,''],['Minor (U17)',30,''],['U20',30,''],['Adult',30,'']]},
  gaa_h:{l:'GAA hurling',code:'hurling',arcAge:null,grades:[['U7',10,'Go Games'],['U8',12,'Go Games'],['U9',15,'Go Games'],['U10',20,''],['U11',20,'Go Games'],['U12',25,''],['U13',30,''],['U14',30,''],['U15',30,''],['U16',30,''],['Minor (U17)',30,''],['U20',30,''],['Adult',30,'']]},
  lgfa:{l:'LGFA (ladies football)',code:'ladies',arcAge:14,grades:[['U8',15,'Go Games'],['U10',20,'Go Games'],['U12',25,'County rules'],['U13',25,'County rules'],['U14',30,''],['U16',30,''],['Minor (U18)',30,''],['Adult',30,'']]},
  camogie:{l:'Camogie',code:'hurling',arcAge:null,grades:[['U7',10,'Go Games'],['U9',15,'Go Games'],['U11',20,'Go Games'],['U12',25,''],['U13',25,''],['U14',30,''],['U16',30,''],['Minor (U18)',30,''],['Adult',30,'']]}
};
const gradeAge=g=>/minor/i.test(g)?(/18/.test(g)?18:17):/adult/i.test(g)?99:parseInt(String(g).replace(/\D/g,''))||0;
const assocOf=t=>ASSOC[t&&t.assoc]||ASSOC.gaa_f;
const footy=code=>code!=='hurling';
const hasBlack=code=>code==='football';
const defaultArc=t=>{const a=assocOf(t);return a.arcAge!=null&&gradeAge(t.grade)>=a.arcAge};
const gradeHalf=t=>{const g=assocOf(t).grades.find(x=>x[0]===t.grade);return g?g[1]:null};
function normTeam(t){
  if(!t.assoc)t.assoc=t.code==='hurling'?'gaa_h':t.code==='ladies'?'lgfa':'gaa_f';
  t.code=assocOf(t).code;
  if(!assocOf(t).grades.some(g=>g[0]===t.grade)){const map={Minor:assocOf(t).grades.find(g=>/minor/i.test(g[0]))};t.grade=(map[t.grade]||assocOf(t).grades.find(g=>gradeAge(g[0])>=gradeAge(t.grade))||assocOf(t).grades[0])[0]}
  if(typeof t.arc!=='boolean')t.arc=defaultArc(t);
  if(!footy(t.code))t.arc=false;
  if(!t.names)t.names='num';
  return t;
}

const SRC={play:'Play',free:'Free','45':'45',pen:'Penalty',mark:'Mark'};
const EV={goal:{l:'Goal',pts:3},point:{l:'Point',pts:1},two:{l:'2-pointer',pts:2},wide:{l:'Wide'},short:{l:'Dropped short'},saved:{l:'Saved / blocked'},penmiss:{l:'Penalty missed'},
  pass:{l:'Pass'},tow:{l:'Turnover won'},tol:{l:'Turnover lost'},fwon:{l:'Free won'},fcon:{l:'Free conceded'},kow:{l:'Own kick-out won'},kol:{l:'Own kick-out lost'},okw:{l:'Opp kick-out won'},okl:{l:'Opp kick-out lost'},w45:{l:'45 won'},
  save:{l:'Save'},pensave:{l:'Penalty saved'},yellow:{l:'Yellow card'},black:{l:'Black card'},red:{l:'Red card'},sub:{l:'Substitution'}};
const isScore=t=>t==='goal'||t==='point'||t==='two';
const SHOTS=['goal','point','two','wide','short','saved','penmiss'];
const lbl=(type,code)=>{const l=(EV[type]||{l:type}).l;return code==='hurling'?l.replace('45 won','65 won').replace('kick-out','puck-out'):l};
const srcL=(src,code)=>src==='45'&&code==='hurling'?'65':SRC[src];
const set45=code=>footy(code)?'45':'65';
const KO=code=>footy(code)?'kick-out':'puck-out';
/* Match time in minutes, GAA style: 13', 30+2' */
const minOf=(sec,half)=>{const m=Math.floor(sec/60)+1;return half&&m>half?half+'+'+(m-half)+"'":m+"'"};
const halfTag=per=>per===1?'<span class="ht h1">1st half</span>':per===2?'<span class="ht h2">2nd half</span>':per==='HT'?'<span class="ht">Half time</span>':per==='FT'?'<span class="ht">Full time</span>':'<span class="ht">Pre-match</span>';

/* ========== pitch geometry (metres; attacking goal at the top) ========== */
const PW=80;
const DEPTH=code=>footy(code)?55:70;
const distM=e=>Math.hypot(e.lx-PW/2,e.ly);
const hasLoc=e=>e&&typeof e.lx==='number'&&typeof e.ly==='number';
const outsideArc=(e,code,arc)=>footy(code)&&arc&&hasLoc(e)&&distM(e)>=40;
const BANDS=(code,arc)=>footy(code)?['0–13m','13–20m','20–40m',arc?'Outside arc':'40m+']:['0–13m','13–20m','20–45m','45m+'];
function bandOf(e,code){const d=distM(e);if(d<13)return 0;if(d<20)return 1;return d<(footy(code)?40:45)?2:3}
const sideOf=e=>e.lx<28?'Left':e.lx>52?'Right':'Centre';
function dotCls(t){return t==='goal'?'dot-g':t==='two'?'dot-2':t==='point'?'dot-s':'dot-m'}
function pitchSVG(o){
  const D=DEPTH(o.code),S=4,w=PW*S,h=D*S,X=m=>m*S;
  let s=`<svg class="pitch"${o.id?` id="${o.id}"`:''} viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.label||'Pitch, attacking goal at the top')}">`;
  s+=`<rect class="grass" x="0" y="0" width="${w}" height="${h}"/>`;
  s+=`<rect class="ln" x="${X(30.5)}" y="0" width="${X(19)}" height="${X(13)}"/><rect class="ln" x="${X(33)}" y="0" width="${X(14)}" height="${X(4.5)}"/>`;
  s+=`<path class="ln" d="M${X(27)} ${X(20)} A${X(13)} ${X(13)} 0 0 0 ${X(53)} ${X(20)}"/>`;
  for(const m of[13,20,45,65])if(m<D)s+=`<line class="ln${o.hl45&&m===(footy(o.code)?45:65)?' l45':''}" x1="0" y1="${X(m)}" x2="${w}" y2="${X(m)}"/><text class="lbl" x="${w-4}" y="${X(m)-4}" text-anchor="end">${m}m</text>`;
  if(footy(o.code)&&o.arc)s+=`<path class="arc" d="M0 0 A${X(40)} ${X(40)} 0 0 0 ${w} 0"/><text class="lbl" x="${X(40)}" y="${X(40)+13}" text-anchor="middle">2-point arc</text>`;
  s+=`<line class="post" x1="${X(36.75)}" y1="2" x2="${X(43.25)}" y2="2"/>`;
  for(const d of o.dots||[])s+=`<circle class="${d.cls}" cx="${(d.lx*S).toFixed(1)}" cy="${(d.ly*S).toFixed(1)}" r="${d.cls==='dot-g'?7:5.5}">${d.t?`<title>${esc(d.t)}</title>`:''}</circle>`;
  if(o.mark)s+=`<circle class="mark" cx="${o.mark.lx*S}" cy="${o.mark.ly*S}" r="9"/>`;
  return s+'</svg>';
}

let S, auth={pin:'',role:null};
let ui={month:null,day:null,armed:null,armT:0,teamF:'all',statsTeam:null,squadTeam:null,backup:'',editFx:null,loginErr:'',busyLogin:false,mapSrc:'all',mapPl:'all'};
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const emptyState=mode=>({v:3,mode,role:mode==='demo'?'manager':null,club:'Owenmore Gaels',logo:null,logoVer:null,imports:null,deletedFx:[],teams:[],fixtures:[],matches:[],active:null,tab:'match',sig:{club:null,t:{},m:{}}});
function persist(){saveDemo(S)}
function save(){persist();schedule()}

/* ========== example data (demo mode only) ========== */
function seed(){return buildDemo()}
function seedOld(){
  const boys=['Seán','Cian','Oisín','Darragh','Conor','Fionn','Jack','Tadhg','Ronan','Eoin','Liam','Rían','Cathal','Niall','Odhrán','Dara','Shane','Aaron'];
  const girls=['Aoife','Saoirse','Ciara','Niamh','Róisín','Éabha','Caoimhe','Orla','Sadhbh','Clodagh','Méabh','Aisling','Gráinne','Laoise','Muireann','Síofra','Ella','Kate'];
  const ini='BCDFGHKLMNOPRSTWBM';
  const mk=a=>a.map((n,i)=>({id:uid(),num:i+1,name:n+' '+ini[i]+'.',code:newCode()}));
  const t1=normTeam({id:uid(),name:'U14 Boys',assoc:'gaa_f',grade:'U14',half:30,names:'num',players:mk(boys)});
  const t2=normTeam({id:uid(),name:'U14 Girls',assoc:'lgfa',grade:'U14',half:30,names:'num',players:mk(girls)});
  const F=(t,date,time,opp,venue,comp)=>({id:uid(),teamId:t.id,date,time,opp,venue,comp,status:'upcoming',createdAt:Date.now()});
  const pl1=F(t1,'2026-10-10','11:00','Easkey','Home','League'),pl2=F(t1,'2026-10-17','11:00','Tourlestrane','Away','League'),pl3=F(t2,'2026-10-18','12:00','Curry','Home','League');
  const fixtures=[pl1,pl2,pl3,F(t2,'2026-10-24','12:00',"St Mary's",'Home','League'),F(t1,'2026-10-25','11:00','Coolera/Strandhill','Home','League'),
    F(t2,'2026-11-01','11:30','Eastern Harps','Away','League'),F(t1,'2026-11-08','10:30','Calry/St Joseph’s','Away','Cup'),F(t2,'2026-11-15','12:00','Shamrock Gaels','Home','Cup')];
  // [per,sec,side,type,num,src,lx,ly,onNum]
  const mkMatch=(fx,t,raw)=>{const p=n=>n?t.players[n-1].id:null;const m={id:uid(),fixtureId:fx.id,teamId:t.id,opp:fx.opp,date:fx.date,half:t.half,code:t.code,arc:t.arc,
    events:raw.map(r=>{const e={id:uid(),per:r[0],sec:r[1],side:r[2],type:r[3],pid:p(r[4]),src:r[5]||null};if(r[6]!=null){e.lx=r[6];e.ly=r[7]}if(r[8])e.onId=p(r[8]);return e}),
    clock:{period:'FT',running:false,acc:0,since:0,alerted:{1:true,2:true}}};fx.status='played';fx.matchId=m.id;fx.result={us:score(m,'us'),them:score(m,'them')};return m};
  const m1=mkMatch(pl2,t1,[[1,95,'us','kow'],[1,140,'us','pass',8],[1,150,'us','point',11,'play',30,22],[1,260,'them','point'],[1,300,'us','tow',6],
    [1,320,'us','wide',14,'play',58,26],[1,410,'us','fwon',12],[1,430,'us','point',15,'free',44,24],[1,520,'us','pass',9],[1,540,'us','goal',14,'play',38,9],
    [1,640,'them','goal'],[1,700,'us','tol',10],[1,760,'us','save',1],[1,820,'us','two',12,'play',62,38],[1,900,'us','yellow',4],[1,980,'them','wide'],
    [1,1050,'us','w45'],[1,1060,'us','two',1,'45',20,45],[1,1200,'them','point'],[1,1380,'us','short',11,'play',47,41],[1,1500,'us','wide',15,'free',18,30],
    [2,60,'us','kol'],[2,120,'them','point'],[2,200,'us','tow',5],[2,215,'us','pass',8],[2,230,'us','point',8,'play',35,17],[2,400,'us','sub',10,null,null,null,16],
    [2,480,'us','wide',15,'play',66,33],[2,520,'us','fcon',3],[2,530,'them','point'],[2,700,'us','pensave',1],[2,820,'us','goal',14,'pen',40,11],
    [2,860,'us','w45'],[2,870,'us','wide',1,'45',62,45],[2,900,'us','saved',13,'play',45,15],[2,1100,'us','point',16,'play',24,19],[2,1250,'them','goal'],[2,1400,'us','tow',7],[2,1500,'us','two',11,'play',40,43]]);
  const m0=mkMatch(pl1,t1,[[1,120,'us','point',11,'play',36,18],[1,300,'us','wide',14,'play',22,25],[1,400,'them','point'],[1,520,'us','point',15,'free',41,21],[1,700,'us','tow',6],
    [1,900,'them','goal'],[1,1100,'us','short',12,'play',60,44],[1,1300,'us','w45'],[1,1310,'us','short',1,'45',58,45],[2,200,'us','goal',14,'play',43,10],[2,400,'them','point'],
    [2,600,'us','point',8,'play',52,23],[2,800,'us','wide',11,'play',70,30],[2,1000,'them','point'],[2,1200,'us','tol',9],[2,1300,'them','two'],[2,1500,'us','point',15,'free',38,26]]);
  const m2=mkMatch(pl3,t2,[[1,100,'us','point',11,'play',37,20],[1,400,'them','point'],[1,600,'us','goal',9,'play',42,8],[1,800,'us','wide',14,'play',60,28],[1,1000,'them','goal'],
    [2,300,'us','point',12,'free',40,30],[2,500,'us','tow',5],[2,700,'them','point'],[2,900,'us','two',10,'play',18,44],[2,1200,'them','point']]);
  return Object.assign(emptyState('demo'),{teams:[t1,t2],fixtures,matches:[m0,m1,m2]});
}

/* ========== lookups & maths ========== */
const team=id=>S.teams.find(t=>t.id===id);
const active=()=>S.matches.find(m=>m.id===S.active)||null;
const player=(t,id)=>t&&t.players.find(p=>p.id===id);
const pName=(t,id)=>{const p=player(t,id);return p?('#'+p.num+' '+p.name):''};
function score(m,side){let g=0,p=0;for(const e of m.events){if(e.side!==side)continue;if(e.type==='goal')g++;else if(e.type==='point')p++;else if(e.type==='two')p+=2}return{g,p,t:g*3+p}}
const fmtS=s=>s.g+'-'+pad(s.p);
function blank(){return{goal:0,point:0,two:0,ptsTotal:0,free:0,f45:0,pen:0,wide:0,short:0,saved:0,penmiss:0,pass:0,tow:0,tol:0,fwon:0,fcon:0,kow:0,kol:0,okw:0,okl:0,w45:0,save:0,pensave:0,yellow:0,black:0,red:0,subOn:0,subOff:0,t45:0,s45:0,twoAtt:0,games:new Set()}}
function tally(r,e,mid,m){
  r.games.add(mid);if(typeof r[e.type]==='number')r[e.type]++;
  if(isScore(e.type)){r.ptsTotal+=EV[e.type].pts;if(e.src==='free')r.free++;if(e.src==='45')r.f45++;if(e.src==='pen')r.pen++}
  if(e.src==='45'&&SHOTS.includes(e.type)){r.t45++;if(isScore(e.type))r.s45++}
  if(e.type==='two'||(SHOTS.includes(e.type)&&m&&outsideArc(e,m.code,m.arc)))r.twoAtt++;
  if(e.type==='pensave')r.save++;
}
function teamStats(tid){
  const ms=S.matches.filter(m=>m.teamId===tid);const t=team(tid);
  const rows=new Map(t.players.map(p=>[p.id,Object.assign(blank(),{p})]));const tot=blank();let W=0,D=0,L=0,For=0,Ag=0,P=0;const games=[];
  for(const m of ms){
    for(const e of m.events){if(e.side!=='us')continue;tally(tot,e,m.id,m);
      if(e.type==='sub'){const off=rows.get(e.pid),on=rows.get(e.onId);if(off){off.subOff++;off.games.add(m.id)}if(on){on.subOn++;on.games.add(m.id)}continue}
      const r=rows.get(e.pid);if(r)tally(r,e,m.id,m)}
    const f=S.fixtures.find(x=>x.id===m.fixtureId);
    if(f&&f.status==='played'){P++;const u=score(m,'us'),th=score(m,'them');For+=u.t;Ag+=th.t;const k=u.t>th.t?'W':u.t<th.t?'L':'D';if(k==='W')W++;else if(k==='L')L++;else D++;games.push({m,f,u,th,k})}
  }
  games.sort((a,b)=>a.f.date.localeCompare(b.f.date));
  return{rows:[...rows.values()],tot,W,D,L,For,Ag,P,games,ms};
}
function matchSummary(m,side){const r=blank();for(const e of m.events)if(e.side===side)tally(r,e,m.id,m);return r}
const shots=r=>SHOTS.reduce((a,k)=>a+(r[k]||0),0);
const scores=r=>r.goal+r.point+r.two;
const pct=(a,b)=>b?Math.round(a*100/b)+'%':'–';
const pctN=(a,b)=>b?Math.round(a*100/b):0;
const isMgr=()=>S.role==='manager';
const initials=n=>String(n||'').split(/\s+/).filter(w=>/^[A-Za-zÀ-ž]/.test(w)).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'GAA';
const logoSrc=()=>S.logo||OWN_BADGE;
const isOwn=name=>{const c=crestFor(name);return !!c&&c.id===81481};
const crestImg=(name,cls)=>crestTag(name,cls);
const badgeHTML=()=>{const src=logoSrc();return src?`<img src="${esc(src)}" alt="${esc(S.club)} badge">`:esc(initials(S.club))};
