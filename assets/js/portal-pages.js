// Student portal pages + sab roles ke liye "Change PIN/Password" (settings)
const rupee=n=>(Number(n)<0?'-':'')+'₹'+Math.abs(Number(n||0)).toLocaleString('en-IN');
const safeUrl=u=>/^https?:\/\//i.test(u)?u:'';
function page(key,title){const m=$('#main');m.innerHTML='';m.append(el('h1',{'data-i':key},title||''));
 const k=el('div',{id:'skm',class:'sk-m skp'});k.innerHTML='<div class="sk-g"><i class="sk"></i><i class="sk"></i><i class="sk"></i><i class="sk"></i></div><i class="sk sk-w"></i><i class="sk sk-w"></i>';m.append(k);
 const done=()=>{const x=document.getElementById('skm');if(x)x.remove()};
 window.__skDone=()=>{if(!window.__pend)done()};new MutationObserver(()=>{const x=document.getElementById('skm');if(x&&m.lastElementChild!==x)m.append(x)}).observe(m,{childList:true});setTimeout(done,12000);
 applyI18n();return m}
const stat=(l,v,sub)=>el('div',{class:'card stat'},el('div',{class:'big'},v),el('div',{class:'mu'},l),sub?el('div',{class:'mu'},sub):'');
const badge=s=>el('span',{class:'bdg '+(s==='P'?'ok':s==='A'?'no':'lt')},s==='P'?'Present':s==='A'?'Absent':s==='L'?'Late':s);


async function initSDash(){
 const m=page('n_dashboard'),r=await call('myDashboard'),p=r.profile;
 m.append(helloCard(p.name,p.studentId,p.className+(p.roll?' · Roll '+p.roll:'')),ringCard(r.attendance.percent,'Attendance',r.attendance.present+r.attendance.late+'/'+r.attendance.total+' din present'),quickActions([['attendance.html','attendance','Attendance','q0'],['fees.html','fees','Fees','q1'],['results.html','results','Results','q2'],['homework.html','homework','Homework','q3']]),
  el('div',{class:'grid'},
   stat('Fee balance',rupee(r.fees.balance),'Paid '+rupee(r.fees.totalPaid)),stat('Class',p.className,p.classTeacher?'Teacher: '+p.classTeacher:'')),
  el('h3',{},'Today\'s classes'),tableEl([{h:'Time',f:l=>l.start+' - '+l.end},{h:'Subject',f:l=>l.subject},{h:'Teacher',f:l=>l.teacher}],r.today,'No classes today'),
  el('h3',{},'Latest notices'),noticeList(r.notices))}
const TONES=['#d9f5e8','#e4dcfb','#fde5d6','#fbe0ee','#fff0bd','#d9e7ff'];
function feedCard(k,i,title,chip,body,extra){const c=el('div',{class:'fcard'}),b=el('span',{class:'fb',style:'background:var(--p'+(i%5+1)+')'});b.innerHTML=PA.mini(k);
 c.append(b,el('div',{class:'ft'},el('b',{},title),el('span',{class:'fc'},chip),body?el('p',{},body):'',extra||''));return c}
function noticeList(n){return n.length?el('div',{class:'flist'},n.map((x,i)=>feedCard('bell',i,x.title,x.date+(x.forAll?' · All':''),x.text))):emptyState('No notices','No notices')}
async function initSProfile(){
 const m=page('n_profile'),p=(await call('myProfile')).profile;
 m.append(tableEl([{h:'',f:r=>el('b',{},r[0])},{h:'',f:r=>r[1]||'-'}],[['Name',p.name],['Student ID',p.studentId],['Admission no',p.admNo],['Class',p.className],['Roll no',p.roll],['Class teacher',p.classTeacher],
  ['Gender',p.gender],['Date of birth',p.dob],['Parent',p.parentName],['Parent phone',p.parentPhone],['Address',p.address]]))}
async function initSAtt(){
 const m=page('n_attendance'),r=await call('myAttendance');
 m.append(ringCard(r.percent,'Attendance',(r.present+r.late)+' / '+r.total+' din (late = present)'),
  el('div',{class:'chips3'},el('div',{class:'pc ok'},el('b',{},String(r.present)),el('small',{},'Present')),el('div',{class:'pc lt'},el('b',{},String(r.late)),el('small',{},'Late')),el('div',{class:'pc no'},el('b',{},String(r.absent)),el('small',{},'Absent'))),
  calMonth(r.rows),el('h3',{},'Recent'),r.rows.length?el('div',{class:'recent'},r.rows.slice(0,10).map(x=>el('div',{class:'rr'},el('span',{},x.date),badge(x.status)))):emptyState('No attendance yet','Attendance is not marked yet'))}
async function initSFees(){
 const m=page('n_fees'),r=await call('myFees');
 m.append(el('p',{class:'mu'},'Session '+r.year),ringCard(r.totalDue?r.totalPaid*100/r.totalDue:100,'Fees paid',rupee(r.totalPaid)+' of '+rupee(r.totalDue)),el('div',{class:'grid'},stat('Total due',rupee(r.totalDue)),stat('Paid',rupee(r.totalPaid)),stat('Balance',rupee(r.balance))),
  el('h3',{},'Month-wise status'),monthGrid(r.months),el('h3',{},'Fee details'),tableEl([{h:'Fee',f:x=>x.feeType},{h:'Amount',f:x=>rupee(x.amount)+(x.dueMonth==='monthly'?' /month':'')},{h:'Due so far',f:x=>rupee(x.due)},{h:'Paid',f:x=>rupee(x.paid)},{h:'Balance',f:x=>rupee(x.balance)}],r.lines,'Fee structure is not set'),
  el('h3',{},'Payments / Receipts'),tableEl([{h:'Receipt',f:x=>el('a',{href:'../receipt.html?no='+encodeURIComponent(x.receiptNo),target:'_blank',rel:'noopener'},x.receiptNo)},{h:'Date',f:x=>x.date},{h:'Fee',f:x=>x.feeType},{h:'Amount',f:x=>rupee(x.amount)},{h:'Mode',f:x=>x.mode}],r.payments,'No payments yet'));
 upiBlock(m,r)}
async function initSResults(){
 const m=page('n_results'),r=await call('myResults');
 if(!r.exams.length)m.append(emptyState('No results yet','No result yet'));
 r.exams.forEach(e=>m.append(el('h3',{},e.title+' · '+e.date),el('div',{class:'chips3'},el('div',{class:'pc ok'},el('b',{},e.percent+'%'),el('small',{},'Percent')),el('div',{class:'pc lt'},el('b',{},String(e.grade)),el('small',{},'Grade')),el('div',{class:'pc no'},el('b',{},'#'+e.rank),el('small',{},'Rank'))),barChart(e.rows.map(x=>({l:x.subject,v:x.marks,pct:x.max?x.marks*100/x.max:0})),'Subject-wise marks'),tableEl([{h:'Subject',f:x=>x.subject},{h:'Marks',f:x=>x.marks+' / '+x.max},{h:'Grade',f:x=>x.grade}],e.rows),
  el('p',{},el('b',{},'Total: '+e.total+' / '+e.max+' ('+e.percent+'%) · Grade '+e.grade+' · Rank '+e.rank+' · '+(e.pass?'Pass':'Fail'))),
  el('p',{},el('a',{href:'../reportcard.html?exam='+encodeURIComponent(e.examId),target:'_blank',rel:'noopener'},'Report card (PDF / Print)'))))}
async function initSTime(){
 const m=page('n_timetable'),r=await call('myTimetable');
 if(!r.lessons.length)m.append(emptyState('Timetable not set','The timetable is not set yet'));else dayTimetable(m,r.lessons,l=>l.teacher||'')}
const DAYS_UI=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
async function initSHome(){
 const m=page('n_homework'),r=await call('myHomework');
 m.append(r.homework.length?el('div',{class:'flist'},r.homework.map((x,i)=>feedCard(PA.prop(x.subject,'notebook')==='chart'?'notebook':PA.prop(x.subject,'notebook'),i,x.title,'Due '+x.due,(x.subject||'')+(x.by?' · '+x.by:''),safeUrl(x.link)?el('a',{class:'fl',href:x.link,target:'_blank',rel:'noopener'},'Open link'):''))):emptyState('No homework','No homework yet'))}
async function initSNotices(){const m=page('n_notices'),r=await call('myNotices');m.append(noticeList(r.notices))}
async function initSettings(){
 const m=page('n_settings'),isS=location.pathname.indexOf('/student/')>=0;
 const f=el('div',{class:'card',style:'max-width:420px'});
 const o=el('input',{type:'password',placeholder:isS?'Old PIN':'Old password'}),n=el('input',{type:'password',placeholder:isS?'New PIN (4-8 digits)':'New password (8+ characters)'}),c=el('input',{type:'password',placeholder:'Confirm new'}),msg=el('div',{class:'err'});
 f.append(el('label',{},isS?'Old PIN':'Old password'),o,el('label',{},isS?'New PIN':'New password'),n,el('label',{},'Confirm'),c,
  el('button',{type:'button',onclick:async()=>{msg.style.color='';msg.textContent='';
   try{if(n.value!==c.value)throw new Error('The two new values do not match');await call('changeSecret',{oldSecret:o.value,newSecret:n.value});o.value=n.value=c.value='';msg.style.color='#16a34a';msg.textContent='Changed'}
   catch(e){msg.textContent=e.message}}},'Save'),msg);
 m.append(f);
 if(location.pathname.indexOf('/admin/')>=0)aiCard(m)}
async function aiCard(m){
 const c=el('div',{class:'card',style:'max-width:420px;margin-top:16px'}),msg=el('div',{class:'mu'});let r={on:true,name:'Tuto'};try{r=await call('aiGet')}catch(e){}
 const on=el('input',{type:'checkbox'}),nm=el('input',{type:'text',maxlength:'20',placeholder:'AI name'});on.checked=r.on;nm.value=r.name;
 c.append(el('h3',{},'AI assistant'),el('p',{class:'mu'},'Floating chat icon in admin, teacher and student panels.'),el('label',{style:'display:flex;gap:10px;align-items:center'},on,'AI assistant ON'),el('label',{},'AI name'),nm,
  el('button',{type:'button',onclick:async()=>{msg.style.color='';msg.textContent='';try{const x=await call('aiSave',{on:on.checked,name:nm.value});sessionStorage.removeItem('ai_cfg');msg.style.color='#16a34a';msg.textContent=x.on?'Saved: AI is ON':'Saved: AI is OFF (icon hidden everywhere)'}catch(e){msg.textContent=e.message}}},'Save'),msg);
 m.append(c)}

// UPI QR (optional): config.js mein upi.id bharo. Payment admin haath se confirm karta hai.
function upiLink(bal,sid){const u=CFG.upi||{};return 'upi://pay?pa='+encodeURIComponent(u.id)+'&pn='+encodeURIComponent(u.name||CFG.name)+'&am='+Number(bal).toFixed(2)+'&cu=INR&tn='+encodeURIComponent('Fee '+sid)}
function upiBlock(m,r){
 if(!(CFG.upi&&CFG.upi.id)||!(r.balance>0)||typeof qrSvg!=='function')return;
 const sid=r.studentId||'',link=upiLink(r.balance,sid),q=el('div');q.innerHTML=qrSvg(link,200);
 m.append(el('h3',{},'Pay via UPI'),el('div',{class:'upi'},q,el('div',{},el('p',{},'Baaki: '+rupee(r.balance)),el('a',{class:'btnlink',href:link},'Open in UPI app'),
  el('p',{class:'mu'},'Scan the QR or tap the button to pay. Tell the school office after paying; your receipt appears once the office confirms the payment.'))))}
