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
