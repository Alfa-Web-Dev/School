// ---------- Doubt Box: student asks -> AI tutor answers in the browser -> unresolved doubts go to the teacher ----------
const DOUBT_DAY_LIMIT=15;

const doubtView=(d,sn,cn,stn)=>({doubtId:String(d.doubtId),studentId:String(d.studentId),student:stn?stn[String(d.studentId)]||'':'',classId:String(d.classId),className:cn[String(d.classId)]||'',subjectId:String(d.subjectId),
 subject:sn[String(d.subjectId)]||'',chapter:String(d.chapter||''),question:String(d.question),aiAnswer:String(d.aiAnswer||''),status:String(d.status),teacherAnswer:String(d.teacherAnswer||''),
 answeredBy:String(d.answeredBy||''),date:Number(d.date),answeredAt:Number(d.answeredAt)||0});

function doubtOptions(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const cid=String(r.classId),ids={};table('Lessons').rows.forEach(l=>{if(String(l.classId)===cid)ids[String(l.subjectId)]=1});
  let subs=table('Subjects').rows.filter(x=>ids[String(x.subjectId)]);if(!subs.length)subs=table('Subjects').rows;
  const c=find('Classes',x=>String(x.classId)===cid);
  return{ok:true,className:c?String(c.name):'',subjects:subs.map(x=>({subjectId:String(x.subjectId),name:String(x.name)}))}})}

function askDoubt(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{
  const sub=String(b.subjectId||'');if(!find('Subjects',x=>String(x.subjectId)===sub))throw new Error('Choose a subject');
  const q=txt(b.question,800);if(q.length<5)throw new Error('Please write your doubt in a little more detail');
  const day=Date.now()-864e5,n=table('Doubts').rows.filter(d=>String(d.studentId)===String(r.studentId)&&Number(d.date)>day).length;
  if(n>=DOUBT_DAY_LIMIT)throw new Error('You have asked '+DOUBT_DAY_LIMIT+' doubts today. Please try again tomorrow.');
  const ai=txt(b.aiAnswer,4000),id=nextId('Doubts','doubtId','D');
  addRow('Doubts',{doubtId:id,studentId:String(r.studentId),classId:String(r.classId),subjectId:sub,chapter:txt(b.chapter,100),question:q,aiAnswer:ai,status:ai?'ai':'open',date:Date.now()});
  return{ok:true,doubtId:id,status:ai?'ai':'open'}}))}

function updateAiAnswer(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{const d=find('Doubts',x=>String(x.doubtId)===String(b.doubtId)&&String(x.studentId)===String(r.studentId));if(!d)throw new Error('Doubt not found');
  if(String(d.status)!=='ai')throw new Error('This doubt is already with your teacher');
  setRow('Doubts',d._row,{aiAnswer:txt(b.aiAnswer,4000)});return{ok:true}}))}

// student: resolve ("Got it") or forward to the teacher
function closeDoubt(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{const d=find('Doubts',x=>String(x.doubtId)===String(b.doubtId)&&String(x.studentId)===String(r.studentId));if(!d)throw new Error('Doubt not found');
  const st=String(d.status),act=String(b.do);
  if(act==='forward'){if(st!=='ai')throw new Error('Already sent to your teacher');setRow('Doubts',d._row,{status:'open'});return{ok:true,status:'open'}}
  if(act==='resolve'){if(st!=='ai'&&st!=='answered')throw new Error('Wait for your teacher to answer first');setRow('Doubts',d._row,{status:'resolved'});return{ok:true,status:'resolved'}}
  throw new Error('Invalid action')}))}

function myDoubts(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const sn=nameMap('Subjects','subjectId'),cn=nameMap('Classes','classId'),tn=nameMap('Users','userId');
  const list=table('Doubts').rows.filter(d=>String(d.studentId)===String(r.studentId)).reverse().slice(0,60).map(d=>{const v=doubtView(d,sn,cn);v.answeredBy=tn[v.answeredBy]||'Teacher';return v});
  return{ok:true,doubts:list}})}

const canSeeDoubt=(s,d)=>s.role==='admin'||isClassTeacher(s,String(d.classId))||teachesSub(s,String(d.classId),String(d.subjectId));

function listDoubts(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const want=String(b.status||'open'),sn=nameMap('Subjects','subjectId'),cn=nameMap('Classes','classId'),stn=nameMap('Students','studentId');
  const rows=table('Doubts').rows.filter(d=>(want==='all'||(want==='open'?String(d.status)==='open':String(d.status)==='answered'||String(d.status)==='resolved'&&String(d.teacherAnswer)!==''))&&canSeeDoubt(s,d));
  const open=table('Doubts').rows.filter(d=>String(d.status)==='open'&&canSeeDoubt(s,d)).length;
  return{ok:true,open,doubts:rows.reverse().slice(0,80).map(d=>doubtView(d,sn,cn,stn))}})}

function answerDoubt(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const d=find('Doubts',x=>String(x.doubtId)===String(b.doubtId));if(!d||!canSeeDoubt(s,d))throw new Error('Doubt not found');
  const a=txt(b.answer,2000);if(a.length<2)throw new Error('Please write an answer');
  setRow('Doubts',d._row,{teacherAnswer:a,answeredBy:s.userId,answeredAt:Date.now(),status:'answered'});log(s.userId,'doubt_answered',d.doubtId);return{ok:true}}))}
