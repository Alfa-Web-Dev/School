const VERSION='0.1.0';
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
 Enquiries:['id','name','phone','message','time','status'],
 Notes:['noteId','classId','subjectId','chapter','title','fileId','fileName','mime','size','uploadedBy','date'],
 Tokens:['tokenHash','userId','role','expires'],
 Notes:['noteId','classId','subjectId','chapter','title','fileId','mime','size','uploadedBy','date'],
 Logs:['time','userId','action','details']
};
const out=o=>ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const tab=n=>SpreadsheetApp.getActive().getSheetByName(n);
function table(n){const v=tab(n).getDataRange().getValues(),h=v.shift().map(String);
 return{h,rows:v.map((r,i)=>{const o={_row:i+2};h.forEach((k,j)=>o[k]=r[j]);return o})}}
const find=(n,fn)=>table(n).rows.find(fn);
function log(uid,action,details){tab('Logs').appendRow([new Date(),uid||'',action,details||''])}

const SESSION_HOURS=6,MAX_FAILS=5,LOCK_SEC=900;
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
 if(Number(cache.get(key)||0)>=MAX_FAILS)return{ok:false,error:'Bahut galat koshish. 15 minute baad try karo.'};
 const u=lookup(role,id);
 if(!(u&&u.active&&hashSecret(secret,u.salt)===u.hash)){
  cache.put(key,String(Number(cache.get(key)||0)+1),LOCK_SEC);
  log(id,'login_fail',role);Utilities.sleep(800);
  return{ok:false,error:'ID ya password galat hai.'}}
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
 const s=session(b.token);if(!s)return{ok:false,error:'expired'};
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
 if(!id||!pw)throw 'FIRST_ADMIN_ID aur FIRST_ADMIN_PASSWORD Script Properties me daalo';
 if(find('Users',r=>String(r.userId)===id))throw 'Yeh admin pehle se hai';
 const f=setSecretFields(pw);
 tab('Users').appendRow([id,name,'admin','','',f.hash,f.salt,true]);
 P.deleteProperty('FIRST_ADMIN_PASSWORD');
 Logger.log('Admin ban gaya. Password property hata di gayi.')}

// Notes ke liye Drive folder (ek baar editor se chalao; pehli baar Drive permission maangega)
function setupDrive(){
 const old=P.getProperty('NOTES_FOLDER_ID');
 if(old){try{DriveApp.getFolderById(old);Logger.log('Notes folder pehle se hai: '+old);return}catch(e){}}
 const f=DriveApp.createFolder('School Notes');P.setProperty('NOTES_FOLDER_ID',f.getId());
 Logger.log('Notes folder ban gaya: '+f.getUrl())}

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
const ROUTES={noteOptions:'noteOptions',listNotes:'listNotes',uploadNote:'uploadNote',updateNote:'updateNote',deleteNote:'deleteNote',uploadNote:'uploadNote',listNotes:'listNotes',updateNote:'updateNote',deleteNote:'deleteNote',noteSubjects:'noteSubjects',deleteFee:'deleteFee',studentFees:'studentFees',voidPayment:'voidPayment',getReceipt:'getReceipt',defaulters:'defaulters',getMarks:'getMarks',deleteAssignment:'deleteAssignment',deleteLesson:'deleteLesson',deleteClassNotice:'deleteClassNotice',teacherHome:'teacherHome',resetSecret:'resetSecret',myDashboard:'myDashboard',myProfile:'myProfile',myAttendance:'myAttendance',myFees:'myFees',myResults:'myResults',myTimetable:'myTimetable',myHomework:'myHomework',myNotices:'myNotices',changeSecret:'changeSecret',listStudents:'listStudents',saveStudent:'saveStudent',importStudents:'importStudents',promoteStudents:'promoteStudents',listTeachers:'listTeachers',saveTeacher:'saveTeacher',listClasses:'listClasses',saveClass:'saveClass',listSubjects:'listSubjects',saveSubject:'saveSubject',listLessons:'listLessons',saveLesson:'saveLesson',listClassNotices:'listClassNotices',saveClassNotice:'saveClassNotice',getAttendance:'getAttendance',markAttendance:'markAttendance',listAssignments:'listAssignments',saveAssignment:'saveAssignment',getFeeStructure:'getFeeStructure',saveFeeStructure:'saveFeeStructure',listPayments:'listPayments',addPayment:'addPayment',listExams:'listExams',adminExams:'adminExams',deleteExam:'deleteExam',reportCard:'reportCard',saveExam:'saveExam',getResults:'getResults',saveMarks:'saveMarks',enquiry:'enquiry',listEnquiries:'listEnquiries',updateEnquiry:'updateEnquiry',dashboardStats:'dashboardStats',listLogs:'listLogs',backupNow:'backupNow'};

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

// Students (Phase 2): list, add/edit, CSV import, promote
function saveStudentCore(d,actor){
 const name=clean(d.name,80);if(!name)throw new Error('Name zaruri hai');
 const classId=resolveClass(d.classId);if(!classId)throw new Error('Class nahi mili: '+clean(d.classId,30));
 const gender=clean(d.gender,1).toUpperCase();
 if(gender&&'MFO'.indexOf(gender)<0)throw new Error('Gender M/F/O hona chahiye');
 const dob=clean(d.dob,10);if(dob&&!/^\d{4}-\d{2}-\d{2}$/.test(dob))throw new Error('DOB format YYYY-MM-DD hona chahiye');
 const status=clean(d.status,15)||'active';
 const ex=d.studentId?find('Students',r=>String(r.studentId)===String(d.studentId)):null;
 if(d.studentId&&!ex)throw new Error('Student nahi mila');
 const admNo=clean(d.admNo,20);
 if(admNo&&find('Students',r=>String(r.admNo)===admNo&&(!ex||r._row!==ex._row)))throw new Error('Admission no pehle se hai: '+admNo);
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
  if(!from||!to)throw new Error('Class galat hai');if(from===to)throw new Error('Dono class same hain');
  let n=0;table('Students').rows.forEach(r=>{
   if(String(r.classId)===from&&String(r.status).toLowerCase()==='active'){
    setRow('Students',r._row,to==='PASSOUT'?{status:'passed-out'}:{classId:to,roll:''});n++}});
  log(s.userId,'promote',from+'->'+to+' ('+n+')');
  return{ok:true,moved:n}}))}

// Teachers (Phase 2) + PIN/password reset
function listTeachers(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return{ok:true,teachers:table('Users').rows.filter(r=>r.role==='teacher').map(r=>strip(r,['passHash','salt']))}}

function saveTeacher(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.teacher||{},name=clean(d.name,80);if(!name)throw new Error('Name zaruri hai');
  const o={name,phone:clean(d.phone,15).replace(/[^\d+]/g,''),email:clean(d.email,80),active:d.active===false||String(d.active)==='false'?false:true};
  if(d.userId){const ex=find('Users',r=>String(r.userId)===String(d.userId)&&r.role==='teacher');
   if(!ex)throw new Error('Teacher nahi mila');
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
  if(!m)throw new Error('kind galat hai');
  const r=find(m[0],x=>String(x[m[1]])===id&&(kind!=='teacher'||x.role==='teacher'));
  if(!r)throw new Error('Record nahi mila');
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
function listClasses(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return{ok:true,classes:table('Classes').rows.map(c=>strip(c,[])),subjects:table('Subjects').rows.map(c=>strip(c,[]))}}
function listSubjects(b){return listClasses(b)}

function saveClass(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.cls||{},grade=clean(d.grade,3),section=clean(d.section,3).toUpperCase();
  if(!grade)throw new Error('Grade zaruri hai');
  const name=clean(d.name,40)||('Class '+grade+(section?' - '+section:''));
  const tid=clean(d.classTeacherId,20);
  if(tid&&!find('Users',r=>String(r.userId)===tid&&r.role==='teacher'))throw new Error('Class teacher nahi mila');
  const o={name,grade,section,classTeacherId:tid};
  if(d.classId){const ex=find('Classes',r=>String(r.classId)===String(d.classId));
   if(!ex)throw new Error('Class nahi mili');setRow('Classes',ex._row,o);log(s.userId,'class_edit',ex.classId);return{ok:true,classId:String(ex.classId)}}
  const id=('C'+grade+section).replace(/\s/g,'').toUpperCase();
  if(find('Classes',r=>String(r.classId)===id))throw new Error('Yeh class pehle se hai: '+id);
  addRow('Classes',Object.assign(o,{classId:id}));log(s.userId,'class_add',id);return{ok:true,classId:id}}))}

function saveSubject(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.subject||{},name=clean(d.name,40);if(!name)throw new Error('Subject ka naam zaruri hai');
  if(d.subjectId){const ex=find('Subjects',r=>String(r.subjectId)===String(d.subjectId));
   if(!ex)throw new Error('Subject nahi mila');setRow('Subjects',ex._row,{name});return{ok:true,subjectId:String(ex.subjectId)}}
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
  if(!cid)throw new Error('Class chuno');if(!find('Subjects',x=>String(x.subjectId)===sub))throw new Error('Subject chuno');
  if(!find('Users',u=>String(u.userId)===tid&&u.role==='teacher'))throw new Error('Teacher chuno');
  if(DAYS.indexOf(day)<0)throw new Error('Din chuno');if(!validTime(st)||!validTime(en))throw new Error('Time HH:MM format mein do (jaise 09:30)');
  if(st>=en)throw new Error('End time start ke baad hona chahiye');
  const me=String(d.lessonId||'');
  const clash=table('Lessons').rows.find(l=>String(l.lessonId)!==me&&String(l.day)===day&&String(l.start)<en&&st<String(l.end)&&(String(l.classId)===cid||String(l.teacherId)===tid));
  if(clash)throw new Error(String(clash.classId)===cid?'Is class ka us time pe doosra period hai ('+clash.lessonId+')':'Yeh teacher us time pe doosri class mein hai ('+clash.lessonId+')');
  const o={classId:cid,subjectId:sub,teacherId:tid,day,start:st,end:en};
  if(me){const ex=find('Lessons',l=>String(l.lessonId)===me);if(!ex)throw new Error('Lesson nahi mila');setRow('Lessons',ex._row,o);return{ok:true,lessonId:me}}
  const id=nextId('Lessons','lessonId','L',3);addRow('Lessons',Object.assign(o,{lessonId:id}));log(s.userId,'lesson_add',id);return{ok:true,lessonId:id}}))}

function deleteLesson(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const ex=find('Lessons',l=>String(l.lessonId)===String(b.lessonId));if(!ex)throw new Error('Lesson nahi mila');
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
  if(!cid)throw new Error('Class chuno');if(cid==='ALL'&&s.role!=='admin')throw new Error('Sab classes ko sirf admin bhej sakta hai');
  if(cid!=='ALL'&&!canClass(s,cid))throw new Error('Is class ki permission nahi hai');
  if(!title)throw new Error('Title zaruri hai');if(!validDate(date))throw new Error('Date galat hai');
  const o={classId:cid,title,text,date};
  if(d.id){const ex=find('ClassNotices',n=>String(n.id)===String(d.id));if(!ex)throw new Error('Notice nahi mili');
   if(!(s.role==='admin'||canClass(s,String(ex.classId))&&String(ex.classId)!=='ALL'))throw new Error('Is notice ko edit nahi kar sakte');
   setRow('ClassNotices',ex._row,o);return{ok:true,id:String(ex.id)}}
  const id=nextId('ClassNotices','id','N',3);addRow('ClassNotices',Object.assign(o,{id}));log(s.userId,'notice_add',id);return{ok:true,id}}))}

function deleteClassNotice(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const ex=find('ClassNotices',n=>String(n.id)===String(b.id));if(!ex)throw new Error('Notice nahi mili');
  if(!(s.role==='admin'||canClass(s,String(ex.classId))&&String(ex.classId)!=='ALL'))throw new Error('Is notice ko delete nahi kar sakte');
  tab('ClassNotices').deleteRow(ex._row);log(s.userId,'notice_delete',ex.id);return{ok:true}}))}

// Attendance (Phase 4): har entry nayi row (purani delete nahi), latest row jeetti hai
function attMap(cid,date){const m={};
 table('Attendance').rows.forEach(r=>{if(String(r.classId)===cid&&dstr(r.date)===date)m[String(r.studentId)]=String(r.status).toUpperCase()});return m}

function getAttendance(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const cid=resolveClass(b.classId),date=dstr(b.date)||todayStr();
  if(!cid||!canClass(s,cid))throw new Error('Is class ki permission nahi hai');
  if(!validDate(date))throw new Error('Date galat hai');
  const m=attMap(cid,date);
  return{ok:true,date,marked:Object.keys(m).length>0,students:activeStudents(cid).map(r=>({studentId:String(r.studentId),name:r.name,roll:String(r.roll),status:m[String(r.studentId)]||''}))}})}

function markAttendance(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const cid=resolveClass(b.classId),date=dstr(b.date);
  if(!cid||!canClass(s,cid))throw new Error('Is class ki permission nahi hai');
  if(!validDate(date))throw new Error('Date galat hai');
  if(date>todayStr())throw new Error('Aane wali date ki attendance nahi lag sakti');
  const okIds={};activeStudents(cid).forEach(r=>okIds[String(r.studentId)]=1);
  const m=attMap(cid,date),rows=[];
  (Array.isArray(b.marks)?b.marks:[]).forEach(x=>{const sid=String(x.studentId),st=String(x.status).toUpperCase();
   if(!okIds[sid])throw new Error('Student is class ka nahi hai: '+sid);
   if(st!=='P'&&st!=='A'&&st!=='L')throw new Error('Status P/A/L hona chahiye');
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
  if(!cid||!canClass(s,cid))throw new Error('Is class ki permission nahi hai');
  if(!find('Subjects',x=>String(x.subjectId)===sub))throw new Error('Subject chuno');
  if(!title)throw new Error('Title zaruri hai');if(!validDate(due))throw new Error('Due date galat hai');
  if(link&&!/^https?:\/\//i.test(link))throw new Error('Link http:// ya https:// se shuru hona chahiye');
  if(d.id){const ex=find('Assignments',a=>String(a.id)===String(d.id));if(!ex)throw new Error('Homework nahi mila');
   if(s.role!=='admin'&&String(ex.by)!==s.userId)throw new Error('Sirf apna homework edit kar sakte ho');
   setRow('Assignments',ex._row,{classId:cid,subjectId:sub,title,due,link});return{ok:true,id:String(ex.id)}}
  const id=nextId('Assignments','id','A',3);addRow('Assignments',{id,classId:cid,subjectId:sub,title,due,link,by:s.userId});
  log(s.userId,'homework_add',id);return{ok:true,id}}))}

function deleteAssignment(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const ex=find('Assignments',a=>String(a.id)===String(b.id));if(!ex)throw new Error('Homework nahi mila');
  if(s.role!=='admin'&&String(ex.by)!==s.userId)throw new Error('Sirf apna homework delete kar sakte ho');
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
  if(!cid)throw new Error('Class chuno');if(!type)throw new Error('Fee ka naam zaruri hai');
  if(!isFinite(amt)||amt<=0||amt>1e7)throw new Error('Amount sahi daalo');
  if(dm!=='monthly'&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(dm))throw new Error('Due month "monthly" ya YYYY-MM hona chahiye');
  const ex=find('FeeStructure',f=>String(f.classId)===cid&&String(f.feeType).toLowerCase()===type.toLowerCase());
  if(ex){setRow('FeeStructure',ex._row,{amount:amt,dueMonth:dm});log(s.userId,'fee_edit',cid+' '+type);return{ok:true}}
  addRow('FeeStructure',{classId:cid,feeType:type,amount:amt,dueMonth:dm});log(s.userId,'fee_add',cid+' '+type);return{ok:true}}))}

function deleteFee(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const cid=resolveClass(b.classId),ex=find('FeeStructure',f=>String(f.classId)===cid&&String(f.feeType)===String(b.feeType));
  if(!ex)throw new Error('Fee nahi mili');tab('FeeStructure').deleteRow(ex._row);log(s.userId,'fee_delete',cid+' '+b.feeType);return{ok:true}}))}

function studentFees(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>{const r=find('Students',x=>String(x.studentId)===String(b.studentId));if(!r)throw new Error('Student nahi mila');
  return{ok:true,student:profileOf(r),fees:feesOf(r)}})}

function nextReceipt(){
 const pre=clean((find('Settings',x=>String(x.key)==='receipt_prefix')||{}).value,5)||'R';let m=0;
 table('Payments').rows.forEach(p=>{const x=String(p.receiptNo);if(x.indexOf(pre)===0){const v=parseInt(x.slice(pre.length),10);if(v>m)m=v}});
 return pre+String(m+1).padStart(4,'0')}

function addPayment(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.payment||{},r=find('Students',x=>String(x.studentId)===String(d.studentId));if(!r)throw new Error('Student nahi mila');
  const type=clean(d.feeType,40),amt=round2(Number(d.amount)),mode=clean(d.mode,10).toLowerCase(),date=dstr(d.date)||todayStr();
  if(!find('FeeStructure',f=>String(f.classId)===String(r.classId)&&String(f.feeType)===type))throw new Error('Is class ki fee structure mein "'+type+'" nahi hai');
  if(!isFinite(amt)||amt<=0||amt>1e7)throw new Error('Amount sahi daalo');
  if(PAY_MODES.indexOf(mode)<0)throw new Error('Mode cash/upi/bank/cheque mein se ho');
  if(!validDate(date)||date>todayStr())throw new Error('Date galat hai (aane wali date nahi chalegi)');
  const no=nextReceipt();addRow('Payments',{receiptNo:no,studentId:String(r.studentId),feeType:type,amount:amt,mode,date,receivedBy:s.userId});
  log(s.userId,'payment',no+' '+r.studentId+' '+type+' '+amt);
  return{ok:true,receiptNo:no,fees:feesOf(r)}}))}

// Galti sudharne ke liye purani row delete nahi hoti: ulta (negative) entry judti hai.
function voidPayment(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const rows=table('Payments').rows,o=rows.find(p=>String(p.receiptNo)===String(b.receiptNo));
  if(!o)throw new Error('Receipt nahi mili');
  if(Number(o.amount)<=0||String(o.mode).indexOf('void:')===0)throw new Error('Yeh entry void nahi ho sakti');
  if(rows.some(p=>String(p.mode)==='void:'+o.receiptNo))throw new Error('Yeh receipt pehle hi void ho chuki hai');
  const reason=clean(b.reason,100);if(!reason)throw new Error('Void ka karan likho');
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
 return safe(()=>{const p=find('Payments',x=>String(x.receiptNo)===String(b.receiptNo));if(!p)throw new Error('Receipt nahi mili');
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
 return safe(()=>{const cid=resolveClass(b.classId);if(!cid||!canClass(s,cid))throw new Error('Is class ki permission nahi hai');
  return{ok:true,exams:table('Exams').rows.filter(e=>String(e.classId)===cid).map(e=>({examId:String(e.examId),title:e.title,date:dstr(e.date),maxMarks:Number(e.maxMarks)||0})),subjects:subjectsFor(s,cid)}})}

function marksMap(examId,subjectId){const m={};
 table('Results').rows.forEach(r=>{if(String(r.examId)===examId&&String(r.subjectId)===subjectId)m[String(r.studentId)]=r.marks});return m}

function getMarks(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const ex=find('Exams',e=>String(e.examId)===String(b.examId)),sub=String(b.subjectId||'');
  if(!ex)throw new Error('Exam nahi mila');const cid=String(ex.classId);
  if(!canClass(s,cid)||!teachesSub(s,cid,sub))throw new Error('Is subject ki permission nahi hai');
  const m=marksMap(String(ex.examId),sub);
  return{ok:true,maxMarks:Number(ex.maxMarks)||0,students:activeStudents(cid).map(r=>({studentId:String(r.studentId),name:r.name,roll:String(r.roll),marks:m[String(r.studentId)]===undefined?'':m[String(r.studentId)]}))}})}

function saveMarks(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Exams',e=>String(e.examId)===String(b.examId)),sub=String(b.subjectId||'');
  if(!ex)throw new Error('Exam nahi mila');const cid=String(ex.classId),max=Number(ex.maxMarks)||0;
  if(!find('Subjects',x=>String(x.subjectId)===sub))throw new Error('Subject galat hai');
  if(!canClass(s,cid)||!teachesSub(s,cid,sub))throw new Error('Is subject ki permission nahi hai');
  const okIds={};activeStudents(cid).forEach(r=>okIds[String(r.studentId)]=1);
  const m=marksMap(String(ex.examId),sub),rows=[];
  (Array.isArray(b.marks)?b.marks:[]).forEach(x=>{const sid=String(x.studentId);if(x.marks===''||x.marks==null)return;
   if(!okIds[sid])throw new Error('Student is class ka nahi hai: '+sid);
   const v=Number(x.marks);if(!isFinite(v)||v<0||v>max)throw new Error(sid+': marks 0 se '+max+' ke beech hone chahiye');
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
  if(!title)throw new Error('Exam ka naam zaruri hai');
  if(!isFinite(max)||max<=0||max>1000)throw new Error('Max marks 1 se 1000 ke beech hone chahiye');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Date galat hai');
  if(d.examId){const ex=find('Exams',e=>String(e.examId)===String(d.examId));if(!ex)throw new Error('Exam nahi mila');
   const over=table('Results').rows.some(r=>String(r.examId)===String(ex.examId)&&Number(r.marks)>max);
   if(over)throw new Error('Kuch students ke marks is max se zyada hain, max kam nahi kar sakte');
   setRow('Exams',ex._row,{title,date,maxMarks:max});log(s.userId,'exam_edit',ex.examId);return{ok:true,examId:String(ex.examId)}}
  const ids=(Array.isArray(d.classIds)&&d.classIds.length?d.classIds:[d.classId]).map(resolveClass);
  if(!ids.length||ids.some(x=>!x))throw new Error('Class chuniye');
  const made=[];[...new Set(ids)].forEach(cid=>{
   if(table('Exams').rows.some(e=>String(e.classId)===cid&&String(e.title).toLowerCase()===title.toLowerCase()))throw new Error('Is class mein "'+title+'" pehle se hai');
   const id=nextId('Exams','examId','E',3);addRow('Exams',{examId:id,title,classId:cid,date,maxMarks:max});made.push(id)});
  log(s.userId,'exam_add',made.join(','));return{ok:true,examIds:made}}))}

function deleteExam(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const ex=find('Exams',e=>String(e.examId)===String(b.examId));if(!ex)throw new Error('Exam nahi mila');
  if(table('Results').rows.some(r=>String(r.examId)===String(ex.examId)))throw new Error('Is exam mein marks bhare hain, delete nahi ho sakta');
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
 return safe(()=>{const ex=find('Exams',e=>String(e.examId)===String(b.examId));if(!ex)throw new Error('Exam nahi mila');
  const cid=String(ex.classId);if(s.role!=='admin'&&!isClassTeacher(s,cid))throw new Error('Poora result sirf class teacher ya admin dekh sakta hai');
  const r=examBoard(ex);
  const students=Object.keys(r.board).map(k=>{const x=r.board[k],m={};x.rows.forEach(y=>m[y.subjectId]=y.marks);
   return{studentId:k,name:x.student.name,roll:String(x.student.roll),marks:m,total:x.total,max:x.max,percent:x.percent,grade:x.grade,pass:x.pass,rank:x.rank||''}});
  students.sort((a,b)=>(Number(a.roll)||0)-(Number(b.roll)||0)||(a.name<b.name?-1:1));
  return{ok:true,exam:{examId:String(ex.examId),title:ex.title,date:dstr(ex.date),maxMarks:Number(ex.maxMarks)||0},subjects:r.subjects,students}})}

function cardOf(st,ex){
 const r=examBoard(ex),x=r.board[String(st.studentId)];if(!x||!x.rows.length)throw new Error('Is exam ka result abhi nahi aaya');
 const cl=find('Classes',c=>String(c.classId)===String(st.classId))||{},a=attOf(String(st.studentId));
 return{ok:true,exam:{examId:String(ex.examId),title:ex.title,date:dstr(ex.date),maxMarks:Number(ex.maxMarks)||0},
  student:{studentId:String(st.studentId),name:st.name,roll:String(st.roll),admNo:String(st.admNo||''),className:cl.name||String(st.classId),parentName:String(st.parentName||''),dob:dstr(st.dob)},
  rows:x.rows,total:x.total,max:x.max,percent:x.percent,grade:x.grade,pass:x.pass,rank:x.rank,classSize:r.ranked,attendance:a.total?a.percent:null,
  classTeacher:(cl.classTeacherId?nameMap('Users','userId')[String(cl.classTeacherId)]:'')||''}}

function reportCard(b){
 const s=guard(b);if(!s)return DENIED;
 return safe(()=>{const ex=find('Exams',e=>String(e.examId)===String(b.examId));if(!ex)throw new Error('Exam nahi mila');
  let sid=s.role==='student'?s.userId:String(b.studentId||'');
  const st=find('Students',x=>String(x.studentId)===sid);if(!st||String(st.classId)!==String(ex.classId))throw new Error('Student is exam ka nahi hai');
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
const safeName=s=>String(s).replace(/[\\/:*?"<>|\r\n]+/g,' ').replace(/\s+/g,' ').trim().slice(0,60)||'note';

// Upload form ke dropdown: kis class mein kaun se subject ke notes daal sakte ho
function noteOptions(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 const mine=s.role==='teacher'?teacherClassIds(s.userId):null;
 return{ok:true,classes:table('Classes').rows.filter(c=>!mine||mine[String(c.classId)]).map(c=>({classId:String(c.classId),name:c.name,subjects:subjectsFor(s,String(c.classId))}))}}

function listNotes(b){
 const s=guard(b,['admin','teacher','student']);if(!s)return DENIED;
 let cid='';
 if(s.role==='student'){const r=find('Students',x=>String(x.studentId)===s.userId&&String(x.status).toLowerCase()==='active');if(!r)return DENIED;cid=String(r.classId)}
 const mine=s.role==='teacher'?teacherClassIds(s.userId):null,want=s.role==='student'?cid:(b.classId?resolveClass(b.classId):'');
 const sn=nameMap('Subjects','subjectId'),cn=nameMap('Classes','classId'),un=nameMap('Users','userId');
 const notes=table('Notes').rows.filter(n=>(!mine||mine[String(n.classId)])&&(!want||String(n.classId)===want)&&(!b.subjectId||String(n.subjectId)===String(b.subjectId)))
  .map(n=>({noteId:String(n.noteId),classId:String(n.classId),className:cn[String(n.classId)]||String(n.classId),subjectId:String(n.subjectId),subject:sn[String(n.subjectId)]||String(n.subjectId),
   chapter:n.chapter,title:n.title,fileId:String(n.fileId),mime:String(n.mime),size:Number(n.size)||0,by:un[String(n.uploadedBy)]||String(n.uploadedBy),date:dstr(n.date),
   editable:s.role==='admin'||String(n.uploadedBy)===s.userId}));
 notes.sort((a,c)=>a.subject.localeCompare(c.subject)||a.chapter.localeCompare(c.chapter,undefined,{numeric:true})||(a.date<c.date?1:-1));
 return{ok:true,notes:notes.slice(0,1000)}}

function uploadNote(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{
  const cid=resolveClass(b.classId),sub=clean(b.subjectId,20),chapter=clean(b.chapter,100),title=clean(b.title,120),mime=clean(b.mime,40).toLowerCase(),data=String(b.data||'');
  if(!cid||!canClass(s,cid))throw new Error('Is class ki permission nahi hai');
  const subj=find('Subjects',x=>String(x.subjectId)===sub);if(!subj)throw new Error('Subject chuno');
  if(!teachesSub(s,cid,sub))throw new Error('Aap is class mein yeh subject nahi padhate');
  if(!title)throw new Error('Title zaruri hai');if(!chapter)throw new Error('Chapter zaruri hai');
  if(!NOTE_TYPES[mime])throw new Error('Sirf PDF ya photo (JPG/PNG/WEBP) chalegi');
  if(!data||data.length>NOTE_MAX_BYTES*1.4)throw new Error('File 20 MB se badi hai');
  const root=P.getProperty('NOTES_FOLDER_ID');if(!root)throw new Error('Drive folder set nahi hai. Apps Script mein setupDrive chalao.');
  const bytes=Utilities.base64Decode(data);
  if(bytes.length>NOTE_MAX_BYTES)throw new Error('File 20 MB se badi hai');if(!magicOk(bytes,mime))throw new Error('File ka type galat hai (extension badla hua lagta hai)');
  return withLock(()=>{
   const cls=find('Classes',c=>String(c.classId)===cid),folder=subFolder(subFolder(DriveApp.getFolderById(root),safeName(cls.name)),safeName(subj.name));
   const file=folder.createFile(Utilities.newBlob(bytes,mime,safeName(title)+NOTE_TYPES[mime]));
   try{file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW)}
   catch(e){file.setTrashed(true);throw new Error('Drive sharing allowed nahi hai (Workspace admin ne roka hua hai)')}
   const id=nextId('Notes','noteId','NT',4);
   addRow('Notes',{noteId:id,classId:cid,subjectId:sub,chapter,title,fileId:file.getId(),fileName:file.getName(),mime,size:bytes.length,uploadedBy:s.userId,date:todayStr()});
   log(s.userId,'note_upload',id+' '+cid+' '+sub);return{ok:true,noteId:id}})})}

function updateNote(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Notes',n=>String(n.noteId)===String(b.noteId));if(!ex)throw new Error('Note nahi mila');
  if(s.role!=='admin'&&String(ex.uploadedBy)!==s.userId)throw new Error('Sirf apna note edit kar sakte ho');
  const chapter=clean(b.chapter,100),title=clean(b.title,120);if(!chapter||!title)throw new Error('Title aur chapter zaruri hain');
  setRow('Notes',ex._row,{chapter,title});return{ok:true}}))}

function deleteNote(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Notes',n=>String(n.noteId)===String(b.noteId));if(!ex)throw new Error('Note nahi mila');
  if(s.role!=='admin'&&String(ex.uploadedBy)!==s.userId)throw new Error('Sirf apna note delete kar sakte ho');
  try{DriveApp.getFileById(String(ex.fileId)).setTrashed(true)}catch(e){}   // Drive trash mein jati hai (wapas laya ja sakta hai)
  tab('Notes').deleteRow(ex._row);log(s.userId,'note_delete',ex.noteId);return{ok:true}}))}

// Phase 7: website enquiry form (public, bina login) + admin inbox. Email owner ko jaati hai (ya Settings tab: key notify_email).
const ENQ_STATUS=['new','contacted','closed'];
function enqMail(){
 const st=find('Settings',x=>String(x.key)==='notify_email'),v=st&&clean(st.value,100);
 if(v)return v;try{return Session.getEffectiveUser().getEmail()}catch(e){return ''}}
function enqLimit(key,max,secs){const c=CacheService.getScriptCache(),n=Number(c.get(key)||0);if(n>=max)return false;c.put(key,String(n+1),secs);return true}

function enquiry(b){
 return safe(()=>{
  if(clean(b.website,50))return{ok:true};   // honeypot: bot ko "ok" dikhao, kuch save mat karo
  const name=clean(b.name,60),phone=clean(b.phone,15).replace(/[\s\-()]/g,''),msg=clean(b.message,600);
  if(name.length<2)throw new Error('Naam likhiye');
  if(!/^\+?\d{8,14}$/.test(phone))throw new Error('Sahi phone number likhiye');
  if(msg.length<3)throw new Error('Message likhiye');
  if(!enqLimit('enq_all',40,3600)||!enqLimit('enq_'+phone,3,3600))throw new Error('Bahut zyada requests. Thodi der baad try karein');
  const id=withLock(()=>{const i=nextId('Enquiries','id','Q',4);addRow('Enquiries',{id:i,name,phone,message:msg,time:new Date(),status:'new'});return i});
  log('public','enquiry',id);
  try{const to=enqMail();if(to)MailApp.sendEmail({to,subject:'New enquiry '+id+': '+name,body:'Name: '+name+'\nPhone: '+phone+'\n\n'+msg+'\n\n(Admin panel > Enquiries mein dekhein)'})}catch(e){log('system','enquiry_mail_fail',String(e.message||e).slice(0,100))}
  return{ok:true}})}

function enqTime(t){if(t instanceof Date)return Utilities.formatDate(t,'Asia/Kolkata','yyyy-MM-dd HH:mm');return String(t||'')}
function listEnquiries(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>{const rows=table('Enquiries').rows.map(r=>({id:String(r.id),name:String(r.name),phone:String(r.phone),message:String(r.message),time:enqTime(r.time),status:String(r.status)||'new'}));
  rows.sort((a,b)=>a.id<b.id?1:-1);return{ok:true,enquiries:rows.slice(0,500),newCount:rows.filter(r=>r.status==='new').length}})}
function updateEnquiry(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const r=find('Enquiries',x=>String(x.id)===String(b.id));if(!r)throw new Error('Enquiry nahi mili');
  if(b.delete){tab('Enquiries').deleteRow(r._row);log(s.userId,'enquiry_delete',r.id);return{ok:true}}
  if(ENQ_STATUS.indexOf(b.status)<0)throw new Error('Status galat hai');
  setRow('Enquiries',r._row,{status:b.status});log(s.userId,'enquiry_'+b.status,r.id);return{ok:true}}))}

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
  byClass:classes.map(c=>({classId:String(c.classId),name:c.name,count:cnt[String(c.classId)]||0}))}}}
function listLogs(b){return{ok:false,error:'Not built yet (Phase 9)'}}

// Backup: Phase 9 me banega. Abhi sirf skeleton.
function backupNow(b){return{ok:false,error:'Not built yet (Phase 9)'}}

