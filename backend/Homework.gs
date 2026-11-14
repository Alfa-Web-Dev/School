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
