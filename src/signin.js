/* ========== one app, one front door ==========
   The app always opens on the public live page: no login needed to follow scores.
   "Sign in" offers the other roles and opens the right screen:
     Coach / manager  -> sign-in link by email or text (demo: pick the coach)  -> coach app
     Scorer           -> match PIN                                             -> scoring screen
     Club admin       -> sign-in link (demo: straight in)                      -> admin
     Player / parent  -> private code                                          -> my stats
   The last sign-in is remembered on the phone so the header button goes straight back to it. */
const ROLE_KEY='gb-signin';
const Role={
  get(){try{return JSON.parse(localStorage.getItem(ROLE_KEY)||'null')}catch(e){return null}},
  set(v){try{v?localStorage.setItem(ROLE_KEY,JSON.stringify(v)):localStorage.removeItem(ROLE_KEY)}catch(e){}},
  go(r){Role.set(r);location.href=r.page==='me'?'me.html':'index.html?as='+encodeURIComponent(r.as)+(r.pin?'&pin='+encodeURIComponent(r.pin):'')},
  out(){Role.set(null);location.href='live.html'}
};
function signinButton(){
  const host=document.querySelector('.top .brand');if(!host||document.getElementById('signin'))return;
  const r=Role.get();
  const b=document.createElement('button');b.id='signin';b.type='button';b.className='btn sm signbtn';
  b.textContent=r?(r.page==='me'?'My stats':r.label||'My app'):'Sign in';
  b.onclick=()=>r?Role.go(r):signinSheet();
  host.appendChild(b);
}
function signinSheet(step){
  const m=document.getElementById('modal');if(!m)return;
  const S=loadDemo();
  const head=(t,back)=>`<div class="row" style="justify-content:space-between;align-items:center">${back?'<button class="btn sm" data-si="home">‹ Back</button>':''}<h2 style="margin:0;flex:1">${t}</h2><button class="btn sm" data-close="1">Close</button></div>`;
  let h;
  if(step==='coach'||step==='admin'){
    const users=S.users.filter(u=>u.role===step);
    h=head(step==='coach'?'Coach or manager':'Club admin',1)+
      `<p class="legend">Enter the email or mobile number the club has for you. We’ll send a one-tap sign-in link, no password.</p>
       <input class="field" type="email" placeholder="Email or mobile" autocomplete="email" aria-label="Email or mobile">
       <p class="legend"><b>Demo:</b> no link is sent. Pick who you are:</p>
       <div class="silist">${users.map(u=>`<button class="btn" data-si="pick" data-as="${u.id}">${esc(u.label)}</button>`).join('')}</div>`;
  }else if(step==='scorer'){
    const demo=S.fixtures.filter(f=>f.pin&&!f.pinExpired&&f.status!=='played');
    h=head('Scorer',1)+
      `<p class="legend">Enter the 4-digit PIN for your match. The coach or PRO gives it to you. It works for that match only and expires at full time.</p>
       <input class="field pinin" id="si-pin" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="PIN" aria-label="Match PIN" autocomplete="one-time-code">
       <p class="sierr" id="si-err" role="alert"></p>
       <button class="btn amb" data-si="pin">Start scoring</button>
       ${demo.length?`<p class="legend"><b>Demo PINs:</b> ${demo.slice(0,3).map(f=>`${esc(f.opp)} <b>${esc(f.pin)}</b>`).join(' · ')}</p>`:''}`;
  }else{
    h=head('Sign in')+
      `<p class="legend">You don’t need to sign in to follow live scores. Sign in for your role:</p>
       <div class="silist">
         <button class="btn sirow" data-si="coach"><b>Coach or manager</b><span>Team sheet, minutes, stats for your team</span></button>
         <button class="btn sirow" data-si="scorer"><b>Scorer</b><span>Score a match with its PIN</span></button>
         <button class="btn sirow" data-si="me"><b>Player or parent</b><span>Team stats and match reports</span></button>
         <button class="btn sirow" data-si="admin"><b>Club admin</b><span>Teams, squads and club settings</span></button>
       </div>`;
  }
  m.innerHTML=`<div class="sheet-bg" id="si-bg"><div class="sheet" role="dialog" aria-modal="true" aria-label="Sign in">${h}</div></div>`;
  m.hidden=false;
  const pin=document.getElementById('si-pin');if(pin){pin.focus();pin.onkeydown=e=>{if(e.key==='Enter')m.querySelector('[data-si="pin"]').click()}}
  m.onclick=e=>{
    if(e.target.id==='si-bg'||e.target.closest('[data-close]')){m.hidden=true;m.innerHTML='';return}
    const b=e.target.closest('[data-si]');if(!b)return;
    const v=b.dataset.si;
    if(v==='home'||v==='coach'||v==='admin'||v==='scorer'){signinSheet(v==='home'?null:v);return}
    if(v==='me'){Role.go({page:'me',label:'My stats'});return}
    if(v==='pick'){const u=S.users.find(x=>x.id===b.dataset.as);Role.go({page:'app',as:u.id,label:u.role==='admin'?'Club admin':'Coach app'});return}
    if(v==='pin'){
      const p=(pin.value||'').trim();const f=S.fixtures.find(x=>x.pin&&x.pin===p&&!x.pinExpired&&x.status!=='played');
      if(!f){document.getElementById('si-err').textContent='That PIN doesn’t match an upcoming match. Check it with your coach.';return}
      Role.go({page:'app',as:f.scorer,pin:p,label:'Scoring'});
    }
  };
}
