/* ========== installable app (PWA) ==========
   Shared by every page. Each page links its own manifest (built by build.sh) so the scorer/coach app,
   the public live page and the player page install separately, each opening on its own start page.
   - Android/Chrome/Edge: an "Install app" button appears in the header when the browser offers its
     install prompt (beforeinstallprompt), and disappears once installed.
   - iPhone/iPad Safari: no install prompt exists, so a one-time tip says "Tap Share, then Add to Home Screen".
   - Already running from the home screen: nothing is shown. */
(function(){
  const inFrame=(()=>{try{return window.top!==window.self}catch(e){return true}})();
  const standalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true}catch(e){return false}};
  const page=(location.pathname.split('/').pop()||'index').replace(/\.html$/,'')||'index';
  const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  const IOS_KEY='pwa-ios-tip-'+page;
  let deferred=null;

  function button(){
    let b=document.getElementById('installbtn');
    if(b)return b;
    const host=document.querySelector('.top .brand');if(!host)return null;
    b=document.createElement('button');b.id='installbtn';b.type='button';b.className='btn sm instbtn';b.hidden=true;
    b.textContent='Install app';b.setAttribute('aria-label','Install this app on your home screen');
    b.addEventListener('click',async()=>{
      if(!deferred)return;
      b.disabled=true;
      try{deferred.prompt();await deferred.userChoice}catch(e){}
      deferred=null;b.disabled=false;b.hidden=true; // the prompt can only be used once; Chrome fires a fresh event if offered again
    });
    host.appendChild(b);
    return b;
  }
  function hideAll(){const b=document.getElementById('installbtn');if(b)b.hidden=true;const t=document.getElementById('iostip');if(t)t.remove()}

  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault(); // use our own button instead of Chrome's mini-infobar
    if(standalone()||inFrame)return;
    deferred=e;const b=button();if(b)b.hidden=false;
  });
  window.addEventListener('appinstalled',()=>{deferred=null;hideAll()});
  try{matchMedia('(display-mode: standalone)').addEventListener('change',ev=>{if(ev.matches)hideAll()})}catch(e){}

  function iosTip(){
    const ua=navigator.userAgent||'';
    const ios=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    if(!ios||standalone()||inFrame||store.get(IOS_KEY))return;
    // Only Safari can add to the home screen on older iOS; other iOS browsers get the same tip from iOS 16.4 on.
    store.set(IOS_KEY,'1'); // one-time: never shown again on this page, even if not dismissed
    const d=document.createElement('div');d.id='iostip';d.className='iostip';d.setAttribute('role','note');
    d.innerHTML='<div class="iostip-in"><svg class="iostip-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 11H5v10h14V11h-1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'+
      '<p><b>Install this app:</b> tap <b>Share</b>, then <b>Add to Home Screen</b>.</p><button type="button" class="btn sm" aria-label="Close tip">OK</button></div>';
    d.querySelector('button').addEventListener('click',()=>d.remove());
    document.body.appendChild(d);
  }

  if(!standalone()&&!inFrame){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{button();iosTip()});else{button();iosTip()}
  }
  try{if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')&&!inFrame)navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}
})();
