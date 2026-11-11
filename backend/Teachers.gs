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
