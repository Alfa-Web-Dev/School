// Student portal pages + sab roles ke liye "PIN/Password badlo" (settings)
const rupee=n=>(Number(n)<0?'-':'')+'₹'+Math.abs(Number(n||0)).toLocaleString('en-IN');
const safeUrl=u=>/^https?:\/\//i.test(u)?u:'';
function page(key,title){const m=$('#main');m.innerHTML='';m.append(el('h1',{'data-i':key},title||''));applyI18n();return m}
const stat=(l,v,sub)=>el('div',{class:'card stat'},el('div',{class:'big'},v),el('div',{class:'mu'},l),sub?el('div',{class:'mu'},sub):'');
const badge=s=>el('span',{class:'bdg '+(s==='P'?'ok':s==='A'?'no':'lt')},s==='P'?'Present':s==='A'?'Absent':s==='L'?'Late':s);

async function initSDash(){
 const m=page('n_dashboard'),r=await call('myDashboard'),p=r.profile;
 m.append(el('p',{class:'mu'},p.name+' · '+p.className+(p.roll?' · Roll '+p.roll:'')),
  el('div',{class:'grid'},stat('Attendance',r.attendance.percent+'%',r.attendance.present+r.attendance.late+'/'+r.attendance.total+' din'),
   stat('Fee balance',rupee(r.fees.balance),'Paid '+rupee(r.fees.totalPaid)),stat('Class',p.className,p.classTeacher?'Teacher: '+p.classTeacher:'')),
  el('h3',{},'Aaj ki classes'),tableEl([{h:'Time',f:l=>l.start+' - '+l.end},{h:'Subject',f:l=>l.subject},{h:'Teacher',f:l=>l.teacher}],r.today,'Aaj koi class nahi'),
  el('h3',{},'Latest notices'),noticeList(r.notices))}
function noticeList(n){return n.length?el('div',{},n.map(x=>el('div',{class:'card',style:'max-width:none;margin-bottom:8px'},el('b',{},x.title),' ',el('span',{class:'mu'},x.date+(x.forAll?' · All':'')),el('p',{},x.text)))):el('p',{class:'mu'},'Koi notice nahi')}
async function initSProfile(){
 const m=page('n_profile'),p=(await call('myProfile')).profile;
 m.append(tableEl([{h:'',f:r=>el('b',{},r[0])},{h:'',f:r=>r[1]||'-'}],[['Name',p.name],['Student ID',p.studentId],['Admission no',p.admNo],['Class',p.className],['Roll no',p.roll],['Class teacher',p.classTeacher],
  ['Gender',p.gender],['Date of birth',p.dob],['Parent',p.parentName],['Parent phone',p.parentPhone],['Address',p.address]]))}
async function initSAtt(){
 const m=page('n_attendance'),r=await call('myAttendance');
 m.append(el('div',{class:'grid'},stat('Attendance',r.percent+'%','Late = present'),stat('Present',r.present),stat('Absent',r.absent),stat('Late',r.late)),
  el('h3',{},'Din-wise'),tableEl([{h:'Date',f:x=>x.date},{h:'Status',f:x=>badge(x.status)}],r.rows,'Abhi attendance nahi lagi'))}
async function initSFees(){
 const m=page('n_fees'),r=await call('myFees');
 m.append(el('p',{class:'mu'},'Session '+r.year),el('div',{class:'grid'},stat('Total due',rupee(r.totalDue)),stat('Paid',rupee(r.totalPaid)),stat('Balance',rupee(r.balance))),
  el('h3',{},'Fee details'),tableEl([{h:'Fee',f:x=>x.feeType},{h:'Amount',f:x=>rupee(x.amount)+(x.dueMonth==='monthly'?' /month':'')},{h:'Due so far',f:x=>rupee(x.due)},{h:'Paid',f:x=>rupee(x.paid)},{h:'Balance',f:x=>rupee(x.balance)}],r.lines,'Fee structure set nahi hai'),
  el('h3',{},'Payments / Receipts'),tableEl([{h:'Receipt',f:x=>el('a',{href:'../receipt.html?no='+encodeURIComponent(x.receiptNo),target:'_blank',rel:'noopener'},x.receiptNo)},{h:'Date',f:x=>x.date},{h:'Fee',f:x=>x.feeType},{h:'Amount',f:x=>rupee(x.amount)},{h:'Mode',f:x=>x.mode}],r.payments,'Abhi koi payment nahi'));
 upiBlock(m,r)}
async function initSResults(){
 const m=page('n_results'),r=await call('myResults');
 if(!r.exams.length)m.append(el('p',{class:'mu'},'Abhi result nahi aaya'));
 r.exams.forEach(e=>m.append(el('h3',{},e.title+' · '+e.date),tableEl([{h:'Subject',f:x=>x.subject},{h:'Marks',f:x=>x.marks+' / '+x.max},{h:'Grade',f:x=>x.grade}],e.rows),
  el('p',{},el('b',{},'Total: '+e.total+' / '+e.max+' ('+e.percent+'%) · Grade '+e.grade+' · Rank '+e.rank+' · '+(e.pass?'Pass':'Fail'))),
  el('p',{},el('a',{href:'../reportcard.html?exam='+encodeURIComponent(e.examId),target:'_blank',rel:'noopener'},'Report card (PDF / Print)'))))}
async function initSTime(){
 const m=page('n_timetable'),r=await call('myTimetable');
 if(!r.lessons.length)m.append(el('p',{class:'mu'},'Timetable abhi set nahi hai'));
 DAYS_UI.forEach(d=>{const ls=r.lessons.filter(l=>l.day===d);if(ls.length)m.append(el('h3',{},d),tableEl([{h:'Time',f:l=>l.start+' - '+l.end},{h:'Subject',f:l=>l.subject},{h:'Teacher',f:l=>l.teacher}],ls))})}
const DAYS_UI=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
async function initSHome(){
 const m=page('n_homework'),r=await call('myHomework');
 m.append(tableEl([{h:'Due',f:x=>x.due},{h:'Subject',f:x=>x.subject},{h:'Homework',f:x=>x.title},{h:'By',f:x=>x.by},{h:'Link',f:x=>safeUrl(x.link)?el('a',{href:x.link,target:'_blank',rel:'noopener'},'Open'):''}],r.homework,'Abhi koi homework nahi'))}
async function initSNotices(){const m=page('n_notices'),r=await call('myNotices');m.append(noticeList(r.notices))}
async function initSettings(){
 const m=page('n_settings'),isS=location.pathname.indexOf('/student/')>=0;
 const f=el('div',{class:'card',style:'max-width:420px'});
 const o=el('input',{type:'password',placeholder:isS?'Purana PIN':'Purana password'}),n=el('input',{type:'password',placeholder:isS?'Naya PIN (4-8 digits)':'Naya password (8+ akshar)'}),c=el('input',{type:'password',placeholder:'Naya dobara'}),msg=el('div',{class:'err'});
 f.append(el('label',{},isS?'Purana PIN':'Purana password'),o,el('label',{},isS?'Naya PIN':'Naya password'),n,el('label',{},'Confirm'),c,
  el('button',{type:'button',onclick:async()=>{msg.style.color='';msg.textContent='';
   try{if(n.value!==c.value)throw new Error('Dono naye alag hain');await call('changeSecret',{oldSecret:o.value,newSecret:n.value});o.value=n.value=c.value='';msg.style.color='#16a34a';msg.textContent='Badal gaya'}
   catch(e){msg.textContent=e.message}}},'Save'),msg);
 m.append(f)}

// UPI QR (optional): config.js mein upi.id bharo. Payment admin haath se confirm karta hai.
function upiLink(bal,sid){const u=CFG.upi||{};return 'upi://pay?pa='+encodeURIComponent(u.id)+'&pn='+encodeURIComponent(u.name||CFG.name)+'&am='+Number(bal).toFixed(2)+'&cu=INR&tn='+encodeURIComponent('Fee '+sid)}
function upiBlock(m,r){
 if(!(CFG.upi&&CFG.upi.id)||!(r.balance>0)||typeof qrSvg!=='function')return;
 const sid=r.studentId||'',link=upiLink(r.balance,sid),q=el('div');q.innerHTML=qrSvg(link,200);
 m.append(el('h3',{},'UPI se payment'),el('div',{class:'upi'},q,el('div',{},el('p',{},'Baaki: '+rupee(r.balance)),el('a',{class:'btnlink',href:link},'UPI app mein kholo'),
  el('p',{class:'mu'},'QR scan karo ya button dabao. Payment ke baad school office ko batao; receipt tab milegi jab office payment confirm kar degi.'))))}
