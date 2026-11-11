// Student portal (Phase 3): student sirf apni hi data dekh sakta hai. changeSecret sab roles ke liye.
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],TZ='Asia/Kolkata';
const dstr=v=>v instanceof Date?Utilities.formatDate(v,TZ,'yyyy-MM-dd'):String(v==null?'':v).slice(0,10);
function stu(b){const s=guard(b,['student']);if(!s)return null;
 const r=find('Students',x=>String(x.studentId)===s.userId&&String(x.status).toLowerCase()==='active');return r||null}
function nameMap(n,k){const m={};table(n).rows.forEach(r=>m[String(r[k])]=r.name);return m}

function profileOf(r){
 const cl=find('Classes',c=>String(c.classId)===String(r.classId))||{},tn=cl.classTeacherId?nameMap('Users','userId')[String(cl.classTeacherId)]:'';
 return{studentId:String(r.studentId),admNo:String(r.admNo),name:r.name,classId:String(r.classId),className:cl.name||String(r.classId),roll:String(r.roll),
  gender:r.gender,dob:dstr(r.dob),parentName:r.parentName,parentPhone:String(r.parentPhone||''),address:r.address,classTeacher:tn||''}}

function attOf(sid){
 const byDate={};table('Attendance').rows.forEach(r=>{if(String(r.studentId)===sid)byDate[dstr(r.date)]=String(r.status).toUpperCase()});  // latest row jeetti hai
 const rows=Object.keys(byDate).map(d=>({date:d,status:byDate[d]}));
 rows.sort((a,b)=>a.date<b.date?1:-1);
 const c={P:0,A:0,L:0};rows.forEach(r=>{if(c[r.status]!==undefined)c[r.status]++});
 const total=c.P+c.A+c.L;
 return{rows,present:c.P,absent:c.A,late:c.L,total,percent:total?Math.round((c.P+c.L)*1000/total)/10:0}}  // late = present maana

// Fee hisaab: monthly fee = amount x (session start se ab tak ke mahine); one-time fee = due month aane par. Payments mein negative (void) rows bhi judti hain.
function feeCtx(){
 const now=new Date(),yr=find('AcademicYears',y=>String(y.current).toUpperCase()==='TRUE')||{},start=dstr(yr.start)||(now.getFullYear()+'-04-01');
 const ny=Number(Utilities.formatDate(now,TZ,'yyyy')),nm=Number(Utilities.formatDate(now,TZ,'MM'));
 return{start,year:yr.name||'',curYM:Utilities.formatDate(now,TZ,'yyyy-MM'),
  months:Math.max(0,Math.min(12,(ny-Number(start.slice(0,4)))*12+(nm-Number(start.slice(5,7)))+1)),
  structure:table('FeeStructure').rows,pays:table('Payments').rows}}
function feesOfCtx(r,c){
 const sid=String(r.studentId),cid=String(r.classId);
 const pays=c.pays.filter(p=>String(p.studentId)===sid&&dstr(p.date)>=c.start)
  .map(p=>({receiptNo:String(p.receiptNo),feeType:String(p.feeType),amount:Number(p.amount)||0,mode:String(p.mode),date:dstr(p.date)}));
 pays.sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:(a.receiptNo<b.receiptNo?1:-1));
 const lines=c.structure.filter(f=>String(f.classId)===cid).map(f=>{
  const amt=Number(f.amount)||0,dm=String(f.dueMonth),type=String(f.feeType);
  const due=dm==='monthly'?amt*c.months:(/^\d{4}-\d{2}$/.test(dm)&&dm<=c.curYM?amt:0);
  const paid=Math.round(pays.filter(p=>p.feeType===type).reduce((a,p)=>a+p.amount,0)*100)/100;
  return{feeType:type,amount:amt,dueMonth:dm,due,paid,balance:Math.round((due-paid)*100)/100}});
 const sum=k=>Math.round(lines.reduce((a,l)=>a+l[k],0)*100)/100;
 return{lines,payments:pays,totalDue:sum('due'),totalPaid:sum('paid'),balance:sum('balance'),year:c.year}}
function feesOf(r){return feesOfCtx(r,feeCtx())}

function noticesOf(r){
 return table('ClassNotices').rows.filter(n=>String(n.classId)==='ALL'||String(n.classId)===String(r.classId))
  .map(n=>({id:String(n.id),title:n.title,text:n.text,date:dstr(n.date),forAll:String(n.classId)==='ALL'})).sort((a,b)=>a.date<b.date?1:-1)}

function lessonsOf(r){
 const sn=nameMap('Subjects','subjectId'),tn=nameMap('Users','userId');
 return table('Lessons').rows.filter(l=>String(l.classId)===String(r.classId)).map(l=>({day:String(l.day),start:String(l.start),end:String(l.end),
  subject:sn[String(l.subjectId)]||String(l.subjectId),teacher:tn[String(l.teacherId)]||''}))
  .sort((a,b)=>(DAYS.indexOf(a.day)-DAYS.indexOf(b.day))||(a.start<b.start?-1:1))}

function myDashboard(b){const r=stu(b);if(!r)return DENIED;
 const a=attOf(String(r.studentId)),f=feesOf(r),today=Utilities.formatDate(new Date(),TZ,'EEE');
 return{ok:true,profile:profileOf(r),attendance:{percent:a.percent,total:a.total,present:a.present,absent:a.absent,late:a.late},
  fees:{balance:f.balance,totalDue:f.totalDue,totalPaid:f.totalPaid},notices:noticesOf(r).slice(0,3),today:lessonsOf(r).filter(l=>l.day===today)}}
function myProfile(b){const r=stu(b);return r?{ok:true,profile:profileOf(r)}:DENIED}
function myAttendance(b){const r=stu(b);if(!r)return DENIED;const a=attOf(String(r.studentId));a.rows=a.rows.slice(0,400);return Object.assign({ok:true},a)}
function myFees(b){const r=stu(b);return r?Object.assign({ok:true,studentId:String(r.studentId)},feesOf(r)):DENIED}
function myNotices(b){const r=stu(b);return r?{ok:true,notices:noticesOf(r)}:DENIED}
function myTimetable(b){const r=stu(b);return r?{ok:true,lessons:lessonsOf(r)}:DENIED}
function myHomework(b){const r=stu(b);if(!r)return DENIED;
 const sn=nameMap('Subjects','subjectId'),tn=nameMap('Users','userId');
 return{ok:true,homework:table('Assignments').rows.filter(a=>String(a.classId)===String(r.classId)).map(a=>({id:String(a.id),subject:sn[String(a.subjectId)]||String(a.subjectId),
  title:a.title,due:dstr(a.due),link:String(a.link||''),by:tn[String(a.by)]||''})).sort((x,y)=>x.due<y.due?1:-1)}}
function myResults(b){const r=stu(b);if(!r)return DENIED;
 const exams=[];table('Exams').rows.filter(e=>String(e.classId)===String(r.classId)).forEach(e=>{
  const x=examBoard(e).board[String(r.studentId)];if(!x||!x.rows.length)return;
  exams.push({examId:String(e.examId),title:e.title,date:dstr(e.date),rows:x.rows.map(y=>({subject:y.subject,marks:y.marks,max:y.max,grade:y.grade})),total:x.total,max:x.max,percent:x.percent,grade:x.grade,pass:x.pass,rank:x.rank})});
 exams.sort((a,b)=>a.date<b.date?1:-1);return{ok:true,exams}}

// Apna password/PIN badlo (admin, teacher, student sab). Student PIN: sirf digits, kam se kam 4.
function changeSecret(b){
 const s=guard(b);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const nw=String(b.newSecret||''),old=String(b.oldSecret||'');
  if(s.role==='student'){if(!/^\d{4,8}$/.test(nw))throw new Error('PIN 4 se 8 digits ka hona chahiye')}
  else if(nw.length<8||nw.length>64)throw new Error('Password kam se kam 8 akshar ka hona chahiye');
  const u=lookup(s.role,s.userId);if(!u||hashSecret(old,u.salt)!==u.hash)throw new Error('Purana password/PIN galat hai');
  const m=s.role==='student'?['Students','studentId','pinHash']:['Users','userId','passHash'],r=find(m[0],x=>String(x[m[1]])===s.userId);
  const f=setSecretFields(nw),o={salt:f.salt};o[m[2]]=f.hash;setRow(m[0],r._row,o);log(s.userId,'change_secret',s.role);
  return{ok:true}}))}
