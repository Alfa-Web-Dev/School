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

// Phase 10: certificate / ID data. Har issue ka serial number Logs se banta hai (kaun, kab, kis ko = log mein).
const CERT_TYPES={bonafide:'BON',tc:'TC',character:'CHR'};
function issueCertificate(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const type=String(b.type||''),pre=CERT_TYPES[type];if(!pre)throw new Error('Certificate type galat hai');
  const st=find('Students',x=>String(x.studentId)===String(b.studentId));if(!st)throw new Error('Student nahi mila');
  const yr=todayStr().slice(0,4),key=pre+'/'+yr+'/';
  const n=table('Logs').rows.filter(l=>String(l.action)==='certificate'&&String(l.details).indexOf(key)===0).length+1;
  const ref=key+String(n).padStart(4,'0');
  log(s.userId,'certificate',ref+' '+st.studentId);
  const cl=find('Classes',c=>String(c.classId)===String(st.classId))||{},ay=find('AcademicYears',a=>String(a.current).toUpperCase()==='TRUE')||{};
  return{ok:true,ref,date:todayStr(),year:String(ay.name||ay.year||''),student:{studentId:String(st.studentId),admNo:String(st.admNo||''),name:st.name,gender:String(st.gender||''),dob:dstr(st.dob),parentName:String(st.parentName||''),address:String(st.address||''),className:cl.name||String(st.classId),roll:String(st.roll||''),status:String(st.status)}}}))}
