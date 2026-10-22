/* ===== Owenmore Gaels demo: shared model + example season =====
   Real 2026 results (scorelines, dates, opponents, venues). Players, Foireann numbers and the
   events behind each score are invented examples generated to add up to the real scores. */
const DEMO_KEY='owenmore-gaels-demo-v2', DEMO_VER=6;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const mmss=s=>{s=Math.max(0,Math.floor(s));return pad(Math.floor(s/60))+':'+pad(s%60)};
const HOME_GROUND='Connolly Park, Collooney';

const OG={};
OG.LABEL={goal:'Goal',point:'Point',two:'2-pointer',wide:'Wide',short:'Dropped short',saved:'Saved / blocked',w45:'45 won',
  fwon:'Free won',fcon:'Free conceded',kow:'Kick-out won',kol:'Kick-out lost',okw:'Their kick-out won',okl:'Their kick-out lost',
  tow:'Turnover won',tol:'Turnover lost',save:'Save',yellow:'Yellow card',black:'Black card',red:'Red card',sub:'Substitution',bloodret:'Blood sub return',note:'Note'};
OG.PTS={goal:3,point:1,two:2};
OG.SHOTS=['goal','point','two','wide','short','saved'];
OG.SRC={play:'Play',free:'Free','45':'45',pen:'Penalty',mark:'Mark'};
OG.isScore=t=>t==='goal'||t==='point'||t==='two';
OG.footy=code=>code!=='hurling';
OG.label=(t,code)=>{const l=OG.LABEL[t]||t;return code==='hurling'?l.replace('45 won','65 won').replace('kick-out','puck-out'):l};
OG.srcLabel=(s,code)=>s==='45'&&code==='hurling'?'65':OG.SRC[s]||'';
OG.set45=code=>OG.footy(code)?'45':'65';
OG.KO=code=>OG.footy(code)?'kick-out':'puck-out';
OG.score=(m,side)=>{let g=0,p=0;for(const e of m.events){if(e.side!==side)continue;if(e.type==='goal')g++;else if(e.type==='point')p++;else if(e.type==='two')p+=2}return{g,p,t:g*3+p}};
OG.fmt=s=>s.g+'-'+pad(s.p);
OG.scoreUpTo=(m,side,maxAbs)=>{let g=0,p=0;for(const e of m.events){if(e.side!==side||OG.abs(m,e.per,e.sec)>maxAbs)continue;if(e.type==='goal')g++;else if(e.type==='point')p++;else if(e.type==='two')p+=2}return{g,p,t:g*3+p}};
OG.TIERS={adult:'Adult',minor:'Minor',gogames:'Go Games'};

/* ----- periods and match time -----
   period: 0 pre-match, 1, 'HT', 2, 'FT', 3 (ET 1st), 'ETH', 4 (ET 2nd), 'AET' */
OG.perLen=(m,p)=>(p<=2?m.half:(m.etHalf||10))*60;
OG.dur=(m,p)=>{const d=m.clock&&m.clock.durs&&m.clock.durs[p];return typeof d==='number'?d:OG.perLen(m,p)};
OG.before={0:0,1:0,HT:1,2:1,FT:2,3:2,ETH:3,4:3,AET:4};
OG.abs=(m,per,sec)=>{let t=0;const n=OG.before[per]??0;for(let p=1;p<=n;p++)t+=OG.dur(m,p);return t+(typeof per==='number'&&per>0?sec:0)};
OG.elapsed=(m,now)=>{const c=m.clock;return c.acc+(c.running?((now||Date.now())-c.since)/1000:0)};
OG.nowAbs=(m,now)=>{const c=m.clock;return typeof c.period==='number'&&c.period>0?OG.abs(m,c.period,OG.elapsed(m,now)):OG.abs(m,c.period,0)};
OG.minOf=(sec,half)=>{const mn=Math.floor(sec/60)+1;return half&&mn>half?half+'+'+(mn-half)+"'":mn+"'"};
OG.perShort=p=>p===1?'1st half':p===2?'2nd half':p===3?'ET 1st':p===4?'ET 2nd':p==='HT'?'Half time':p==='FT'?'Full time':p==='ETH'?'ET half time':p==='AET'?'After ET':'Pre-match';
OG.halfOf=(m,per)=>per<=2?m.half:(m.etHalf||10);
// running match minute for reports, e.g. 38' or 60+2'
OG.matchMin=(m,e)=>{const mn=Math.floor(e.sec/60)+1,h=OG.halfOf(m,e.per);const base=e.per===2?m.half:e.per===3?2*m.half:e.per===4?2*m.half+(m.etHalf||10):0;
  return mn>h?(base+h)+'+'+(mn-h)+"'":(base+mn)+"'"};

/* ----- privacy tiers and names ----- */
OG.tierOf=t=>t&&t.tier||'adult';
OG.first=n=>String(n||'').split(' ')[0];
OG.pubName=(t,pid)=>{const p=t&&t.players.find(x=>x.id===pid);if(!p)return '';const tier=OG.tierOf(t);return tier==='adult'?`#${p.num} ${p.name}`:tier==='minor'?`#${p.num} ${OG.first(p.name)}`:''};
OG.fullName=(t,pid)=>{const p=t&&t.players.find(x=>x.id===pid);return p?`#${p.num} ${p.name}`:''};

/* ----- sin-bin ----- */
OG.sinbinRule=t=>{ // which card sends a player to the sin-bin, and for how long
  if(t.sinbinCard==='none')return null;
  const card=t.sinbinCard||(t.assoc==='gaa_f'?'black':t.assoc==='lgfa'?'yellow':'none');if(card==='none')return null;
  if(t.assoc==='lgfa'&&OG.gradeAge(t.grade)<=13)return null; // LGFA Rule 408: no sin-bin up to U13
  const mins=t.sinbinMins||(t.assoc==='lgfa'?(t.half>=30?10:t.half>15?5:3):10);
  return{card,secs:mins*60};
};
OG.gradeAge=g=>/minor/i.test(g)?(/18/.test(g)?18:17):/adult/i.test(g)?99:parseInt(String(g).replace(/\D/g,''))||0;
OG.sinbins=(m,t,now)=>{ // active sin-bins with seconds left (playing time)
  const na=OG.nowAbs(m,now),out=[];
  for(const e of m.events){if(!e.sinbin)continue;const left=e.sinbin-(na-OG.abs(m,e.per,e.sec));if(left>-30)out.push({e,left})}
  return out;
};

/* ----- minutes played (from starting team + subs log) ----- */
OG.minutes=(m,rules,now)=>{
  rules=rules||{bloodCounts:true,sinbinCounts:false};
  const end=m.ended||m.clock.period==='FT'||m.clock.period==='AET'?OG.abs(m,m.clock.period==='AET'?'AET':'FT',0):OG.nowAbs(m,now);
  const ev=[];for(const e of m.events)if(e.side==='us'&&['sub','bloodret','red'].includes(e.type)||e.side==='us'&&e.sinbin)ev.push({t:OG.abs(m,e.per,e.sec),e});
  if(!rules.sinbinCounts)for(const x of ev.slice())if(x.e.sinbin)ev.push({t:x.t+x.e.sinbin,e:{type:'sinret',pid:x.e.pid}});
  ev.sort((a,b)=>a.t-b.t);
  const secs={},since={},blood=new Set(),off=new Set();
  const open=(pid,t)=>{if(pid&&!(pid in since)&&!off.has(pid))since[pid]=t};
  const close=(pid,t)=>{if(pid in since){const d=Math.max(0,Math.min(t,end)-since[pid]);if(!blood.has(pid)||rules.bloodCounts)secs[pid]=(secs[pid]||0)+d;delete since[pid]}};
  (m.lineup||[]).forEach(pid=>open(pid,0));
  for(const {t,e} of ev){if(t>end)break;
    if(e.type==='sub'){close(e.pid,t);if(e.blood)blood.add(e.onId);open(e.onId,t)}
    else if(e.type==='bloodret'){close(e.pid,t);open(e.onId,t)}
    else if(e.type==='red'){close(e.pid,t);off.add(e.pid)}
    else if(e.sinbin&&!rules.sinbinCounts)close(e.pid,t);
    else if(e.type==='sinret')open(e.pid,t);
  }
  for(const pid of Object.keys(since))close(pid,end);
  return secs;
};
OG.onPitch=(m)=>{ // who's on the pitch after the subs/reds logged so far
  const set=new Set(m.lineup||[]);
  const ev=m.events.filter(e=>e.side==='us'&&['sub','bloodret','red'].includes(e.type)).sort((a,b)=>OG.abs(m,a.per,a.sec)-OG.abs(m,b.per,b.sec));
  for(const e of ev){if(e.type==='red')set.delete(e.pid);else{set.delete(e.pid);if(e.onId)set.add(e.onId)}}
  return set;
};

/* ----- tallies ----- */
OG.blank=()=>{const r={scoreG:0,scoreP:0,pts:0,fromFree:0,from45:0,fromPen:0,subOn:0,subOff:0,t45:0,s45:0,twoAtt:0};for(const k in OG.LABEL)r[k]=0;return r};
OG.outsideArc=(e,m)=>OG.footy(m.code)&&m.arc&&typeof e.lx==='number'&&Math.hypot(e.lx-40,e.ly)>=40;
OG.tally=(r,e,m)=>{if(e.type in r)r[e.type]++;
  if(OG.SHOTS.includes(e.type)){if(e.src==='45'){r.t45++;if(OG.PTS[e.type])r.s45++}if(e.type==='two'||OG.outsideArc(e,m))r.twoAtt++}
  if(OG.PTS[e.type]){r.pts+=OG.PTS[e.type];if(e.type==='goal')r.scoreG++;else r.scoreP+=OG.PTS[e.type];if(e.src==='free')r.fromFree++;if(e.src==='45')r.from45++;if(e.src==='pen')r.fromPen++}};
// A turnover won by one team is a turnover lost by the other; their kick-out lost is one we won.
OG.cross=(r,e)=>{if(e.type==='kow')r.okl++;else if(e.type==='kol')r.okw++;else if(e.type==='tow')r.tol++;else if(e.type==='tol')r.tow++;else if(e.type==='okw')r.kol++;else if(e.type==='okl')r.kow++};
OG.summary=(m,side)=>{const r=OG.blank();for(const e of m.events){if(e.side===side)OG.tally(r,e,m);else OG.cross(r,e)}
  return{scores:r.goal+r.point+r.two,shots:OG.SHOTS.reduce((a,t)=>a+r[t],0),wide:r.wide,tow:r.tow,tol:r.tol,kow:r.kow,kol:r.kol,okw:r.okw,okl:r.okl,fwon:r.fwon,fcon:r.fcon,y:r.yellow,b:r.black,r:r.red,save:r.save}};

/* ----- match report ----- */
OG.report=(S,m,publicVersion)=>{
  const t=S.teams.find(x=>x.id===m.teamId),f=S.fixtures.find(x=>x.id===m.fixtureId)||{};
  const nm=pid=>publicVersion?OG.pubName(t,pid):OG.fullName(t,pid);
  const us=OG.score(m,'us'),th=OG.score(m,'them'),ht1=OG.scoreUpTo(m,'us',OG.abs(m,'HT',0)),ht2=OG.scoreUpTo(m,'them',OG.abs(m,'HT',0));
  const aet=m.events.some(e=>e.per===3||e.per===4)||m.clock.period==='AET';
  const res=us.t>th.t?'beat':us.t<th.t?'lost to':'drew with';
  const d=new Date(m.date+'T12:00').toLocaleDateString('en-IE',{weekday:'long',day:'numeric',month:'long'});
  const where=f.ground||(f.venue==='Home'?HOME_GROUND:'');
  let s=`${S.club} ${t.name} ${res} ${m.opp}, ${OG.fmt(us)} (${us.t}) to ${OG.fmt(th)} (${th.t})${aet?' after extra time':''}`;
  s+=` in the ${f.comp||'match'}${where?' at '+where:''} on ${d}.`;
  if(OG.tierOf(t)==='gogames')return `${S.club} ${t.name} played ${m.opp} in a Go Games fixture on ${d}${where?' at '+where:''}. Go Games are non-competitive, so no scores are recorded.`;
  s+=` The half-time score was ${OG.fmt(ht1)} to ${OG.fmt(ht2)}.`;
  const sc={};for(const e of m.events)if(e.side==='us'&&OG.isScore(e.type)&&e.pid){const r=sc[e.pid]||(sc[e.pid]={g:0,p:0,b:{}});if(e.type==='goal')r.g++;else r.p+=OG.PTS[e.type];
    const k=e.src==='free'?'f':e.src==='45'?OG.set45(m.code):e.src==='pen'?'pen':e.src==='mark'?'m':null;if(k){const b=r.b[k]||(r.b[k]={g:0,p:0});if(e.type==='goal')b.g++;else b.p+=OG.PTS[e.type]}}
  const list=Object.entries(sc).sort((a,b)=>(b[1].g*3+b[1].p)-(a[1].g*3+a[1].p)).map(([pid,r])=>{const br=Object.entries(r.b).map(([k,b])=>`${b.g}-${b.p} ${k}`);return `${nm(pid).replace(/^#\d+ /,'')||'Unknown'} ${r.g}-${pad(r.p)}${br.length?' ('+br.join(', ')+')':''}`});
  if(list.length)s+=`\n\nScorers: ${list.join(', ')}.`;
  const S1=OG.summary(m,'us'),S2=OG.summary(m,'them');
  s+=`\n\nShooting: ${S1.scores} scores from ${S1.shots} shots (${S1.shots?Math.round(S1.scores*100/S1.shots):0}%), ${S1.wide} wides. ${m.opp}: ${S2.wide} wides.`;
  if(!publicVersion){
    s+=` Turnovers ${S1.tow} won, ${S1.tol} lost. Own ${OG.KO(m.code)}s ${S1.kow}/${S1.kow+S1.kol} kept; won ${S1.okw} of theirs.`;
    const subs=m.events.filter(e=>e.side==='us'&&e.type==='sub').map(e=>`${OG.matchMin(m,e)} ${nm(e.onId).replace(/^#\d+ /,'')} for ${nm(e.pid).replace(/^#\d+ /,'')}${e.blood?' (blood)':''}`);
    if(subs.length)s+=`\n\nSubs: ${subs.join('; ')}`;
    const cards=m.events.filter(e=>['yellow','black','red'].includes(e.type)).map(e=>`${OG.label(e.type,m.code).replace(' card','')} ${e.side==='us'?nm(e.pid).replace(/^#\d+ /,''):m.opp} ${OG.matchMin(m,e)}${e.sinbin?' (sin-bin)':''}`);
    if(cards.length)s+=`\nCards: ${cards.join('; ')}`;
    const notes=m.events.filter(e=>e.type==='note').map(e=>`${OG.matchMin(m,e)} ${e.text}`);
    if(notes.length)s+=`\n\nNotes: ${notes.join(' / ')}`;
  }
  return s;
};

/* ----- CSV ----- */
OG.csv=rows=>rows.map(r=>r.map(v=>{v=String(v??'');return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v}).join(',')).join('\n');

/* ===== example season ===== */
const DEMO_TEAMS=[
  {id:'sen',name:'Senior Football',assoc:'gaa_f',grade:'Adult',half:30,etHalf:10,arc:true,tier:'adult',onField:15,men:true,coach:'u-padraig'},
  {id:'u20',name:'U20 Football',assoc:'gaa_f',grade:'U20',half:30,etHalf:10,arc:true,tier:'adult',onField:15,men:true,coach:'u-gerry'},
  {id:'lad',name:'Ladies Junior',assoc:'lgfa',grade:'Adult',half:30,etHalf:10,arc:true,tier:'adult',onField:15,coach:'u-siobhan'},
  {id:'u16',name:'U16 Girls',assoc:'lgfa',grade:'U16',half:30,etHalf:10,arc:true,tier:'minor',onField:15,coach:'u-helen'},
  {id:'u13',name:'U13 Girls',assoc:'lgfa',grade:'U13',half:25,etHalf:5,arc:false,tier:'minor',onField:15,coach:'u-martina'},
  {id:'u10',name:'U10 Go Games',assoc:'gaa_f',grade:'U10',half:20,etHalf:5,arc:false,tier:'gogames',onField:11,men:true,kids:true,coach:'u-kevin'}
];
const DEMO_USERS=[
  {id:'u-mary',name:'Mary',role:'admin',label:'Mary · PRO (admin)'},
  {id:'u-padraig',name:'Pádraig',role:'coach',teamId:'sen',label:'Pádraig · Senior coach'},
  {id:'u-gerry',name:'Gerry',role:'coach',teamId:'u20',label:'Gerry · U20 coach'},
  {id:'u-siobhan',name:'Siobhán',role:'coach',teamId:'lad',label:'Siobhán · Ladies coach'},
  {id:'u-helen',name:'Helen',role:'coach',teamId:'u16',label:'Helen · U16 coach'},
  {id:'u-martina',name:'Martina',role:'coach',teamId:'u13',label:'Martina · U13 coach'},
  {id:'u-kevin',name:'Kevin',role:'coach',teamId:'u10',label:'Kevin · U10 coach'},
  {id:'u-aine',name:'Áine',role:'scorer',label:'Áine · scorer (parent)'},
  {id:'u-tom',name:'Tom',role:'scorer',label:'Tom · scorer (parent)'}
];
// Real results. et = the part of the final score scored in extra time.
const DEMO_RESULTS=[
  {t:'sen',date:'2026-07-25',time:'19:30',opp:'Geevagh',venue:'Neutral',ground:'Bunninadden',comp:'Division 2 League Final',us:[1,18],them:[1,17],et:{us:[0,4],them:[0,3]},scorer:'u-padraig',blood:true},
  {t:'sen',date:'2026-08-08',time:'18:00',opp:'Coolera/Strandhill',venue:'Home',ground:HOME_GROUND,comp:'Junior A Championship, Group 1',us:[2,21],them:[3,6],scorer:'u-aine'},
  {t:'sen',date:'2026-09-06',time:'15:00',opp:'Tourlestrane',venue:'Away',ground:'',comp:'Junior A Championship, Group 1',us:[6,15],them:[0,7],scorer:'u-aine',sinbin:true},
  {t:'sen',date:'2026-10-04',time:'14:00',opp:"St Michael's",venue:'Neutral',ground:'Markievicz Park, Sligo',comp:'Junior A Championship Final',us:[1,14],them:[0,16],scorer:'u-tom',edit:true},
  {t:'lad',date:'2026-09-13',time:'12:00',opp:"St John's",venue:'Home',ground:HOME_GROUND,comp:'Junior B Championship',us:[4,16],them:[2,6],scorer:'u-siobhan'},
  {t:'lad',date:'2026-10-03',time:'14:00',opp:"St John's",venue:'Neutral',ground:'Eastern Harps',comp:'Connacht Gold Junior B Championship',us:[8,19],them:[4,4],scorer:'u-tom',sinbin:true},
  {t:'u16',date:'2026-09-22',time:'19:00',opp:'St Molaise Gaels',venue:'Home',ground:HOME_GROUND,comp:'U16 B Championship',us:[5,14],them:[3,6],scorer:'u-aine',blood:true},
  {t:'u13',date:'2026-09-23',time:'19:00',opp:'CT Gaels',venue:'Away',ground:'CT Gaels',comp:'U13 Division 2 League',us:[1,7],them:[4,15],scorer:'u-martina'},
  {t:'u10',date:'2026-10-10',time:'10:30',opp:"St Mary's",venue:'Away',ground:"St Mary's",comp:'Go Games blitz',gogames:true,scorer:'u-kevin',example:true}
];
const DEMO_UPCOMING=[
  {t:'u20',date:'2026-10-24',time:'16:00',opp:'Geevagh/St Michaels',venue:'Home',ground:HOME_GROUND,comp:'U20 B Football Championship, Round 1',ref:'M. Duffy',source:'Sligo GAA',scorer:'u-aine'},
  {t:'u10',date:'2026-10-24',time:'10:30',opp:'Coolera/Strandhill',venue:'Home',ground:HOME_GROUND,comp:'Go Games blitz',example:true,scorer:'u-kevin'},
  {t:'u16',date:'2026-10-31',time:'11:00',opp:'Tourlestrane',venue:'Away',comp:'U16 League',example:true,scorer:'u-tom'},
  {t:'lad',date:'2026-11-01',time:'12:00',opp:'Curry',venue:'Home',ground:HOME_GROUND,comp:'Ladies League',example:true,prev:{date:'2026-10-31',time:'14:00',venue:'Home'}},
  {t:'u13',date:'2026-11-07',time:'11:00',opp:'Shamrock Gaels',venue:'Home',ground:HOME_GROUND,comp:'U13 League',example:true},
  {t:'u20',date:'2026-11-14',time:'15:00',opp:'Eastern Harps',venue:'Away',comp:'U20 B Football Championship, Round 2',example:true}
];
const DM_MEN=['Ciarán','Darragh','Eoin','Seán','Conor','Pádraig','Niall','Shane','Kevin','Mark','Dylan','Liam','Rory','Aidan','Brian','Declan','Jamie','Oisín','Cathal','Tomás'];
const DM_WOMEN=['Aoife','Saoirse','Ciara','Niamh','Róisín','Éabha','Caoimhe','Orla','Sadhbh','Clodagh','Méabh','Aisling','Gráinne','Laoise','Muireann','Síofra','Ella','Kate','Emma','Leah'];
const DM_KIDS=['Fionn','Cian','Rían','Odhrán','Tadhg','Senan','Darach','Oran','Cillian','Jack','Noah','Leon','Charlie','Alex','Dáithí','Bobby'];
const DM_INI='BCDFGHKLMNOPRSTWBCDM';
const DM_NOTES=['Wind behind us this half','Short kick-outs working well','Their #11 causing problems, moved #4 across','Need more runners off the shoulder','Great spell of pressure, three turnovers in a row','Keeper hurt, play stopped two minutes'];
function dmRng(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}}

function dmGen(t,res,R,by){
  const m={half:t.half,etHalf:t.etHalf,code:t.code,arc:t.arc,clock:{durs:{}}};
  const d=m.clock.durs;d[1]=t.half*60+60+Math.floor(R()*120);d[2]=t.half*60+90+Math.floor(R()*150);
  const hasET=!!res.et;if(hasET){d[3]=t.etHalf*60+20+Math.floor(R()*40);d[4]=t.etHalf*60+30+Math.floor(R()*60)}
  const players=t.players,lineup=players.slice(0,t.onField).map(p=>p.id),bench=players.slice(t.onField);
  const ev=[];let n=0;const at0=Date.parse(res.date+'T'+(res.time||'12:00')+':00Z');
  const add=o=>{const e=Object.assign({id:'e'+(++n),by},o);e.at=at0+Math.round(OG.abs(m,e.per,e.sec)*1000);ev.push(e);return e};
  const pickTime=et=>{if(et){const p=R()<.5?3:4;return{per:p,sec:Math.floor(R()*(d[p]-5))}}const p=R()<.5?1:2;return{per:p,sec:Math.floor(R()*(d[p]-5))}};
  // substitutions first, so scorers are always on the pitch
  const subs=[];const offPool=lineup.slice(1).sort(()=>R()-.5),onPool=bench.map(p=>p.id).sort(()=>R()-.5);
  if(res.gogames){ // rolling subs: everyone gets game time
    let tm=6*60;for(let i=0;i<Math.min(onPool.length,6);i++){const per=tm<d[1]?1:2,sec=per===1?tm:tm-d[1];subs.push({per,sec,side:'us',type:'sub',pid:offPool[i],onId:onPool[i]});tm+=5*60}
  }else{
    const k=3+Math.floor(R()*3);for(let i=0;i<k&&i<onPool.length;i++)subs.push({per:2,sec:Math.floor(300+R()*(d[2]-500)),side:'us',type:'sub',pid:offPool[i],onId:onPool[i]});
    if(res.blood&&onPool.length>k){const sec=Math.floor(400+R()*600),off=offPool[k+1],on=onPool[k];subs.push({per:1,sec,side:'us',type:'sub',pid:off,onId:on,blood:true});subs.push({per:1,sec:sec+240+Math.floor(R()*180),side:'us',type:'bloodret',pid:on,onId:off})}
  }
  subs.sort((a,b)=>OG.abs(m,a.per,a.sec)-OG.abs(m,b.per,b.sec)).forEach(s=>add(s));
  m.events=ev;m.lineup=lineup;
  const on=(per,sec)=>{const tmp=Object.assign({},m,{events:ev.filter(e=>OG.abs(m,e.per,e.sec)<=OG.abs(m,per,sec))});return [...OG.onPitch(tmp)]};
  const wpick=(per,sec,w)=>{const ids=on(per,sec);const pool=[];ids.forEach(id=>{const p=players.find(x=>x.id===id);const num=p.num>t.onField?12:p.num;const k=num===1?(w==='keeper'?20:0):num<=7?(w==='att'?.6:2):num<=9?2:(w==='att'?4:1.5);for(let i=0;i<Math.round(k*5);i++)pool.push(id)});return pool[Math.floor(R()*pool.length)]||ids[0]};
  const taker=(per,sec)=>{const ids=on(per,sec);for(const n2 of[11,14,12])if(ids.includes(t.id+'-p'+n2))return t.id+'-p'+n2;return wpick(per,sec,'att')};
  const loc=(a,b)=>{for(;;){const dd=a+R()*(b-a),an=(R()*2-1)*1.15,lx=40+dd*Math.sin(an),ly=dd*Math.cos(an);if(lx>2&&lx<78&&ly>1&&ly<54)return{lx:Math.round(lx*2)/2,ly:Math.round(ly*2)/2}}};
  if(!res.gogames){
    for(const phase of hasET?['nt','et']:['nt']){
      const et=phase==='et';const sp=et?res.et.us:[res.us[0]-(hasET?res.et.us[0]:0),res.us[1]-(hasET?res.et.us[1]:0)];
      const op=et?res.et.them:[res.them[0]-(hasET?res.et.them[0]:0),res.them[1]-(hasET?res.et.them[1]:0)];
      let twos=t.arc?Math.min(Math.floor(sp[1]/2),et?1:Math.floor(R()*4)):0;let ones=sp[1]-2*twos;
      for(let i=0;i<sp[0];i++){const w=pickTime(et);const pen=R()<.12;add(Object.assign({side:'us',type:'goal',src:pen?'pen':'play',pid:pen?taker(w.per,w.sec):wpick(w.per,w.sec,'att')},w,pen?{lx:40,ly:11}:loc(5,14)))}
      for(let i=0;i<twos;i++){const w=pickTime(et);const k=R();if(k<.2&&!et){add(Object.assign({side:'us',type:'two',pid:t.id+'-p1',src:'45',lx:R()<.5?14:66,ly:45},w,{sec:w.sec+20}))}else add(Object.assign({side:'us',type:'two',src:k<.5||et?'free':'play'},w,{pid:k<.5||et?taker(w.per,w.sec):wpick(w.per,w.sec,'att')},loc(41,47)))}
      for(let i=0;i<ones;i++){const w=pickTime(et);const k=R(),src=k<.3?'free':k<.38?'mark':'play';add(Object.assign({side:'us',type:'point',src},w,{pid:src==='free'?taker(w.per,w.sec):wpick(w.per,w.sec,'att')},loc(src==='free'?18:12,src==='free'?36:38)))}
      const otwo=t.arc?Math.min(Math.floor(op[1]/2),Math.floor(R()*3)):0;
      for(let i=0;i<op[0];i++)add(Object.assign({side:'them',type:'goal'},pickTime(et)));
      for(let i=0;i<otwo;i++)add(Object.assign({side:'them',type:'two'},pickTime(et)));
      for(let i=0;i<op[1]-2*otwo;i++)add(Object.assign({side:'them',type:'point'},pickTime(et)));
      const sc=sp[0]+sp[1];
      for(let i=0,k=Math.round(sc*.4+R()*3);i<k;i++){const w=pickTime(et);const fr=R()<.25;add(Object.assign({side:'us',type:R()<.8?'wide':R()<.5?'short':'saved',src:fr?'free':'play'},w,{pid:fr?taker(w.per,w.sec):wpick(w.per,w.sec,'att')},loc(14,44)))}
      for(let i=0,k=Math.round((op[0]+op[1])*.5+R()*2);i<k;i++)add(Object.assign({side:'them',type:'wide'},pickTime(et)));
    }
    const t45miss=Math.floor(R()*3);for(let i=0;i<t45miss;i++){const w=pickTime(false);add(Object.assign({side:'us',type:R()<.6?'wide':'short',pid:t.id+'-p1',src:'45',lx:R()<.5?14:66,ly:45},w,{sec:w.sec+20}))}
    const many=(type,lo,hi,who)=>{for(let i=0,k=lo+Math.floor(R()*(hi-lo+1));i<k;i++){const w=pickTime(false);add(Object.assign({side:'us',type},w,who?{pid:R()<.7?wpick(w.per,w.sec,who):null}:{}))}};
    many('tow',7,14,'any');many('tol',4,8,'any');many('kow',9,16);many('kol',2,6);
    const them=(type,lo,hi)=>{for(let i=0,k=lo+Math.floor(R()*(hi-lo+1));i<k;i++)add(Object.assign({side:'them',type},pickTime(false)))};
    them('kow',7,12);them('kol',3,8);them('tow',1,4);
    const rule=OG.sinbinRule(t);
    if(rule&&rule.card!=='yellow')for(let i=0,k=Math.floor(R()*2);i<k;i++){const w=pickTime(false);add(Object.assign({side:'us',type:'yellow',pid:wpick(w.per,w.sec,'any')},w))}
    if(res.sinbin&&rule){const w={per:1,sec:Math.floor(500+R()*600)};add(Object.assign({side:'us',type:rule.card,pid:wpick(w.per,w.sec,'any'),sinbin:rule.secs},w));const w2={per:2,sec:Math.floor(400+R()*600)};add(Object.assign({side:'them',type:rule.card,sinbin:rule.secs},w2))}
    else for(let i=0,k=Math.floor(R()*2);i<k;i++)add(Object.assign({side:'them',type:'yellow'},pickTime(false)));
  }
  for(let i=0,k=1+Math.floor(R()*2);i<k;i++){const w=pickTime(false);add(Object.assign({side:'us',type:'note',text:DM_NOTES[Math.floor(R()*DM_NOTES.length)]},w))}
  ev.sort((a,b)=>OG.abs(m,a.per,a.sec)-OG.abs(m,b.per,b.sec));
  return{events:ev,lineup,durs:d,hasET};
}

function buildDemo(){
  const codeOf={gaa_f:'football',gaa_h:'hurling',lgfa:'ladies',camogie:'hurling'};
  const CC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const teams=DEMO_TEAMS.map((d,ti)=>{const names=d.kids?DM_KIDS:d.men?DM_MEN:DM_WOMEN;const R=dmRng(900+ti*71);const count=d.kids?16:20;
    return{id:d.id,name:d.name,assoc:d.assoc,grade:d.grade,half:d.half,etHalf:d.etHalf,code:codeOf[d.assoc],arc:d.arc,tier:d.tier,onField:d.onField,
      shotLoc:d.tier!=='gogames',leaderboard:d.tier==='adult',tableUrl:d.assoc==='lgfa'?'https://sligolgfa.com/results/':'https://www.sligogaa.ie/FixturesResultsAll.aspx',coach:d.coach,
      players:names.slice(0,count).map((nm,i)=>({id:d.id+'-p'+(i+1),num:i+1,name:nm+' '+DM_INI[(i+ti*3)%DM_INI.length]+'.',foireann:String(40000000+Math.floor(R()*9000000)),code:Array.from({length:6},()=>CC[Math.floor(R()*CC.length)]).join('')}))}});
  const S={v:5,demoVer:DEMO_VER,club:'Owenmore Gaels',logo:null,teams,fixtures:[],matches:[],users:DEMO_USERS.map(u=>Object.assign({},u)),me:'u-mary',active:null,tab:'stats',
    settings:{joinUrl:'https://www.foireann.ie',lottoUrl:'',foireannKey:'',fixtureSource:'sligogaa',bloodCounts:true,sinbinCounts:false}};
  DEMO_RESULTS.forEach((r,i)=>{const t=teams.find(x=>x.id===r.t);const scorer=S.users.find(u=>u.id===r.scorer);
    const g=dmGen(t,r,dmRng(5000+i*131),scorer?scorer.name:'Coach');
    const fx={id:'fx-r'+i,teamId:t.id,date:r.date,time:r.time,opp:r.opp,venue:r.venue,ground:r.ground||'',comp:r.comp,status:'played',createdAt:Date.parse(r.date),scorer:r.scorer,example:!!r.example};
    const m={id:'m-r'+i,fixtureId:fx.id,teamId:t.id,opp:r.opp,date:r.date,half:t.half,etHalf:t.etHalf,code:t.code,arc:t.arc,lineup:g.lineup,events:g.events,ended:true,scorer:r.scorer,
      clock:{period:g.hasET?'AET':'FT',running:false,acc:0,since:0,durs:g.durs,alerted:{1:true,2:true,3:true,4:true}},
      audit:[{at:Date.parse(r.date+'T'+r.time+':00Z'),who:scorer?scorer.name:'Coach',action:'Started scoring'}]};
    if(r.edit){const e=m.events.find(x=>x.side==='us'&&x.type==='point'&&x.pid);if(e){const was=OG.fullName(t,e.pid);const other=t.players[13].id;if(other!==e.pid){e.pid=other;m.audit.push({at:e.at+3600e3,who:'Pádraig',action:`Changed scorer of point at ${OG.minOf(e.sec,t.half)} (${OG.perShort(e.per)}) from ${was} to ${OG.fullName(t,other)}`})}}}
    m.audit.push({at:Date.parse(r.date+'T'+r.time+':00Z')+(g.hasET?100:80)*60e3,who:scorer?scorer.name:'Coach',action:'Finished match'});
    fx.matchId=m.id;if(!r.gogames)fx.result={us:OG.score(m,'us'),them:OG.score(m,'them')};S.fixtures.push(fx);S.matches.push(m)});
  DEMO_UPCOMING.forEach((u,i)=>{const f=Object.assign({id:'fx-u'+i,teamId:u.t,status:'upcoming',createdAt:Date.now()-3*86400e3},u);delete f.t;if(f.scorer)f.pin=String(4821+i*1379).slice(-4);if(u.prev)f.changedAt=Date.now()-5*3600e3;S.fixtures.push(f)});
  return S;
}
function loadDemo(){try{const s=JSON.parse(localStorage.getItem(DEMO_KEY)||'null');if(s&&s.v===5&&s.demoVer===DEMO_VER)return s}catch(e){}return buildDemo()}
function saveDemo(S){try{localStorage.setItem(DEMO_KEY,JSON.stringify(S))}catch(e){}}

/* ===== what the public page and player page see ===== */
function dmExampleLive(S,now){
  const t=S.teams.find(x=>x.id==='u20');const R=dmRng(4242);
  const g=dmGen(t,{us:[1,12],them:[1,9],date:new Date(now).toISOString().slice(0,10),time:'16:00'},R,'Áine');
  const m={id:'example-live',teamId:t.id,opp:'Geevagh/St Michaels',date:new Date(now).toISOString().slice(0,10),half:t.half,etHalf:t.etHalf,code:t.code,arc:t.arc,lineup:g.lineup,events:[],example:true,clock:{period:2,running:true,acc:0,since:now,durs:{1:g.durs[1]}}};
  const at=Math.floor(now/1000)%1800;m.clock.acc=at;
  m.events=g.events.filter(e=>e.per===1||(e.per===2&&e.sec<=at));
  return m;
}
OG.publicMatch=(S,m,now)=>{const t=S.teams.find(x=>x.id===m.teamId)||{players:[]};const tier=OG.tierOf(t);const gg=tier==='gogames';
  const c=m.clock;const el=typeof c.period==='number'&&c.period>0?OG.elapsed(m,now):0;
  return{id:m.id,club:S.club,squad:t.name,tier,code:m.code,arc:!!m.arc,opp:m.opp,date:m.date,half:m.half,etHalf:m.etHalf,savedAt:now,example:!!m.example,
    clock:{period:c.period,running:!!c.running,elapsed:el},
    score:gg?null:{us:OG.score(m,'us'),them:OG.score(m,'them')},stats:gg?null:{us:OG.summary(m,'us'),them:OG.summary(m,'them')},
    sinbins:gg?[]:OG.sinbins(m,t,now).filter(x=>x.left>0).map(x=>({side:x.e.side,who:x.e.side==='us'?OG.pubName(t,x.e.pid):m.opp,left:x.left})),
    events:m.events.filter(e=>e.type!=='note'&&(!gg||e.type==='sub')).map(e=>({per:e.per,sec:e.sec,side:e.side,type:e.type,label:OG.label(e.type,m.code),pts:OG.PTS[e.type]||0,blood:!!e.blood,
      src:e.src&&e.src!=='play'?OG.srcLabel(e.src,m.code):null,sinbin:e.sinbin||0,
      who:e.side==='them'?'':e.type==='sub'||e.type==='bloodret'?`${OG.pubName(t,e.pid)||'?'} off, ${OG.pubName(t,e.onId)||'?'} on`:OG.pubName(t,e.pid)}))}};
function demoPublic(S,now=Date.now()){
  const byId=Object.fromEntries(S.teams.map(t=>[t.id,t]));
  let live=S.matches.filter(m=>!m.ended&&m.clock.period!==0);let example=false;
  if(!live.length){live=[dmExampleLive(S,now)];example=true}
  const fixtures=S.fixtures.map(f=>{const t=byId[f.teamId]||{};const gg=OG.tierOf(t)==='gogames';
    return{id:f.id,squad:t.name||'',tier:OG.tierOf(t),opp:f.opp,date:f.date,time:f.time||'',venue:f.venue||'',ground:f.ground||(f.venue==='Home'?HOME_GROUND:''),comp:f.comp||'',ref:f.ref||'',status:f.status,
      result:gg?null:f.result||null,prev:f.prev||null,changedAt:f.changedAt||null,example:!!f.example,tableUrl:t.tableUrl||''}});
  const updates=[];
  for(const f of fixtures){
    if(f.status==='cancelled'&&f.changedAt)updates.push({at:f.changedAt,kind:'cancelled',f});
    else if(f.prev&&f.changedAt)updates.push({at:f.changedAt,kind:'moved',f});
    if(f.status==='played'&&f.result&&now-Date.parse(f.date+'T18:00:00Z')<21*86400e3)updates.push({at:Date.parse(f.date+'T18:00:00Z'),kind:'result',f});
  }
  updates.sort((a,b)=>b.at-a.at);
  return{now,club:S.club,example,settings:S.settings,matches:live.map(m=>OG.publicMatch(S,m,now)),fixtures,updates:updates.slice(0,12)};
}
function demoPlayer(S,code){
  code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  let team,player;for(const t of S.teams){const p=t.players.find(x=>x.code===code);if(p){team=t;player=p;break}}
  if(!player)return null;
  const tier=OG.tierOf(team),gg=tier==='gogames';
  const total=OG.blank(),games=[],shots=[];let mins=0,apps=0;
  const board={};team.players.forEach(p=>board[p.id]={p,pts:0,g:0,pp:0,apps:0,mins:0});
  for(const m of S.matches.filter(x=>x.teamId===team.id).sort((a,b)=>String(b.date).localeCompare(String(a.date)))){
    const ms=OG.minutes(m,S.settings);
    for(const [pid,s] of Object.entries(ms))if(board[pid]){board[pid].mins+=s;if(s>0)board[pid].apps++}
    for(const e of m.events)if(e.side==='us'&&OG.isScore(e.type)&&board[e.pid]){board[e.pid].pts+=OG.PTS[e.type];if(e.type==='goal')board[e.pid].g++;else board[e.pid].pp+=OG.PTS[e.type]}
    const line=OG.blank();let inv=(ms[player.id]||0)>0;
    for(const e of m.events){if(e.side!=='us')continue;
      if(e.type==='sub'){if(e.pid===player.id)line.subOff++;if(e.onId===player.id)line.subOn++;continue}
      if(e.pid===player.id&&!gg){OG.tally(line,e,m);inv=true;if(OG.SHOTS.includes(e.type)&&typeof e.lx==='number')shots.push({type:e.type,lx:e.lx,ly:e.ly})}}
    if(!inv)continue;for(const k in line)total[k]+=line[k];
    const mm=Math.round((ms[player.id]||0)/60);mins+=mm;if(mm>0)apps++;
    const fx=S.fixtures.find(f=>f.id===m.fixtureId);
    games.push({date:m.date,opp:m.opp,comp:fx?fx.comp:'',result:gg?null:{us:OG.score(m,'us'),them:OG.score(m,'them')},final:!!m.ended,line,mins:mm,started:(m.lineup||[]).includes(player.id)});
  }
  const lb=team.leaderboard&&!gg?Object.values(board).filter(r=>r.apps).map(r=>({name:tier==='adult'?r.p.name:OG.first(r.p.name),num:r.p.num,me:r.p.id===player.id,g:r.g,p:r.pp,pts:r.pts,apps:r.apps,mins:Math.round(r.mins/60)})):null;
  return{club:S.club,squad:team.name,tier,code:team.code,arc:!!team.arc,player:{num:player.num,name:player.name},games:games.length,apps,mins,total,matches:games,shots,leaderboard:lb,settings:S.settings};
}
OG.mapUrl=(ground,opp)=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent((ground||(opp+' GAA'))+', Co. Sligo');

/* ===== shareable result card (canvas) ===== */
OG.resultCard=(o)=>new Promise(res=>{
  const c=document.createElement('canvas');c.width=1080;c.height=1080;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,1080,1080);g.addColorStop(0,'#1f3fbf');g.addColorStop(1,'#0d1f6b');x.fillStyle=g;x.fillRect(0,0,1080,1080);
  x.fillStyle='#f5a800';x.fillRect(0,1040,1080,40);
  const draw=img=>{
    if(img){x.fillStyle='#fff';x.beginPath();x.arc(540,210,120,0,Math.PI*2);x.fill();const s=Math.min(200/img.width,200/img.height);x.drawImage(img,540-img.width*s/2,210-img.height*s/2,img.width*s,img.height*s)}
    x.textAlign='center';x.fillStyle='rgba(255,255,255,.8)';x.font='600 40px "Barlow Condensed", Arial Narrow, sans-serif';
    x.fillText((o.label||'FULL TIME').toUpperCase(),540,400);
    x.fillStyle='#fff';x.font='700 58px "Barlow Condensed", Arial Narrow, sans-serif';
    x.fillText(o.us,540,490);x.fillText(o.them,540,790);
    x.fillStyle='#f5a800';x.font='700 160px "Barlow Condensed", Arial Narrow, sans-serif';x.fillText(o.usScore,540,650);
    x.fillStyle='#fff';x.font='700 120px "Barlow Condensed", Arial Narrow, sans-serif';x.fillText(o.themScore,540,930);
    x.fillStyle='rgba(255,255,255,.75)';x.font='500 34px Barlow, Arial, sans-serif';x.fillText(o.sub||'',540,1000);
    res(c);
  };
  const img=new Image();img.onload=()=>draw(img);img.onerror=()=>draw(null);img.src=OWN_BADGE;
});

// Crest from the Sligo LGFA club list (hotlinked; Owenmore's own crest is built in)
function crestTag(name,cls){const c=crestFor(name);if(!c)return '';const src=c.id===81481?OWN_BADGE:crestUrl(c);return `<img class="crest ${cls||''}" src="${src}" alt="" loading="lazy" onerror="this.remove()">`}
