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

// ===== Core.gs =====
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
const ROUTES={resetSecret:'resetSecret',listStudents:'listStudents',saveStudent:'saveStudent',importStudents:'importStudents',promoteStudents:'promoteStudents',listTeachers:'listTeachers',saveTeacher:'saveTeacher',listClasses:'listClasses',saveClass:'saveClass',listSubjects:'listSubjects',saveSubject:'saveSubject',listLessons:'listLessons',saveLesson:'saveLesson',listClassNotices:'listClassNotices',saveClassNotice:'saveClassNotice',getAttendance:'getAttendance',markAttendance:'markAttendance',listAssignments:'listAssignments',saveAssignment:'saveAssignment',getFeeStructure:'getFeeStructure',saveFeeStructure:'saveFeeStructure',listPayments:'listPayments',addPayment:'addPayment',listExams:'listExams',saveExam:'saveExam',getResults:'getResults',saveMarks:'saveMarks',enquiry:'enquiry',listEnquiries:'listEnquiries',updateEnquiry:'updateEnquiry',dashboardStats:'dashboardStats',listLogs:'listLogs',backupNow:'backupNow'};

// ===== Students.gs =====
// Students (Phase 2): list, add/edit, CSV import, promote
function upsertParent(name,phone){
 phone=clean(phone,15).replace(/[^\d+]/g,'');if(!phone)return{id:'',pin:''};
 const p=find('Parents',r=>String(r.phone).trim()===phone);
 if(p){if(name&&!p.name)setRow('Parents',p._row,{name});return{id:String(p.parentId),pin:''}}
 const id=nextId('Parents','parentId','P',3),pin=genPin(),f=setSecretFields(pin);
 addRow('Parents',{parentId:id,name:name||'Parent',phone,email:'',pinHash:f.hash,salt:f.salt});
 return{id,pin}}

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
 const par=upsertParent(clean(d.parentName,80),d.parentPhone);
 const o={name,classId,roll:clean(d.roll,10),gender,dob,address:clean(d.address,200),status};
 if(par.id)o.parentId=par.id;
 if(ex){if(admNo)o.admNo=admNo;setRow('Students',ex._row,o);log(actor,'student_edit',ex.studentId);
  return{studentId:String(ex.studentId),pin:'',parentId:par.id,parentPin:par.pin}}
 const id=nextId('Students','studentId','S',3),pin=genPin(),f=setSecretFields(pin);
 o.studentId=id;o.admNo=admNo||String(new Date().getFullYear())+id.slice(1);o.pinHash=f.hash;o.salt=f.salt;
 addRow('Students',o);log(actor,'student_add',id);
 return{studentId:id,pin,parentId:par.id,parentPin:par.pin}}

function listStudents(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 const par={};table('Parents').rows.forEach(p=>par[String(p.parentId)]=p);
 const mine=s.role==='teacher'?teacherClassIds(s.userId):null;
 const students=table('Students').rows.filter(r=>!mine||mine[String(r.classId)]).map(r=>{
  const p=par[String(r.parentId)]||{};
  return Object.assign(strip(r,['pinHash','salt']),{parentName:p.name||'',parentPhone:String(p.phone||'')})});
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

// ===== Teachers.gs =====
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

// kind: student | parent | teacher. Naya secret sirf ek baar dikhta hai.
function resetSecret(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const id=String(b.id||''),kind=String(b.kind||'');
  const m={student:['Students','studentId','pinHash',genPin],parent:['Parents','parentId','pinHash',genPin],teacher:['Users','userId','passHash',genPassword]}[kind];
  if(!m)throw new Error('kind galat hai');
  const r=find(m[0],x=>String(x[m[1]])===id&&(kind!=='teacher'||x.role==='teacher'));
  if(!r)throw new Error('Record nahi mila');
  const secret=m[3](),f=setSecretFields(secret),o={salt:f.salt};o[m[2]]=f.hash;
  setRow(m[0],r._row,o);revokeTokens(id);log(s.userId,'reset_'+kind,id);
  return{ok:true,id,secret}}))}

// ===== Classes.gs =====
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

// ===== Backup.gs =====
// Backup: Phase 9 me banega. Abhi sirf skeleton.
function backupNow(b){return{ok:false,error:'Not built yet (Phase 9)'}}

