// ===== Utils.gs =====
const VERSION='0.1.0';
const P=PropertiesService.getScriptProperties();
const SCHEMA={
 Settings:['key','value'],
 AcademicYears:['yearId','name','start','end','current'],
 Users:['userId','name','role','phone','email','passHash','salt','active'],
 Students:['studentId','admNo','name','classId','roll','gender','dob','parentId','address','pinHash','salt','status'],
 Parents:['parentId','name','phone','email','pinHash','salt'],
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
 Tokens:['tokenHash','userId','role','expires'],
 Logs:['time','userId','action','details']
};
const out=o=>ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const tab=n=>SpreadsheetApp.getActive().getSheetByName(n);
function table(n){const v=tab(n).getDataRange().getValues(),h=v.shift().map(String);
 return{h,rows:v.map((r,i)=>{const o={_row:i+2};h.forEach((k,j)=>o[k]=r[j]);return o})}}
const find=(n,fn)=>table(n).rows.find(fn);
function log(uid,action,details){tab('Logs').appendRow([new Date(),uid||'',action,details||''])}

// ===== Auth.gs =====
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
 if(role==='parent'){
  const r=find('Parents',r=>String(r.parentId).toLowerCase()===lc||String(r.phone).trim()===String(id).trim());
  return r&&{userId:String(r.parentId),name:r.name,role,salt:String(r.salt),hash:String(r.pinHash),active:true}}
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

// ===== Setup.gs =====
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

// ===== Main.gs =====
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
const ROUTES={listStudents:'listStudents',saveStudent:'saveStudent',importStudents:'importStudents',promoteStudents:'promoteStudents',listTeachers:'listTeachers',saveTeacher:'saveTeacher',listClasses:'listClasses',saveClass:'saveClass',listSubjects:'listSubjects',saveSubject:'saveSubject',listLessons:'listLessons',saveLesson:'saveLesson',listClassNotices:'listClassNotices',saveClassNotice:'saveClassNotice',getAttendance:'getAttendance',markAttendance:'markAttendance',listAssignments:'listAssignments',saveAssignment:'saveAssignment',getFeeStructure:'getFeeStructure',saveFeeStructure:'saveFeeStructure',listPayments:'listPayments',addPayment:'addPayment',listExams:'listExams',saveExam:'saveExam',getResults:'getResults',saveMarks:'saveMarks',enquiry:'enquiry',listEnquiries:'listEnquiries',updateEnquiry:'updateEnquiry',dashboardStats:'dashboardStats',listLogs:'listLogs',backupNow:'backupNow'};

// ===== Students.gs =====
// Students: Phase 2 me banega. Abhi sirf skeleton.
function listStudents(b){return{ok:false,error:'Not built yet (Phase 2)'}}
function saveStudent(b){return{ok:false,error:'Not built yet (Phase 2)'}}
function importStudents(b){return{ok:false,error:'Not built yet (Phase 2)'}}
function promoteStudents(b){return{ok:false,error:'Not built yet (Phase 2)'}}

// ===== Teachers.gs =====
// Teachers: Phase 2 me banega. Abhi sirf skeleton.
function listTeachers(b){return{ok:false,error:'Not built yet (Phase 2)'}}
function saveTeacher(b){return{ok:false,error:'Not built yet (Phase 2)'}}

// ===== Classes.gs =====
// Classes: Phase 2 me banega. Abhi sirf skeleton.
function listClasses(b){return{ok:false,error:'Not built yet (Phase 2)'}}
function saveClass(b){return{ok:false,error:'Not built yet (Phase 2)'}}
function listSubjects(b){return{ok:false,error:'Not built yet (Phase 2)'}}
function saveSubject(b){return{ok:false,error:'Not built yet (Phase 2)'}}

// ===== Timetable.gs =====
// Timetable: Phase 2 me banega. Abhi sirf skeleton.
function listLessons(b){return{ok:false,error:'Not built yet (Phase 2)'}}
function saveLesson(b){return{ok:false,error:'Not built yet (Phase 2)'}}

// ===== Notices.gs =====
// Notices: Phase 2 me banega. Abhi sirf skeleton.
function listClassNotices(b){return{ok:false,error:'Not built yet (Phase 2)'}}
function saveClassNotice(b){return{ok:false,error:'Not built yet (Phase 2)'}}

// ===== Attendance.gs =====
// Attendance: Phase 4 me banega. Abhi sirf skeleton.
function getAttendance(b){return{ok:false,error:'Not built yet (Phase 4)'}}
function markAttendance(b){return{ok:false,error:'Not built yet (Phase 4)'}}

// ===== Homework.gs =====
// Homework: Phase 4 me banega. Abhi sirf skeleton.
function listAssignments(b){return{ok:false,error:'Not built yet (Phase 4)'}}
function saveAssignment(b){return{ok:false,error:'Not built yet (Phase 4)'}}

// ===== Fees.gs =====
// Fees: Phase 5 me banega. Abhi sirf skeleton.
function getFeeStructure(b){return{ok:false,error:'Not built yet (Phase 5)'}}
function saveFeeStructure(b){return{ok:false,error:'Not built yet (Phase 5)'}}
function listPayments(b){return{ok:false,error:'Not built yet (Phase 5)'}}
function addPayment(b){return{ok:false,error:'Not built yet (Phase 5)'}}

// ===== Results.gs =====
// Results: Phase 6 me banega. Abhi sirf skeleton.
function listExams(b){return{ok:false,error:'Not built yet (Phase 6)'}}
function saveExam(b){return{ok:false,error:'Not built yet (Phase 6)'}}
function getResults(b){return{ok:false,error:'Not built yet (Phase 6)'}}
function saveMarks(b){return{ok:false,error:'Not built yet (Phase 6)'}}

// ===== Enquiry.gs =====
// Enquiry: Phase 7 me banega. Abhi sirf skeleton.
function enquiry(b){return{ok:false,error:'Not built yet (Phase 7)'}}
function listEnquiries(b){return{ok:false,error:'Not built yet (Phase 7)'}}
function updateEnquiry(b){return{ok:false,error:'Not built yet (Phase 7)'}}

// ===== Dashboard.gs =====
// Dashboard: Phase 9 me banega. Abhi sirf skeleton.
function dashboardStats(b){return{ok:false,error:'Not built yet (Phase 9)'}}
function listLogs(b){return{ok:false,error:'Not built yet (Phase 9)'}}

// ===== Backup.gs =====
// Backup: Phase 9 me banega. Abhi sirf skeleton.
function backupNow(b){return{ok:false,error:'Not built yet (Phase 9)'}}

