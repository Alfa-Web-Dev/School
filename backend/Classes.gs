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
