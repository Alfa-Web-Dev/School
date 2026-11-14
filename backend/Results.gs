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


// ---- Phase 6: exams banana, class result sheet, report card ----
function gradeOf(pc){return pc>=90?'A+':pc>=80?'A':pc>=70?'B+':pc>=60?'B':pc>=50?'C':pc>=40?'D':pc>=33?'E':'F'}
const PASS_PC=33;

function adminExams(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>{const cn=nameMap('Classes','classId'),cnt={};
  table('Results').rows.forEach(r=>{const k=String(r.examId);cnt[k]=cnt[k]||{};cnt[k][String(r.studentId)+'|'+String(r.subjectId)]=1});
  const ex=table('Exams').rows.map(e=>({examId:String(e.examId),title:e.title,classId:String(e.classId),className:cn[String(e.classId)]||String(e.classId),date:dstr(e.date),maxMarks:Number(e.maxMarks)||0,entries:Object.keys(cnt[String(e.examId)]||{}).length}));
  ex.sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:0);return{ok:true,exams:ex}})}

function saveExam(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.exam||{},title=clean(d.title,60),max=Number(d.maxMarks),date=clean(d.date,10);
  if(!title)throw new Error('Exam ka naam zaruri hai');
  if(!isFinite(max)||max<=0||max>1000)throw new Error('Max marks 1 se 1000 ke beech hone chahiye');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Date galat hai');
  if(d.examId){const ex=find('Exams',e=>String(e.examId)===String(d.examId));if(!ex)throw new Error('Exam nahi mila');
   const over=table('Results').rows.some(r=>String(r.examId)===String(ex.examId)&&Number(r.marks)>max);
   if(over)throw new Error('Kuch students ke marks is max se zyada hain, max kam nahi kar sakte');
   setRow('Exams',ex._row,{title,date,maxMarks:max});log(s.userId,'exam_edit',ex.examId);return{ok:true,examId:String(ex.examId)}}
  const ids=(Array.isArray(d.classIds)&&d.classIds.length?d.classIds:[d.classId]).map(resolveClass);
  if(!ids.length||ids.some(x=>!x))throw new Error('Class chuniye');
  const made=[];[...new Set(ids)].forEach(cid=>{
   if(table('Exams').rows.some(e=>String(e.classId)===cid&&String(e.title).toLowerCase()===title.toLowerCase()))throw new Error('Is class mein "'+title+'" pehle se hai');
   const id=nextId('Exams','examId','E',3);addRow('Exams',{examId:id,title,classId:cid,date,maxMarks:max});made.push(id)});
  log(s.userId,'exam_add',made.join(','));return{ok:true,examIds:made}}))}

function deleteExam(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const ex=find('Exams',e=>String(e.examId)===String(b.examId));if(!ex)throw new Error('Exam nahi mila');
  if(table('Results').rows.some(r=>String(r.examId)===String(ex.examId)))throw new Error('Is exam mein marks bhare hain, delete nahi ho sakta');
  tab('Exams').deleteRow(ex._row);log(s.userId,'exam_delete',ex.examId);return{ok:true}}))}

// Ek exam ka poori class ka hisaab: {studentId:{rows,total,max,percent,grade,rank}}
function examBoard(ex){
 const cid=String(ex.classId),max=Number(ex.maxMarks)||0,sn=nameMap('Subjects','subjectId'),latest={};
 table('Results').rows.forEach(r=>{if(String(r.examId)===String(ex.examId))latest[String(r.studentId)+'|'+String(r.subjectId)]=r});  // latest row jeetti hai
 const stus=activeStudents(cid),out={},subjSeen={};
 stus.forEach(st=>{const sid=String(st.studentId),rows=[];
  Object.keys(latest).forEach(k=>{const r=latest[k];if(String(r.studentId)!==sid)return;const m=Number(r.marks)||0,pc=max?Math.round(m*1000/max)/10:0;
   subjSeen[String(r.subjectId)]=1;rows.push({subjectId:String(r.subjectId),subject:sn[String(r.subjectId)]||String(r.subjectId),marks:m,max,grade:gradeOf(pc),pass:pc>=PASS_PC})});
  rows.sort((a,b)=>a.subject<b.subject?-1:1);
  const total=rows.reduce((a,x)=>a+x.marks,0),mx=rows.length*max,percent=mx?Math.round(total*1000/mx)/10:0;
  out[sid]={student:st,rows,total,max:mx,percent,grade:rows.length?gradeOf(percent):'',pass:rows.length>0&&rows.every(x=>x.pass)}});
 const ranked=Object.keys(out).filter(k=>out[k].rows.length).sort((a,b)=>out[b].percent-out[a].percent);
 ranked.forEach((k,i)=>{out[k].rank=i>0&&out[ranked[i-1]].percent===out[k].percent?out[ranked[i-1]].rank:i+1});
 return{board:out,subjects:Object.keys(subjSeen).map(id=>({subjectId:id,name:sn[id]||id})).sort((a,b)=>a.name<b.name?-1:1),ranked:ranked.length}}

// Admin ya class teacher: poori class ka result sheet
function getResults(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const ex=find('Exams',e=>String(e.examId)===String(b.examId));if(!ex)throw new Error('Exam nahi mila');
  const cid=String(ex.classId);if(s.role!=='admin'&&!isClassTeacher(s,cid))throw new Error('Poora result sirf class teacher ya admin dekh sakta hai');
  const r=examBoard(ex);
  const students=Object.keys(r.board).map(k=>{const x=r.board[k],m={};x.rows.forEach(y=>m[y.subjectId]=y.marks);
   return{studentId:k,name:x.student.name,roll:String(x.student.roll),marks:m,total:x.total,max:x.max,percent:x.percent,grade:x.grade,pass:x.pass,rank:x.rank||''}});
  students.sort((a,b)=>(Number(a.roll)||0)-(Number(b.roll)||0)||(a.name<b.name?-1:1));
  return{ok:true,exam:{examId:String(ex.examId),title:ex.title,date:dstr(ex.date),maxMarks:Number(ex.maxMarks)||0},subjects:r.subjects,students}})}

function cardOf(st,ex){
 const r=examBoard(ex),x=r.board[String(st.studentId)];if(!x||!x.rows.length)throw new Error('Is exam ka result abhi nahi aaya');
 const cl=find('Classes',c=>String(c.classId)===String(st.classId))||{},a=attOf(String(st.studentId));
 return{ok:true,exam:{examId:String(ex.examId),title:ex.title,date:dstr(ex.date),maxMarks:Number(ex.maxMarks)||0},
  student:{studentId:String(st.studentId),name:st.name,roll:String(st.roll),admNo:String(st.admNo||''),className:cl.name||String(st.classId),parentName:String(st.parentName||''),dob:dstr(st.dob)},
  rows:x.rows,total:x.total,max:x.max,percent:x.percent,grade:x.grade,pass:x.pass,rank:x.rank,classSize:r.ranked,attendance:a.total?a.percent:null,
  classTeacher:(cl.classTeacherId?nameMap('Users','userId')[String(cl.classTeacherId)]:'')||''}}

function reportCard(b){
 const s=guard(b);if(!s)return DENIED;
 return safe(()=>{const ex=find('Exams',e=>String(e.examId)===String(b.examId));if(!ex)throw new Error('Exam nahi mila');
  let sid=s.role==='student'?s.userId:String(b.studentId||'');
  const st=find('Students',x=>String(x.studentId)===sid);if(!st||String(st.classId)!==String(ex.classId))throw new Error('Student is exam ka nahi hai');
  if(s.role==='teacher'&&!isClassTeacher(s,String(ex.classId)))return DENIED;
  return cardOf(st,ex)})}
