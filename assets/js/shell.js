// Role panels ka common layout + login guard. Use: initShell('admin','students')
const NAV={"admin": [["index", "dashboard"], ["students", "students"], ["teachers", "teachers"], ["classes", "classes"], ["timetable", "timetable"], ["fees", "fees"], ["exams", "exams"], ["notices", "notices"], ["notes", "notes"], ["enquiries", "enquiries"], ["certificates", "certificates"], ["content", "content"], ["logs", "logs"], ["settings", "settings"]], "teacher": [["index", "dashboard"], ["attendance", "attendance"], ["marks", "marks"], ["results", "results"], ["homework", "homework"], ["notes", "notes"], ["classes", "classes"], ["timetable", "timetable"], ["notices", "notices"], ["settings", "settings"]], "student": [["index", "dashboard"], ["profile", "profile"], ["attendance", "attendance"], ["fees", "fees"], ["results", "results"], ["timetable", "timetable"], ["homework", "homework"], ["notes", "notes"], ["notices", "notices"], ["settings", "settings"]]};
const HOME={admin:'admin',teacher:'teacher',student:'student'};
async function initShell(role,page,phase){
 applyI18n();
 let r;try{r=await api('me')}catch(e){location.href='../login.html';return}
 if(!r.ok){location.href='../login.html';return}
 const u=r.user,ok=(u.role===role);
 if(!ok){location.href='../'+HOME[u.role]+'/index.html';return}
 const nav=NAV[role].map(([p,k])=>'<a href="'+p+'.html"'+(p===page?' class="on"':'')+' data-i="n_'+k+'"></a>').join('');
 document.getElementById('shell').innerHTML=
  '<header><b>'+CFG.shortName+'</b><span class="sp"></span><span class="mu">'+u.name+'</span>'+
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
