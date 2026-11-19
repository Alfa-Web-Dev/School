const VERSION='0.5.2';
const P=PropertiesService.getScriptProperties();
const SCHEMA={
 Settings:['key','value'],
 AcademicYears:['yearId','name','start','end','current'],
 Users:['userId','name','role','phone','email','passHash','salt','active'],
 Students:['studentId','admNo','name','classId','roll','gender','dob','parentName','parentPhone','address','pinHash','salt','status'],
 Classes:['classId','name','grade','section','classTeacherId'],
 Subjects:['subjectId','name'],
 Lessons:['lessonId','classId','subjectId','teacherId','day','start','end'],
 Attendance:['date','classId','studentId','status','markedBy'],
 Exams:['examId','title','classId','date','maxMarks'],
 Results:['examId','studentId','subjectId','marks'],
 Assignments:['id','classId','subjectId','title','due','link','by'],
 FeeStructure:['classId','feeType','amount','dueMonth'],
 Payments:['receiptNo','studentId','feeType','amount','mode','date','receivedBy'],
 ClassNotices:['id','classId','title','text','date'],
 Enquiries:['id','name','phone','message','time','status','type','role','email','details'],
 Tokens:['tokenHash','userId','role','expires'],
 Notes:['noteId','classId','subjectId','chapter','title','fileId','mime','size','uploadedBy','date','category'],
 Questions:['qid','classId','subjectId','chapter','text','a','b','c','d','correct','explain','difficulty','createdBy','date','type','marks','keyAns'],
 Tests:['testId','title','classId','subjectId','mode','durationMin','start','end','marksPer','negative','proctor','shuffle','qids','status','createdBy','date','instructions','reveal'],
 Attempts:['attemptId','testId','studentId','startedAt','submittedAt','answers','order','score','total','correct','wrong','skipped','status','strikes','flags','grades','pending'],
 Doubts:['doubtId','studentId','classId','subjectId','chapter','question','aiAnswer','status','teacherAnswer','answeredBy','date','answeredAt'],
 Flashcards:['cardId','classId','subjectId','chapter','front','back','createdBy','date'],
 CardProgress:['studentId','key','box','due','last'],
 Violations:['id','attemptId','testId','studentId','time','type','detail','photoId'],
 Logs:['time','userId','action','details']
};
const out=o=>ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
// Sheet na mile (naye features) to header ke saath apne aap ban jati hai
function ensureSheet(n){const h=SCHEMA[n];if(!h)return null;const ss=SpreadsheetApp.getActive(),s=ss.getSheetByName(n)||ss.insertSheet(n);
 if(s.getLastRow()===0){s.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold');s.setFrozenRows(1)}return s}
const _mig={},MIGRATE=['Questions','Tests','Attempts'];
// Purani sheet me naye columns aaye to unke header apne aap jud jaate hain (data wahi rehta hai)
function tab(n){const s=SpreadsheetApp.getActive().getSheetByName(n)||ensureSheet(n);
 if(!_mig[n]&&s&&SCHEMA[n]&&MIGRATE.indexOf(n)>=0&&s.getLastRow()>0){_mig[n]=1;const h=SCHEMA[n],cur=s.getRange(1,1,1,Math.max(s.getLastColumn(),1)).getValues()[0].map(String);
  for(let i=0;i<h.length;i++)if(!cur[i])s.getRange(1,i+1).setValue(h[i]).setFontWeight('bold')}
 return s}
function table(n){const v=tab(n).getDataRange().getValues(),h=v.shift().map(String);
 return{h,rows:v.map((r,i)=>{const o={_row:i+2};h.forEach((k,j)=>o[k]=r[j]);return o})}}
const find=(n,fn)=>table(n).rows.find(fn);
function log(uid,action,details){tab('Logs').appendRow([new Date(),uid||'',action,details||''])}

const SESSION_HOURS=24*30,MAX_FAILS=5,LOCK_SEC=900;
const sha=s=>Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s,Utilities.Charset.UTF_8).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');
const newSalt=()=>Utilities.getUuid().replace(/-/g,'');
const hashSecret=(secret,salt)=>sha(salt+'|'+P.getProperty('PEPPER')+'|'+secret);
function setSecretFields(secret){const salt=newSalt();return{salt,hash:hashSecret(secret,salt)}}

function lookup(role,id){
 const lc=String(id).toLowerCase(),on=v=>v===true||String(v).toUpperCase()==='TRUE';
 if(role==='admin'||role==='teacher'){
  const r=find('Users',r=>String(r.userId).toLowerCase()===lc&&r.role===role);
  return r&&{userId:String(r.userId),name:r.name,role,salt:String(r.salt),hash:String(r.passHash),active:on(r.active)}}
 if(role==='student'){
  const r=find('Students',r=>String(r.studentId).toLowerCase()===lc);
  return r&&{userId:String(r.studentId),name:r.name,role,salt:String(r.salt),hash:String(r.pinHash),active:String(r.status).toLowerCase()==='active'}}
 return null}

function login(b){
 const role=String(b.role||''),id=String(b.id||'').trim(),secret=String(b.secret||'');
 const key='fail:'+role+':'+id.toLowerCase(),cache=CacheService.getScriptCache();
 if(Number(cache.get(key)||0)>=MAX_FAILS)return{ok:false,error:'Too many wrong attempts. Try again after 15 minutes.'};
 const u=lookup(role,id);
 if(!(u&&u.active&&hashSecret(secret,u.salt)===u.hash)){
  cache.put(key,String(Number(cache.get(key)||0)+1),LOCK_SEC);
  log(id,'login_fail',role);Utilities.sleep(800);
  return{ok:false,error:'Wrong ID or password.'}}
 cache.remove(key);
 const token=Utilities.getUuid()+newSalt();
 tab('Tokens').appendRow([sha(token),u.userId,u.role,Date.now()+SESSION_HOURS*3600000]);
 log(u.userId,'login',role);
 return{ok:true,token,user:{userId:u.userId,name:u.name,role:u.role}}}

// Doosre modules yahi use karenge: const s=session(b.token,['admin']); if(!s) return denied
function session(token,roles){
 if(!token)return null;
 const r=find('Tokens',r=>String(r.tokenHash)===sha(String(token)));
 if(!r||Number(r.expires)<Date.now())return null;
 if(roles&&roles.indexOf(r.role)<0)return null;
 return{userId:String(r.userId),role:r.role}}

function me(b){
 const s=session(b.token);if(!s)return{ok:false,error:'Session expired. Please login again.'};
 const u=lookup(s.role,s.userId);
 return{ok:true,user:{userId:s.userId,role:s.role,name:u?u.name:''}}}

function logout(b){
 if(!b.token)return{ok:true};
 const r=find('Tokens',r=>String(r.tokenHash)===sha(String(b.token)));
 if(r)tab('Tokens').deleteRow(r._row);
 return{ok:true}}

function cleanTokens(){
 const s=tab('Tokens'),v=s.getDataRange().getValues(),now=Date.now();
 for(let i=v.length-1;i>=1;i--)if(Number(v[i][3])<now)s.deleteRow(i+1)}

// Core: sab modules ke common helpers (guard, lock, row read/write, id aur PIN banana)
const DENIED={ok:false,error:'Not allowed'};
const clean=(v,n)=>String(v==null?'':v).trim().slice(0,n||200);
const guard=(b,roles)=>session(b.token,roles);
function safe(fn){try{return fn()}catch(e){return{ok:false,error:String(e&&e.message||e)}}}
function withLock(fn){const l=LockService.getScriptLock();l.waitLock(20000);try{return fn()}finally{l.releaseLock()}}
function addRow(n,o){tab(n).appendRow(SCHEMA[n].map(k=>o[k]!==undefined?o[k]:''))}
function setRow(n,row,o){const h=SCHEMA[n],r=tab(n).getRange(row,1,1,h.length),cur=r.getValues()[0];
 r.setValues([h.map((k,i)=>o[k]!==undefined?o[k]:cur[i])])}
function nextId(n,col,prefix,pad){let m=0;
 table(n).rows.forEach(r=>{const x=String(r[col]);if(x.indexOf(prefix)===0){const v=parseInt(x.slice(prefix.length),10);if(v>m)m=v}});
 return prefix+String(m+1).padStart(pad,'0')}
function genPin(){return String(Math.floor(1000+Math.random()*9000))}
function genPassword(){const a='abcdefghjkmnpqrstuvwxyz23456789';let s='';for(let i=0;i<8;i++)s+=a[Math.floor(Math.random()*a.length)];return s}
function strip(o,keys){const c=Object.assign({},o);keys.concat(['_row']).forEach(k=>delete c[k]);return c}
function revokeTokens(userId){const s=tab('Tokens'),v=s.getDataRange().getValues();
 for(let i=v.length-1;i>=1;i--)if(String(v[i][1])===String(userId))s.deleteRow(i+1)}
function resolveClass(v){const x=clean(v,40).toLowerCase();
 const r=table('Classes').rows.find(c=>String(c.classId).toLowerCase()===x||String(c.name).toLowerCase()===x);
 return r?String(r.classId):''}
function teacherClassIds(uid){const ids={};
 table('Classes').rows.forEach(c=>{if(String(c.classTeacherId)===uid)ids[String(c.classId)]=1});
 table('Lessons').rows.forEach(l=>{if(String(l.teacherId)===uid)ids[String(l.classId)]=1});
 return ids}

// ---- Phase 4 helpers ----
const todayStr=()=>Utilities.formatDate(new Date(),'Asia/Kolkata','yyyy-MM-dd');
function addRows(n,list){if(!list.length)return;const h=SCHEMA[n],s=tab(n),start=s.getLastRow()+1,end=start+list.length-1;
 if(end>s.getMaxRows())s.insertRowsAfter(s.getMaxRows(),end-s.getMaxRows()+200);
 s.getRange(start,1,list.length,h.length).setValues(list.map(o=>h.map(k=>o[k]!==undefined?o[k]:'')))}
const canClass=(s,cid)=>s.role==='admin'||!!teacherClassIds(s.userId)[cid];
const isClassTeacher=(s,cid)=>{const c=find('Classes',x=>String(x.classId)===cid);return !!c&&String(c.classTeacherId)===s.userId};
function teachesSub(s,cid,sub){if(s.role==='admin'||isClassTeacher(s,cid))return true;
 return table('Lessons').rows.some(l=>String(l.classId)===cid&&String(l.subjectId)===sub&&String(l.teacherId)===s.userId)}
function activeStudents(cid){return table('Students').rows.filter(r=>String(r.classId)===cid&&String(r.status).toLowerCase()==='active')
 .sort((a,b)=>((parseInt(a.roll,10)||999)-(parseInt(b.roll,10)||999))||String(a.name).localeCompare(String(b.name)))}
const validDate=d=>/^\d{4}-\d{2}-\d{2}$/.test(d);
const validTime=t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t);

// Editor se chalao: pehle setupSheet(), phir createFirstAdmin()
function setupSheet(){
 const ss=SpreadsheetApp.getActive();
 Object.keys(SCHEMA).forEach(n=>{
  const s=ss.getSheetByName(n)||ss.insertSheet(n),h=SCHEMA[n];
  if(s.getLastRow()===0){s.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold');s.setFrozenRows(1)}
  h.forEach((k,i)=>{if(/hash|salt|id$|phone|admno|roll/i.test(k))s.getRange(1,i+1,s.getMaxRows(),1).setNumberFormat('@')})});
 const d=ss.getSheetByName('Sheet1');
 if(d&&d.getLastRow()===0&&ss.getSheets().length>1)ss.deleteSheet(d);
 if(!P.getProperty('PEPPER'))P.setProperty('PEPPER',newSalt()+newSalt());
 if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='cleanTokens'))
  ScriptApp.newTrigger('cleanTokens').timeBased().everyDays(1).create();
 Logger.log('Setup done. Version '+VERSION)}

// Script Properties me FIRST_ADMIN_ID, FIRST_ADMIN_PASSWORD, FIRST_ADMIN_NAME daal kar chalao
function createFirstAdmin(){
 const id=P.getProperty('FIRST_ADMIN_ID'),pw=P.getProperty('FIRST_ADMIN_PASSWORD'),name=P.getProperty('FIRST_ADMIN_NAME')||'Admin';
 if(!id||!pw)throw 'Set FIRST_ADMIN_ID and FIRST_ADMIN_PASSWORD in Script Properties';
 if(find('Users',r=>String(r.userId)===id))throw 'This admin already exists';
 const f=setSecretFields(pw);
 tab('Users').appendRow([id,name,'admin','','',f.hash,f.salt,true]);
 P.deleteProperty('FIRST_ADMIN_PASSWORD');
 Logger.log('Admin created. The password property was removed.')}

// Notes ke liye Drive folder (ek baar editor se chalao; pehli baar Drive permission maangega)
function setupDrive(){
 const old=P.getProperty('NOTES_FOLDER_ID');
 if(old){try{DriveApp.getFolderById(old);Logger.log('Notes folder already exists: '+old);return}catch(e){}}
 const f=DriveApp.createFolder('School Notes');P.setProperty('NOTES_FOLDER_ID',f.getId());
 Logger.log('Notes folder created: '+f.getUrl())}

function doGet(){return out({ok:true,version:VERSION})}
function doPost(e){
 try{
  const b=JSON.parse(e.postData.contents);
  switch(b.action){
   case 'ping':return out({ok:true,version:VERSION});
   case 'login':return out(login(b));
   case 'logout':return out(logout(b));
   case 'me':return out(me(b));
   default:{const fn=ROUTES[b.action];
    if(fn&&typeof globalThis[fn]==='function')return out(globalThis[fn](b));
    return out({ok:false,error:'Unknown action'})}}
 }catch(err){return out({ok:false,error:'Server error'})}}

// action -> function ka naam. Naye features yahin jodo.
const ROUTES={
 noteOptions:'noteOptions',listNotes:'listNotes',uploadNote:'uploadNote',updateNote:'updateNote',
 deleteNote:'deleteNote',deleteFee:'deleteFee',studentFees:'studentFees',voidPayment:'voidPayment',
 getReceipt:'getReceipt',defaulters:'defaulters',getMarks:'getMarks',deleteAssignment:'deleteAssignment',
 deleteLesson:'deleteLesson',deleteClassNotice:'deleteClassNotice',teacherHome:'teacherHome',resetSecret:'resetSecret',
 myDashboard:'myDashboard',myProfile:'myProfile',myAttendance:'myAttendance',myFees:'myFees',
 myResults:'myResults',myTimetable:'myTimetable',myHomework:'myHomework',myNotices:'myNotices',
 changeSecret:'changeSecret',listStudents:'listStudents',saveStudent:'saveStudent',importStudents:'importStudents',
 promoteStudents:'promoteStudents',listTeachers:'listTeachers',saveTeacher:'saveTeacher',listClasses:'listClasses',
 saveClass:'saveClass',saveSections:'saveSections',deleteClass:'deleteClass',saveSubject:'saveSubject',listLessons:'listLessons',
 saveLesson:'saveLesson',listClassNotices:'listClassNotices',saveClassNotice:'saveClassNotice',getAttendance:'getAttendance',
 markAttendance:'markAttendance',listAssignments:'listAssignments',saveAssignment:'saveAssignment',getFeeStructure:'getFeeStructure',
 saveFeeStructure:'saveFeeStructure',listPayments:'listPayments',addPayment:'addPayment',listExams:'listExams',
 issueCertificate:'issueCertificate',adminExams:'adminExams',deleteExam:'deleteExam',reportCard:'reportCard',
 saveExam:'saveExam',getResults:'getResults',saveMarks:'saveMarks',enquiry:'enquiry',
 listEnquiries:'listEnquiries',updateEnquiry:'updateEnquiry',dashboardStats:'dashboardStats',listLogs:'listLogs',
 backupNow:'backupNow',aiGet:'aiGet',aiSave:'aiSave',
 listQuestions:'listQuestions',saveQuestion:'saveQuestion',importQuestions:'importQuestions',deleteQuestion:'deleteQuestion',listTests:'listTests',saveTest:'saveTest',
 deleteTest:'deleteTest',testResults:'testResults',attemptDetail:'attemptDetail',gradeAttempt:'gradeAttempt',doubtOptions:'doubtOptions',askDoubt:'askDoubt',updateAiAnswer:'updateAiAnswer',closeDoubt:'closeDoubt',myDoubts:'myDoubts',listDoubts:'listDoubts',answerDoubt:'answerDoubt',myStudy:'myStudy',listCards:'listCards',saveCard:'saveCard',deleteCard:'deleteCard',importCards:'importCards',myDeck:'myDeck',reviewCards:'reviewCards',classInsights:'classInsights',violationPhoto:'violationPhoto',resetAttempt:'resetAttempt',myTests:'myTests',startTest:'startTest',
 saveProgress:'saveProgress',checkAnswer:'checkAnswer',submitTest:'submitTest',attemptReview:'attemptReview',reportViolation:'reportViolation'};

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
function feesOfCtx(r,c,wm){
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
 const out={lines,payments:pays,totalDue:sum('due'),totalPaid:sum('paid'),balance:sum('balance'),year:c.year};
 if(wm)out.months=monthsOf(lines,c);return out}
// Month-wise status: har fee type ka paid amount sabse purane month se bharte hue baant do (payment mein month nahi hota)
function monthsOf(lines,c){
 const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],sy=Number(c.start.slice(0,4)),sm=Number(c.start.slice(5,7));
 const list=[];for(let i=0;i<12;i++){const m=(sm-1+i)%12,y=sy+Math.floor((sm-1+i)/12);list.push({ym:y+'-'+String(m+1).padStart(2,'0'),label:MN[m]+' '+y,items:[]})}
 const by={};list.forEach(x=>by[x.ym]=x);
 lines.forEach(l=>{let rem=l.paid;const per=l.dueMonth==='monthly'?list.map(x=>x.ym):(by[l.dueMonth]?[l.dueMonth]:[]);
  per.forEach(ym=>{const take=Math.max(0,Math.min(rem,l.amount));rem=Math.round((rem-take)*100)/100;by[ym].items.push({feeType:l.feeType,due:l.amount,paid:Math.round(take*100)/100})})});
 return list.filter(x=>x.items.length).map(x=>{const due=x.items.reduce((a,i)=>a+i.due,0),paid=x.items.reduce((a,i)=>a+i.paid,0);
  const st=x.ym>c.curYM?'upcoming':(paid>=due?'paid':(paid>0?'partial':'due'));
  return{ym:x.ym,label:x.label,due:Math.round(due*100)/100,paid:Math.round(paid*100)/100,balance:Math.round((due-paid)*100)/100,status:st,items:x.items}})}
function feesOf(r){return feesOfCtx(r,feeCtx(),true)}

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
  if(s.role==='student'){if(!/^\d{4,8}$/.test(nw))throw new Error('PIN must be 4 to 8 digits')}
  else if(nw.length<8||nw.length>64)throw new Error('Password must be at least 8 characters');
  const u=lookup(s.role,s.userId);if(!u||hashSecret(old,u.salt)!==u.hash)throw new Error('The old password/PIN is wrong');
  const m=s.role==='student'?['Students','studentId','pinHash']:['Users','userId','passHash'],r=find(m[0],x=>String(x[m[1]])===s.userId);
  const f=setSecretFields(nw),o={salt:f.salt};o[m[2]]=f.hash;setRow(m[0],r._row,o);log(s.userId,'change_secret',s.role);
  return{ok:true}}))}

// Students (Phase 2): list, add/edit, CSV import, promote
function saveStudentCore(d,actor){
 const name=clean(d.name,80);if(!name)throw new Error('Name is required');
 const classId=resolveClass(d.classId);if(!classId)throw new Error('Class not found: '+clean(d.classId,30));
 const gender=clean(d.gender,1).toUpperCase();
 if(gender&&'MFO'.indexOf(gender)<0)throw new Error('Gender must be M/F/O');
 const dob=clean(d.dob,10);if(dob&&!/^\d{4}-\d{2}-\d{2}$/.test(dob))throw new Error('DOB format must be YYYY-MM-DD');
 const status=clean(d.status,15)||'active';
 const ex=d.studentId?find('Students',r=>String(r.studentId)===String(d.studentId)):null;
 if(d.studentId&&!ex)throw new Error('Student not found');
 const admNo=clean(d.admNo,20);
 if(admNo&&find('Students',r=>String(r.admNo)===admNo&&(!ex||r._row!==ex._row)))throw new Error('Admission no already exists: '+admNo);
 const o={name,classId,roll:clean(d.roll,10),gender,dob,parentName:clean(d.parentName,80),parentPhone:clean(d.parentPhone,15).replace(/[^\d+]/g,''),address:clean(d.address,200),status};
 if(ex){if(admNo)o.admNo=admNo;setRow('Students',ex._row,o);log(actor,'student_edit',ex.studentId);
  return{studentId:String(ex.studentId),pin:''}}
 const id=nextId('Students','studentId','S',3),pin=genPin(),f=setSecretFields(pin);
 o.studentId=id;o.admNo=admNo||String(new Date().getFullYear())+id.slice(1);o.pinHash=f.hash;o.salt=f.salt;
 addRow('Students',o);log(actor,'student_add',id);
 return{studentId:id,pin}}

function listStudents(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 const mine=s.role==='teacher'?teacherClassIds(s.userId):null;
 const students=table('Students').rows.filter(r=>!mine||mine[String(r.classId)]).map(r=>strip(r,['pinHash','salt']));
 const classes=table('Classes').rows.filter(c=>!mine||mine[String(c.classId)]).map(c=>strip(c,[]));
 return{ok:true,students,classes}}

function saveStudent(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>Object.assign({ok:true},saveStudentCore(b.student||{},s.userId))))}

function importStudents(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 const rows=Array.isArray(b.rows)?b.rows.slice(0,50):[];
 return withLock(()=>({ok:true,results:rows.map(d=>{
  try{const r=saveStudentCore(Object.assign({},d,{studentId:''}),s.userId);return Object.assign({name:clean(d.name,80)},r)}
  catch(e){return{name:clean(d.name,80),error:String(e.message||e)}}})}))}

function promoteStudents(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const from=resolveClass(b.fromClassId),to=String(b.toClassId)==='PASSOUT'?'PASSOUT':resolveClass(b.toClassId);
  if(!from||!to)throw new Error('Invalid class');if(from===to)throw new Error('Both classes are the same');
  let n=0;table('Students').rows.forEach(r=>{
   if(String(r.classId)===from&&String(r.status).toLowerCase()==='active'){
    setRow('Students',r._row,to==='PASSOUT'?{status:'passed-out'}:{classId:to,roll:''});n++}});
  log(s.userId,'promote',from+'->'+to+' ('+n+')');
  return{ok:true,moved:n}}))}

// Phase 10: certificate / ID data. Har issue ka serial number Logs se banta hai (kaun, kab, kis ko = log mein).
const CERT_TYPES={bonafide:'BON',tc:'TC',character:'CHR'};
function issueCertificate(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const type=String(b.type||''),pre=CERT_TYPES[type];if(!pre)throw new Error('Invalid certificate type');
  const st=find('Students',x=>String(x.studentId)===String(b.studentId));if(!st)throw new Error('Student not found');
  const yr=todayStr().slice(0,4),key=pre+'/'+yr+'/';
  const n=table('Logs').rows.filter(l=>String(l.action)==='certificate'&&String(l.details).indexOf(key)===0).length+1;
  const ref=key+String(n).padStart(4,'0');
  log(s.userId,'certificate',ref+' '+st.studentId);
  const cl=find('Classes',c=>String(c.classId)===String(st.classId))||{},ay=find('AcademicYears',a=>String(a.current).toUpperCase()==='TRUE')||{};
  return{ok:true,ref,date:todayStr(),year:String(ay.name||ay.year||''),student:{studentId:String(st.studentId),admNo:String(st.admNo||''),name:st.name,gender:String(st.gender||''),dob:dstr(st.dob),parentName:String(st.parentName||''),address:String(st.address||''),className:cl.name||String(st.classId),roll:String(st.roll||''),status:String(st.status)}}}))}

// Teachers (Phase 2) + PIN/password reset
function listTeachers(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return{ok:true,teachers:table('Users').rows.filter(r=>r.role==='teacher').map(r=>strip(r,['passHash','salt']))}}

function saveTeacher(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.teacher||{},name=clean(d.name,80);if(!name)throw new Error('Name is required');
  const o={name,phone:clean(d.phone,15).replace(/[^\d+]/g,''),email:clean(d.email,80),active:d.active===false||String(d.active)==='false'?false:true};
  if(d.userId){const ex=find('Users',r=>String(r.userId)===String(d.userId)&&r.role==='teacher');
   if(!ex)throw new Error('Teacher not found');
   setRow('Users',ex._row,o);if(!o.active)revokeTokens(ex.userId);
   log(s.userId,'teacher_edit',ex.userId);return{ok:true,userId:String(ex.userId)}}
  const id=nextId('Users','userId','T',3),pw=genPassword(),f=setSecretFields(pw);
  addRow('Users',Object.assign(o,{userId:id,role:'teacher',passHash:f.hash,salt:f.salt}));
  log(s.userId,'teacher_add',id);return{ok:true,userId:id,password:pw}}))}

// kind: student | teacher. Naya secret sirf ek baar dikhta hai.
function resetSecret(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const id=String(b.id||''),kind=String(b.kind||'');
  const m={student:['Students','studentId','pinHash',genPin],teacher:['Users','userId','passHash',genPassword]}[kind];
  if(!m)throw new Error('Invalid kind');
  const r=find(m[0],x=>String(x[m[1]])===id&&(kind!=='teacher'||x.role==='teacher'));
  if(!r)throw new Error('Record not found');
  const secret=m[3](),f=setSecretFields(secret),o={salt:f.salt};o[m[2]]=f.hash;
  setRow(m[0],r._row,o);revokeTokens(id);log(s.userId,'reset_'+kind,id);
  return{ok:true,id,secret}}))}

// Teacher dashboard: meri classes aur aaj ke periods
function teacherHome(b){
 const s=guard(b,['teacher']);if(!s)return DENIED;
 const ids=teacherClassIds(s.userId),sn=nameMap('Subjects','subjectId'),cn=nameMap('Classes','classId'),today=Utilities.formatDate(new Date(),'Asia/Kolkata','EEE');
 const lessons=table('Lessons').rows.filter(l=>String(l.teacherId)===s.userId);
 return{ok:true,classes:Object.keys(ids).map(cid=>({classId:cid,name:cn[cid]||cid,isClassTeacher:isClassTeacher(s,cid),students:activeStudents(cid).length,
   subjects:lessons.filter(l=>String(l.classId)===cid).map(l=>sn[String(l.subjectId)]||String(l.subjectId)).filter((v,i,a)=>a.indexOf(v)===i)})),
  today:lessons.filter(l=>String(l.day)===today).map(l=>({classId:String(l.classId),className:cn[String(l.classId)]||String(l.classId),subject:sn[String(l.subjectId)]||String(l.subjectId),start:String(l.start),end:String(l.end)}))
   .sort((a,c)=>a.start<c.start?-1:1)}}

// Classes + Subjects (Phase 2)
// Ready-made classes: Nursery, Prep 1, Prep 2, Class 1-10. Sections (A/B/C) optional, admin adds only if needed.
const PRE=[['NUR','Nursery','Nursery'],['P1','Prep 1','Prep 1'],['P2','Prep 2','Prep 2']].concat(Array.from({length:10},(_,i)=>[String(i+1),'Class '+(i+1),String(i+1)]));
// Section ka naam: "Class 5A", "Class 5B" (number ke baad seedha letter); Nursery/Prep ke liye "Nursery A", "Prep 1 A"
const secName=(base,L)=>/\d$/.test(base)&&/^Class /.test(base)?base+L:base+' '+L;
function ensureClasses(){
 const have={};table('Classes').rows.forEach(r=>{have[String(r.grade)]=1;
  // purana "Class 5 - A" naam ho to naye format mein badlo (ek baar)
  const sec=String(r.section||'');if(sec&&/ - /.test(String(r.name))){const base=String(r.name).split(' - ')[0];setRow('Classes',r._row,{name:secName(base,sec)})}});
 if(!PRE.some(p=>!have[p[2]]))return;
 withLock(()=>{const cur={};table('Classes').rows.forEach(r=>cur[String(r.grade)]=1);
  PRE.forEach(p=>{if(!cur[p[2]])addRow('Classes',{classId:'C'+p[0],name:p[1],grade:p[2],section:'',classTeacherId:''})})})}
const classInUse=id=>Object.keys(SCHEMA).some(n=>n!=='Classes'&&SCHEMA[n].indexOf('classId')>=0&&table(n).rows.some(r=>String(r.classId)===String(id)));

function listClasses(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 ensureClasses();
 const ix=g=>{const i=PRE.findIndex(p=>p[2]===String(g));return i<0?99:i};
 const rows=table('Classes').rows.sort((a,c)=>ix(a.grade)-ix(c.grade)||String(a.section).localeCompare(String(c.section)));
 return{ok:true,classes:rows.map(c=>Object.assign(strip(c,[]),{inUse:s.role==='admin'?classInUse(c.classId):false})),subjects:table('Subjects').rows.map(c=>strip(c,[]))}}

// Sirf class teacher badalna. Nayi class banane ka option nahi (ready-made classes hain).
function saveClass(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.cls||{},tid=clean(d.classTeacherId,20);
  if(tid&&!find('Users',r=>String(r.userId)===tid&&r.role==='teacher'))throw new Error('Class teacher not found');
  const ex=find('Classes',r=>String(r.classId)===String(d.classId));if(!ex)throw new Error('Class not found');
  setRow('Classes',ex._row,{classTeacherId:tid});log(s.userId,'class_edit',ex.classId);return{ok:true,classId:String(ex.classId)}}))}

// Optional sections: "A, B, C" -> "Class 5 - A", "Class 5 - B"...
function saveSections(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const grade=clean(b.grade,12),pre=PRE.find(p=>p[2]===grade);if(!grade)throw new Error('Class not found');
  const code=pre?pre[0]:grade.replace(/\W/g,'').toUpperCase(),baseName=pre?pre[1]:'Class '+grade;
  const letters=[...new Set(String(b.sections||'').toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean))].filter(x=>x.length<=3).slice(0,8);
  if(!letters.length)throw new Error('Enter sections like A, B, C');
  let made=0;
  letters.forEach(L=>{const id='C'+code+L;if(!find('Classes',r=>String(r.classId)===id)){addRow('Classes',{classId:id,name:secName(baseName,L),grade,section:L,classTeacherId:''});made++}});
  const base=find('Classes',r=>String(r.grade)===grade&&!String(r.section));
  if(base&&made&&!classInUse(base.classId))tab('Classes').deleteRow(base._row);
  log(s.userId,'sections_add',grade+' '+letters.join(','));return{ok:true,added:made}}))}

function deleteClass(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Classes',r=>String(r.classId)===String(b.classId));if(!ex)throw new Error('Class not found');
  if(!String(ex.section))throw new Error('Ready-made classes cannot be deleted');
  if(classInUse(ex.classId))throw new Error('This section has students or data. Move or remove them first.');
  tab('Classes').deleteRow(ex._row);log(s.userId,'class_delete',ex.classId);return{ok:true}}))}

function saveSubject(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.subject||{},name=clean(d.name,40);if(!name)throw new Error('Subject name is required');
  if(d.subjectId){const ex=find('Subjects',r=>String(r.subjectId)===String(d.subjectId));
   if(!ex)throw new Error('Subject not found');setRow('Subjects',ex._row,{name});return{ok:true,subjectId:String(ex.subjectId)}}
  const id=nextId('Subjects','subjectId','SUB',2);addRow('Subjects',{subjectId:id,name});
  log(s.userId,'subject_add',id);return{ok:true,subjectId:id}}))}

// Timetable (Phase 4): admin banata hai, teacher apna dekhta hai
function listLessons(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 const sn=nameMap('Subjects','subjectId'),cn=nameMap('Classes','classId'),un=nameMap('Users','userId');
 const lessons=table('Lessons').rows.filter(l=>s.role==='admin'||String(l.teacherId)===s.userId).map(l=>({lessonId:String(l.lessonId),classId:String(l.classId),className:cn[String(l.classId)]||String(l.classId),
  subjectId:String(l.subjectId),subject:sn[String(l.subjectId)]||String(l.subjectId),teacherId:String(l.teacherId),teacher:un[String(l.teacherId)]||'',day:String(l.day),start:String(l.start),end:String(l.end)}))
  .sort((a,c)=>(DAYS.indexOf(a.day)-DAYS.indexOf(c.day))||(a.start<c.start?-1:1));
 return{ok:true,lessons}}

function saveLesson(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.lesson||{},cid=resolveClass(d.classId),sub=clean(d.subjectId,20),tid=clean(d.teacherId,20),day=clean(d.day,3),st=clean(d.start,5),en=clean(d.end,5);
  if(!cid)throw new Error('Select a class');if(!find('Subjects',x=>String(x.subjectId)===sub))throw new Error('Select a subject');
  if(!find('Users',u=>String(u.userId)===tid&&u.role==='teacher'))throw new Error('Select a teacher');
  if(DAYS.indexOf(day)<0)throw new Error('Select a day');if(!validTime(st)||!validTime(en))throw new Error('Enter time as HH:MM (e.g. 09:30)');
  if(st>=en)throw new Error('End time must be after start time');
  const me=String(d.lessonId||'');
  const clash=table('Lessons').rows.find(l=>String(l.lessonId)!==me&&String(l.day)===day&&String(l.start)<en&&st<String(l.end)&&(String(l.classId)===cid||String(l.teacherId)===tid));
  if(clash)throw new Error(String(clash.classId)===cid?'This class already has a period at that time ('+clash.lessonId+')':'This teacher is in another class at that time ('+clash.lessonId+')');
  const o={classId:cid,subjectId:sub,teacherId:tid,day,start:st,end:en};
  if(me){const ex=find('Lessons',l=>String(l.lessonId)===me);if(!ex)throw new Error('Period not found');setRow('Lessons',ex._row,o);return{ok:true,lessonId:me}}
  const id=nextId('Lessons','lessonId','L',3);addRow('Lessons',Object.assign(o,{lessonId:id}));log(s.userId,'lesson_add',id);return{ok:true,lessonId:id}}))}

function deleteLesson(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const ex=find('Lessons',l=>String(l.lessonId)===String(b.lessonId));if(!ex)throw new Error('Period not found');
  tab('Lessons').deleteRow(ex._row);log(s.userId,'lesson_delete',ex.lessonId);return{ok:true}}))}

// Class notices (Phase 4): admin sab ko (ALL) ya kisi class ko; teacher sirf apni classes ko
function listClassNotices(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 const mine=s.role==='teacher'?teacherClassIds(s.userId):null,cn=nameMap('Classes','classId');
 return{ok:true,notices:table('ClassNotices').rows.filter(n=>!mine||String(n.classId)==='ALL'||mine[String(n.classId)]).map(n=>({id:String(n.id),classId:String(n.classId),
  className:String(n.classId)==='ALL'?'All classes':(cn[String(n.classId)]||String(n.classId)),title:n.title,text:n.text,date:dstr(n.date),
  editable:s.role==='admin'||!!(mine&&mine[String(n.classId)])})).sort((a,c)=>a.date<c.date?1:-1)}}

function saveClassNotice(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.notice||{},raw=clean(d.classId,40),cid=raw==='ALL'?'ALL':resolveClass(raw),title=clean(d.title,120),text=clean(d.text,1000),date=dstr(d.date)||todayStr();
  if(!cid)throw new Error('Select a class');if(cid==='ALL'&&s.role!=='admin')throw new Error('Only the admin can send to all classes');
  if(cid!=='ALL'&&!canClass(s,cid))throw new Error('You do not have permission for this class');
  if(!title)throw new Error('Title is required');if(!validDate(date))throw new Error('Invalid date');
  const o={classId:cid,title,text,date};
  if(d.id){const ex=find('ClassNotices',n=>String(n.id)===String(d.id));if(!ex)throw new Error('Notice not found');
   if(!(s.role==='admin'||canClass(s,String(ex.classId))&&String(ex.classId)!=='ALL'))throw new Error('You cannot edit this notice');
   setRow('ClassNotices',ex._row,o);return{ok:true,id:String(ex.id)}}
  const id=nextId('ClassNotices','id','N',3);addRow('ClassNotices',Object.assign(o,{id}));log(s.userId,'notice_add',id);return{ok:true,id}}))}

function deleteClassNotice(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const ex=find('ClassNotices',n=>String(n.id)===String(b.id));if(!ex)throw new Error('Notice not found');
  if(!(s.role==='admin'||canClass(s,String(ex.classId))&&String(ex.classId)!=='ALL'))throw new Error('You cannot delete this notice');
  tab('ClassNotices').deleteRow(ex._row);log(s.userId,'notice_delete',ex.id);return{ok:true}}))}

// Attendance (Phase 4): har entry nayi row (purani delete nahi), latest row jeetti hai
function attMap(cid,date){const m={};
 table('Attendance').rows.forEach(r=>{if(String(r.classId)===cid&&dstr(r.date)===date)m[String(r.studentId)]=String(r.status).toUpperCase()});return m}

function getAttendance(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const cid=resolveClass(b.classId),date=dstr(b.date)||todayStr();
  if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
  if(!validDate(date))throw new Error('Invalid date');
  const m=attMap(cid,date);
  return{ok:true,date,marked:Object.keys(m).length>0,students:activeStudents(cid).map(r=>({studentId:String(r.studentId),name:r.name,roll:String(r.roll),status:m[String(r.studentId)]||''}))}})}

function markAttendance(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const cid=resolveClass(b.classId),date=dstr(b.date);
  if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
  if(!validDate(date))throw new Error('Invalid date');
  if(date>todayStr())throw new Error('Attendance cannot be marked for a future date');
  const okIds={};activeStudents(cid).forEach(r=>okIds[String(r.studentId)]=1);
  const m=attMap(cid,date),rows=[];
  (Array.isArray(b.marks)?b.marks:[]).forEach(x=>{const sid=String(x.studentId),st=String(x.status).toUpperCase();
   if(!okIds[sid])throw new Error('Student is not in this class: '+sid);
   if(st!=='P'&&st!=='A'&&st!=='L')throw new Error('Status must be P/A/L');
   if(m[sid]!==st)rows.push({date,classId:cid,studentId:sid,status:st,markedBy:s.userId})});
  addRows('Attendance',rows);log(s.userId,'attendance',cid+' '+date+' ('+rows.length+')');
  return{ok:true,saved:rows.length}}))}

// Homework (Phase 4)
function listAssignments(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const sn=nameMap('Subjects','subjectId'),cn=nameMap('Classes','classId'),un=nameMap('Users','userId'),mine=s.role==='teacher'?teacherClassIds(s.userId):null;
  const cid=b.classId?resolveClass(b.classId):'';
  return{ok:true,assignments:table('Assignments').rows.filter(a=>(!mine||mine[String(a.classId)])&&(!cid||String(a.classId)===cid)).map(a=>({id:String(a.id),classId:String(a.classId),className:cn[String(a.classId)]||String(a.classId),
   subjectId:String(a.subjectId),subject:sn[String(a.subjectId)]||String(a.subjectId),title:a.title,due:dstr(a.due),link:String(a.link||''),by:String(a.by),byName:un[String(a.by)]||String(a.by),
   editable:s.role==='admin'||String(a.by)===s.userId})).sort((x,y)=>x.due<y.due?1:-1)}})}

function saveAssignment(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.assignment||{},cid=resolveClass(d.classId),sub=clean(d.subjectId,20),title=clean(d.title,200),due=dstr(d.due),link=clean(d.link,300);
  if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
  if(!find('Subjects',x=>String(x.subjectId)===sub))throw new Error('Select a subject');
  if(!title)throw new Error('Title is required');if(!validDate(due))throw new Error('Invalid due date');
  if(link&&!/^https?:\/\//i.test(link))throw new Error('The link must start with http:// or https://');
  if(d.id){const ex=find('Assignments',a=>String(a.id)===String(d.id));if(!ex)throw new Error('Homework not found');
   if(s.role!=='admin'&&String(ex.by)!==s.userId)throw new Error('You can edit only your own homework');
   setRow('Assignments',ex._row,{classId:cid,subjectId:sub,title,due,link});return{ok:true,id:String(ex.id)}}
  const id=nextId('Assignments','id','A',3);addRow('Assignments',{id,classId:cid,subjectId:sub,title,due,link,by:s.userId});
  log(s.userId,'homework_add',id);return{ok:true,id}}))}

function deleteAssignment(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const ex=find('Assignments',a=>String(a.id)===String(b.id));if(!ex)throw new Error('Homework not found');
  if(s.role!=='admin'&&String(ex.by)!==s.userId)throw new Error('You can delete only your own homework');
  tab('Assignments').deleteRow(ex._row);log(s.userId,'homework_delete',ex.id);return{ok:true}}))}

// Fees (Phase 5): structure, payments ledger (sirf nayi rows; galti = void entry), receipt, defaulters
const PAY_MODES=['cash','upi','bank','cheque'];
const round2=n=>Math.round(n*100)/100;

function getFeeStructure(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 const cn=nameMap('Classes','classId');
 return{ok:true,fees:table('FeeStructure').rows.map(f=>({classId:String(f.classId),className:cn[String(f.classId)]||String(f.classId),feeType:String(f.feeType),amount:Number(f.amount)||0,dueMonth:String(f.dueMonth)}))}}

function saveFeeStructure(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.fee||{},cid=resolveClass(d.classId),type=clean(d.feeType,40),amt=round2(Number(d.amount)),dm=clean(d.dueMonth,10);
  if(!cid)throw new Error('Select a class');if(!type)throw new Error('Fee name is required');
  if(!isFinite(amt)||amt<=0||amt>1e7)throw new Error('Enter a valid amount');
  if(dm!=='monthly'&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(dm))throw new Error('Due month "monthly" ya YYYY-MM hona chahiye');
  const ex=find('FeeStructure',f=>String(f.classId)===cid&&String(f.feeType).toLowerCase()===type.toLowerCase());
  if(ex){setRow('FeeStructure',ex._row,{amount:amt,dueMonth:dm});log(s.userId,'fee_edit',cid+' '+type);return{ok:true}}
  addRow('FeeStructure',{classId:cid,feeType:type,amount:amt,dueMonth:dm});log(s.userId,'fee_add',cid+' '+type);return{ok:true}}))}

function deleteFee(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const cid=resolveClass(b.classId),ex=find('FeeStructure',f=>String(f.classId)===cid&&String(f.feeType)===String(b.feeType));
  if(!ex)throw new Error('Fee not found');tab('FeeStructure').deleteRow(ex._row);log(s.userId,'fee_delete',cid+' '+b.feeType);return{ok:true}}))}

function studentFees(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>{const r=find('Students',x=>String(x.studentId)===String(b.studentId));if(!r)throw new Error('Student not found');
  return{ok:true,student:profileOf(r),fees:feesOf(r)}})}

function nextReceipt(){
 const pre=clean((find('Settings',x=>String(x.key)==='receipt_prefix')||{}).value,5)||'R';let m=0;
 table('Payments').rows.forEach(p=>{const x=String(p.receiptNo);if(x.indexOf(pre)===0){const v=parseInt(x.slice(pre.length),10);if(v>m)m=v}});
 return pre+String(m+1).padStart(4,'0')}

function addPayment(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.payment||{},r=find('Students',x=>String(x.studentId)===String(d.studentId));if(!r)throw new Error('Student not found');
  const type=clean(d.feeType,40),amt=round2(Number(d.amount)),mode=clean(d.mode,10).toLowerCase(),date=dstr(d.date)||todayStr();
  if(!find('FeeStructure',f=>String(f.classId)===String(r.classId)&&String(f.feeType)===type))throw new Error('Is class ki fee structure mein "'+type+'" nahi hai');
  if(!isFinite(amt)||amt<=0||amt>1e7)throw new Error('Enter a valid amount');
  if(PAY_MODES.indexOf(mode)<0)throw new Error('Mode must be cash/upi/bank/cheque');
  if(!validDate(date)||date>todayStr())throw new Error('Invalid date (a future date is not allowed)');
  const no=nextReceipt();addRow('Payments',{receiptNo:no,studentId:String(r.studentId),feeType:type,amount:amt,mode,date,receivedBy:s.userId});
  log(s.userId,'payment',no+' '+r.studentId+' '+type+' '+amt);
  return{ok:true,receiptNo:no,fees:feesOf(r)}}))}

// Galti sudharne ke liye purani row delete nahi hoti: ulta (negative) entry judti hai.
function voidPayment(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const rows=table('Payments').rows,o=rows.find(p=>String(p.receiptNo)===String(b.receiptNo));
  if(!o)throw new Error('Receipt not found');
  if(Number(o.amount)<=0||String(o.mode).indexOf('void:')===0)throw new Error('This entry cannot be voided');
  if(rows.some(p=>String(p.mode)==='void:'+o.receiptNo))throw new Error('This receipt is already voided');
  const reason=clean(b.reason,100);if(!reason)throw new Error('Write the reason for voiding');
  const no=nextReceipt();addRow('Payments',{receiptNo:no,studentId:String(o.studentId),feeType:String(o.feeType),amount:-Number(o.amount),mode:'void:'+o.receiptNo,date:todayStr(),receivedBy:s.userId});
  log(s.userId,'void',o.receiptNo+' -> '+no+' ('+reason+')');return{ok:true,receiptNo:no}}))}

function listPayments(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 const st={},cn=nameMap('Classes','classId'),un=nameMap('Users','userId');table('Students').rows.forEach(r=>st[String(r.studentId)]=r);
 const all=table('Payments').rows,voided={};all.forEach(p=>{const m=/^void:(.+)$/.exec(String(p.mode));if(m)voided[m[1]]=1});
 const from=dstr(b.from),to=dstr(b.to),sid=clean(b.studentId,20);
 const rows=all.filter(p=>(!sid||String(p.studentId)===sid)&&(!from||dstr(p.date)>=from)&&(!to||dstr(p.date)<=to)).map(p=>{const r=st[String(p.studentId)]||{};
  return{receiptNo:String(p.receiptNo),studentId:String(p.studentId),name:r.name||'',className:cn[String(r.classId)]||String(r.classId||''),feeType:String(p.feeType),amount:Number(p.amount)||0,mode:String(p.mode),date:dstr(p.date),
   receivedBy:un[String(p.receivedBy)]||String(p.receivedBy),isVoid:String(p.mode).indexOf('void:')===0,voided:!!voided[String(p.receiptNo)]}});
 rows.sort((a,c)=>a.date<c.date?1:a.date>c.date?-1:(a.receiptNo<c.receiptNo?1:-1));
 const total=round2(rows.reduce((a,p)=>a+p.amount,0));
 return{ok:true,payments:rows.slice(0,500),total,count:rows.length}}

function getReceipt(b){
 const s=guard(b,['admin','student']);if(!s)return DENIED;
 return safe(()=>{const p=find('Payments',x=>String(x.receiptNo)===String(b.receiptNo));if(!p)throw new Error('Receipt not found');
  if(s.role==='student'&&String(p.studentId)!==s.userId)return DENIED;
  const r=find('Students',x=>String(x.studentId)===String(p.studentId))||{},un=nameMap('Users','userId');
  return{ok:true,receipt:{receiptNo:String(p.receiptNo),date:dstr(p.date),feeType:String(p.feeType),amount:Number(p.amount)||0,mode:String(p.mode),receivedBy:un[String(p.receivedBy)]||String(p.receivedBy),
   isVoid:String(p.mode).indexOf('void:')===0,voided:table('Payments').rows.some(x=>String(x.mode)==='void:'+p.receiptNo)},student:r.studentId?profileOf(r):{}}})}

function defaulters(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>{const cid=b.classId?resolveClass(b.classId):'',c=feeCtx(),cn=nameMap('Classes','classId');
  const rows=table('Students').rows.filter(r=>String(r.status).toLowerCase()==='active'&&(!cid||String(r.classId)===cid)).map(r=>{const f=feesOfCtx(r,c);
   return{studentId:String(r.studentId),name:r.name,className:cn[String(r.classId)]||String(r.classId),roll:String(r.roll),phone:String(r.parentPhone||''),due:f.totalDue,paid:f.totalPaid,balance:f.balance}})
   .filter(x=>x.balance>0).sort((a,d)=>d.balance-a.balance);
  return{ok:true,students:rows,total:round2(rows.reduce((a,x)=>a+x.balance,0))}})}

// Results/marks (Phase 4: marks entry. Exams banana + report card PDF Phase 6). Har entry nayi row, latest jeetti hai.
function subjectsFor(s,cid){const all=table('Subjects').rows;
 if(s.role==='admin'||isClassTeacher(s,cid))return all.map(x=>({subjectId:String(x.subjectId),name:x.name}));
 const ids={};table('Lessons').rows.forEach(l=>{if(String(l.classId)===cid&&String(l.teacherId)===s.userId)ids[String(l.subjectId)]=1});
 return all.filter(x=>ids[String(x.subjectId)]).map(x=>({subjectId:String(x.subjectId),name:x.name}))}

function listExams(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const cid=resolveClass(b.classId);if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
  return{ok:true,exams:table('Exams').rows.filter(e=>String(e.classId)===cid).map(e=>({examId:String(e.examId),title:e.title,date:dstr(e.date),maxMarks:Number(e.maxMarks)||0})),subjects:subjectsFor(s,cid)}})}

function marksMap(examId,subjectId){const m={};
 table('Results').rows.forEach(r=>{if(String(r.examId)===examId&&String(r.subjectId)===subjectId)m[String(r.studentId)]=r.marks});return m}

function getMarks(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const ex=find('Exams',e=>String(e.examId)===String(b.examId)),sub=String(b.subjectId||'');
  if(!ex)throw new Error('Exam not found');const cid=String(ex.classId);
  if(!canClass(s,cid)||!teachesSub(s,cid,sub))throw new Error('You do not have permission for this subject');
  const m=marksMap(String(ex.examId),sub);
  return{ok:true,maxMarks:Number(ex.maxMarks)||0,students:activeStudents(cid).map(r=>({studentId:String(r.studentId),name:r.name,roll:String(r.roll),marks:m[String(r.studentId)]===undefined?'':m[String(r.studentId)]}))}})}

function saveMarks(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Exams',e=>String(e.examId)===String(b.examId)),sub=String(b.subjectId||'');
  if(!ex)throw new Error('Exam not found');const cid=String(ex.classId),max=Number(ex.maxMarks)||0;
  if(!find('Subjects',x=>String(x.subjectId)===sub))throw new Error('Invalid subject');
  if(!canClass(s,cid)||!teachesSub(s,cid,sub))throw new Error('You do not have permission for this subject');
  const okIds={};activeStudents(cid).forEach(r=>okIds[String(r.studentId)]=1);
  const m=marksMap(String(ex.examId),sub),rows=[];
  (Array.isArray(b.marks)?b.marks:[]).forEach(x=>{const sid=String(x.studentId);if(x.marks===''||x.marks==null)return;
   if(!okIds[sid])throw new Error('Student is not in this class: '+sid);
   const v=Number(x.marks);if(!isFinite(v)||v<0||v>max)throw new Error(sid+': marks must be between 0 and '+max);
   if(m[sid]===undefined||Number(m[sid])!==v)rows.push({examId:String(ex.examId),studentId:sid,subjectId:sub,marks:v})});
  addRows('Results',rows);log(s.userId,'marks',ex.examId+' '+sub+' ('+rows.length+')');
  return{ok:true,saved:rows.length}}))}


// ---- Phase 6: exams banana, class result sheet, report card ----
function gradeOf(pc){return pc>=90?'A+':pc>=80?'A':pc>=70?'B+':pc>=60?'B':pc>=50?'C':pc>=40?'D':pc>=33?'E':'F'}
const PASS_PC=33;

function adminExams(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>{const cn=nameMap('Classes','classId'),cnt={};
  table('Results').rows.forEach(r=>{const k=String(r.examId);cnt[k]=cnt[k]||{};cnt[k][String(r.studentId)+'|'+String(r.subjectId)]=1});
  const ex=table('Exams').rows.map(e=>({examId:String(e.examId),title:e.title,classId:String(e.classId),className:cn[String(e.classId)]||String(e.classId),date:dstr(e.date),maxMarks:Number(e.maxMarks)||0,entries:Object.keys(cnt[String(e.examId)]||{}).length}));
  ex.sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:0);return{ok:true,exams:ex}})}

function saveExam(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.exam||{},title=clean(d.title,60),max=Number(d.maxMarks),date=clean(d.date,10);
  if(!title)throw new Error('Exam name is required');
  if(!isFinite(max)||max<=0||max>1000)throw new Error('Max marks must be between 1 and 1000');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Invalid date');
  if(d.examId){const ex=find('Exams',e=>String(e.examId)===String(d.examId));if(!ex)throw new Error('Exam not found');
   const over=table('Results').rows.some(r=>String(r.examId)===String(ex.examId)&&Number(r.marks)>max);
   if(over)throw new Error('Some students have marks above this max, so max cannot be lowered');
   setRow('Exams',ex._row,{title,date,maxMarks:max});log(s.userId,'exam_edit',ex.examId);return{ok:true,examId:String(ex.examId)}}
  const ids=(Array.isArray(d.classIds)&&d.classIds.length?d.classIds:[d.classId]).map(resolveClass);
  if(!ids.length||ids.some(x=>!x))throw new Error('Select a class');
  const made=[];[...new Set(ids)].forEach(cid=>{
   if(table('Exams').rows.some(e=>String(e.classId)===cid&&String(e.title).toLowerCase()===title.toLowerCase()))throw new Error('Is class mein "'+title+'" pehle se hai');
   const id=nextId('Exams','examId','E',3);addRow('Exams',{examId:id,title,classId:cid,date,maxMarks:max});made.push(id)});
  log(s.userId,'exam_add',made.join(','));return{ok:true,examIds:made}}))}

function deleteExam(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const ex=find('Exams',e=>String(e.examId)===String(b.examId));if(!ex)throw new Error('Exam not found');
  if(table('Results').rows.some(r=>String(r.examId)===String(ex.examId)))throw new Error('Marks are entered in this exam, it cannot be deleted');
  tab('Exams').deleteRow(ex._row);log(s.userId,'exam_delete',ex.examId);return{ok:true}}))}

// Ek exam ka poori class ka hisaab: {studentId:{rows,total,max,percent,grade,rank}}
function examBoard(ex){
 const cid=String(ex.classId),max=Number(ex.maxMarks)||0,sn=nameMap('Subjects','subjectId'),latest={};
 table('Results').rows.forEach(r=>{if(String(r.examId)===String(ex.examId))latest[String(r.studentId)+'|'+String(r.subjectId)]=r});  // latest row jeetti hai
 const stus=activeStudents(cid),out={},subjSeen={};
 stus.forEach(st=>{const sid=String(st.studentId),rows=[];
  Object.keys(latest).forEach(k=>{const r=latest[k];if(String(r.studentId)!==sid)return;const m=Number(r.marks)||0,pc=max?Math.round(m*1000/max)/10:0;
   subjSeen[String(r.subjectId)]=1;rows.push({subjectId:String(r.subjectId),subject:sn[String(r.subjectId)]||String(r.subjectId),marks:m,max,grade:gradeOf(pc),pass:pc>=PASS_PC})});
  rows.sort((a,b)=>a.subject<b.subject?-1:1);
  const total=rows.reduce((a,x)=>a+x.marks,0),mx=rows.length*max,percent=mx?Math.round(total*1000/mx)/10:0;
  out[sid]={student:st,rows,total,max:mx,percent,grade:rows.length?gradeOf(percent):'',pass:rows.length>0&&rows.every(x=>x.pass)}});
 const ranked=Object.keys(out).filter(k=>out[k].rows.length).sort((a,b)=>out[b].percent-out[a].percent);
 ranked.forEach((k,i)=>{out[k].rank=i>0&&out[ranked[i-1]].percent===out[k].percent?out[ranked[i-1]].rank:i+1});
 return{board:out,subjects:Object.keys(subjSeen).map(id=>({subjectId:id,name:sn[id]||id})).sort((a,b)=>a.name<b.name?-1:1),ranked:ranked.length}}

// Admin ya class teacher: poori class ka result sheet
function getResults(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const ex=find('Exams',e=>String(e.examId)===String(b.examId));if(!ex)throw new Error('Exam not found');
  const cid=String(ex.classId);if(s.role!=='admin'&&!isClassTeacher(s,cid))throw new Error('Only the class teacher or admin can see the full result');
  const r=examBoard(ex);
  const students=Object.keys(r.board).map(k=>{const x=r.board[k],m={};x.rows.forEach(y=>m[y.subjectId]=y.marks);
   return{studentId:k,name:x.student.name,roll:String(x.student.roll),marks:m,total:x.total,max:x.max,percent:x.percent,grade:x.grade,pass:x.pass,rank:x.rank||''}});
  students.sort((a,b)=>(Number(a.roll)||0)-(Number(b.roll)||0)||(a.name<b.name?-1:1));
  return{ok:true,exam:{examId:String(ex.examId),title:ex.title,date:dstr(ex.date),maxMarks:Number(ex.maxMarks)||0},subjects:r.subjects,students}})}

function cardOf(st,ex){
 const r=examBoard(ex),x=r.board[String(st.studentId)];if(!x||!x.rows.length)throw new Error('The result of this exam is not out yet');
 const cl=find('Classes',c=>String(c.classId)===String(st.classId))||{},a=attOf(String(st.studentId));
 return{ok:true,exam:{examId:String(ex.examId),title:ex.title,date:dstr(ex.date),maxMarks:Number(ex.maxMarks)||0},
  student:{studentId:String(st.studentId),name:st.name,roll:String(st.roll),admNo:String(st.admNo||''),className:cl.name||String(st.classId),parentName:String(st.parentName||''),dob:dstr(st.dob)},
  rows:x.rows,total:x.total,max:x.max,percent:x.percent,grade:x.grade,pass:x.pass,rank:x.rank,classSize:r.ranked,attendance:a.total?a.percent:null,
  classTeacher:(cl.classTeacherId?nameMap('Users','userId')[String(cl.classTeacherId)]:'')||''}}

function reportCard(b){
 const s=guard(b);if(!s)return DENIED;
 return safe(()=>{const ex=find('Exams',e=>String(e.examId)===String(b.examId));if(!ex)throw new Error('Exam not found');
  let sid=s.role==='student'?s.userId:String(b.studentId||'');
  const st=find('Students',x=>String(x.studentId)===sid);if(!st||String(st.classId)!==String(ex.classId))throw new Error('Student is not part of this exam');
  if(s.role==='teacher'&&!isClassTeacher(s,String(ex.classId)))return DENIED;
  return cardOf(st,ex)})}

// Notes library (Phase 6a): file Google Drive mein, list Sheet ke "Notes" tab mein.
// Folder: School Notes / <Class> / <Subject> /. File "anyone with link can view" hoti hai; list sirf login wale ko milti hai.
const NOTE_MAX_BYTES=20*1024*1024,NOTE_TYPES={'application/pdf':'.pdf','image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp'};
function magicOk(b,mime){const u=i=>b[i]&255;
 if(mime==='application/pdf')return u(0)===0x25&&u(1)===0x50&&u(2)===0x44&&u(3)===0x46;
 if(mime==='image/jpeg')return u(0)===0xFF&&u(1)===0xD8;
 if(mime==='image/png')return u(0)===0x89&&u(1)===0x50&&u(2)===0x4E&&u(3)===0x47;
 if(mime==='image/webp')return u(0)===0x52&&u(1)===0x49&&u(2)===0x46&&u(3)===0x46;return false}
function subFolder(parent,name){const it=parent.getFoldersByName(name);return it.hasNext()?it.next():parent.createFolder(name)}
const NOTE_CATS=['short','chapter','pyq','sample','ref','mag','syll','work','other'];
// Purani Notes sheet mein 'category' column na ho to ek baar header daal do
function ensureNoteCat(){const t=tab('Notes');if(String(t.getRange(1,11).getValue())!=='category')t.getRange(1,11).setValue('category').setFontWeight('bold')}
const safeName=s=>String(s).replace(/[\\/:*?"<>|\r\n]+/g,' ').replace(/\s+/g,' ').trim().slice(0,60)||'note';

// Upload form ke dropdown: kis class mein kaun se subject ke notes daal sakte ho
function noteOptions(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 const mine=s.role==='teacher'?teacherClassIds(s.userId):null;
 return{ok:true,canAll:s.role==='admin',classes:table('Classes').rows.filter(c=>!mine||mine[String(c.classId)]).map(c=>({classId:String(c.classId),name:c.name,subjects:subjectsFor(s,String(c.classId))}))}}

function listNotes(b){
 const s=guard(b,['admin','teacher','student']);if(!s)return DENIED;
 ensureNoteCat();
 let cid='';
 if(s.role==='student'){const r=find('Students',x=>String(x.studentId)===s.userId&&String(x.status).toLowerCase()==='active');if(!r)return DENIED;cid=String(r.classId)}
 const mine=s.role==='teacher'?teacherClassIds(s.userId):null,onlyAll=b.classId==='ALL',want=s.role==='student'?cid:(b.classId&&!onlyAll?resolveClass(b.classId):'');
 const sn=nameMap('Subjects','subjectId'),cn=nameMap('Classes','classId'),un=nameMap('Users','userId');
 const isAll=n=>String(n.classId)==='ALL';
 const notes=table('Notes').rows.filter(n=>(onlyAll?isAll(n):(isAll(n)||((!mine||mine[String(n.classId)])&&(!want||String(n.classId)===want))))&&(!b.subjectId||String(n.subjectId)===String(b.subjectId)))
  .map(n=>({noteId:String(n.noteId),classId:String(n.classId),className:isAll(n)?'All classes':(cn[String(n.classId)]||String(n.classId)),subjectId:String(n.subjectId),subject:isAll(n)?'General':(sn[String(n.subjectId)]||String(n.subjectId)),
   chapter:n.chapter,category:NOTE_CATS.indexOf(String(n.category))>=0?String(n.category):'chapter',title:n.title,fileId:String(n.fileId),mime:String(n.mime),size:Number(n.size)||0,by:un[String(n.uploadedBy)]||String(n.uploadedBy),date:dstr(n.date),
   editable:s.role==='admin'||String(n.uploadedBy)===s.userId}));
 notes.sort((a,c)=>a.subject.localeCompare(c.subject)||a.chapter.localeCompare(c.chapter,undefined,{numeric:true})||(a.date<c.date?1:-1));
 return{ok:true,notes:notes.slice(0,1000)}}

function uploadNote(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{
  const toAll=b.classId==='ALL',cid=toAll?'ALL':resolveClass(b.classId),sub=toAll?'ALL':clean(b.subjectId,20),chapter=clean(b.chapter,100)||'General',category=clean(b.category,12),title=clean(b.title,120),mime=clean(b.mime,40).toLowerCase(),data=String(b.data||'');
  if(toAll){if(s.role!=='admin')throw new Error('Only admin can add to all classes')}
  else if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
  const subj=toAll?{name:'General'}:find('Subjects',x=>String(x.subjectId)===sub);if(!subj)throw new Error('Select a subject');
  if(!toAll&&!teachesSub(s,cid,sub))throw new Error('You do not teach this subject in this class');
  if(!title)throw new Error('Title is required');if(NOTE_CATS.indexOf(category)<0)throw new Error('Choose a section (category)');ensureNoteCat();
  if(!NOTE_TYPES[mime])throw new Error('Only PDF or photo (JPG/PNG/WEBP) is allowed');
  if(!data||data.length>NOTE_MAX_BYTES*1.4)throw new Error('File is larger than 20 MB');
  const root=P.getProperty('NOTES_FOLDER_ID');if(!root)throw new Error('Drive folder is not set. Run setupDrive in Apps Script.');
  const bytes=Utilities.base64Decode(data);
  if(bytes.length>NOTE_MAX_BYTES)throw new Error('File is larger than 20 MB');if(!magicOk(bytes,mime))throw new Error('Invalid file type (the extension seems changed)');
  return withLock(()=>{
   const cls=toAll?{name:'All Classes'}:find('Classes',c=>String(c.classId)===cid),folder=subFolder(subFolder(DriveApp.getFolderById(root),safeName(cls.name)),safeName(subj.name));
   const file=folder.createFile(Utilities.newBlob(bytes,mime,safeName(title)+NOTE_TYPES[mime]));
   try{file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW)}
   catch(e){file.setTrashed(true);throw new Error('Drive sharing is not allowed (blocked by the Workspace admin)')}
   const id=nextId('Notes','noteId','NT',4);
   addRow('Notes',{noteId:id,classId:cid,subjectId:sub,chapter,title,fileId:file.getId(),fileName:file.getName(),mime,size:bytes.length,uploadedBy:s.userId,date:todayStr(),category});
   log(s.userId,'note_upload',id+' '+cid+' '+sub);return{ok:true,noteId:id}})})}

function updateNote(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Notes',n=>String(n.noteId)===String(b.noteId));if(!ex)throw new Error('Note not found');
  if(s.role!=='admin'&&String(ex.uploadedBy)!==s.userId)throw new Error('You can edit only your own note');
  const chapter=clean(b.chapter,100)||'General',title=clean(b.title,120),category=clean(b.category,12);if(!title)throw new Error('Title is required');if(NOTE_CATS.indexOf(category)<0)throw new Error('Choose a section');ensureNoteCat();
  setRow('Notes',ex._row,{chapter,title,category});return{ok:true}}))}

function deleteNote(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Notes',n=>String(n.noteId)===String(b.noteId));if(!ex)throw new Error('Note not found');
  if(s.role!=='admin'&&String(ex.uploadedBy)!==s.userId)throw new Error('You can delete only your own note');
  try{DriveApp.getFileById(String(ex.fileId)).setTrashed(true)}catch(e){}   // Drive trash mein jati hai (wapas laya ja sakta hai)
  tab('Notes').deleteRow(ex._row);log(s.userId,'note_delete',ex.noteId);return{ok:true}}))}

// Online tests + practice + proctoring (questions bank, tests, attempts, violations)
const T_MODES=['practice','test'],T_PROCTOR=['off','basic','camera'],DIFFS=['easy','medium','hard'],OPTK=['a','b','c','d'];
const txt=(v,n)=>{const x=clean(v,n);return /^[=+\-@]/.test(x)?' '+x:x};           // sheet formula injection se bachav
const parseIST=v=>{const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);return m?new Date(m[1]+'-'+m[2]+'-'+m[3]+'T'+m[4]+':'+m[5]+':00+05:30').getTime():0};
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a};
const jparse=(v,d)=>{try{return JSON.parse(String(v))}catch(e){return d}};
const setNum=(k,d)=>{const r=find('Settings',x=>String(x.key)===k),n=r?Number(r.value):NaN;return isFinite(n)&&n>0?n:d};
const maxStrikes=()=>setNum('proctor_max_strikes',3);

function qOf(q,withAns){const ty=String(q.type||'mcq'),o={qid:String(q.qid),classId:String(q.classId),subjectId:String(q.subjectId),chapter:String(q.chapter||''),text:String(q.text).trim(),type:ty,marks:ty==='mcq'?0:(Number(q.marks)||5),
 opts:ty==='mcq'?OPTK.filter(k=>String(q[k]).trim()!=='').map(k=>({k,t:String(q[k]).trim()})):[],difficulty:String(q.difficulty||'medium')};
 if(withAns){o.keyAns=String(q.keyAns||'').trim();o.correct=String(q.correct);o.explain=String(q.explain||'').trim();o.createdBy=String(q.createdBy)}return o}
function staffClasses(s){return s.role==='admin'?null:teacherClassIds(s.userId)}
const testView=(t,att)=>({testId:String(t.testId),title:String(t.title),classId:String(t.classId),subjectId:String(t.subjectId),mode:String(t.mode),durationMin:Number(t.durationMin)||0,
 start:Number(t.start)||0,end:Number(t.end)||0,marksPer:Number(t.marksPer)||1,negative:Number(t.negative)||0,proctor:String(t.proctor||'off'),shuffle:String(t.shuffle).toUpperCase()==='TRUE',
 qids:String(t.qids).split(',').filter(Boolean),status:String(t.status),instructions:String(t.instructions||''),reveal:String(t.reveal)==='submit'?'submit':'end'});

// ---------------- staff: question bank ----------------
function listQuestions(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 const mine=staffClasses(s),cid=b.classId?resolveClass(b.classId):'',sub=clean(b.subjectId,20),ch=clean(b.chapter,100).toLowerCase(),q=clean(b.q,60).toLowerCase();
 const cn=nameMap('Classes','classId'),sn=nameMap('Subjects','subjectId');
 const rows=table('Questions').rows.filter(r=>(!mine||mine[String(r.classId)])&&(!cid||String(r.classId)===cid)&&(!sub||String(r.subjectId)===sub)&&(!ch||String(r.chapter).toLowerCase()===ch)&&(!q||String(r.text).toLowerCase().indexOf(q)>=0))
  .slice(-800).reverse().map(r=>Object.assign(qOf(r,true),{className:cn[String(r.classId)]||String(r.classId),subject:sn[String(r.subjectId)]||String(r.subjectId),editable:s.role==='admin'||String(r.createdBy)===s.userId}));
 return{ok:true,questions:rows}}

function checkQ(s,d){
 const cid=resolveClass(d.classId),sub=clean(d.subjectId,20);
 if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
 if(!find('Subjects',x=>String(x.subjectId)===sub))throw new Error('Select a subject');
 if(!teachesSub(s,cid,sub))throw new Error('You do not teach this subject in this class');
 const ty=['short','long'].indexOf(String(d.type))>=0?String(d.type):'mcq';
 const o={type:ty,classId:cid,subjectId:sub,chapter:txt(d.chapter,100),text:txt(d.text,ty==='mcq'?600:1000),explain:txt(d.explain,500),difficulty:DIFFS.indexOf(String(d.difficulty))>=0?String(d.difficulty):'medium'};
 if(!o.text)throw new Error('Question text is required');
 if(ty!=='mcq'){const mk=Number(d.marks);if(!(mk>0&&mk<=100))throw new Error('Marks must be between 1 and 100');o.marks=mk;o.keyAns=txt(d.keyAns,1500);OPTK.forEach(k=>o[k]='');o.correct='';return o}
 o.marks='';o.keyAns='';
 OPTK.forEach(k=>o[k]=txt(d[k],200));
 if(!o.a||!o.b)throw new Error('Give at least options A and B');
 const c=clean(d.correct,1).toLowerCase();if(OPTK.indexOf(c)<0||!o[c])throw new Error('Choose the correct option (it must not be empty)');
 o.correct=c;return o}

function saveQuestion(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.q||{},o=checkQ(s,d);
  if(d.qid){const ex=find('Questions',x=>String(x.qid)===String(d.qid));if(!ex)throw new Error('Question not found');
   if(s.role!=='admin'&&String(ex.createdBy)!==s.userId)throw new Error('You can edit only your own questions');
   setRow('Questions',ex._row,o);log(s.userId,'question_edit',ex.qid);return{ok:true,qid:String(ex.qid)}}
  const id=nextId('Questions','qid','Q',5);addRow('Questions',Object.assign(o,{qid:id,createdBy:s.userId,date:todayStr()}));log(s.userId,'question_add',id);return{ok:true,qid:id}}))}

function importQuestions(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const rows=Array.isArray(b.rows)?b.rows.slice(0,300):[];if(!rows.length)throw new Error('Nothing to import');
  let m=0;const list=[],errs=[];const t=table('Questions');let id=0;t.rows.forEach(r=>{const v=parseInt(String(r.qid).slice(1),10);if(v>id)id=v});
  rows.forEach((r,i)=>{try{const o=checkQ(s,Object.assign({},r,{classId:b.classId,subjectId:b.subjectId,chapter:r.chapter||b.chapter}));
   id++;list.push(Object.assign(o,{qid:'Q'+String(id).padStart(5,'0'),createdBy:s.userId,date:todayStr()}))}catch(e){errs.push('Row '+(i+1)+': '+e.message)}});
  addRows('Questions',list);log(s.userId,'question_import',list.length+' added');return{ok:true,added:list.length,errors:errs.slice(0,10)}}))}

function deleteQuestion(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Questions',x=>String(x.qid)===String(b.qid));if(!ex)throw new Error('Question not found');
  if(s.role!=='admin'&&String(ex.createdBy)!==s.userId)throw new Error('You can delete only your own questions');
  if(table('Tests').rows.some(t=>String(t.status)==='published'&&String(t.qids).split(',').indexOf(String(ex.qid))>=0))throw new Error('This question is used in a published test');
  tab('Questions').deleteRow(ex._row);log(s.userId,'question_delete',ex.qid);return{ok:true}}))}

// ---------------- staff: tests ----------------
function listTests(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 const mine=staffClasses(s),cn=nameMap('Classes','classId'),sn=nameMap('Subjects','subjectId'),atts=table('Attempts').rows;
 const tests=table('Tests').rows.filter(t=>!mine||mine[String(t.classId)]).reverse().map(t=>{const v=testView(t),a=atts.filter(x=>String(x.testId)===v.testId&&String(x.status)!=='reset');
  return Object.assign(v,{className:cn[String(t.classId)]||String(t.classId),subject:sn[String(t.subjectId)]||'Mixed',count:v.qids.length,attempts:a.length,submitted:a.filter(x=>String(x.status)==='submitted'||String(x.status)==='blocked').length,blocked:a.filter(x=>String(x.status)==='blocked').length,editable:s.role==='admin'||String(t.createdBy)===s.userId})});
 return{ok:true,tests,now:Date.now()}}

function saveTest(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.test||{},cid=resolveClass(d.classId),sub=clean(d.subjectId,20),title=clean(d.title,100),mode=String(d.mode);
  if(!title)throw new Error('Test title is required');if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
  if(sub&&!teachesSub(s,cid,sub))throw new Error('You do not teach this subject in this class');
  if(T_MODES.indexOf(mode)<0)throw new Error('Choose practice or test');
  const qids=[...new Set((Array.isArray(d.qids)?d.qids:[]).map(String))];if(!qids.length)throw new Error('Add at least 1 question');if(qids.length>200)throw new Error('Maximum 200 questions');
  const qm={};table('Questions').rows.forEach(q=>qm[String(q.qid)]=q);
  qids.forEach(q=>{if(!qm[q]||String(qm[q].classId)!==cid)throw new Error('Question '+q+' does not belong to this class');if(mode==='practice'&&String(qm[q].type||'mcq')!=='mcq')throw new Error('Practice sets can have only MCQ questions')});
  const dur=Math.round(Number(d.durationMin)||0),marks=Number(d.marksPer)||1,neg=Number(d.negative)||0;
  let start=0,end=0,proctor=T_PROCTOR.indexOf(String(d.proctor))>=0?String(d.proctor):'off';
  if(mode==='test'){start=parseIST(d.start);end=parseIST(d.end);if(!start||!end)throw new Error('Set start and end time');if(end<=start)throw new Error('End time must be after start time');
   if(dur<5||dur>300)throw new Error('Duration must be between 5 and 300 minutes')}
  else{proctor='off'}
  if(marks<=0||marks>100)throw new Error('Marks per question must be 1-100');if(neg<0||neg>marks)throw new Error('Negative marks must be between 0 and marks per question');
  const o={title,classId:cid,subjectId:sub,mode,durationMin:mode==='test'?dur:(dur||0),start,end,marksPer:marks,negative:neg,proctor,shuffle:d.shuffle?'TRUE':'FALSE',qids:qids.join(','),
   status:String(d.status)==='published'?'published':'draft',instructions:txt(d.instructions,600),reveal:String(d.reveal)==='submit'?'submit':'end'};
  if(d.testId){const ex=find('Tests',x=>String(x.testId)===String(d.testId));if(!ex)throw new Error('Test not found');
   if(s.role!=='admin'&&String(ex.createdBy)!==s.userId)throw new Error('You can edit only your own tests');
   const used=table('Attempts').rows.some(a=>String(a.testId)===String(ex.testId)&&String(a.status)!=='reset');
   if(used&&(String(ex.classId)!==cid||String(ex.qids)!==o.qids||Number(ex.marksPer)!==marks||Number(ex.negative)!==neg||String(ex.mode)!==mode))throw new Error('Students have already attempted this test. You can change only title, time and status.');
   setRow('Tests',ex._row,o);log(s.userId,'test_edit',ex.testId);return{ok:true,testId:String(ex.testId)}}
  const id=nextId('Tests','testId','TS',4);addRow('Tests',Object.assign(o,{testId:id,createdBy:s.userId,date:todayStr()}));log(s.userId,'test_add',id);return{ok:true,testId:id}}))}

function deleteTest(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Tests',x=>String(x.testId)===String(b.testId));if(!ex)throw new Error('Test not found');
  if(s.role!=='admin'&&String(ex.createdBy)!==s.userId)throw new Error('You can delete only your own tests');
  if(table('Attempts').rows.some(a=>String(a.testId)===String(ex.testId)))throw new Error('Students have attempted this test. Unpublish it instead.');
  tab('Tests').deleteRow(ex._row);log(s.userId,'test_delete',ex.testId);return{ok:true}}))}

function staffTest(s,id){const t=find('Tests',x=>String(x.testId)===String(id));if(!t)throw new Error('Test not found');
 if(!canClass(s,String(t.classId)))throw new Error('You do not have permission for this class');return t}

function testResults(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const t=staffTest(s,b.testId),v=testView(t),now=Date.now();
  table('Attempts').rows.filter(a=>String(a.testId)===v.testId&&String(a.status)==='inprogress').forEach(a=>finalizeIfExpired(a,t,now));
  const atts=table('Attempts').rows.filter(a=>String(a.testId)===v.testId&&String(a.status)!=='reset'),vio=table('Violations').rows.filter(x=>String(x.testId)===v.testId&&String(x.type)!=='snapshot');
  const sts=activeStudents(v.classId).sort((a,c)=>(parseInt(a.roll,10)||0)-(parseInt(c.roll,10)||0));
  const rows=sts.map(r=>{const mine=atts.filter(a=>String(a.studentId)===String(r.studentId)),best=mine.sort((a,c)=>Number(c.score)-Number(a.score))[0];
   return{studentId:String(r.studentId),name:r.name,roll:String(r.roll),attempts:mine.length,attemptId:best?String(best.attemptId):'',status:best?String(best.status):'none',score:best?Number(best.score):null,total:best?Number(best.total):null,
    correct:best?Number(best.correct):null,wrong:best?Number(best.wrong):null,pending:best?Number(best.pending)||0:0,strikes:best?Number(best.strikes)||0:0,violations:vio.filter(x=>String(x.studentId)===String(r.studentId)).length}});
  const done=rows.filter(r=>r.score!==null),avg=done.length?Math.round(done.reduce((a,r)=>a+r.score,0)/done.length*100)/100:0;
  return{ok:true,test:Object.assign(v,{count:v.qids.length}),rows,stats:{students:rows.length,attempted:done.length,avg,highest:done.length?Math.max.apply(null,done.map(r=>r.score)):0,blocked:rows.filter(r=>r.status==='blocked').length,pending:rows.reduce((x,r)=>x+(r.pending?1:0),0)}}})}

function attemptDetail(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const a=find('Attempts',x=>String(x.attemptId)===String(b.attemptId));if(!a)throw new Error('Attempt not found');const t=staffTest(s,a.testId);
  const qm={};table('Questions').rows.forEach(q=>qm[String(q.qid)]=q);const ans=jparse(a.answers,{}),grd=jparse(a.grades,{}),ord=jparse(a.order,[]);
  const review=ord.map(o=>{const q=qm[o.q];return q?Object.assign(qOf(q,true),{mine:ans[o.q]||'',grade:grd[o.q]||null}):null}).filter(Boolean);
  const vio=table('Violations').rows.filter(x=>String(x.attemptId)===String(a.attemptId)).map(x=>({id:String(x.id),time:Number(x.time),type:String(x.type),detail:String(x.detail||''),photo:!!String(x.photoId||'')}));
  return{ok:true,attempt:{attemptId:String(a.attemptId),studentId:String(a.studentId),status:String(a.status),score:Number(a.score),total:Number(a.total),correct:Number(a.correct),wrong:Number(a.wrong),skipped:Number(a.skipped),pending:Number(a.pending)||0,strikes:Number(a.strikes)||0,startedAt:Number(a.startedAt),submittedAt:Number(a.submittedAt)||0},review,violations:vio,test:testView(t)}})}

// Teacher/AI-suggested marks for subjective answers; teacher confirms here
function gradeAttempt(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const a=find('Attempts',x=>String(x.attemptId)===String(b.attemptId));if(!a)throw new Error('Attempt not found');const t=staffTest(s,a.testId);
  if(String(a.status)==='inprogress')throw new Error('The student is still writing this test');
  const ord=jparse(a.order,[]),ids={};ord.forEach(o=>ids[o.q]=1);const qm=qMap(ids),gr=jparse(a.grades,{}),inp=b.grades||{};
  Object.keys(inp).forEach(q=>{const qq=qm[q];if(!qq||String(qq.type||'mcq')==='mcq'||!ids[q])return;const mk=Number(qq.marks)||5,m=Number(inp[q].m);
   if(inp[q].m===''||inp[q].m===null||inp[q].m===undefined){delete gr[q];return}
   if(!isFinite(m)||m<0||m>mk)throw new Error('Marks for a question must be between 0 and '+mk);
   gr[q]={m:Math.round(m*100)/100,c:clean(inp[q].c,300),by:inp[q].by==='ai'?'ai':s.userId}});
  const g=gradeOrder(ord,jparse(a.answers,{}),t,qm,gr);setRow('Attempts',a._row,Object.assign(g,{grades:JSON.stringify(gr)}));log(s.userId,'attempt_graded',a.attemptId+' '+g.score+'/'+g.total);
  return{ok:true,score:g.score,total:g.total,pending:g.pending}}))}

function violationPhoto(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const v=find('Violations',x=>String(x.id)===String(b.id));if(!v||!String(v.photoId))throw new Error('No photo');staffTest(s,v.testId);
  const f=DriveApp.getFileById(String(v.photoId)),bl=f.getBlob();return{ok:true,data:'data:'+bl.getContentType()+';base64,'+Utilities.base64Encode(bl.getBytes())}})}

// Block hone ya galti se warning milne par teacher naya mauka de sakta hai
function resetAttempt(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const a=find('Attempts',x=>String(x.attemptId)===String(b.attemptId));if(!a)throw new Error('Attempt not found');staffTest(s,a.testId);
  setRow('Attempts',a._row,{status:'reset'});log(s.userId,'attempt_reset',a.attemptId+' '+a.studentId);return{ok:true}}))}

// ---------------- grading ----------------
function gradeOrder(order,ans,t,qm,gr){gr=gr||{};let c=0,w=0,k=0,ms=0,sm=0,pend=0,total=0;const mp=Number(t.marksPer)||1,ng=Number(t.negative)||0;
 order.forEach(o=>{const q=qm[o.q];if(!q)return;const a=ans[o.q],ty=String(q.type||'mcq');
  if(ty==='mcq'){total+=mp;if(!a)k++;else if(a===String(q.correct)){c++;ms+=mp}else{w++;ms-=ng}}
  else{const mk=Number(q.marks)||5;total+=mk;if(!a||!String(a).trim())k++;else{const g=gr[o.q];
   if(g&&g.m!==undefined&&g.m!==''){const m=Math.min(mk,Math.max(0,Number(g.m)||0));sm+=m;if(m>=mk/2)c++;else w++}else pend++}}});
 return{score:Math.round((ms+sm)*100)/100,total:Math.round(total*100)/100,correct:c,wrong:w,skipped:k,pending:pend}}
function qMap(ids){const m={};table('Questions').rows.forEach(q=>{if(!ids||ids[String(q.qid)])m[String(q.qid)]=q});return m}
function finishAttempt(a,t,answers,status){
 const order=jparse(a.order,[]),ids={};order.forEach(o=>ids[o.q]=1);const ans=answers||jparse(a.answers,{});
 const g=gradeOrder(order,ans,t,qMap(ids),jparse(a.grades,{}));setRow('Attempts',a._row,Object.assign(g,{answers:JSON.stringify(ans),submittedAt:Date.now(),status:status||'submitted'}));return g}
const deadlineOf=(a,t)=>String(t.mode)==='test'?Math.min(Number(a.startedAt)+(Number(t.durationMin)||0)*60000,Number(t.end)||1e15):0;
function finalizeIfExpired(a,t,now){if(String(a.status)!=='inprogress'||String(t.mode)!=='test')return false;
 if(now>deadlineOf(a,t)+45000){finishAttempt(a,t,null,'submitted');return true}return false}

// ---------------- student ----------------
function myTests(b){
 const r=stu(b);if(!r)return DENIED;
 const cid=String(r.classId),now=Date.now(),sn=nameMap('Subjects','subjectId'),QM=qMap(),atts=table('Attempts').rows.filter(a=>String(a.studentId)===String(r.studentId)&&String(a.status)!=='reset');
 const tests=table('Tests').rows.filter(t=>String(t.status)==='published'&&String(t.classId)===cid).reverse().map(t=>{const v=testView(t);
  const mine=atts.filter(a=>String(a.testId)===v.testId);mine.filter(a=>String(a.status)==='inprogress').forEach(a=>finalizeIfExpired(a,t,now));
  const mm=table('Attempts').rows.filter(a=>String(a.testId)===v.testId&&String(a.studentId)===String(r.studentId)&&String(a.status)!=='reset');
  const done=mm.filter(a=>String(a.status)==='submitted'||String(a.status)==='blocked'),best=done.sort((x,y)=>Number(y.score)-Number(x.score))[0],prog=mm.find(a=>String(a.status)==='inprogress');
  const state=v.mode==='practice'?'practice':(now<v.start?'upcoming':(now>v.end?'ended':'live'));
  return{testId:v.testId,title:v.title,subject:sn[v.subjectId]||'Mixed',mode:v.mode,state,start:v.start,end:v.end,durationMin:v.durationMin,count:v.qids.length,marks:v.qids.reduce((x,id)=>{const q=QM[id];return x+(q?(String(q.type||'mcq')==='mcq'?v.marksPer:(Number(q.marks)||5)):0)},0),proctor:v.proctor,
   attempts:done.length,best:best?{attemptId:String(best.attemptId),score:Number(best.score),total:Number(best.total),status:String(best.status),pending:Number(best.pending)||0}:null,
   blocked:mm.some(a=>String(a.status)==='blocked'),inprogress:prog?String(prog.attemptId):''}});
 const topics={};table('Questions').rows.filter(q=>String(q.classId)===cid&&String(q.type||'mcq')==='mcq').forEach(q=>{const sid=String(q.subjectId),ch=String(q.chapter||'General').trim()||'General';
  const o=topics[sid]=topics[sid]||{subjectId:sid,subject:sn[sid]||sid,total:0,chapters:{}};o.total++;o.chapters[ch]=(o.chapters[ch]||0)+1});
 return{ok:true,tests,now,topics:Object.keys(topics).map(k=>({subjectId:k,subject:topics[k].subject,total:topics[k].total,chapters:Object.keys(topics[k].chapters).sort().map(c=>({chapter:c,count:topics[k].chapters[c]}))}))}}

function permOrder(qids,doShuffle){const qs=doShuffle?shuffle(qids):qids;return qs.map(q=>({q,o:doShuffle?shuffle(OPTK).join(''):'abcd'}))}
function paperOf(order,qm){return order.map(o=>{const q=qm[o.q];if(!q)return null;const full=qOf(q,false),by={};full.opts.forEach(x=>by[x.k]=x);
 return{qid:full.qid,text:full.text,type:full.type,marks:full.marks,opts:o.o.split('').map(k=>by[k]).filter(Boolean)}}).filter(Boolean)}

function startTest(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{
  const cid=String(r.classId),now=Date.now();let t,order,mode,title,adhoc=null;
  if(b.practice){const p=b.practice,sub=clean(p.subjectId,20),ch=clean(p.chapter,100),n=Math.max(3,Math.min(30,Math.round(Number(p.count))||10));
   const pool=table('Questions').rows.filter(q=>String(q.classId)===cid&&String(q.type||'mcq')==='mcq'&&(!sub||String(q.subjectId)===sub)&&(!ch||(String(q.chapter||'General').trim()||'General')===ch));
   if(pool.length<1)throw new Error('No questions available for this topic yet');
   const pick=shuffle(pool.map(q=>String(q.qid))).slice(0,n);order=permOrder(pick,true);mode='practice';
   t={testId:'PRACTICE',title:'Practice: '+(ch||'Mixed'),mode:'practice',marksPer:1,negative:0,proctor:'off',durationMin:0,end:0,instructions:'Practice mode: you get instant feedback after each answer.'}}
  else{const tt=find('Tests',x=>String(x.testId)===String(b.testId)&&String(x.status)==='published'&&String(x.classId)===cid);if(!tt)throw new Error('Test not found');t=tt;mode=String(t.mode)}
  title=String(t.title);const tid=String(t.testId),mine=table('Attempts').rows.filter(a=>String(a.testId)===tid&&String(a.studentId)===String(r.studentId)&&String(a.status)!=='reset');
  if(mode==='test'){
   if(mine.some(a=>String(a.status)==='blocked'))throw new Error('You are blocked from this test. Please contact your teacher.');
   if(now<Number(t.start))throw new Error('This test has not started yet');if(now>Number(t.end))throw new Error('This test has ended');
   const open=mine.find(a=>String(a.status)==='inprogress');
   if(open&&finalizeIfExpired(open,t,now))throw new Error('Your time was over. The test was submitted automatically.');
   if(!open&&mine.length)throw new Error('You have already attempted this test');
   if(open)return resumeOf(open,t,r,now)}
  else{const open=!b.practice&&mine.find(a=>String(a.status)==='inprogress');if(open)return resumeOf(open,t,r,now)}
  if(!order)order=permOrder(String(t.qids).split(',').filter(Boolean),String(t.shuffle).toUpperCase()==='TRUE');
  const id='A'+Utilities.getUuid().replace(/-/g,'').slice(0,10);
  addRow('Attempts',{attemptId:id,testId:tid,studentId:String(r.studentId),startedAt:now,submittedAt:'',answers:'{}',order:JSON.stringify(order),score:0,total:0,correct:0,wrong:0,skipped:0,status:'inprogress',strikes:0,flags:''});
  const a=find('Attempts',x=>String(x.attemptId)===id);log(r.studentId,'test_start',tid+' '+id);return resumeOf(a,t,r,now)}))}

function resumeOf(a,t,r,now){
 const order=jparse(a.order,[]),ids={};order.forEach(o=>ids[o.q]=1);const qm=qMap(ids);
 return{ok:true,attemptId:String(a.attemptId),testId:String(t.testId),title:String(t.title),mode:String(t.mode),proctor:String(t.proctor||'off'),marksPer:Number(t.marksPer)||1,negative:Number(t.negative)||0,
  instructions:String(t.instructions||''),deadline:deadlineOf(a,t),now,strikes:Number(a.strikes)||0,maxStrikes:maxStrikes(),answers:jparse(a.answers,{}),questions:paperOf(order,qm),student:String(r.name)}}

function ownAttempt(r,id){const a=find('Attempts',x=>String(x.attemptId)===String(id)&&String(x.studentId)===String(r.studentId));if(!a)throw new Error('Attempt not found');return a}
function attemptTest(a){if(String(a.testId)==='PRACTICE')return{testId:'PRACTICE',mode:'practice',marksPer:1,negative:0,proctor:'off',durationMin:0,end:0};const t=find('Tests',x=>String(x.testId)===String(a.testId));if(!t)throw new Error('Test not found');return t}
const cleanAns=(ans)=>{const o={};let len=0;if(ans&&typeof ans==='object')Object.keys(ans).slice(0,250).forEach(q=>{let v=String(ans[q]==null?'':ans[q]);
 if(v.length===1&&OPTK.indexOf(v.toLowerCase())>=0)v=v.toLowerCase();else v=v.replace(/\u0000/g,'').slice(0,3000);
 if(!v.trim())return;if(len+v.length>44000)return;len+=v.length+16;o[String(q).slice(0,12)]=v});return o};

function saveProgress(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const a=ownAttempt(r,b.attemptId);if(String(a.status)!=='inprogress')return{ok:true,status:String(a.status)};
  setRow('Attempts',a._row,{answers:JSON.stringify(cleanAns(b.answers))});return{ok:true,status:'inprogress'}})}

// Practice mein har jawab ke turant baad sahi/galat dikhane ke liye
function checkAnswer(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const a=ownAttempt(r,b.attemptId),t=attemptTest(a);if(String(t.mode)!=='practice')throw new Error('Not allowed in a test');
  const ord=jparse(a.order,[]);if(!ord.some(o=>o.q===String(b.qid)))throw new Error('Question not in this attempt');
  const q=find('Questions',x=>String(x.qid)===String(b.qid));if(!q)throw new Error('Question not found');const ans=jparse(a.answers,{}),k=String(b.ans).toLowerCase();
  if(OPTK.indexOf(k)<0)throw new Error('Invalid option');ans[String(b.qid)]=k;setRow('Attempts',a._row,{answers:JSON.stringify(ans)});
  return{ok:true,correct:k===String(q.correct),right:String(q.correct),explain:String(q.explain||'').trim()}})}

function resultOf(a,g,t){const mx=g.total||1;return{score:g.score,total:g.total,correct:g.correct,wrong:g.wrong,skipped:g.skipped,pending:Number(g.pending)||0,percent:Math.round(g.score*1000/mx)/10,status:String(a.status),mode:String(t.mode),
 timeTaken:Math.round((Date.now()-Number(a.startedAt))/1000)}}

function submitTest(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{const a=ownAttempt(r,b.attemptId),t=attemptTest(a);
  if(String(a.status)!=='inprogress'){return{ok:true,result:resultOf(a,{score:Number(a.score),total:Number(a.total),correct:Number(a.correct),wrong:Number(a.wrong),skipped:Number(a.skipped),pending:Number(a.pending)||0},t),already:true}}
  const late=String(t.mode)==='test'&&Date.now()>deadlineOf(a,t)+45000;
  const g=finishAttempt(a,t,late?null:cleanAns(b.answers),'submitted');log(r.studentId,'test_submit',a.attemptId+' '+g.score+'/'+g.total);
  return{ok:true,result:resultOf(find('Attempts',x=>String(x.attemptId)===String(a.attemptId)),g,t)}}))}

function attemptReview(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const a=ownAttempt(r,b.attemptId),t=attemptTest(a);if(String(a.status)==='inprogress')throw new Error('Submit the test first');
  if(String(t.mode)==='test'&&String(t.reveal)!=='submit'&&Date.now()<=Number(t.end))throw new Error('Answers open after the test ends for everyone ('+Utilities.formatDate(new Date(Number(t.end)),TZ,'d MMM, h:mm a')+')');
  const ans=jparse(a.answers,{}),grd=jparse(a.grades,{}),ord=jparse(a.order,[]),ids={};ord.forEach(o=>ids[o.q]=1);const qm=qMap(ids);
  return{ok:true,title:String(t.title),result:resultOf(a,{score:Number(a.score),total:Number(a.total),correct:Number(a.correct),wrong:Number(a.wrong),skipped:Number(a.skipped),pending:Number(a.pending)||0},t),
   review:ord.map(o=>{const q=qm[o.q];if(!q)return null;const full=qOf(q,true),by={};full.opts.forEach(x=>by[x.k]=x);const g=grd[o.q];return{qid:full.qid,text:full.text,type:full.type,marks:full.marks,opts:o.o.split('').map(k=>by[k]).filter(Boolean),correct:full.correct,explain:full.explain,keyAns:full.keyAns,mine:ans[o.q]||'',grade:g?{m:Number(g.m),c:String(g.c||'')}:null}}).filter(Boolean)}})}

// ---------------- proctoring ----------------
const COUNTED=['face_missing','multiple_faces','looking_away','tab_switch','fullscreen_exit','camera_off','camera_covered','window_blur'];
function proctorFolder(){const id=P.getProperty('PROCTOR_FOLDER_ID');if(id){try{return DriveApp.getFolderById(id)}catch(e){}}
 const f=DriveApp.createFolder('School Proctor (private)');P.setProperty('PROCTOR_FOLDER_ID',f.getId());return f}
function savePhoto(dataUrl,name){const m=String(dataUrl||'').match(/^data:image\/jpeg;base64,([A-Za-z0-9+\/=]+)$/);if(!m||m[1].length>220000)return '';
 try{return proctorFolder().createFile(Utilities.newBlob(Utilities.base64Decode(m[1]),'image/jpeg',name+'.jpg')).getId()}catch(e){return ''}}

function reportViolation(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{const a=ownAttempt(r,b.attemptId),t=attemptTest(a),type=clean(b.type,20),max=maxStrikes();
  if(String(a.status)!=='inprogress')return{ok:true,strikes:Number(a.strikes)||0,blocked:String(a.status)==='blocked',max};
  if(String(t.proctor||'off')==='off')return{ok:true,strikes:0,blocked:false,max};
  const vio=table('Violations').rows.filter(x=>String(x.attemptId)===String(a.attemptId)),now=Date.now();
  if(type==='snapshot'){if(vio.filter(x=>String(x.type)==='snapshot').length>=15)return{ok:true,strikes:Number(a.strikes)||0,blocked:false,max};
   const pid=savePhoto(b.photo,a.attemptId+'-s'+now);addRow('Violations',{id:'V'+Utilities.getUuid().replace(/-/g,'').slice(0,10),attemptId:a.attemptId,testId:a.testId,studentId:a.studentId,time:now,type:'snapshot',detail:'',photoId:pid});
   return{ok:true,strikes:Number(a.strikes)||0,blocked:false,max}}
  if(COUNTED.indexOf(type)<0)throw new Error('Unknown event');
  const last=vio.filter(x=>String(x.type)!=='snapshot').pop();
  if(last&&now-Number(last.time)<4000)return{ok:true,strikes:Number(a.strikes)||0,blocked:false,max,dup:true};       // ek hi ghatna ke do strike nahi
  const strikes=(Number(a.strikes)||0)+1,pid=savePhoto(b.photo,a.attemptId+'-'+now);
  addRow('Violations',{id:'V'+Utilities.getUuid().replace(/-/g,'').slice(0,10),attemptId:a.attemptId,testId:a.testId,studentId:a.studentId,time:now,type,detail:clean(b.detail,120),photoId:pid});
  setRow('Attempts',a._row,{strikes});
  if(strikes>=max){const g=finishAttempt(Object.assign({},a,{strikes}),t,cleanAns(b.answers),'blocked');setRow('Attempts',a._row,{strikes});
   log(r.studentId,'test_blocked',a.attemptId+' '+type);return{ok:true,strikes,blocked:true,max,result:resultOf(Object.assign({},a,{status:'blocked'}),g,t)}}
  return{ok:true,strikes,blocked:false,max}}))}

// Privacy: proctor photos 30 din baad Drive se hat jati hain (daily trigger: enableProctorCleanup chalao)
function purgeProctorPhotos(){const cut=Date.now()-30*86400000,s=tab('Violations'),v=s.getDataRange().getValues(),pc=SCHEMA.Violations.indexOf('photoId'),tc=SCHEMA.Violations.indexOf('time');let n=0;
 for(let i=1;i<v.length;i++){if(v[i][pc]&&Number(v[i][tc])<cut){try{DriveApp.getFileById(String(v[i][pc])).setTrashed(true)}catch(e){}s.getRange(i+1,pc+1).setValue('');n++}}return n}
function enableProctorCleanup(){if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='purgeProctorPhotos'))ScriptApp.newTrigger('purgeProctorPhotos').timeBased().atHour(3).everyDays(1).create();Logger.log('Proctor photo cleanup enabled')}

// ---------- Doubt Box: student asks -> AI tutor answers in the browser -> unresolved doubts go to the teacher ----------
const DOUBT_DAY_LIMIT=15;

const doubtView=(d,sn,cn,stn)=>({doubtId:String(d.doubtId),studentId:String(d.studentId),student:stn?stn[String(d.studentId)]||'':'',classId:String(d.classId),className:cn[String(d.classId)]||'',subjectId:String(d.subjectId),
 subject:sn[String(d.subjectId)]||'',chapter:String(d.chapter||''),question:String(d.question),aiAnswer:String(d.aiAnswer||''),status:String(d.status),teacherAnswer:String(d.teacherAnswer||''),
 answeredBy:String(d.answeredBy||''),date:Number(d.date),answeredAt:Number(d.answeredAt)||0});

function doubtOptions(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const cid=String(r.classId),ids={};table('Lessons').rows.forEach(l=>{if(String(l.classId)===cid)ids[String(l.subjectId)]=1});
  let subs=table('Subjects').rows.filter(x=>ids[String(x.subjectId)]);if(!subs.length)subs=table('Subjects').rows;
  const c=find('Classes',x=>String(x.classId)===cid);
  return{ok:true,className:c?String(c.name):'',subjects:subs.map(x=>({subjectId:String(x.subjectId),name:String(x.name)}))}})}

function askDoubt(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{
  const sub=String(b.subjectId||'');if(!find('Subjects',x=>String(x.subjectId)===sub))throw new Error('Choose a subject');
  const q=txt(b.question,800);if(q.length<5)throw new Error('Please write your doubt in a little more detail');
  const day=Date.now()-864e5,n=table('Doubts').rows.filter(d=>String(d.studentId)===String(r.studentId)&&Number(d.date)>day).length;
  if(n>=DOUBT_DAY_LIMIT)throw new Error('You have asked '+DOUBT_DAY_LIMIT+' doubts today. Please try again tomorrow.');
  const ai=txt(b.aiAnswer,4000),id=nextId('Doubts','doubtId','D');
  addRow('Doubts',{doubtId:id,studentId:String(r.studentId),classId:String(r.classId),subjectId:sub,chapter:txt(b.chapter,100),question:q,aiAnswer:ai,status:ai?'ai':'open',date:Date.now()});
  return{ok:true,doubtId:id,status:ai?'ai':'open'}}))}

function updateAiAnswer(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{const d=find('Doubts',x=>String(x.doubtId)===String(b.doubtId)&&String(x.studentId)===String(r.studentId));if(!d)throw new Error('Doubt not found');
  if(String(d.status)!=='ai')throw new Error('This doubt is already with your teacher');
  setRow('Doubts',d._row,{aiAnswer:txt(b.aiAnswer,4000)});return{ok:true}}))}

// student: resolve ("Got it") or forward to the teacher
function closeDoubt(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{const d=find('Doubts',x=>String(x.doubtId)===String(b.doubtId)&&String(x.studentId)===String(r.studentId));if(!d)throw new Error('Doubt not found');
  const st=String(d.status),act=String(b.do);
  if(act==='forward'){if(st!=='ai')throw new Error('Already sent to your teacher');setRow('Doubts',d._row,{status:'open'});return{ok:true,status:'open'}}
  if(act==='resolve'){if(st!=='ai'&&st!=='answered')throw new Error('Wait for your teacher to answer first');setRow('Doubts',d._row,{status:'resolved'});return{ok:true,status:'resolved'}}
  throw new Error('Invalid action')}))}

function myDoubts(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const sn=nameMap('Subjects','subjectId'),cn=nameMap('Classes','classId'),tn=nameMap('Users','userId');
  const list=table('Doubts').rows.filter(d=>String(d.studentId)===String(r.studentId)).reverse().slice(0,60).map(d=>{const v=doubtView(d,sn,cn);v.answeredBy=tn[v.answeredBy]||'Teacher';return v});
  return{ok:true,doubts:list}})}

const canSeeDoubt=(s,d)=>s.role==='admin'||isClassTeacher(s,String(d.classId))||teachesSub(s,String(d.classId),String(d.subjectId));

function listDoubts(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const want=String(b.status||'open'),sn=nameMap('Subjects','subjectId'),cn=nameMap('Classes','classId'),stn=nameMap('Students','studentId');
  const rows=table('Doubts').rows.filter(d=>(want==='all'||(want==='open'?String(d.status)==='open':String(d.status)==='answered'||String(d.status)==='resolved'&&String(d.teacherAnswer)!==''))&&canSeeDoubt(s,d));
  const open=table('Doubts').rows.filter(d=>String(d.status)==='open'&&canSeeDoubt(s,d)).length;
  return{ok:true,open,doubts:rows.reverse().slice(0,80).map(d=>doubtView(d,sn,cn,stn))}})}

function answerDoubt(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const d=find('Doubts',x=>String(x.doubtId)===String(b.doubtId));if(!d||!canSeeDoubt(s,d))throw new Error('Doubt not found');
  const a=txt(b.answer,2000);if(a.length<2)throw new Error('Please write an answer');
  setRow('Doubts',d._row,{teacherAnswer:a,answeredBy:s.userId,answeredAt:Date.now(),status:'answered'});log(s.userId,'doubt_answered',d.doubtId);return{ok:true}}))}

// ---------- Weak-topic report + study planner (all computed from test/practice attempts) ----------
const WEAK_PCT=60,STRONG_PCT=80,MIN_ATT=3;
const istDay=ms=>new Date(Number(ms)+19800000).toISOString().slice(0,10);
const chOf=q=>(String(q.chapter||'General').trim()||'General');

// returns {studentId:{"sub|chapter":{subjectId,chapter,att,cor}}, days:{studentId:{day:1}}, today:{studentId:{"sub|chapter":1}}}
function topicStats(sids){
 const want={};sids.forEach(x=>want[String(x)]=1);const QM=qMap(),out={},days={},today={},td=istDay(Date.now());
 const per={};table('Attempts').rows.forEach(a=>{const sid=String(a.studentId);if(!want[sid])return;(per[sid]=per[sid]||[]).push(a)});
 Object.keys(per).forEach(sid=>{
  days[sid]={};today[sid]={};const m=out[sid]={};
  per[sid].forEach(a=>{const st=String(a.status);if(st==='reset'||!Number(a.startedAt))return;const d=istDay(a.startedAt);days[sid][d]=1;
   if(st!=='submitted')return;
   const ord=jparse(a.order,[]),ans=jparse(a.answers,{}),gr=jparse(a.grades,{});
   ord.forEach(o=>{const q=QM[o.q];if(!q)return;const ty=String(q.type||'mcq'),k=String(q.subjectId)+'|'+chOf(q);
    if(d===td)today[sid][k]=1;
    let att=0,cor=0;
    if(ty==='mcq'){att=1;cor=ans[o.q]&&ans[o.q]===String(q.correct)?1:0}
    else{const g=gr[o.q];if(!ans[o.q]||!g||g.m===undefined)return;const mk=Number(q.marks)||5;att=1;cor=Math.min(1,Math.max(0,Number(g.m)/mk))}
    const e=m[k]=m[k]||{subjectId:String(q.subjectId),chapter:chOf(q),att:0,cor:0};e.att+=att;e.cor+=cor})})});
 return{stats:out,days,today}}

const levelOf=(att,pct)=>att<MIN_ATT?'new':(pct<WEAK_PCT?'weak':(pct<STRONG_PCT?'mid':'strong'));

function streakOf(daysSet){
 let d=Date.now(),n=0;const has=ms=>!!daysSet[istDay(ms)];
 if(!has(d))d-=864e5;           // today not studied yet: streak is still alive until midnight
 while(has(d)){n++;d-=864e5}return n}

function myStudy(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{
  const sid=String(r.studentId),cid=String(r.classId),sn=nameMap('Subjects','subjectId'),T=topicStats([sid]),mine=T.stats[sid]||{};
  const bank={};table('Questions').rows.filter(q=>String(q.classId)===cid&&String(q.type||'mcq')==='mcq').forEach(q=>{const k=String(q.subjectId)+'|'+chOf(q);bank[k]=(bank[k]||0)+1});
  const topics=Object.keys(bank).map(k=>{const e=mine[k]||{subjectId:k.split('|')[0],chapter:k.slice(k.indexOf('|')+1),att:0,cor:0},pct=e.att?Math.round(e.cor/e.att*100):0;
   return{subjectId:e.subjectId,subject:sn[e.subjectId]||e.subjectId,chapter:e.chapter,att:e.att,pct,level:levelOf(e.att,pct),available:bank[k],doneToday:!!(T.today[sid]&&T.today[sid][k])}});
  const rank={weak:0,new:1,mid:2,strong:3};topics.sort((a,b)=>(rank[a.level]-rank[b.level])||(a.pct-b.pct)||(b.available-a.available));
  const focus=topics.filter(t=>t.level!=='strong');
  // today's tasks rotate through the focus list so every day brings different topics
  const dayN=Math.floor((Date.now()+19800000)/864e5),pick=(i,n)=>{const out=[];if(!focus.length)return out;for(let j=0;j<Math.min(n,focus.length);j++)out.push(focus[(i*n+j)%focus.length]);return out};
  const task=t=>({subjectId:t.subjectId,subject:t.subject,chapter:t.chapter,pct:t.pct,level:t.level,count:Math.min(10,t.available),doneToday:t.doneToday});
  const todayTasks=pick(dayN,3).map(task);
  const exams=table('Exams').rows.filter(e=>String(e.classId)===cid&&dstr(e.date)>=todayStr()).sort((a,b)=>dstr(a.date).localeCompare(dstr(b.date))).slice(0,3)
   .map(e=>({title:String(e.title),date:dstr(e.date),daysLeft:Math.round((new Date(dstr(e.date)+'T00:00:00+05:30')-new Date(todayStr()+'T00:00:00+05:30'))/864e5)}));
  const week=[];for(let i=0;i<7;i++){const dt=new Date(Date.now()+19800000+i*864e5).toISOString().slice(0,10);week.push({date:dt,tasks:pick(dayN+i,3).map(t=>({subject:t.subject,chapter:t.chapter,subjectId:t.subjectId}))})}
  const att=topics.reduce((x,t)=>x+t.att,0),cor=topics.reduce((x,t)=>x+t.pct*t.att/100,0),days=T.days[sid]||{};
  table('CardProgress').rows.forEach(p=>{if(String(p.studentId)===sid&&Number(p.last))days[istDay(p.last)]=1});
  let best=0,run=0;Object.keys(days).sort().forEach((d,i,a)=>{run=(i&&(new Date(d)-new Date(a[i-1]))===864e5)?run+1:1;best=Math.max(best,run)});
  return{ok:true,streak:streakOf(days),bestStreak:best,studiedToday:!!days[istDay(Date.now())],overall:att?Math.round(cor/att*100):null,answered:att,topics,today:todayTasks,exams,week}})}

// teacher/admin: weak topics of a class + students who need help
function classInsights(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const cid=String(b.classId||'');if(!canClass(s,cid))throw new Error('Not allowed for this class');
  const subF=String(b.subjectId||''),sn=nameMap('Subjects','subjectId'),sts=activeStudents(cid),T=topicStats(sts.map(x=>x.studentId)),agg={},per=[];
  sts.forEach(st=>{const m=T.stats[String(st.studentId)]||{};let att=0,cor=0,weak=[];
   Object.keys(m).forEach(k=>{const e=m[k];if(!teachesSub(s,cid,e.subjectId)||(subF&&e.subjectId!==subF))return;att+=e.att;cor+=e.cor;const pct=Math.round(e.cor/e.att*100);
    const a=agg[k]=agg[k]||{subjectId:e.subjectId,subject:sn[e.subjectId]||e.subjectId,chapter:e.chapter,students:0,sum:0,weak:0};
    if(e.att>=MIN_ATT){a.students++;a.sum+=pct;if(pct<WEAK_PCT){a.weak++;weak.push({t:(sn[e.subjectId]||'')+' · '+e.chapter,pct})}}});
   per.push({studentId:String(st.studentId),name:String(st.name),roll:String(st.roll||''),answered:att,pct:att?Math.round(cor/att*100):null,weakCount:weak.length,weakTopics:weak.sort((x,y)=>x.pct-y.pct).slice(0,3).map(w=>w.t+' ('+w.pct+'%)')})});
  const topics=Object.keys(agg).map(k=>agg[k]).filter(a=>a.students>0).map(a=>({subjectId:a.subjectId,subject:a.subject,chapter:a.chapter,students:a.students,avg:Math.round(a.sum/a.students),weak:a.weak,level:levelOf(MIN_ATT,a.sum/a.students)})).sort((x,y)=>x.avg-y.avg);
  const active=per.filter(p=>p.answered>0);
  return{ok:true,total:sts.length,active:active.length,avg:active.length?Math.round(active.reduce((x,p)=>x+p.pct,0)/active.length):null,topics,
   needHelp:per.filter(p=>p.weakCount>0).sort((x,y)=>(y.weakCount-x.weakCount)||(x.pct-y.pct)).slice(0,20),inactive:per.filter(p=>!p.answered).map(p=>p.name).slice(0,30)}})}

// ---------- Flashcards: teacher cards + question-bank cards, spaced repetition (Leitner boxes) ----------
const BOX_DAYS=[0,0,1,3,7,14];                       // box 1..5 -> days until next review
const dayNo=()=>Math.floor((Date.now()+19800000)/864e5);

function cardCheck(s,d){
 const cid=resolveClass(d.classId),sub=clean(d.subjectId,20);
 if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
 if(!find('Subjects',x=>String(x.subjectId)===sub))throw new Error('Select a subject');
 if(!teachesSub(s,cid,sub))throw new Error('You do not teach this subject in this class');
 const front=txt(d.front,300),back=txt(d.back,600);if(front.length<2||back.length<1)throw new Error('Both front and back are required');
 return{classId:cid,subjectId:sub,chapter:txt(d.chapter,100),front,back}}

function listCards(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const cid=resolveClass(b.classId);if(!cid||!canClass(s,cid))throw new Error('Not allowed for this class');const sub=String(b.subjectId||''),sn=nameMap('Subjects','subjectId');
  const rows=table('Flashcards').rows.filter(c=>String(c.classId)===cid&&(!sub||String(c.subjectId)===sub)&&teachesSub(s,cid,String(c.subjectId)));
  return{ok:true,cards:rows.reverse().slice(0,300).map(c=>({cardId:String(c.cardId),subjectId:String(c.subjectId),subject:sn[String(c.subjectId)]||'',chapter:String(c.chapter||''),front:String(c.front),back:String(c.back),mine:s.role==='admin'||String(c.createdBy)===s.userId})),
   fromBank:table('Questions').rows.filter(q=>String(q.classId)===cid&&String(q.type||'mcq')==='mcq'&&(!sub||String(q.subjectId)===sub)).length}})}

function saveCard(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const d=b.card||{},o=cardCheck(s,d);
  if(d.cardId){const ex=find('Flashcards',x=>String(x.cardId)===String(d.cardId));if(!ex)throw new Error('Card not found');
   if(s.role!=='admin'&&String(ex.createdBy)!==s.userId)throw new Error('You can edit only your own cards');setRow('Flashcards',ex._row,o);return{ok:true,cardId:String(ex.cardId)}}
  const id=nextId('Flashcards','cardId','F');addRow('Flashcards',Object.assign(o,{cardId:id,createdBy:s.userId,date:todayStr()}));return{ok:true,cardId:id}}))}

function importCards(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const rows=Array.isArray(b.rows)?b.rows.slice(0,100):[];if(!rows.length)throw new Error('Nothing to import');
  let id=0;table('Flashcards').rows.forEach(r=>{const v=parseInt(String(r.cardId).slice(1),10);if(v>id)id=v});const list=[],errs=[];
  rows.forEach((r,i)=>{try{const o=cardCheck(s,Object.assign({},r,{classId:b.classId,subjectId:b.subjectId,chapter:r.chapter||b.chapter}));id++;list.push(Object.assign(o,{cardId:'F'+String(id).padStart(5,'0'),createdBy:s.userId,date:todayStr()}))}catch(e){errs.push('Row '+(i+1)+': '+e.message)}});
  addRows('Flashcards',list);log(s.userId,'cards_import',list.length+' added');return{ok:true,added:list.length,errors:errs.slice(0,10)}}))}

function deleteCard(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const ex=find('Flashcards',x=>String(x.cardId)===String(b.cardId));if(!ex)throw new Error('Card not found');
  if(s.role!=='admin'&&String(ex.createdBy)!==s.userId)throw new Error('You can delete only your own cards');tab('Flashcards').deleteRow(ex._row);return{ok:true}}))}

// all cards a student can revise: teacher cards + every MCQ in the class question bank
function deckOf(cid){
 const sn=nameMap('Subjects','subjectId'),out=[];
 table('Flashcards').rows.filter(c=>String(c.classId)===cid).forEach(c=>out.push({key:'C:'+c.cardId,subjectId:String(c.subjectId),chapter:chOf(c),front:String(c.front),back:String(c.back)}));
 table('Questions').rows.filter(q=>String(q.classId)===cid&&String(q.type||'mcq')==='mcq').forEach(q=>{const f=qOf(q,true),right=f.opts.find(o=>o.k===f.correct);if(!right)return;
  out.push({key:'Q:'+q.qid,subjectId:f.subjectId,chapter:chOf(q),front:f.text,back:right.t+(f.explain?'\n'+f.explain:'')})});
 out.forEach(c=>c.subject=sn[c.subjectId]||c.subjectId);return out}

function myDeck(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const sid=String(r.studentId),cid=String(r.classId),all=deckOf(cid),today=dayNo(),sub=String(b.subjectId||''),ch=String(b.chapter||'');
  const prog={};table('CardProgress').rows.filter(p=>String(p.studentId)===sid).forEach(p=>prog[String(p.key)]=p);
  const T=topicStats([sid]).stats[sid]||{},lvl=c=>{const e=T[c.subjectId+'|'+c.chapter];return e&&e.att>=MIN_ATT?(e.cor/e.att<WEAK_PCT/100?0:1):2};
  const view=all.map(c=>{const p=prog[c.key],box=p?Number(p.box)||1:0,due=p?Number(p.due)||0:0;return Object.assign({},c,{box,isNew:!p,isDue:!!p&&due<=today,weak:lvl(c)===0})});
  const pool=view.filter(c=>(!sub||c.subjectId===sub)&&(!ch||c.chapter===ch));
  const summary={total:pool.length,due:pool.filter(c=>c.isDue).length,fresh:pool.filter(c=>c.isNew).length,mastered:pool.filter(c=>c.box>=5).length};
  // session: due cards (weak topics first, low box first), then new cards (weak topics first), shuffled inside each group
  const rnd=()=>Math.random()-.5,ord=(a,b2)=>(b2.weak-a.weak)||(a.box-b2.box)||rnd();
  const due=pool.filter(c=>c.isDue).sort(ord),fresh=pool.filter(c=>c.isNew).sort((a,b2)=>(b2.weak-a.weak)||rnd());
  const n=Math.min(30,Math.max(5,Number(b.count)||10)),deck=due.concat(fresh).slice(0,n).map(c=>({key:c.key,subject:c.subject,chapter:c.chapter,front:c.front,back:c.back,box:c.box,isNew:c.isNew}));
  const tmap={};view.forEach(c=>{const k=c.subjectId;const o=tmap[k]=tmap[k]||{subjectId:k,subject:c.subject,chapters:{}};o.chapters[c.chapter]=(o.chapters[c.chapter]||0)+1});
  return{ok:true,summary,deck,subjects:Object.keys(tmap).map(k=>({subjectId:k,subject:tmap[k].subject,chapters:Object.keys(tmap[k].chapters).sort()}))}})}

// results: [{key,knew}] -> Leitner box move
function reviewCards(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{const sid=String(r.studentId),cid=String(r.classId),res=Array.isArray(b.results)?b.results.slice(0,40):[],valid={};deckOf(cid).forEach(c=>valid[c.key]=1);
  const prog={};table('CardProgress').rows.filter(p=>String(p.studentId)===sid).forEach(p=>prog[String(p.key)]=p);const today=dayNo(),add=[];let n=0;
  res.forEach(x=>{const k=String(x.key||'');if(!valid[k])return;const p=prog[k],box=p?Number(p.box)||1:1,nb=x.knew?Math.min(5,box+1):1,o={box:nb,due:today+BOX_DAYS[nb],last:Date.now()};n++;
   if(p){setRow('CardProgress',p._row,o)}else{add.push(Object.assign({studentId:sid,key:k},o));prog[k]={}}});
  if(add.length)addRows('CardProgress',add);return{ok:true,saved:n}}))}

// Phase 7: website enquiry form (public, bina login) + admin inbox. Email owner ko jaati hai (ya Settings tab: key notify_email).
const ENQ_STATUS=['new','contacted','closed'];
function enqMail(){
 const st=find('Settings',x=>String(x.key)==='notify_email'),v=st&&clean(st.value,100);
 if(v)return v;try{return Session.getEffectiveUser().getEmail()}catch(e){return ''}}
// Editor mein ek baar chalao: Gmail permission maangega (Allow karo) aur test email bhejega. Phir Deploy -> Manage deployments -> Edit -> New version.
function testEnquiryEmail(){
 const to=enqMail();if(!to)throw new Error('Email not found. In the Settings sheet add key=notify_email and your email as the value.');
 MailApp.sendEmail({to,subject:'Test: school website enquiry email',body:'If you received this mail, enquiry emails are working.'});
 Logger.log('Test email bheja: '+to+' | Daily quota left: '+MailApp.getRemainingDailyQuota())}
function enqLimit(key,max,secs){const c=CacheService.getScriptCache(),n=Number(c.get(key)||0);if(n>=max)return false;c.put(key,String(n+1),secs);return true}

// Purane sheet mein 7-10 columns (type, role, email, details) apne aap jud jate hain.
function enqCols(){const sh=tab('Enquiries'),add=['type','role','email','details'],h=sh.getRange(1,7,1,4).getValues()[0];add.forEach((k,i)=>{if(String(h[i])!==k)sh.getRange(1,7+i).setValue(k)})}
const ENQ_TYPES={admission:'Admission enquiry',complaint:'Complaint',review:'Review',general:'Question'},ENQ_ROLES=['parent','student','teacher','visitor','alumni'];
const ENQ_DETAIL={admission:['child','cls'],complaint:['cat','cls','urgent'],review:['rating','title','show'],general:['topic']};
function enquiry(b){
 return safe(()=>{
  if(clean(b.website,50))return{ok:true};   // honeypot: bot ko "ok" dikhao, kuch save mat karo
  const type=ENQ_TYPES[b.type]?b.type:'admission',role=ENQ_ROLES.indexOf(b.role)>=0?b.role:'visitor';
  const name=clean(b.name,60),phone=clean(b.phone,15).replace(/[\s\-()]/g,''),email=clean(b.email,80),msg=clean(b.message,1000);
  if(name.length<2)throw new Error('Please enter a name');
  if((phone||type!=='review')&&!/^\+?\d{8,14}$/.test(phone))throw new Error('Enter a valid phone number');
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))throw new Error('Please enter a valid email');
  if(msg.length<3&&type!=='admission')throw new Error('Please write a message');
  const d={};(ENQ_DETAIL[type]||[]).forEach(k=>{const v=clean(b.details&&b.details[k],120);if(v)d[k]=v});
  if(type==='review'){const r=parseInt(d.rating,10);if(!(r>=1&&r<=5))throw new Error('Rating (stars) chuniye');d.rating=String(r)}
  if(!enqLimit('enq_all',60,3600)||!enqLimit('enq_'+(phone||email||name),3,3600))throw new Error('Too many requests. Please try again later');
  const details=JSON.stringify(d);
  const id=withLock(()=>{enqCols();const i=nextId('Enquiries','id','Q',4);addRow('Enquiries',{id:i,name,phone,message:msg,time:new Date(),status:'new',type,role,email,details});return i});
  log('public','enquiry_'+type,id);
  try{const to=enqMail();if(to)MailApp.sendEmail({to,subject:'['+ENQ_TYPES[type]+'] '+id+': '+name,body:'Type: '+ENQ_TYPES[type]+'\nFrom: '+role+'\nName: '+name+'\nPhone: '+phone+'\nEmail: '+email+'\nDetails: '+Object.keys(d).map(k=>k+'='+d[k]).join(', ')+'\n\n'+msg+'\n\n(See Admin panel > Enquiries)'})}catch(e){log('system','enquiry_mail_fail',String(e.message||e).slice(0,100))}
  return{ok:true}})}

function enqTime(t){if(t instanceof Date)return Utilities.formatDate(t,'Asia/Kolkata','yyyy-MM-dd HH:mm');return String(t||'')}
function listEnquiries(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>{const rows=table('Enquiries').rows.map(r=>{let d={};try{d=JSON.parse(String(r.details||'{}'))}catch(e){}return{id:String(r.id),name:String(r.name),phone:String(r.phone),message:String(r.message),time:enqTime(r.time),status:String(r.status)||'new',type:ENQ_TYPES[r.type]?String(r.type):'admission',role:String(r.role||''),email:String(r.email||''),details:d}});
  rows.sort((a,b)=>a.id<b.id?1:-1);return{ok:true,enquiries:rows.slice(0,500),newCount:rows.filter(r=>r.status==='new').length}})}
function updateEnquiry(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const r=find('Enquiries',x=>String(x.id)===String(b.id));if(!r)throw new Error('Enquiry not found');
  if(b.delete){tab('Enquiries').deleteRow(r._row);log(s.userId,'enquiry_delete',r.id);return{ok:true}}
  if(ENQ_STATUS.indexOf(b.status)<0)throw new Error('Invalid status');
  enqCols();setRow('Enquiries',r._row,{status:b.status});log(s.userId,'enquiry_'+b.status,r.id);return{ok:true}}))}

// Dashboard: admin ke counts (Phase 2). Logs/charts Phase 9 me.
function dashboardStats(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 const st=table('Students').rows.filter(r=>String(r.status).toLowerCase()==='active'),cnt={};
 st.forEach(r=>cnt[String(r.classId)]=(cnt[String(r.classId)]||0)+1);
 const classes=table('Classes').rows;
 return{ok:true,stats:{
  students:st.length,
  teachers:table('Users').rows.filter(r=>r.role==='teacher'&&String(r.active).toUpperCase()==='TRUE').length,
  classes:classes.length,
  newEnquiries:table('Enquiries').rows.filter(r=>String(r.status)==='new').length,
  today:todayAtt(),monthFees:monthFees(),
  byClass:classes.map(c=>({classId:String(c.classId),name:c.name,count:cnt[String(c.classId)]||0}))}}}

// Aaj ki attendance (latest row per student) aur is mahine ki fee collection (void rows judti hain)
function todayAtt(){const t=todayStr(),by={};table('Attendance').rows.forEach(r=>{if(dstr(r.date)===t)by[String(r.studentId)]=String(r.status).toUpperCase()});
 const act={};table('Students').rows.forEach(r=>{if(String(r.status).toLowerCase()==='active')act[String(r.studentId)]=1});
 let p=0,a=0;Object.keys(by).forEach(k=>{if(!act[k])return;if(by[k]==='A')a++;else if(by[k]==='P'||by[k]==='L')p++});
 return{present:p,absent:a,marked:p+a,total:Object.keys(act).length}}
function monthFees(){const m=todayStr().slice(0,7);let sum=0;table('Payments').rows.forEach(r=>{if(dstr(r.date).slice(0,7)===m)sum+=Number(r.amount)||0});return Math.round(sum*100)/100}

function listLogs(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>{const q=clean(b.q,40).toLowerCase(),rows=table('Logs').rows.map(r=>({time:r.time instanceof Date?Utilities.formatDate(r.time,'Asia/Kolkata','yyyy-MM-dd HH:mm'):String(r.time),userId:String(r.userId),action:String(r.action),details:String(r.details)}));
  const f=q?rows.filter(r=>(r.userId+' '+r.action+' '+r.details).toLowerCase().indexOf(q)>=0):rows;
  return{ok:true,logs:f.slice(-300).reverse(),total:f.length}})}

// Backup: poori Sheet ki copy Drive ke "School Backups" folder mein. Purani copies (14 se zyada) trash ho jaati hain.
const BACKUP_KEEP=14;
function runBackup(by){
 const ss=SpreadsheetApp.getActive(),it=DriveApp.getFoldersByName('School Backups'),dir=it.hasNext()?it.next():DriveApp.createFolder('School Backups');
 const name=ss.getName()+' backup '+Utilities.formatDate(new Date(),'Asia/Kolkata','yyyy-MM-dd HH:mm');
 const f=DriveApp.getFileById(ss.getId()).makeCopy(name,dir);
 const files=[],all=dir.getFiles();while(all.hasNext())files.push(all.next());
 files.sort((a,b)=>b.getDateCreated()-a.getDateCreated());
 let removed=0;files.slice(BACKUP_KEEP).forEach(x=>{x.setTrashed(true);removed++});
 log(by,'backup',name+(removed?' (purani '+removed+' hataai)':''));
 return{name,url:f.getUrl(),removed,kept:Math.min(files.length,BACKUP_KEEP)}}
function backupNow(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>Object.assign({ok:true},runBackup(s.userId)))}
function autoBackup(){try{runBackup('system')}catch(e){log('system','backup_fail',String(e.message||e).slice(0,120))}}
// Editor mein ek baar chalao: roz raat auto backup
function enableAutoBackup(){
 if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='autoBackup'))ScriptApp.newTrigger('autoBackup').timeBased().atHour(2).everyDays(1).create();
 runBackup('system')}

// AI assistant on/off + naam (Settings sheet: ai_enabled = on/off, ai_name). Sab roles padh sakte hain, sirf admin badal sakta hai.
function aiRead(){const g=k=>{const r=find('Settings',x=>String(x.key)===k);return r?String(r.value):''};
 const en=g('ai_enabled').toLowerCase();return{on:en!=='off',name:clean(g('ai_name'),20)||'Tuto'}}
function aiGet(b){
 const s=guard(b,['admin','teacher','student']);if(!s)return DENIED;
 return safe(()=>Object.assign({ok:true},aiRead()))}
function aiSave(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const put=(k,v)=>{const r=find('Settings',x=>String(x.key)===k);if(r)setRow('Settings',r._row,{key:k,value:v});else addRow('Settings',{key:k,value:v})};
  put('ai_enabled',b.on===false||b.on==='off'?'off':'on');
  const nm=clean(b.name,20);if(nm)put('ai_name',nm);
  log(s.userId,'ai_settings',b.on===false?'off':'on');return Object.assign({ok:true},aiRead())}))}

