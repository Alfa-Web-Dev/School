// Online tests + practice + proctoring (questions bank, tests, attempts, violations)
const T_MODES=['practice','test'],T_PROCTOR=['off','basic','camera'],DIFFS=['easy','medium','hard'],OPTK=['a','b','c','d'];
const txt=(v,n)=>{const x=clean(v,n);return /^[=+\-@]/.test(x)?' '+x:x};           // sheet formula injection se bachav
const parseIST=v=>{const m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);return m?new Date(m[1]+'-'+m[2]+'-'+m[3]+'T'+m[4]+':'+m[5]+':00+05:30').getTime():0};
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a};
const jparse=(v,d)=>{try{return JSON.parse(String(v))}catch(e){return d}};
const setNum=(k,d)=>{const r=find('Settings',x=>String(x.key)===k),n=r?Number(r.value):NaN;return isFinite(n)&&n>0?n:d};
const maxStrikes=()=>setNum('proctor_max_strikes',3);

function qOf(q,withAns){const ty=String(q.type||'mcq'),o={qid:String(q.qid),classId:String(q.classId),subjectId:String(q.subjectId),chapter:String(q.chapter||''),text:String(q.text).trim(),type:ty,marks:ty==='mcq'?0:(Number(q.marks)||5),
 opts:ty==='mcq'?OPTK.filter(k=>String(q[k]).trim()!=='').map(k=>({k,t:String(q[k]).trim()})):[],difficulty:String(q.difficulty||'medium')};
 if(withAns){o.keyAns=String(q.keyAns||'').trim();o.correct=String(q.correct);o.explain=String(q.explain||'').trim();o.createdBy=String(q.createdBy)}return o}
function staffClasses(s){return s.role==='admin'?null:teacherClassIds(s.userId)}
const testView=(t,att)=>({testId:String(t.testId),title:String(t.title),classId:String(t.classId),subjectId:String(t.subjectId),mode:String(t.mode),durationMin:Number(t.durationMin)||0,
 start:Number(t.start)||0,end:Number(t.end)||0,marksPer:Number(t.marksPer)||1,negative:Number(t.negative)||0,proctor:String(t.proctor||'off'),shuffle:String(t.shuffle).toUpperCase()==='TRUE',
 qids:String(t.qids).split(',').filter(Boolean),status:String(t.status),instructions:String(t.instructions||''),reveal:String(t.reveal)==='submit'?'submit':'end'});

// ---------------- staff: question bank ----------------
function listQuestions(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 const mine=staffClasses(s),cid=b.classId?resolveClass(b.classId):'',sub=clean(b.subjectId,20),ch=clean(b.chapter,100).toLowerCase(),q=clean(b.q,60).toLowerCase();
 const cn=nameMap('Classes','classId'),sn=nameMap('Subjects','subjectId');
 const rows=table('Questions').rows.filter(r=>(!mine||mine[String(r.classId)])&&(!cid||String(r.classId)===cid)&&(!sub||String(r.subjectId)===sub)&&(!ch||String(r.chapter).toLowerCase()===ch)&&(!q||String(r.text).toLowerCase().indexOf(q)>=0))
  .slice(-800).reverse().map(r=>Object.assign(qOf(r,true),{className:cn[String(r.classId)]||String(r.classId),subject:sn[String(r.subjectId)]||String(r.subjectId),editable:s.role==='admin'||String(r.createdBy)===s.userId}));
 return{ok:true,questions:rows}}

function checkQ(s,d){
 const cid=resolveClass(d.classId),sub=clean(d.subjectId,20);
 if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
 if(!find('Subjects',x=>String(x.subjectId)===sub))throw new Error('Select a subject');
 if(!teachesSub(s,cid,sub))throw new Error('You do not teach this subject in this class');
 const ty=['short','long'].indexOf(String(d.type))>=0?String(d.type):'mcq';
 const o={type:ty,classId:cid,subjectId:sub,chapter:txt(d.chapter,100),text:txt(d.text,ty==='mcq'?600:1000),explain:txt(d.explain,500),difficulty:DIFFS.indexOf(String(d.difficulty))>=0?String(d.difficulty):'medium'};
 if(!o.text)throw new Error('Question text is required');
 if(ty!=='mcq'){const mk=Number(d.marks);if(!(mk>0&&mk<=100))throw new Error('Marks must be between 1 and 100');o.marks=mk;o.keyAns=txt(d.keyAns,1500);OPTK.forEach(k=>o[k]='');o.correct='';return o}
 o.marks='';o.keyAns='';
 OPTK.forEach(k=>o[k]=txt(d[k],200));
 if(!o.a||!o.b)throw new Error('Give at least options A and B');
 const c=clean(d.correct,1).toLowerCase();if(OPTK.indexOf(c)<0||!o[c])throw new Error('Choose the correct option (it must not be empty)');
 o.correct=c;return o}

function saveQuestion(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.q||{},o=checkQ(s,d);
  if(d.qid){const ex=find('Questions',x=>String(x.qid)===String(d.qid));if(!ex)throw new Error('Question not found');
   if(s.role!=='admin'&&String(ex.createdBy)!==s.userId)throw new Error('You can edit only your own questions');
   setRow('Questions',ex._row,o);log(s.userId,'question_edit',ex.qid);return{ok:true,qid:String(ex.qid)}}
  const id=nextId('Questions','qid','Q',5);addRow('Questions',Object.assign(o,{qid:id,createdBy:s.userId,date:todayStr()}));log(s.userId,'question_add',id);return{ok:true,qid:id}}))}

function importQuestions(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const rows=Array.isArray(b.rows)?b.rows.slice(0,300):[];if(!rows.length)throw new Error('Nothing to import');
  let m=0;const list=[],errs=[];const t=table('Questions');let id=0;t.rows.forEach(r=>{const v=parseInt(String(r.qid).slice(1),10);if(v>id)id=v});
  rows.forEach((r,i)=>{try{const o=checkQ(s,Object.assign({},r,{classId:b.classId,subjectId:b.subjectId,chapter:r.chapter||b.chapter}));
   id++;list.push(Object.assign(o,{qid:'Q'+String(id).padStart(5,'0'),createdBy:s.userId,date:todayStr()}))}catch(e){errs.push('Row '+(i+1)+': '+e.message)}});
  addRows('Questions',list);log(s.userId,'question_import',list.length+' added');return{ok:true,added:list.length,errors:errs.slice(0,10)}}))}

function deleteQuestion(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Questions',x=>String(x.qid)===String(b.qid));if(!ex)throw new Error('Question not found');
  if(s.role!=='admin'&&String(ex.createdBy)!==s.userId)throw new Error('You can delete only your own questions');
  if(table('Tests').rows.some(t=>String(t.status)==='published'&&String(t.qids).split(',').indexOf(String(ex.qid))>=0))throw new Error('This question is used in a published test');
  tab('Questions').deleteRow(ex._row);log(s.userId,'question_delete',ex.qid);return{ok:true}}))}

// ---------------- staff: tests ----------------
function listTests(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 const mine=staffClasses(s),cn=nameMap('Classes','classId'),sn=nameMap('Subjects','subjectId'),atts=table('Attempts').rows;
 const tests=table('Tests').rows.filter(t=>!mine||mine[String(t.classId)]).reverse().map(t=>{const v=testView(t),a=atts.filter(x=>String(x.testId)===v.testId&&String(x.status)!=='reset');
  return Object.assign(v,{className:cn[String(t.classId)]||String(t.classId),subject:sn[String(t.subjectId)]||'Mixed',count:v.qids.length,attempts:a.length,submitted:a.filter(x=>String(x.status)==='submitted'||String(x.status)==='blocked').length,blocked:a.filter(x=>String(x.status)==='blocked').length,editable:s.role==='admin'||String(t.createdBy)===s.userId})});
 return{ok:true,tests,now:Date.now()}}

function saveTest(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.test||{},cid=resolveClass(d.classId),sub=clean(d.subjectId,20),title=clean(d.title,100),mode=String(d.mode);
  if(!title)throw new Error('Test title is required');if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
  if(sub&&!teachesSub(s,cid,sub))throw new Error('You do not teach this subject in this class');
  if(T_MODES.indexOf(mode)<0)throw new Error('Choose practice or test');
  const qids=[...new Set((Array.isArray(d.qids)?d.qids:[]).map(String))];if(!qids.length)throw new Error('Add at least 1 question');if(qids.length>200)throw new Error('Maximum 200 questions');
  const qm={};table('Questions').rows.forEach(q=>qm[String(q.qid)]=q);
  qids.forEach(q=>{if(!qm[q]||String(qm[q].classId)!==cid)throw new Error('Question '+q+' does not belong to this class');if(mode==='practice'&&String(qm[q].type||'mcq')!=='mcq')throw new Error('Practice sets can have only MCQ questions')});
  const dur=Math.round(Number(d.durationMin)||0),marks=Number(d.marksPer)||1,neg=Number(d.negative)||0;
  let start=0,end=0,proctor=T_PROCTOR.indexOf(String(d.proctor))>=0?String(d.proctor):'off';
  if(mode==='test'){start=parseIST(d.start);end=parseIST(d.end);if(!start||!end)throw new Error('Set start and end time');if(end<=start)throw new Error('End time must be after start time');
   if(dur<5||dur>300)throw new Error('Duration must be between 5 and 300 minutes')}
  else{proctor='off'}
  if(marks<=0||marks>100)throw new Error('Marks per question must be 1-100');if(neg<0||neg>marks)throw new Error('Negative marks must be between 0 and marks per question');
  const o={title,classId:cid,subjectId:sub,mode,durationMin:mode==='test'?dur:(dur||0),start,end,marksPer:marks,negative:neg,proctor,shuffle:d.shuffle?'TRUE':'FALSE',qids:qids.join(','),
   status:String(d.status)==='published'?'published':'draft',instructions:txt(d.instructions,600),reveal:String(d.reveal)==='submit'?'submit':'end'};
  if(d.testId){const ex=find('Tests',x=>String(x.testId)===String(d.testId));if(!ex)throw new Error('Test not found');
   if(s.role!=='admin'&&String(ex.createdBy)!==s.userId)throw new Error('You can edit only your own tests');
   const used=table('Attempts').rows.some(a=>String(a.testId)===String(ex.testId)&&String(a.status)!=='reset');
   if(used&&(String(ex.classId)!==cid||String(ex.qids)!==o.qids||Number(ex.marksPer)!==marks||Number(ex.negative)!==neg||String(ex.mode)!==mode))throw new Error('Students have already attempted this test. You can change only title, time and status.');
   setRow('Tests',ex._row,o);log(s.userId,'test_edit',ex.testId);return{ok:true,testId:String(ex.testId)}}
  const id=nextId('Tests','testId','TS',4);addRow('Tests',Object.assign(o,{testId:id,createdBy:s.userId,date:todayStr()}));log(s.userId,'test_add',id);return{ok:true,testId:id}}))}

function deleteTest(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Tests',x=>String(x.testId)===String(b.testId));if(!ex)throw new Error('Test not found');
  if(s.role!=='admin'&&String(ex.createdBy)!==s.userId)throw new Error('You can delete only your own tests');
  if(table('Attempts').rows.some(a=>String(a.testId)===String(ex.testId)))throw new Error('Students have attempted this test. Unpublish it instead.');
  tab('Tests').deleteRow(ex._row);log(s.userId,'test_delete',ex.testId);return{ok:true}}))}

function staffTest(s,id){const t=find('Tests',x=>String(x.testId)===String(id));if(!t)throw new Error('Test not found');
 if(!canClass(s,String(t.classId)))throw new Error('You do not have permission for this class');return t}

function testResults(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const t=staffTest(s,b.testId),v=testView(t),now=Date.now();
  table('Attempts').rows.filter(a=>String(a.testId)===v.testId&&String(a.status)==='inprogress').forEach(a=>finalizeIfExpired(a,t,now));
  const atts=table('Attempts').rows.filter(a=>String(a.testId)===v.testId&&String(a.status)!=='reset'),vio=table('Violations').rows.filter(x=>String(x.testId)===v.testId&&String(x.type)!=='snapshot');
  const sts=activeStudents(v.classId).sort((a,c)=>(parseInt(a.roll,10)||0)-(parseInt(c.roll,10)||0));
  const rows=sts.map(r=>{const mine=atts.filter(a=>String(a.studentId)===String(r.studentId)),best=mine.sort((a,c)=>Number(c.score)-Number(a.score))[0];
   return{studentId:String(r.studentId),name:r.name,roll:String(r.roll),attempts:mine.length,attemptId:best?String(best.attemptId):'',status:best?String(best.status):'none',score:best?Number(best.score):null,total:best?Number(best.total):null,
    correct:best?Number(best.correct):null,wrong:best?Number(best.wrong):null,pending:best?Number(best.pending)||0:0,strikes:best?Number(best.strikes)||0:0,violations:vio.filter(x=>String(x.studentId)===String(r.studentId)).length}});
  const done=rows.filter(r=>r.score!==null),avg=done.length?Math.round(done.reduce((a,r)=>a+r.score,0)/done.length*100)/100:0;
  return{ok:true,test:Object.assign(v,{count:v.qids.length}),rows,stats:{students:rows.length,attempted:done.length,avg,highest:done.length?Math.max.apply(null,done.map(r=>r.score)):0,blocked:rows.filter(r=>r.status==='blocked').length,pending:rows.reduce((x,r)=>x+(r.pending?1:0),0)}}})}

function attemptDetail(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const a=find('Attempts',x=>String(x.attemptId)===String(b.attemptId));if(!a)throw new Error('Attempt not found');const t=staffTest(s,a.testId);
  const qm={};table('Questions').rows.forEach(q=>qm[String(q.qid)]=q);const ans=jparse(a.answers,{}),grd=jparse(a.grades,{}),ord=jparse(a.order,[]);
  const review=ord.map(o=>{const q=qm[o.q];return q?Object.assign(qOf(q,true),{mine:ans[o.q]||'',grade:grd[o.q]||null}):null}).filter(Boolean);
  const vio=table('Violations').rows.filter(x=>String(x.attemptId)===String(a.attemptId)).map(x=>({id:String(x.id),time:Number(x.time),type:String(x.type),detail:String(x.detail||''),photo:!!String(x.photoId||'')}));
  return{ok:true,attempt:{attemptId:String(a.attemptId),studentId:String(a.studentId),status:String(a.status),score:Number(a.score),total:Number(a.total),correct:Number(a.correct),wrong:Number(a.wrong),skipped:Number(a.skipped),pending:Number(a.pending)||0,strikes:Number(a.strikes)||0,startedAt:Number(a.startedAt),submittedAt:Number(a.submittedAt)||0},review,violations:vio,test:testView(t)}})}

// Teacher/AI-suggested marks for subjective answers; teacher confirms here
function gradeAttempt(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const a=find('Attempts',x=>String(x.attemptId)===String(b.attemptId));if(!a)throw new Error('Attempt not found');const t=staffTest(s,a.testId);
  if(String(a.status)==='inprogress')throw new Error('The student is still writing this test');
  const ord=jparse(a.order,[]),ids={};ord.forEach(o=>ids[o.q]=1);const qm=qMap(ids),gr=jparse(a.grades,{}),inp=b.grades||{};
  Object.keys(inp).forEach(q=>{const qq=qm[q];if(!qq||String(qq.type||'mcq')==='mcq'||!ids[q])return;const mk=Number(qq.marks)||5,m=Number(inp[q].m);
   if(inp[q].m===''||inp[q].m===null||inp[q].m===undefined){delete gr[q];return}
   if(!isFinite(m)||m<0||m>mk)throw new Error('Marks for a question must be between 0 and '+mk);
   gr[q]={m:Math.round(m*100)/100,c:clean(inp[q].c,300),by:inp[q].by==='ai'?'ai':s.userId}});
  const g=gradeOrder(ord,jparse(a.answers,{}),t,qm,gr);setRow('Attempts',a._row,Object.assign(g,{grades:JSON.stringify(gr)}));log(s.userId,'attempt_graded',a.attemptId+' '+g.score+'/'+g.total);
  return{ok:true,score:g.score,total:g.total,pending:g.pending}}))}

function violationPhoto(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const v=find('Violations',x=>String(x.id)===String(b.id));if(!v||!String(v.photoId))throw new Error('No photo');staffTest(s,v.testId);
  const f=DriveApp.getFileById(String(v.photoId)),bl=f.getBlob();return{ok:true,data:'data:'+bl.getContentType()+';base64,'+Utilities.base64Encode(bl.getBytes())}})}

// Block hone ya galti se warning milne par teacher naya mauka de sakta hai
function resetAttempt(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const a=find('Attempts',x=>String(x.attemptId)===String(b.attemptId));if(!a)throw new Error('Attempt not found');staffTest(s,a.testId);
  setRow('Attempts',a._row,{status:'reset'});log(s.userId,'attempt_reset',a.attemptId+' '+a.studentId);return{ok:true}}))}

// ---------------- grading ----------------
function gradeOrder(order,ans,t,qm,gr){gr=gr||{};let c=0,w=0,k=0,ms=0,sm=0,pend=0,total=0;const mp=Number(t.marksPer)||1,ng=Number(t.negative)||0;
 order.forEach(o=>{const q=qm[o.q];if(!q)return;const a=ans[o.q],ty=String(q.type||'mcq');
  if(ty==='mcq'){total+=mp;if(!a)k++;else if(a===String(q.correct)){c++;ms+=mp}else{w++;ms-=ng}}
  else{const mk=Number(q.marks)||5;total+=mk;if(!a||!String(a).trim())k++;else{const g=gr[o.q];
   if(g&&g.m!==undefined&&g.m!==''){const m=Math.min(mk,Math.max(0,Number(g.m)||0));sm+=m;if(m>=mk/2)c++;else w++}else pend++}}});
 return{score:Math.round((ms+sm)*100)/100,total:Math.round(total*100)/100,correct:c,wrong:w,skipped:k,pending:pend}}
function qMap(ids){const m={};table('Questions').rows.forEach(q=>{if(!ids||ids[String(q.qid)])m[String(q.qid)]=q});return m}
function finishAttempt(a,t,answers,status){
 const order=jparse(a.order,[]),ids={};order.forEach(o=>ids[o.q]=1);const ans=answers||jparse(a.answers,{});
 const g=gradeOrder(order,ans,t,qMap(ids),jparse(a.grades,{}));setRow('Attempts',a._row,Object.assign(g,{answers:JSON.stringify(ans),submittedAt:Date.now(),status:status||'submitted'}));return g}
const deadlineOf=(a,t)=>String(t.mode)==='test'?Math.min(Number(a.startedAt)+(Number(t.durationMin)||0)*60000,Number(t.end)||1e15):0;
function finalizeIfExpired(a,t,now){if(String(a.status)!=='inprogress'||String(t.mode)!=='test')return false;
 if(now>deadlineOf(a,t)+45000){finishAttempt(a,t,null,'submitted');return true}return false}

// ---------------- student ----------------
function myTests(b){
 const r=stu(b);if(!r)return DENIED;
 const cid=String(r.classId),now=Date.now(),sn=nameMap('Subjects','subjectId'),QM=qMap(),atts=table('Attempts').rows.filter(a=>String(a.studentId)===String(r.studentId)&&String(a.status)!=='reset');
 const tests=table('Tests').rows.filter(t=>String(t.status)==='published'&&String(t.classId)===cid).reverse().map(t=>{const v=testView(t);
  const mine=atts.filter(a=>String(a.testId)===v.testId);mine.filter(a=>String(a.status)==='inprogress').forEach(a=>finalizeIfExpired(a,t,now));
  const mm=table('Attempts').rows.filter(a=>String(a.testId)===v.testId&&String(a.studentId)===String(r.studentId)&&String(a.status)!=='reset');
  const done=mm.filter(a=>String(a.status)==='submitted'||String(a.status)==='blocked'),best=done.sort((x,y)=>Number(y.score)-Number(x.score))[0],prog=mm.find(a=>String(a.status)==='inprogress');
  const state=v.mode==='practice'?'practice':(now<v.start?'upcoming':(now>v.end?'ended':'live'));
  return{testId:v.testId,title:v.title,subject:sn[v.subjectId]||'Mixed',mode:v.mode,state,start:v.start,end:v.end,durationMin:v.durationMin,count:v.qids.length,marks:v.qids.reduce((x,id)=>{const q=QM[id];return x+(q?(String(q.type||'mcq')==='mcq'?v.marksPer:(Number(q.marks)||5)):0)},0),proctor:v.proctor,
   attempts:done.length,best:best?{attemptId:String(best.attemptId),score:Number(best.score),total:Number(best.total),status:String(best.status),pending:Number(best.pending)||0}:null,
   blocked:mm.some(a=>String(a.status)==='blocked'),inprogress:prog?String(prog.attemptId):''}});
 const topics={};table('Questions').rows.filter(q=>String(q.classId)===cid&&String(q.type||'mcq')==='mcq').forEach(q=>{const sid=String(q.subjectId),ch=String(q.chapter||'General').trim()||'General';
  const o=topics[sid]=topics[sid]||{subjectId:sid,subject:sn[sid]||sid,total:0,chapters:{}};o.total++;o.chapters[ch]=(o.chapters[ch]||0)+1});
 return{ok:true,tests,now,topics:Object.keys(topics).map(k=>({subjectId:k,subject:topics[k].subject,total:topics[k].total,chapters:Object.keys(topics[k].chapters).sort().map(c=>({chapter:c,count:topics[k].chapters[c]}))}))}}

function permOrder(qids,doShuffle){const qs=doShuffle?shuffle(qids):qids;return qs.map(q=>({q,o:doShuffle?shuffle(OPTK).join(''):'abcd'}))}
function paperOf(order,qm){return order.map(o=>{const q=qm[o.q];if(!q)return null;const full=qOf(q,false),by={};full.opts.forEach(x=>by[x.k]=x);
 return{qid:full.qid,text:full.text,type:full.type,marks:full.marks,opts:o.o.split('').map(k=>by[k]).filter(Boolean)}}).filter(Boolean)}

function startTest(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{
  const cid=String(r.classId),now=Date.now();let t,order,mode,title,adhoc=null;
  if(b.practice){const p=b.practice,sub=clean(p.subjectId,20),ch=clean(p.chapter,100),n=Math.max(3,Math.min(30,Math.round(Number(p.count))||10));
   const pool=table('Questions').rows.filter(q=>String(q.classId)===cid&&String(q.type||'mcq')==='mcq'&&(!sub||String(q.subjectId)===sub)&&(!ch||(String(q.chapter||'General').trim()||'General')===ch));
   if(pool.length<1)throw new Error('No questions available for this topic yet');
   const pick=shuffle(pool.map(q=>String(q.qid))).slice(0,n);order=permOrder(pick,true);mode='practice';
   t={testId:'PRACTICE',title:'Practice: '+(ch||'Mixed'),mode:'practice',marksPer:1,negative:0,proctor:'off',durationMin:0,end:0,instructions:'Practice mode: you get instant feedback after each answer.'}}
  else{const tt=find('Tests',x=>String(x.testId)===String(b.testId)&&String(x.status)==='published'&&String(x.classId)===cid);if(!tt)throw new Error('Test not found');t=tt;mode=String(t.mode)}
  title=String(t.title);const tid=String(t.testId),mine=table('Attempts').rows.filter(a=>String(a.testId)===tid&&String(a.studentId)===String(r.studentId)&&String(a.status)!=='reset');
  if(mode==='test'){
   if(mine.some(a=>String(a.status)==='blocked'))throw new Error('You are blocked from this test. Please contact your teacher.');
   if(now<Number(t.start))throw new Error('This test has not started yet');if(now>Number(t.end))throw new Error('This test has ended');
   const open=mine.find(a=>String(a.status)==='inprogress');
   if(open&&finalizeIfExpired(open,t,now))throw new Error('Your time was over. The test was submitted automatically.');
   if(!open&&mine.length)throw new Error('You have already attempted this test');
   if(open)return resumeOf(open,t,r,now)}
  else{const open=!b.practice&&mine.find(a=>String(a.status)==='inprogress');if(open)return resumeOf(open,t,r,now)}
  if(!order)order=permOrder(String(t.qids).split(',').filter(Boolean),String(t.shuffle).toUpperCase()==='TRUE');
  const id='A'+Utilities.getUuid().replace(/-/g,'').slice(0,10);
  addRow('Attempts',{attemptId:id,testId:tid,studentId:String(r.studentId),startedAt:now,submittedAt:'',answers:'{}',order:JSON.stringify(order),score:0,total:0,correct:0,wrong:0,skipped:0,status:'inprogress',strikes:0,flags:''});
  const a=find('Attempts',x=>String(x.attemptId)===id);log(r.studentId,'test_start',tid+' '+id);return resumeOf(a,t,r,now)}))}

function resumeOf(a,t,r,now){
 const order=jparse(a.order,[]),ids={};order.forEach(o=>ids[o.q]=1);const qm=qMap(ids);
 return{ok:true,attemptId:String(a.attemptId),testId:String(t.testId),title:String(t.title),mode:String(t.mode),proctor:String(t.proctor||'off'),marksPer:Number(t.marksPer)||1,negative:Number(t.negative)||0,
  instructions:String(t.instructions||''),deadline:deadlineOf(a,t),now,strikes:Number(a.strikes)||0,maxStrikes:maxStrikes(),answers:jparse(a.answers,{}),questions:paperOf(order,qm),student:String(r.name)}}

function ownAttempt(r,id){const a=find('Attempts',x=>String(x.attemptId)===String(id)&&String(x.studentId)===String(r.studentId));if(!a)throw new Error('Attempt not found');return a}
function attemptTest(a){if(String(a.testId)==='PRACTICE')return{testId:'PRACTICE',mode:'practice',marksPer:1,negative:0,proctor:'off',durationMin:0,end:0};const t=find('Tests',x=>String(x.testId)===String(a.testId));if(!t)throw new Error('Test not found');return t}
const cleanAns=(ans)=>{const o={};let len=0;if(ans&&typeof ans==='object')Object.keys(ans).slice(0,250).forEach(q=>{let v=String(ans[q]==null?'':ans[q]);
 if(v.length===1&&OPTK.indexOf(v.toLowerCase())>=0)v=v.toLowerCase();else v=v.replace(/\u0000/g,'').slice(0,3000);
 if(!v.trim())return;if(len+v.length>44000)return;len+=v.length+16;o[String(q).slice(0,12)]=v});return o};

function saveProgress(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const a=ownAttempt(r,b.attemptId);if(String(a.status)!=='inprogress')return{ok:true,status:String(a.status)};
  setRow('Attempts',a._row,{answers:JSON.stringify(cleanAns(b.answers))});return{ok:true,status:'inprogress'}})}

// Practice mein har jawab ke turant baad sahi/galat dikhane ke liye
function checkAnswer(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const a=ownAttempt(r,b.attemptId),t=attemptTest(a);if(String(t.mode)!=='practice')throw new Error('Not allowed in a test');
  const ord=jparse(a.order,[]);if(!ord.some(o=>o.q===String(b.qid)))throw new Error('Question not in this attempt');
  const q=find('Questions',x=>String(x.qid)===String(b.qid));if(!q)throw new Error('Question not found');const ans=jparse(a.answers,{}),k=String(b.ans).toLowerCase();
  if(OPTK.indexOf(k)<0)throw new Error('Invalid option');ans[String(b.qid)]=k;setRow('Attempts',a._row,{answers:JSON.stringify(ans)});
  return{ok:true,correct:k===String(q.correct),right:String(q.correct),explain:String(q.explain||'').trim()}})}

function resultOf(a,g,t){const mx=g.total||1;return{score:g.score,total:g.total,correct:g.correct,wrong:g.wrong,skipped:g.skipped,pending:Number(g.pending)||0,percent:Math.round(g.score*1000/mx)/10,status:String(a.status),mode:String(t.mode),
 timeTaken:Math.round((Date.now()-Number(a.startedAt))/1000)}}

function submitTest(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{const a=ownAttempt(r,b.attemptId),t=attemptTest(a);
  if(String(a.status)!=='inprogress'){return{ok:true,result:resultOf(a,{score:Number(a.score),total:Number(a.total),correct:Number(a.correct),wrong:Number(a.wrong),skipped:Number(a.skipped),pending:Number(a.pending)||0},t),already:true}}
  const late=String(t.mode)==='test'&&Date.now()>deadlineOf(a,t)+45000;
  const g=finishAttempt(a,t,late?null:cleanAns(b.answers),'submitted');log(r.studentId,'test_submit',a.attemptId+' '+g.score+'/'+g.total);
  return{ok:true,result:resultOf(find('Attempts',x=>String(x.attemptId)===String(a.attemptId)),g,t)}}))}

function attemptReview(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const a=ownAttempt(r,b.attemptId),t=attemptTest(a);if(String(a.status)==='inprogress')throw new Error('Submit the test first');
  if(String(t.mode)==='test'&&String(t.reveal)!=='submit'&&Date.now()<=Number(t.end))throw new Error('Answers open after the test ends for everyone ('+Utilities.formatDate(new Date(Number(t.end)),TZ,'d MMM, h:mm a')+')');
  const ans=jparse(a.answers,{}),grd=jparse(a.grades,{}),ord=jparse(a.order,[]),ids={};ord.forEach(o=>ids[o.q]=1);const qm=qMap(ids);
  return{ok:true,title:String(t.title),result:resultOf(a,{score:Number(a.score),total:Number(a.total),correct:Number(a.correct),wrong:Number(a.wrong),skipped:Number(a.skipped),pending:Number(a.pending)||0},t),
   review:ord.map(o=>{const q=qm[o.q];if(!q)return null;const full=qOf(q,true),by={};full.opts.forEach(x=>by[x.k]=x);const g=grd[o.q];return{qid:full.qid,text:full.text,type:full.type,marks:full.marks,opts:o.o.split('').map(k=>by[k]).filter(Boolean),correct:full.correct,explain:full.explain,keyAns:full.keyAns,mine:ans[o.q]||'',grade:g?{m:Number(g.m),c:String(g.c||'')}:null}}).filter(Boolean)}})}

// ---------------- proctoring ----------------
const COUNTED=['face_missing','multiple_faces','looking_away','tab_switch','fullscreen_exit','camera_off','camera_covered','window_blur'];
function proctorFolder(){const id=P.getProperty('PROCTOR_FOLDER_ID');if(id){try{return DriveApp.getFolderById(id)}catch(e){}}
 const f=DriveApp.createFolder('School Proctor (private)');P.setProperty('PROCTOR_FOLDER_ID',f.getId());return f}
function savePhoto(dataUrl,name){const m=String(dataUrl||'').match(/^data:image\/jpeg;base64,([A-Za-z0-9+\/=]+)$/);if(!m||m[1].length>220000)return '';
 try{return proctorFolder().createFile(Utilities.newBlob(Utilities.base64Decode(m[1]),'image/jpeg',name+'.jpg')).getId()}catch(e){return ''}}

function reportViolation(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{const a=ownAttempt(r,b.attemptId),t=attemptTest(a),type=clean(b.type,20),max=maxStrikes();
  if(String(a.status)!=='inprogress')return{ok:true,strikes:Number(a.strikes)||0,blocked:String(a.status)==='blocked',max};
  if(String(t.proctor||'off')==='off')return{ok:true,strikes:0,blocked:false,max};
  const vio=table('Violations').rows.filter(x=>String(x.attemptId)===String(a.attemptId)),now=Date.now();
  if(type==='snapshot'){if(vio.filter(x=>String(x.type)==='snapshot').length>=15)return{ok:true,strikes:Number(a.strikes)||0,blocked:false,max};
   const pid=savePhoto(b.photo,a.attemptId+'-s'+now);addRow('Violations',{id:'V'+Utilities.getUuid().replace(/-/g,'').slice(0,10),attemptId:a.attemptId,testId:a.testId,studentId:a.studentId,time:now,type:'snapshot',detail:'',photoId:pid});
   return{ok:true,strikes:Number(a.strikes)||0,blocked:false,max}}
  if(COUNTED.indexOf(type)<0)throw new Error('Unknown event');
  const last=vio.filter(x=>String(x.type)!=='snapshot').pop();
  if(last&&now-Number(last.time)<4000)return{ok:true,strikes:Number(a.strikes)||0,blocked:false,max,dup:true};       // ek hi ghatna ke do strike nahi
  const strikes=(Number(a.strikes)||0)+1,pid=savePhoto(b.photo,a.attemptId+'-'+now);
  addRow('Violations',{id:'V'+Utilities.getUuid().replace(/-/g,'').slice(0,10),attemptId:a.attemptId,testId:a.testId,studentId:a.studentId,time:now,type,detail:clean(b.detail,120),photoId:pid});
  setRow('Attempts',a._row,{strikes});
  if(strikes>=max){const g=finishAttempt(Object.assign({},a,{strikes}),t,cleanAns(b.answers),'blocked');setRow('Attempts',a._row,{strikes});
   log(r.studentId,'test_blocked',a.attemptId+' '+type);return{ok:true,strikes,blocked:true,max,result:resultOf(Object.assign({},a,{status:'blocked'}),g,t)}}
  return{ok:true,strikes,blocked:false,max}}))}

// Privacy: proctor photos 30 din baad Drive se hat jati hain (daily trigger: enableProctorCleanup chalao)
function purgeProctorPhotos(){const cut=Date.now()-30*86400000,s=tab('Violations'),v=s.getDataRange().getValues(),pc=SCHEMA.Violations.indexOf('photoId'),tc=SCHEMA.Violations.indexOf('time');let n=0;
 for(let i=1;i<v.length;i++){if(v[i][pc]&&Number(v[i][tc])<cut){try{DriveApp.getFileById(String(v[i][pc])).setTrashed(true)}catch(e){}s.getRange(i+1,pc+1).setValue('');n++}}return n}
function enableProctorCleanup(){if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='purgeProctorPhotos'))ScriptApp.newTrigger('purgeProctorPhotos').timeBased().atHour(3).everyDays(1).create();Logger.log('Proctor photo cleanup enabled')}
