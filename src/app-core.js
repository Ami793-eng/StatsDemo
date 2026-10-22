/* ========== coach app: state, roles, settings, pitch, stats ========== */
const CODE_CHARS='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const uid=()=>Math.random().toString(36).slice(2,10);
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const newCode=()=>Array.from({length:6},()=>CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]).join('');

/* Associations and age grades. Half lengths: GAA Go Games guidance (U7–U11), county under-age rules,
   LGFA Rule 351 (30 min halves from U14 up). Privacy tier defaults follow the planning brief. */
const ASSOC={
  gaa_f:{l:'GAA football',code:'football',arcAge:13,grades:[['U7',10],['U8',12],['U9',15],['U10',20],['U11',20],['U12',25],['U13',30],['U14',30],['U15',30],['U16',30],['Minor (U17)',30],['U20',30],['Adult',30]]},
  gaa_h:{l:'GAA hurling',code:'hurling',arcAge:null,grades:[['U7',10],['U8',12],['U9',15],['U10',20],['U11',20],['U12',25],['U13',30],['U14',30],['U15',30],['U16',30],['Minor (U17)',30],['U20',30],['Adult',30]]},
  lgfa:{l:'LGFA (ladies football)',code:'ladies',arcAge:14,grades:[['U8',15],['U10',20],['U12',25],['U13',25],['U14',30],['U16',30],['Minor (U18)',30],['Adult',30]]},
  camogie:{l:'Camogie',code:'hurling',arcAge:null,grades:[['U7',10],['U9',15],['U11',20],['U12',25],['U13',25],['U14',30],['U16',30],['Minor (U18)',30],['Adult',30]]}
};
const assocOf=t=>ASSOC[t&&t.assoc]||ASSOC.gaa_f;
const footy=OG.footy, set45=OG.set45, KO=OG.KO, lbl=OG.label, srcL=OG.srcLabel, isScore=OG.isScore, SHOTS=OG.SHOTS, SRC=OG.SRC, fmtS=OG.fmt, score=OG.score;
const hasBlack=code=>code==='football';
const gradeHalf=t=>{const g=assocOf(t).grades.find(x=>x[0]===t.grade);return g?g[1]:null};
const defaultArc=t=>{const a=assocOf(t);return a.arcAge!=null&&OG.gradeAge(t.grade)>=a.arcAge};
const defaultTier=t=>OG.gradeAge(t.grade)<=12?'gogames':OG.gradeAge(t.grade)<=18?'minor':'adult';
function normTeam(t){
  t.code=assocOf(t).code;
  if(!assocOf(t).grades.some(g=>g[0]===t.grade))t.grade=assocOf(t).grades.find(g=>OG.gradeAge(g[0])>=OG.gradeAge(t.grade))?.[0]||'Adult';
  if(typeof t.arc!=='boolean')t.arc=defaultArc(t);if(!footy(t.code))t.arc=false;
  if(!t.tier)t.tier=defaultTier(t);if(!t.onField)t.onField=t.tier==='gogames'?11:15;if(!t.etHalf)t.etHalf=10;
  return t;
}

/* ========== pitch (metres; attacking goal at the top) ========== */
const PW=80;
const DEPTH=code=>footy(code)?55:70;
const distM=e=>Math.hypot(e.lx-PW/2,e.ly);
const hasLoc=e=>e&&typeof e.lx==='number'&&typeof e.ly==='number';
const outsideArc=(e,code,arc)=>footy(code)&&arc&&hasLoc(e)&&distM(e)>=40;
const BANDS=(code,arc)=>footy(code)?['0–13m','13–20m','20–40m',arc?'Outside arc':'40m+']:['0–13m','13–20m','20–45m','45m+'];
function bandOf(e,code){const d=distM(e);if(d<13)return 0;if(d<20)return 1;return d<(footy(code)?40:45)?2:3}
const sideOf=e=>e.lx<28?'Left':e.lx>52?'Right':'Centre';
const dotCls=t=>t==='goal'?'dot-g':t==='two'?'dot-2':t==='point'?'dot-s':'dot-m';
function pitchSVG(o){
  const D=DEPTH(o.code),Sx=4,w=PW*Sx,h=D*Sx,X=m=>m*Sx;
  let s=`<svg class="pitch"${o.id?` id="${o.id}"`:''} viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(o.label||'Pitch, attacking goal at the top')}">`;
  s+=`<rect class="grass" x="0" y="0" width="${w}" height="${h}"/>`;
  s+=`<rect class="ln" x="${X(30.5)}" y="0" width="${X(19)}" height="${X(13)}"/><rect class="ln" x="${X(33)}" y="0" width="${X(14)}" height="${X(4.5)}"/>`;
  s+=`<path class="ln" d="M${X(27)} ${X(20)} A${X(13)} ${X(13)} 0 0 0 ${X(53)} ${X(20)}"/>`;
  for(const m of[13,20,45,65])if(m<D)s+=`<line class="ln${o.hl45&&m===(footy(o.code)?45:65)?' l45':''}" x1="0" y1="${X(m)}" x2="${w}" y2="${X(m)}"/><text class="lbl" x="${w-4}" y="${X(m)-4}" text-anchor="end">${m}m</text>`;
  if(footy(o.code)&&o.arc)s+=`<path class="arc" d="M0 0 A${X(40)} ${X(40)} 0 0 0 ${w} 0"/><text class="lbl" x="${X(40)}" y="${X(40)+13}" text-anchor="middle">2-point arc</text>`;
  s+=`<line class="post" x1="${X(36.75)}" y1="2" x2="${X(43.25)}" y2="2"/>`;
  for(const d of o.dots||[])s+=`<circle class="${d.cls}" cx="${(d.lx*Sx).toFixed(1)}" cy="${(d.ly*Sx).toFixed(1)}" r="${d.cls==='dot-g'?7:5.5}">${d.t?`<title>${esc(d.t)}</title>`:''}</circle>`;
  if(o.mark)s+=`<circle class="mark" cx="${o.mark.lx*Sx}" cy="${o.mark.ly*Sx}" r="9"/>`;
  return s+'</svg>';
}

/* ========== state ========== */
let S;
let ui={month:null,day:null,armed:null,armT:0,teamF:'all',statsTeam:null,adminTeam:null,adminTab:'club',editFx:null,mapSrc:'all',mapPl:'all',view:null,editEv:null,csv:''};
const persist=()=>saveDemo(S);
const save=persist;
const team=id=>S.teams.find(t=>t.id===id);
const fixture=id=>S.fixtures.find(f=>f.id===id);
const active=()=>S.matches.find(m=>m.id===S.active)||null;
const player=(t,id)=>t&&t.players.find(p=>p.id===id);
const pName=(t,id)=>OG.fullName(t,id);
const me=()=>S.users.find(u=>u.id===S.me)||S.users[0];
const isAdmin=()=>me().role==='admin';
const isCoach=()=>me().role==='coach';
const isScorer=()=>me().role==='scorer';
const myTeams=()=>isAdmin()?S.teams:isCoach()?S.teams.filter(t=>t.id===me().teamId):[];
const canManage=tid=>isAdmin()||(isCoach()&&me().teamId===tid);
const userName=id=>(S.users.find(u=>u.id===id)||{}).name||'Unassigned';
const canScore=m=>!!m&&!m.ended&&m.scorer===S.me;
const visibleFixtures=()=>isScorer()?S.fixtures.filter(f=>f.scorer===S.me):S.fixtures.filter(f=>canManage(f.teamId));
const crestImg=(name,cls)=>crestTag(name,cls);
const initials=n=>String(n||'').split(/\s+/).filter(w=>/^[A-Za-zÀ-ž]/.test(w)).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'GAA';
const badgeHTML=()=>`<img src="${S.logo||OWN_BADGE}" alt="${esc(S.club)} badge">`;
const pct=(a,b)=>b?Math.round(a*100/b)+'%':'–';
const pctN=(a,b)=>b?Math.round(a*100/b):0;
function audit(m,action){(m.audit=m.audit||[]).push({at:Date.now(),who:me().name,action})}

/* ========== stats ========== */
function blank(){return Object.assign(OG.blank(),{ptsTotal:0,free:0,f45:0,pen:0,games:new Set(),mins:0,apps:0,starts:0})}
function tally(r,e,mid,m){r.games.add(mid);OG.tally(r,e,m);if(isScore(e.type)){r.ptsTotal+=OG.PTS[e.type];if(e.src==='free')r.free++;if(e.src==='45')r.f45++;if(e.src==='pen')r.pen++}}
function teamStats(tid){
  const t=team(tid);const ms=S.matches.filter(m=>m.teamId===tid);
  const rows=new Map(t.players.map(p=>[p.id,Object.assign(blank(),{p})]));const tot=blank();let W=0,D=0,L=0,For=0,Ag=0,P=0;const games=[];
  for(const m of ms){
    const mins=OG.minutes(m,S.settings);
    for(const [pid,sec] of Object.entries(mins)){const r=rows.get(pid);if(r){r.mins+=sec;if(sec>0){r.apps++;r.games.add(m.id)}}}
    for(const pid of m.lineup||[]){const r=rows.get(pid);if(r)r.starts++}
    for(const e of m.events){if(e.side!=='us'||e.type==='note')continue;tally(tot,e,m.id,m);
      if(e.type==='sub'){const off=rows.get(e.pid),on=rows.get(e.onId);if(off)off.subOff++;if(on)on.subOn++;continue}
      const r=rows.get(e.pid);if(r)tally(r,e,m.id,m)}
    const f=fixture(m.fixtureId);
    if(f&&f.status==='played'&&OG.tierOf(t)!=='gogames'){P++;const u=score(m,'us'),th=score(m,'them');For+=u.t;Ag+=th.t;const k=u.t>th.t?'W':u.t<th.t?'L':'D';if(k==='W')W++;else if(k==='L')L++;else D++;games.push({m,f,u,th,k})}
  }
  games.sort((a,b)=>a.f.date.localeCompare(b.f.date));
  return{rows:[...rows.values()],tot,W,D,L,For,Ag,P,games,ms};
}
const shots=r=>SHOTS.reduce((a,k)=>a+(r[k]||0),0);
const scores=r=>r.goal+r.point+r.two;
