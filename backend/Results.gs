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

function saveExam(b){return{ok:false,error:'Not built yet (Phase 6)'}}
function getResults(b){return{ok:false,error:'Not built yet (Phase 6)'}}
