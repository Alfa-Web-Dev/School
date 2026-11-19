// Role panels ka common layout + login guard. Use: initShell('admin','students')
const NAV={"admin": [["index", "dashboard"], ["students", "students"], ["teachers", "teachers"], ["classes", "classes"], ["timetable", "timetable"], ["fees", "fees"], ["exams", "exams"], ["notices", "notices"], ["notes", "notes"], ["tests", "tests"], ["doubts", "doubts"], ["cards", "cards"], ["leaves", "leaves"], ["slots", "slots"], ["insights", "insights"], ["enquiries", "enquiries"], ["certificates", "certificates"], ["logs", "logs"], ["settings", "settings"]], "teacher": [["index", "dashboard"], ["attendance", "attendance"], ["marks", "marks"], ["results", "results"], ["homework", "homework"], ["notes", "notes"], ["tests", "tests"], ["doubts", "doubts"], ["cards", "cards"], ["leaves", "leaves"], ["slots", "slots"], ["insights", "insights"], ["classes", "classes"], ["timetable", "timetable"], ["notices", "notices"], ["settings", "settings"]], "student": [["index", "dashboard"], ["profile", "profile"], ["attendance", "attendance"], ["fees", "fees"], ["results", "results"], ["timetable", "timetable"], ["homework", "homework"], ["notes", "notes"], ["tests", "tests"], ["doubts", "doubts"], ["cards", "cards"], ["leave", "leave"], ["slots", "slots"], ["idcard", "idcard"], ["study", "study"], ["notices", "notices"], ["settings", "settings"]]};
const IC={dashboard:'<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',students:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
teachers:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14a5 5 0 0 1 5 5"/>',classes:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
timetable:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',fees:'<rect x="2" y="6" width="20" height="14" rx="3"/><path d="M2 11h20M16 15h2"/>',
exams:'<path d="M5 21V10M12 21V4M19 21v-7"/>',results:'<path d="M5 21V10M12 21V4M19 21v-7"/>',marks:'<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>',notices:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
leaves:'<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2v4M16 2v4M4 10h16M9 15l2 2 4-4"/>',slots:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',idcard:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.6 1.8-2.2 3-2.2s2.4.6 3 2.2M14 10h4M14 13h3"/>',leave:'<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2v4M16 2v4M4 10h16M9 15l2 2 4-4"/>',cards:'<rect x="3" y="6" width="14" height="13" rx="2"/><path d="M7 6V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"/>',insights:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',study:'<path d="M4 19l5-6 4 3 7-9"/><path d="M15 7h5v5"/>',doubts:'<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 16.5v.01"/>',tests:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3h6v3H9zM9 13l2 2 4-4"/>',notes:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5"/>',homework:'<path d="M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>',attendance:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
enquiries:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 7l9 6 9-6"/>',certificates:'<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>',content:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
logs:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',settings:'<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'};
const icon=k=>'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(IC[k]||'<circle cx="12" cy="12" r="3"/>')+'</svg>';
// Install (PWA): har role ka apna manifest/scope hai (admin/, teacher/, student/). Sirf wahi app install hota hai.
let _ip=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();_ip=e;const b=document.getElementById('inst');if(b)b.hidden=false});
window.addEventListener('appinstalled',()=>{_ip=null;const b=document.getElementById('inst');if(b)b.hidden=true});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
const HOME={admin:'admin',teacher:'teacher',student:'student'};
async function loadBrand(){
 try{const r=await fetch('../content/site.json?v='+Date.now());if(r.ok){const o=await r.json();for(const k in (o.CFG||{}))if(k!=='api')CFG[k]=o.CFG[k];window.__PH=o.PH||{}}}catch(e){}
 if(typeof applyTheme==='function')applyTheme()}
const logoUrl=()=>{let l=CFG.logo||'';l=(window.__PH&&window.__PH[l])||l;return /^uploads\//.test(l)?'../'+l:(/^https:\/\//.test(l)?l:'')};
const saveShell=u=>{try{const c={};for(const k in CFG)if(k!=='api'&&typeof CFG[k]!=='function')c[k]=CFG[k];localStorage.setItem('sp_shell',JSON.stringify({u:{userId:u.userId,name:u.name,role:u.role},cfg:c,ph:window.__PH||{}}))}catch(e){}};
async function initShell(role,page,phase){
 applyI18n();
 // Cache hai to header/menu/nav turant dikhao (network ka intezaar nahi); login check background mein
 let cu=null;try{const c=JSON.parse(localStorage.getItem('sp_shell')||'null');if(c&&c.u&&c.u.role===role&&TOK.get()){cu=c.u;for(const k in c.cfg)CFG[k]=c.cfg[k];window.__PH=c.ph||{};if(typeof applyTheme==='function')applyTheme()}}catch(e){}
 if(cu){window.__U=cu;paint(role,page,cu,phase);
  (async()=>{try{await loadBrand();const r=await api('me');
   if(r.ok){if(r.user.role!==role)location.href='../'+HOME[r.user.role]+'/index.html';else{saveShell(r.user);if(r.user.userId!==cu.userId)location.reload()}}
   else if(r.error==='Session expired. Please login again.'){TOK.clear();location.href='../login.html'}}catch(e){}})();
  return cu}
 await loadBrand();
 let r;const retry=()=>{document.body.innerHTML='<div style="min-height:100vh;display:grid;place-items:center;text-align:center;padding:24px;font-family:sans-serif"><div><p style="font-size:17px">Connection problem. Your login is safe.</p><button onclick="location.reload()" style="padding:12px 26px;border:0;border-radius:999px;background:#111;color:#fff;font-size:16px">Try again</button></div></div>'};
 try{r=await api('me')}catch(e){retry();return}
 if(!r.ok){if(r.error==='Session expired. Please login again.'){TOK.clear();location.href='../login.html'}else retry();return}
 const u=r.user;window.__U=u;
 if(u.role!==role){location.href='../'+HOME[u.role]+'/index.html';return}
 saveShell(u);paint(role,page,u,phase);return u}
function paint(role,page,u,phase){
 const nav=NAV[role].map(([p,k])=>'<a href="'+p+'.html"'+(p===page?' class="on"':'')+'>'+icon(k)+'<span data-i="n_'+k+'"></span></a>').join('');
 document.getElementById('shell').innerHTML=
  '<header><a class="brand" href="index.html">'+(logoUrl()?'<img src="'+logoUrl()+'" alt="">':'<span class="lm">'+((CFG.shortName||'S').trim().charAt(0))+'</span>')+'<span class="bn">'+(typeof SN==='function'?SN():CFG.name)+'</span></a><span class="sp"></span><button id="um" class="um" aria-label="Menu" aria-expanded="false"></button>'+
  '<div id="umenu" class="umenu" hidden style="display:none"><div class="up">'+AV.html(AV.get(u.userId,u.name),'')+'<div><b>'+u.name+'</b><small data-i="role_'+u.role+'"></small></div></div>'+
  (role==='student'?'<a href="profile.html">'+icon('profile')+'My profile</a>':'')+'<button id="chav">'+icon('profile')+'Change avatar</button><a href="settings.html">'+icon('settings')+'Settings</a>'+
  '<button id="inst" hidden>'+icon('dashboard')+'Install app</button><a href="../index.html">'+icon('content')+'Visit website</a><hr><button id="lo" class="out"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Logout</button></div></header>'+
  '<div class="wrap"><nav>'+nav+'</nav><main id="main"><div id="skm1" class="sk-m"><i class="sk sk-t"></i><div class="sk-g"><i class="sk"></i><i class="sk"></i><i class="sk"></i><i class="sk"></i></div><i class="sk sk-w"></i><i class="sk sk-w"></i></div></main></div>';
 {const mm=document.getElementById('main');new MutationObserver(()=>{const k=document.getElementById('skm1');if(k&&mm.children.length>1)k.remove()}).observe(mm,{childList:true})}
 const um=document.getElementById('um'),mn=document.getElementById('umenu');um.onclick=e=>{e.stopPropagation();const o=mn.hidden;mn.hidden=!o;mn.style.display=o?'block':'none';um.setAttribute('aria-expanded',o)};document.addEventListener('click',e=>{if(!mn.contains(e.target)&&e.target!==um){mn.hidden=true;mn.style.display='none';um.setAttribute('aria-expanded',false)}});
 document.getElementById('chav').onclick=()=>{mn.hidden=true;mn.style.display='none';const cur=AV.get(u.userId,u.name),o=document.createElement('div');o.className='avm';o.innerHTML='<div class="avb"><div class="avh"><b>Choose your avatar</b><button type="button" class="avx" aria-label="Close">×</button></div><div class="avg">'+Array.from({length:AV.count},(_,i)=>'<button type="button" data-i="'+i+'" class="'+(i===cur?'on':'')+'">'+AV.svg(i)+'</button>').join('')+'</div></div>';document.body.append(o);o.onclick=e=>{if(e.target===o||e.target.classList.contains('avx'))o.remove();const b=e.target.closest('button[data-i]');if(b){AV.set(u.userId,+b.dataset.i);location.reload()}}};
 document.getElementById('lo').onclick=async()=>{try{await api('logout')}catch(e){}TOK.clear();location.href='../login.html'};
 const ib=document.getElementById('inst');if(ib){ib.hidden=!_ip;ib.onclick=async()=>{if(!_ip)return;_ip.prompt();await _ip.userChoice;_ip=null;ib.hidden=true}}
 applyI18n();
 const m=document.getElementById('main');
 if(typeof initAI==='function')initAI(role,u);
 if(!phase)return;
 m.innerHTML='<h1 data-i="n_'+(NAV[role].find(x=>x[0]===page)||[0,page])[1]+'"></h1><p class="mu"><span data-i="soon"></span> Phase '+phase+'</p>';
 applyI18n();
 }
