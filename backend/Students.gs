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
