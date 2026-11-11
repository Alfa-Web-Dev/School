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

function feesOf(r){
 const sid=String(r.studentId),cid=String(r.classId),now=new Date();
 const yr=find('AcademicYears',y=>String(y.current).toUpperCase()==='TRUE')||{},start=dstr(yr.start)||(now.getFullYear()+'-04-01');
 const ny=Number(Utilities.formatDate(now,TZ,'yyyy')),nm=Number(Utilities.formatDate(now,TZ,'MM')),curYM=Utilities.formatDate(now,TZ,'yyyy-MM');
 const months=Math.max(0,Math.min(12,(ny-Number(start.slice(0,4)))*12+(nm-Number(start.slice(5,7)))+1));
 const pays=table('Payments').rows.filter(p=>String(p.studentId)===sid&&(!start||dstr(p.date)>=start))
  .map(p=>({receiptNo:String(p.receiptNo),feeType:String(p.feeType),amount:Number(p.amount)||0,mode:p.mode,date:dstr(p.date)}));
 pays.sort((a,b)=>a.date<b.date?1:-1);
 const lines=table('FeeStructure').rows.filter(f=>String(f.classId)===cid).map(f=>{
  const amt=Number(f.amount)||0,dm=String(f.dueMonth),type=String(f.feeType);
  const due=dm==='monthly'?amt*months:(/^\d{4}-\d{2}$/.test(dm)&&dm<=curYM?amt:0);
  const paid=pays.filter(p=>p.feeType===type).reduce((a,p)=>a+p.amount,0);
  return{feeType:type,amount:amt,dueMonth:dm,due,paid,balance:due-paid}});
 const sum=k=>lines.reduce((a,l)=>a+l[k],0);
 return{lines,payments:pays,totalDue:sum('due'),totalPaid:sum('paid'),balance:sum('balance'),year:yr.name||''}}

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
function myFees(b){const r=stu(b);return r?Object.assign({ok:true},feesOf(r)):DENIED}
function myNotices(b){const r=stu(b);return r?{ok:true,notices:noticesOf(r)}:DENIED}
function myTimetable(b){const r=stu(b);return r?{ok:true,lessons:lessonsOf(r)}:DENIED}
function myHomework(b){const r=stu(b);if(!r)return DENIED;
 const sn=nameMap('Subjects','subjectId'),tn=nameMap('Users','userId');
 return{ok:true,homework:table('Assignments').rows.filter(a=>String(a.classId)===String(r.classId)).map(a=>({id:String(a.id),subject:sn[String(a.subjectId)]||String(a.subjectId),
  title:a.title,due:dstr(a.due),link:String(a.link||''),by:tn[String(a.by)]||''})).sort((x,y)=>x.due<y.due?1:-1)}}
function myResults(b){const r=stu(b);if(!r)return DENIED;
 const sn=nameMap('Subjects','subjectId'),sid=String(r.studentId),res=(()=>{const m={};table('Results').rows.forEach(x=>{if(String(x.studentId)===sid)m[x.examId+'|'+x.subjectId]=x});return Object.keys(m).map(k=>m[k])})();  // latest row jeetti hai
 const exams=table('Exams').rows.filter(e=>String(e.classId)===String(r.classId)).map(e=>{
  const rows=res.filter(x=>String(x.examId)===String(e.examId)).map(x=>({subject:sn[String(x.subjectId)]||String(x.subjectId),marks:Number(x.marks)||0,max:Number(e.maxMarks)||0}));
  const total=rows.reduce((a,x)=>a+x.marks,0),max=rows.reduce((a,x)=>a+x.max,0);
  return{examId:String(e.examId),title:e.title,date:dstr(e.date),rows,total,max,percent:max?Math.round(total*1000/max)/10:0}}).filter(e=>e.rows.length);
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
