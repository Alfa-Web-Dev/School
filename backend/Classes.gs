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
