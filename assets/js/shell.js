// Role panels ka common layout + login guard. Use: initShell('admin','students')
const NAV={"admin": [["index", "dashboard"], ["students", "students"], ["teachers", "teachers"], ["classes", "classes"], ["timetable", "timetable"], ["fees", "fees"], ["exams", "exams"], ["notices", "notices"], ["notes", "notes"], ["enquiries", "enquiries"], ["certificates", "certificates"], ["content", "content"], ["logs", "logs"], ["settings", "settings"]], "teacher": [["index", "dashboard"], ["attendance", "attendance"], ["marks", "marks"], ["results", "results"], ["homework", "homework"], ["notes", "notes"], ["classes", "classes"], ["timetable", "timetable"], ["notices", "notices"], ["settings", "settings"]], "student": [["index", "dashboard"], ["profile", "profile"], ["attendance", "attendance"], ["fees", "fees"], ["results", "results"], ["timetable", "timetable"], ["homework", "homework"], ["notes", "notes"], ["notices", "notices"], ["settings", "settings"]]};
const IC={dashboard:'<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',students:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
teachers:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14a5 5 0 0 1 5 5"/>',classes:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
timetable:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',fees:'<rect x="2" y="6" width="20" height="14" rx="3"/><path d="M2 11h20M16 15h2"/>',
exams:'<path d="M5 21V10M12 21V4M19 21v-7"/>',results:'<path d="M5 21V10M12 21V4M19 21v-7"/>',marks:'<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>',notices:'<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
notes:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5"/>',homework:'<path d="M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>',attendance:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
enquiries:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 7l9 6 9-6"/>',certificates:'<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>',content:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
logs:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',settings:'<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'};
const icon=k=>'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+(IC[k]||'<circle cx="12" cy="12" r="3"/>')+'</svg>';
const HOME={admin:'admin',teacher:'teacher',student:'student'};
async function initShell(role,page,phase){
 applyI18n();
 let r;try{r=await api('me')}catch(e){location.href='../login.html';return}
 if(!r.ok){location.href='../login.html';return}
 const u=r.user,ok=(u.role===role);
 if(!ok){location.href='../'+HOME[u.role]+'/index.html';return}
 const nav=NAV[role].map(([p,k])=>'<a href="'+p+'.html"'+(p===page?' class="on"':'')+'>'+icon(k)+'<span data-i="n_'+k+'"></span></a>').join('');
 document.getElementById('shell').innerHTML=
  '<header><b class="brand">'+CFG.shortName+'</b><span class="sp"></span><span class="uchip"><span class="av">'+(u.name||'?').trim().charAt(0).toUpperCase()+'</span><span class="un">'+u.name+'</span></span>'+
  '<button class="g s" id="lg">'+(getLang()==='hi'?'EN':'हिं')+'</button><button class="g s" id="lo" data-i="logout"></button></header>'+
  '<div class="wrap"><nav>'+nav+'</nav><main id="main"></main></div>';
 document.getElementById('lg').onclick=()=>{setLang(getLang()==='hi'?'en':'hi');location.reload()};
 document.getElementById('lo').onclick=async()=>{try{await api('logout')}catch(e){}sessionStorage.clear();location.href='../login.html'};
 applyI18n();
 const m=document.getElementById('main');
 if(!phase)return u;
 m.innerHTML='<h1 data-i="n_'+(NAV[role].find(x=>x[0]===page)||[0,page])[1]+'"></h1><p class="mu"><span data-i="soon"></span> Phase '+phase+'</p>';
 applyI18n();
 return u}
