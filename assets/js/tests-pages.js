// Online tests (teacher + admin): question bank, test builder, results, proctoring review
const T_IST=ms=>ms?new Date(ms).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'-';
const T_INPUT=ms=>ms?new Date(ms+5.5*3600e3).toISOString().slice(0,16):'';
const T_DIFF=[['easy','Easy'],['medium','Medium'],['hard','Hard']];
const T_PROC=[['off','Off'],['basic','Basic: tab switch + fullscreen'],['camera','Camera: AI face monitoring']];
const VIO={face_missing:'Face not visible',multiple_faces:'More than one face',looking_away:'Looking away',tab_switch:'Left the test tab',fullscreen_exit:'Exited fullscreen',camera_off:'Camera turned off',camera_covered:'Camera covered',window_blur:'Window lost focus',snapshot:'Periodic snapshot'};
const chip=(t,k)=>el('span',{class:'tchip '+(k||'')},t);
const selEl=(opts,val,on)=>{const s=el('select',{},opts.map(([v,l])=>el('option',{value:v},l)));if(val!=null)s.value=val;if(on)s.onchange=on;return s};
const fld=(l,i,hint)=>el('div',{class:'tf'},el('label',{},l),i,hint?el('small',{class:'mu'},hint):'');

async function initTests(){
 const m=page('n_tests');
 const opt=await call('noteOptions'),classes=opt.classes;
 if(!classes.length){m.append(emptyState('No classes yet','Classes appear here once you are assigned to them'));return}
 let tab='tests';const body=el('div'),seg=el('div',{class:'seg'});
 const go=t=>{tab=t;[...seg.children].forEach(b=>b.classList.toggle('on',b.dataset.t===t));body.innerHTML='';(t==='tests'?viewTests:viewBank)(body,classes)};
 [['tests','Tests'],['bank','Question bank']].forEach(([k,l])=>seg.append(el('button',{type:'button','data-t':k,onclick:()=>go(k)},l)));
 m.append(seg,body);go('tests')}

/* ---------------- tests list ---------------- */
async function viewTests(box,classes){
 box.innerHTML='';box.append(el('div',{class:'bar'},btn('+ New test',()=>testForm(null,classes,()=>viewTests(box,classes)),false)));
 const list=el('div',{class:'flist'});box.append(list);
 const load=async()=>{const r=await call('listTests');list.innerHTML='';
  if(!r.tests.length){list.append(emptyState('No tests yet','Create a test or a practice set. Add questions to the question bank first.'));return}
  r.tests.forEach(t=>list.append(testCard(t,r.now,classes,load,box)))};
 await load()}

function testCard(t,now,classes,reload,box){
 const live=t.status==='published'&&t.mode==='test'&&now>=t.start&&now<=t.end,over=t.mode==='test'&&now>t.end;
 const st=t.status==='draft'?['Draft','']:t.mode==='practice'?['Practice','pr']:live?['Live','live']:over?['Ended','end']:['Scheduled','sch'];
 const c=el('div',{class:'tcard'});
 const top=el('div',{class:'tct'},el('div',{class:'tci'},miEl(t.mode==='practice'?'notebook':'exam')),el('div',{class:'tcm'},el('b',{},t.title),el('span',{class:'mu'},t.className+' · '+t.subject)),chip(st[0],st[1]));
 const meta=el('div',{class:'tcs'},chip(t.count+' questions'),t.mode==='test'?chip(t.durationMin+' min'):'',t.proctor!=='off'?chip(t.proctor==='camera'?'Camera proctored':'Tab proctored','pc'):'',
  t.mode==='test'?chip(T_IST(t.start)+' → '+T_IST(t.end)):'',chip(t.attempts+' attempted'+(t.blocked?' · '+t.blocked+' blocked':''),t.blocked?'bad':''));
 const act=el('div',{class:'row',style:'flex-wrap:wrap'},[btn('Results',()=>showResults(t.testId,box,classes)),
  t.editable?btn('Edit',()=>testForm(t,classes,reload)):'',
  t.editable?btn(t.status==='published'?'Unpublish':'Publish',async()=>{await call('saveTest',{test:Object.assign({},t,{status:t.status==='published'?'draft':'published',start:T_INPUT(t.start),end:T_INPUT(t.end)})});toast(t.status==='published'?'Moved to draft':'Published');reload()}):'',
  t.editable&&!t.attempts?btn('Delete',async()=>{if(confirm('Delete "'+t.title+'"?')){await call('deleteTest',{testId:t.testId});reload()}}):'']);
 c.append(top,meta,act);return c}

/* ---------------- test builder ---------------- */
function testForm(t,classes,done){
 t=t||{};const isNew=!t.testId;
 const title=el('input',{placeholder:'e.g. Unit Test 1 - Fractions',value:t.title||''}),
  cls=selEl(classes.map(c=>[c.classId,c.name]),t.classId||classes[0].classId),
  sub=selEl([],''),mode=selEl([['test','Scheduled test'],['practice','Practice set']],t.mode||'test'),
  start=el('input',{type:'datetime-local',value:T_INPUT(t.start)}),end=el('input',{type:'datetime-local',value:T_INPUT(t.end)}),
  dur=el('input',{type:'number',min:'5',max:'300',value:t.durationMin||30}),marks=el('input',{type:'number',min:'1',value:t.marksPer||1}),neg=el('input',{type:'number',min:'0',step:'0.25',value:t.negative||0}),
  proc=selEl(T_PROC,t.proctor||'off'),shuf=el('input',{type:'checkbox'}),ins=el('textarea',{rows:2,placeholder:'Instructions shown before the test starts'}),
  q=el('input',{placeholder:'Search questions'}),qlist=el('div',{class:'qpick'}),qcount=el('b',{},'0');
 shuf.checked=!!t.shuffle;ins.value=t.instructions||'';const picked=new Set(t.qids||[]);let all=[];
 const fillSub=()=>{const c=classes.find(x=>x.classId===cls.value);sub.innerHTML='';sub.append(el('option',{value:''},'Mixed / all subjects'));(c?c.subjects:[]).forEach(s=>sub.append(el('option',{value:s.subjectId},s.name)));sub.value=(c&&c.subjects.some(s=>s.subjectId===t.subjectId))?t.subjectId:''};
 const draw=()=>{const tx=q.value.toLowerCase();qlist.innerHTML='';qcount.textContent=String(picked.size);
  const vis=all.filter(x=>(!sub.value||x.subjectId===sub.value)&&(!tx||(x.text+' '+x.chapter).toLowerCase().includes(tx)));
  if(!vis.length){qlist.append(el('p',{class:'mu'},'No questions for this class/subject yet. Add them in the Question bank tab.'));return}
  vis.forEach(x=>{const cb=el('input',{type:'checkbox'});cb.checked=picked.has(x.qid);cb.onchange=()=>{cb.checked?picked.add(x.qid):picked.delete(x.qid);qcount.textContent=String(picked.size)};
   qlist.append(el('label',{class:'qrow'},cb,el('span',{},el('b',{},x.text),el('small',{class:'mu'},(x.chapter?x.chapter+' · ':'')+x.difficulty))))})};
 const loadQ=async()=>{if(!isNew&&t.classId===cls.value&&all.length)return;const r=await call('listQuestions',{classId:cls.value});all=r.questions;draw()};
 cls.onchange=()=>{picked.clear();fillSub();loadQ()};sub.onchange=draw;q.oninput=draw;
 const sync=()=>{[start,end,dur].forEach(i=>i.closest('.tf').style.display=mode.value==='test'?'':'none');proc.closest('.tf').style.display=mode.value==='test'?'':'none'};mode.onchange=sync;
 fillSub();
 const pickN=el('input',{type:'number',min:'1',value:'10',style:'width:70px'});
 const randBtn=el('button',{type:'button',class:'g s',onclick:()=>{const vis=all.filter(x=>!sub.value||x.subjectId===sub.value).sort(()=>Math.random()-.5).slice(0,Number(pickN.value)||10);picked.clear();vis.forEach(x=>picked.add(x.qid));draw()}},'Pick random');
 const body=el('div',{class:'frm tform'},fld('Title *',title),el('div',{class:'g2'},fld('Class *',cls),fld('Subject',sub)),fld('Type',mode),
  el('div',{class:'g2'},fld('Starts *',start),fld('Ends *',end)),el('div',{class:'g3'},fld('Duration (min)',dur),fld('Marks / question',marks),fld('Negative marks',neg)),
  fld('Proctoring',proc,'Camera mode asks the student for camera permission and watches for abnormal behaviour. 3 warnings block the student.'),
  el('label',{class:'chk'},shuf,' Shuffle questions and options'),fld('Instructions',ins),
  el('div',{class:'qh'},el('b',{},'Questions'),el('span',{class:'mu'},'Selected: '),qcount,el('span',{style:'flex:1'}),pickN,randBtn),q,qlist);
 sync();if(!all.length)loadQ();
 const save=status=>async()=>{if(!picked.size)throw new Error('Select at least 1 question');
  await call('saveTest',{test:{testId:t.testId,title:title.value,classId:cls.value,subjectId:sub.value,mode:mode.value,durationMin:dur.value,start:start.value,end:end.value,marksPer:marks.value,negative:neg.value,
   proctor:proc.value,shuffle:shuf.checked,qids:[...picked],instructions:ins.value,status}});toast(status==='published'?'Test published':'Saved as draft');await done()};
 const d=modal(isNew?'New test':'Edit test',body,[{t:'Cancel',g:1,fn:()=>true},{t:'Save draft',g:1,fn:save('draft')},{t:'Publish',fn:save('published')}]);d.classList.add('wide')}

/* ---------------- question bank ---------------- */
async function viewBank(box,classes){
 const fc=selEl(classes.map(c=>[c.classId,c.name]),classes[0].classId),fs=selEl([],''),fq=el('input',{placeholder:'Search'}),list=el('div',{class:'flist'});
 const fillSub=()=>{const c=classes.find(x=>x.classId===fc.value);fs.innerHTML='';fs.append(el('option',{value:''},'All subjects'));(c?c.subjects:[]).forEach(s=>fs.append(el('option',{value:s.subjectId},s.name)))};
 const load=async()=>{const r=await call('listQuestions',{classId:fc.value,subjectId:fs.value,q:fq.value});list.innerHTML='';
  if(!r.questions.length){list.append(emptyState('No questions yet','Add questions one by one, or paste many at once with Bulk add.'));return}
  r.questions.forEach(x=>list.append(qCard(x,classes,load)))};
 fc.onchange=()=>{fillSub();load()};fs.onchange=load;let tm;fq.oninput=()=>{clearTimeout(tm);tm=setTimeout(load,300)};fillSub();
 box.append(el('div',{class:'bar'},btn('+ Add question',()=>qForm(null,classes,fc.value,load),false),btn('Bulk add',()=>bulkForm(classes,fc.value,load))),el('div',{class:'bar'},fc,fs,fq),list);await load()}

function qCard(x,classes,reload){
 const c=el('div',{class:'qcard'});
 c.append(el('div',{class:'qct'},el('b',{},x.text),chip(x.difficulty,'d-'+x.difficulty)),
  el('ol',{class:'qop'},x.opts.map(o=>el('li',{class:o.k===x.correct?'ok':''},o.t))),
  el('div',{class:'tcs'},chip(x.subject),x.chapter?chip(x.chapter):'',x.explain?chip('Has explanation'):''),
  x.editable?el('div',{class:'row'},[btn('Edit',()=>qForm(x,classes,x.classId,reload)),btn('Delete',async()=>{if(confirm('Delete this question?')){await call('deleteQuestion',{qid:x.qid});reload()}})]):'');return c}

function qForm(x,classes,cid,done){
 x=x||{};const isNew=!x.qid;
 const cls=selEl(classes.map(c=>[c.classId,c.name]),x.classId||cid),sub=selEl([],''),ch=el('input',{placeholder:'Chapter (optional)',value:x.chapter||''}),text=el('textarea',{rows:3,placeholder:'Type the question'}),
  op={},ex=el('textarea',{rows:2,placeholder:'Explanation shown after answering (optional)'}),cor=selEl([['a','A'],['b','B'],['c','C'],['d','D']],x.correct||'a'),dif=selEl(T_DIFF,x.difficulty||'medium');
 text.value=x.text||'';ex.value=x.explain||'';
 ['a','b','c','d'].forEach(k=>op[k]=el('input',{placeholder:'Option '+k.toUpperCase()+(k<='b'?' *':''),value:((x.opts||[]).find(o=>o.k===k)||{}).t||''}));
 const fillSub=()=>{const c=classes.find(z=>z.classId===cls.value);sub.innerHTML='';(c?c.subjects:[]).forEach(s=>sub.append(el('option',{value:s.subjectId},s.name)));if(x.subjectId)sub.value=x.subjectId};cls.onchange=fillSub;fillSub();
 const body=el('div',{class:'frm tform'},el('div',{class:'g2'},fld('Class',cls),fld('Subject',sub)),fld('Chapter',ch),fld('Question *',text),el('div',{class:'g2'},fld('A',op.a),fld('B',op.b)),el('div',{class:'g2'},fld('C',op.c),fld('D',op.d)),
  el('div',{class:'g2'},fld('Correct answer',cor),fld('Difficulty',dif)),fld('Explanation',ex));
 const d=modal(isNew?'Add question':'Edit question',body,[{t:'Cancel',g:1,fn:()=>true},{t:'Save',fn:async()=>{
  await call('saveQuestion',{q:{qid:x.qid,classId:cls.value,subjectId:sub.value,chapter:ch.value,text:text.value,a:op.a.value,b:op.b.value,c:op.c.value,d:op.d.value,correct:cor.value,explain:ex.value,difficulty:dif.value}});toast('Saved');await done()}}]);d.classList.add('wide')}

function bulkForm(classes,cid,done){
 const cls=selEl(classes.map(c=>[c.classId,c.name]),cid),sub=selEl([],''),ch=el('input',{placeholder:'Chapter (optional)'}),ta=el('textarea',{rows:9,placeholder:'2 + 2 = ? | 3 | 4 | 5 | 6 | b | Because 2 + 2 is 4'});
 const fillSub=()=>{const c=classes.find(z=>z.classId===cls.value);sub.innerHTML='';(c?c.subjects:[]).forEach(s=>sub.append(el('option',{value:s.subjectId},s.name)))};cls.onchange=fillSub;fillSub();
 const body=el('div',{class:'frm tform'},el('div',{class:'g2'},fld('Class',cls),fld('Subject',sub)),fld('Chapter',ch),
  el('p',{class:'mu'},'One question per line:  Question | A | B | C | D | correct (a/b/c/d) | explanation (optional). You can paste from Excel too. Up to 300 lines.'),ta);
 const d=modal('Bulk add questions',body,[{t:'Cancel',g:1,fn:()=>true},{t:'Import',fn:async()=>{
  const rows=ta.value.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const p=l.split(/\s*\|\s*|\t/);return{text:p[0],a:p[1],b:p[2],c:p[3],d:p[4],correct:(p[5]||'').toLowerCase(),explain:p[6]||''}});
  if(!rows.length)throw new Error('Paste at least one line');
  const r=await call('importQuestions',{classId:cls.value,subjectId:sub.value,chapter:ch.value,rows});
  toast(r.added+' added'+(r.errors.length?' · '+r.errors.length+' skipped: '+r.errors[0]:''),!r.added);if(r.added)await done()}}]);d.classList.add('wide')}

/* ---------------- results ---------------- */
async function showResults(testId,box,classes){
 box.innerHTML='';const r=await call('testResults',{testId}),t=r.test,S=r.stats;
 const back=btn('← All tests',()=>{box.innerHTML='';viewTests(box,classes)});
 const stc=(l,v)=>el('div',{class:'card stat'},el('div',{class:'big'},String(v)),el('div',{class:'mu'},l));
 box.append(el('div',{class:'bar'},back),el('h3',{},t.title),el('p',{class:'mu'},t.count+' questions · '+(t.mode==='test'?T_IST(t.start)+' → '+T_IST(t.end):'Practice set')),
  el('div',{class:'grid'},stc('Students',S.students),stc('Attempted',S.attempted),stc('Average',S.avg),stc('Blocked',S.blocked)));
 const label={submitted:['Submitted','ok'],blocked:['Blocked','bad'],inprogress:['In progress','sch'],none:['Not attempted','']};
 box.append(tableEl([{h:'Roll',f:x=>x.roll},{h:'Name',f:x=>x.name},{h:'Status',f:x=>chip(label[x.status][0],label[x.status][1])},
  {h:'Score',f:x=>x.score==null?'-':x.score+' / '+x.total},{h:'Warnings',f:x=>x.strikes?chip(x.strikes+'/3','bad'):'0'},
  {h:'',f:x=>x.attemptId?el('div',{class:'row'},[btn('View',()=>attemptView(x.attemptId,()=>showResults(testId,box,classes))),(x.status==='blocked'||x.violations)?btn('Allow retake',async()=>{if(confirm('Cancel this attempt and let '+x.name+' take the test again?')){await call('resetAttempt',{attemptId:x.attemptId});toast('Reset. The student can start again.');showResults(testId,box,classes)}}):'']):''}],r.rows,'No students in this class'))}

async function attemptView(id,after){
 const r=await call('attemptDetail',{attemptId:id}),a=r.attempt,body=el('div',{class:'tform'});
 body.append(el('div',{class:'tcs'},chip(a.status,a.status==='blocked'?'bad':'ok'),chip('Score '+a.score+' / '+a.total),chip(a.correct+' correct'),chip(a.wrong+' wrong'),chip(a.skipped+' skipped')));
 const vio=r.violations;body.append(el('h3',{},'Proctoring log ('+vio.filter(v=>v.type!=='snapshot').length+' warnings)'));
 if(!vio.length)body.append(el('p',{class:'mu'},'No events recorded.'));
 const vl=el('div',{class:'vlist'});vio.forEach(v=>{const row=el('div',{class:'vrow'},el('b',{},(VIO[v.type]||v.type)),el('span',{class:'mu'},new Date(v.time).toLocaleTimeString('en-IN',{timeZone:'Asia/Kolkata'})+(v.detail?' · '+v.detail:'')));
  if(v.photo){const slot=el('div',{class:'vph'});row.append(btn('Photo',async b=>{const bt=b.target;bt.disabled=true;try{const p=await call('violationPhoto',{id:v.id});slot.innerHTML='';slot.append(el('img',{src:p.data,alt:'proctor photo'}));bt.remove()}catch(e){toast(e.message,1);bt.disabled=false}}),slot)}vl.append(row)});body.append(vl);
 body.append(el('h3',{},'Answers'));r.review.forEach((q,i)=>{const ok=q.mine===q.correct;body.append(el('div',{class:'rv '+(!q.mine?'sk':ok?'ok':'no')},el('b',{},(i+1)+'. '+q.text),
  el('ol',{class:'qop'},q.opts.map(o=>el('li',{class:o.k===q.correct?'ok':(o.k===q.mine?'wr':'')},o.t+(o.k===q.mine?'  ← student':''))))))});
 const d=modal('Attempt review',body,[{t:'Close',fn:()=>true}]);d.classList.add('wide')}
