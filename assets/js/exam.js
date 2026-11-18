// Student exam runner (standalone page): intro + system check, timer, palette, autosave, practice feedback, proctoring, result
const Q=new URLSearchParams(location.search),root=()=>document.getElementById('ex');
const fmt=s=>{s=Math.max(0,Math.floor(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return(h?h+':':'')+String(m).padStart(h?2:1,'0')+':'+String(x).padStart(2,'0')};
let X={};// state
const show=(...n)=>{const r=root();r.innerHTML='';r.append(...n)};
const wrap=(...n)=>el('div',{class:'xw'},...n);
const big=(ic,t,p,...b)=>wrap(el('div',{class:'xc xcen'},el('div',{class:'xi'},miEl(ic)),el('h2',{},t),el('p',{class:'mu'},p),...b));
const back=()=>location.href='tests.html';

async function boot(){
 if(!TOK.get()){location.href='../login.html';return}
 if(Q.get('r')){await loadBrand().catch(()=>{});return review(Q.get('r'))}
 await loadBrand().catch(()=>{});let r;
 try{r=await api('me')}catch(e){show(big('exam','Connection problem','Check your internet and try again.',btn('Retry',()=>location.reload())));return}
 if(!r.ok||r.user.role!=='student'){location.href='../login.html';return}
 const pr=Q.get('p');let info;
 try{
  if(pr){const[sid,ch,n]=pr.split('|');info={mode:'practice',title:'Practice: '+(ch||'Mixed'),practice:{subjectId:sid,chapter:ch,count:Number(n)||10},count:Number(n)||10,proctor:'off',instructions:'Practice mode: after each answer you instantly see whether it was right, with an explanation. Nothing here affects your marks.'}}
  else{const t=Q.get('t'),m=await call('myTests'),x=m.tests.find(z=>z.testId===t);if(!x)throw new Error('Test not found');info=x;info.instructions=info.instructions||''}
 }catch(e){show(big('exam','Cannot open',e.message,btn('Back to tests',back)));return}
 X.info=info;intro()}

function intro(){
 const i=X.info,cam=i.proctor==='camera',bas=i.proctor!=='off',prac=i.mode==='practice';
 const rules=[['Answers are saved automatically. You can change them until you submit.',1]];
 if(!prac){rules.push(['The test submits by itself when time ends.',1]);if(i.negative)rules.push(['Wrong answers lose marks.',1])}
 if(bas){rules.push(['The test opens in fullscreen. Do not leave the test tab or exit fullscreen.',1]);rules.push(['Every violation gives a warning. After 3 warnings you are blocked from the test.',1])}
 if(cam){rules.push(['Your camera must stay on and your face clearly visible, alone in the frame, looking at the screen. Keep the camera uncovered.',1]);rules.push(['The face check runs inside your phone. Only a few evidence photos are sent to your teacher and deleted after 30 days.',1])}
 const consent=el('input',{type:'checkbox'}),vid=el('video',{class:'xv',playsinline:'',muted:'',autoplay:''}),msg=el('div',{class:'err'}),go=btn(i.attempts&&0?'':'Start',null,false);
 go.disabled=bas;go.textContent=prac?'Start practice':'Start test';
 const chk=()=>{go.disabled=!consent.checked||(cam&&!X.camOk)};consent.onchange=chk;
 const c=el('div',{class:'xc'},el('div',{class:'xi'},miEl(prac?'notebook':'exam')),el('h2',{},i.title),
  el('div',{class:'tcs'},el('span',{class:'tchip'},i.count+' questions'),!prac&&i.durationMin?el('span',{class:'tchip'},i.durationMin+' min'):'',i.proctor==='camera'?el('span',{class:'tchip pc'},'Camera proctored'):''),
  i.instructions?el('p',{class:'xins'},i.instructions):'',el('ul',{class:'xr'},rules.map(r=>el('li',{},r[0]))));
 if(cam){const chkB=btn('Turn on camera',async()=>{msg.textContent='';try{await Proctor.camera(vid);X.camOk=true;chkB.textContent='Camera ready ✓';chkB.disabled=true;vid.style.display='block';chk();Proctor.loadAI().then(ok=>{X.ai=ok;aiNote.textContent=ok?'Face check ready':'Face check could not load. Only evidence photos will be recorded.'})}catch(e){msg.textContent='Camera permission is needed for this test. Allow camera access in your browser and try again.'}},true);
  const aiNote=el('small',{class:'mu'},'');c.append(chkB,vid,aiNote)}
 if(bas)c.append(el('label',{class:'chk'},consent,' I have read the rules and agree to be monitored during this test.'));
 c.append(msg,el('div',{class:'row'},[btn('Back',back,true),go]));
 go.onclick=async()=>{go.disabled=true;msg.textContent='';
  if(bas){const d=document.documentElement;try{(d.requestFullscreen||d.webkitRequestFullscreen||(()=>0)).call(d)}catch(e){}}
  try{const r=await call('startTest',i.practice?{practice:i.practice}:{testId:i.testId});await begin(r)}catch(e){msg.textContent=e.message;go.disabled=false;try{document.exitFullscreen()}catch(_){}}};
 show(wrap(c));if(!bas)go.disabled=false}

async function begin(r){
 X.r=r;X.i=0;X.ans=r.answers||{};X.mark=new Set();X.fb={};X.skew=r.now-Date.now();X.practice=r.mode==='practice';X.done=false;
 window.onbeforeunload=e=>{if(!X.done){e.preventDefault();e.returnValue=''}};
 if(r.proctor!=='off'){
  const v=document.querySelector('.xv');
  await Proctor.start({mode:r.proctor,fire:fire,snapshot:p=>api('reportViolation',{attemptId:r.attemptId,type:'snapshot',photo:p}).catch(()=>{}),onState:s=>{const d=document.getElementById('xcam');if(d)d.dataset.s=s}})}
 draw();timerStart()}

function timerStart(){clearInterval(X.tm);if(X.practice)return;X.tm=setInterval(()=>{const left=(X.r.deadline-(Date.now()+X.skew))/1000,t=document.getElementById('xt');if(t){t.textContent=fmt(left);t.parentNode.classList.toggle('low',left<300)}if(left<=0){clearInterval(X.tm);submit(true)}},500)}

let saveT;const save=()=>{clearTimeout(saveT);saveT=setTimeout(()=>api('saveProgress',{attemptId:X.r.attemptId,answers:X.ans}).catch(()=>{}),1200)};

async function fire(type,detail,photo){
 if(X.done||X.busy)return;
 try{const r=await api('reportViolation',{attemptId:X.r.attemptId,type,detail,photo,answers:X.ans});
  if(!r.ok)return;if(r.dup)return;
  if(r.blocked){X.done=true;Proctor.stop();clearInterval(X.tm);blocked(r.result);return}
  X.r.strikes=r.strikes;warn(type,r.strikes,r.max)}catch(e){}}

const WT={face_missing:'We cannot see your face. Sit in front of the camera.',multiple_faces:'More than one face is visible. You must be alone.',looking_away:'You are looking away from the screen.',tab_switch:'You left the test tab.',fullscreen_exit:'You exited fullscreen.',camera_off:'Your camera was turned off.',camera_covered:'Your camera is covered or too dark.',window_blur:'The test window lost focus.'};
function warn(type,n,max){
 Proctor.pause(3000);const ov=el('div',{class:'xov'},el('div',{class:'xwarn'},el('div',{class:'xwn'},'Warning '+n+' of '+max),el('p',{},WT[type]||'Abnormal activity detected.'),el('p',{class:'mu'},n===max-1?'One more warning and you will be blocked from this test.':'After '+max+' warnings you will be blocked.'),
  btn('I understand',()=>{ov.remove();const d=document.documentElement;if(X.r.proctor!=='off'&&!document.fullscreenElement&&document.fullscreenEnabled){try{d.requestFullscreen()}catch(e){}}},false)));
 document.body.append(ov)}

function blocked(res){window.onbeforeunload=null;show(big('exam','You have been blocked','You reached the maximum number of warnings, so your test was ended and submitted. Your teacher has been notified. Contact your teacher if you think this is a mistake.',res?el('p',{},'Marks for answers given so far: ',el('b',{},res.score+' / '+res.total)):'',btn('Back to tests',back)))}

function draw(){
 const r=X.r,q=r.questions[X.i],n=r.questions.length,ans=X.ans[q.qid],fb=X.fb[q.qid];
 const opts=q.opts.map((o,ix)=>{const k=o.k,cls=['xo'];if(ans===k)cls.push('sel');
  if(fb){cls.push('lock');if(k===fb.right)cls.push('right');else if(ans===k)cls.push('wrong')}
  return el('button',{type:'button',class:cls.join(' '),onclick:()=>pick(q,k)},el('span',{class:'xl'},String.fromCharCode(65+ix)),el('span',{},o.t))});
 const pal=el('div',{class:'xp'},r.questions.map((z,ix)=>el('button',{type:'button',class:(ix===X.i?'cur ':'')+(X.ans[z.qid]?'ans ':'')+(X.mark.has(z.qid)?'mk':''),onclick:()=>{X.i=ix;draw()}},String(ix+1))));
 const answered=Object.keys(X.ans).filter(k=>r.questions.some(z=>z.qid===k)).length;
 const top=el('div',{class:'xtop'},el('div',{class:'xtt'},el('b',{},r.title),el('small',{class:'mu'},answered+' / '+n+' answered')),
  X.practice?'':el('div',{class:'xtm'},el('span',{id:'xt'},fmt((r.deadline-(Date.now()+X.skew))/1000))),
  r.proctor==='camera'?el('video',{id:'xcam',class:'xpip',playsinline:'',muted:'',autoplay:''}):'');
 const sub=q.type&&q.type!=='mcq',ta=sub?el('textarea',{class:'xta',rows:q.type==='long'?10:5,maxlength:3000,placeholder:'Type your answer here'}):null,cc=el('small',{class:'mu'},'');
 if(ta){ta.value=X.ans[q.qid]||'';const upd=()=>{cc.textContent=ta.value.length+' / 3000';};upd();
  ta.oninput=()=>{upd();if(ta.value.trim())X.ans[q.qid]=ta.value;else delete X.ans[q.qid];save();const pb=document.querySelectorAll('.xp button')[X.i];if(pb)pb.classList.toggle('ans',!!ta.value.trim());const sm=document.querySelector('.xtt small');if(sm)sm.textContent=Object.keys(X.ans).filter(k=>r.questions.some(z=>z.qid===k)).length+' / '+n+' answered'}}
 const card=el('div',{class:'xc xq'},el('div',{class:'xqn'},'Question '+(X.i+1)+' of '+n+(sub?' · '+q.marks+' marks':'')),el('h3',{class:'xqt'},q.text),sub?el('div',{},ta,cc):el('div',{class:'xos'},opts),
  fb?el('div',{class:'xfb '+(fb.correct?'ok':'no')},el('b',{},fb.correct?'Correct!':'Not quite.'),fb.explain?el('p',{},fb.explain):'' ):'');
 const nav=el('div',{class:'xnav'},btn('Previous',()=>{X.i--;draw()},true),X.practice?'':btn(X.mark.has(q.qid)?'Unmark':'Mark for review',()=>{X.mark.has(q.qid)?X.mark.delete(q.qid):X.mark.add(q.qid);draw()},true),
  X.i<n-1?btn('Next',()=>{X.i++;draw()},false):btn(X.practice?'Finish':'Submit',()=>confirmSubmit(),false));
 nav.firstChild.disabled=X.i===0;
 show(el('div',{class:'xw wide'},top,el('div',{class:'xmain'},el('div',{},card,nav),el('div',{class:'xc xside'},el('b',{},'Questions'),pal,el('div',{class:'xleg'},el('i',{class:'ans'}),' Answered ',el('i',{class:'mk'}),' Marked ',el('i',{}),' Not answered')))));
 const cam=document.getElementById('xcam');if(cam&&Proctor.stream){cam.srcObject=Proctor.stream;cam.muted=true;cam.play().catch(()=>{});Proctor.video=cam}}

async function pick(q,k){
 if(X.fb[q.qid])return;X.ans[q.qid]=k;
 if(X.practice){try{const r=await api('checkAnswer',{attemptId:X.r.attemptId,qid:q.qid,ans:k});if(r.ok)X.fb[q.qid]={correct:r.correct,right:r.right,explain:r.explain};else toast(r.error,1)}catch(e){toast('Connection problem',1)}}
 else save();draw()}

function confirmSubmit(){
 const r=X.r,n=r.questions.length,a=r.questions.filter(z=>X.ans[z.qid]).length,mk=[...X.mark].length;
 modal(X.practice?'Finish practice?':'Submit test?',el('div',{},el('p',{},a+' of '+n+' answered.'),n-a?el('p',{class:'mu'},(n-a)+' unanswered.'):'',mk?el('p',{class:'mu'},mk+' marked for review.'):'',X.practice?'':el('p',{class:'mu'},'You cannot change answers after submitting.')),
  [{t:'Go back',g:1,fn:()=>true},{t:X.practice?'Finish':'Submit',fn:async()=>{await submit(false);return true}}])}

async function submit(auto){
 if(X.done||X.busy)return;X.busy=true;clearTimeout(saveT);
 try{const r=await call('submitTest',{attemptId:X.r.attemptId,answers:X.ans});X.done=true;X.busy=false;Proctor.stop();clearInterval(X.tm);window.onbeforeunload=null;document.querySelectorAll('.xov').forEach(e=>e.remove());result(r.result,auto)}
 catch(e){X.busy=false;toast(e.message,1);if(auto)setTimeout(()=>submit(true),3000)}}

function result(res,auto){
 const pct=Math.max(0,Math.min(100,res.percent||0)),ring=el('div',{class:'xring',style:'--p:'+pct},el('b',{},Math.round(pct)+'%'));
 const c=el('div',{class:'xc xcen'},el('div',{class:'xi'},miEl('trophy')),el('h2',{},auto?'Time is up. Test submitted':(X.practice?'Practice complete':'Test submitted')),ring,
  el('p',{class:'xsc'},el('b',{},res.score+' / '+res.total),' marks'),res.pending?el('p',{class:'mu'},res.pending+' written answer(s) will be marked by your teacher. Your total will update.'):'',el('div',{class:'tcs xcen'},el('span',{class:'tchip ok'},res.correct+' correct'),el('span',{class:'tchip bad'},res.wrong+' wrong'),el('span',{class:'tchip'},res.skipped+' skipped')),
  el('div',{class:'row'},[btn('Review answers',()=>review(X.r.attemptId),true),btn('Back to tests',back,false)]));show(wrap(c))}

async function review(id){
 try{const r=await call('attemptReview',{attemptId:id}),box=el('div',{class:'xw'},el('div',{class:'bar'},btn('← Back',back,true)),el('h2',{},r.title));
  r.review.forEach((q,i)=>{if(q.type&&q.type!=='mcq'){const g=q.grade;box.append(el('div',{class:'xc rv '+(g?(g.m>=q.marks/2?'ok':'no'):'sk')},el('b',{},(i+1)+'. '+q.text),el('p',{class:'wans'},q.mine||'(not answered)'),
    el('p',{},el('b',{},g?'Marks: '+g.m+' / '+q.marks:'Waiting for teacher marks ('+q.marks+' marks)')),g&&g.c?el('p',{class:'mu'},'Feedback: '+g.c):'',q.keyAns?el('details',{},el('summary',{},'Model answer'),el('p',{class:'mu'},q.keyAns)):''))}
   else box.append(el('div',{class:'xc rv '+(!q.mine?'sk':q.mine===q.correct?'ok':'no')},el('b',{},(i+1)+'. '+q.text),
   el('ol',{class:'qop'},q.opts.map(o=>el('li',{class:o.k===q.correct?'ok':(o.k===q.mine?'wr':'')},o.t+(o.k===q.correct?'  ✓':'')+(o.k===q.mine&&o.k!==q.correct?'  ← your answer':'')))),q.explain?el('p',{class:'mu'},q.explain):''))});
  show(box)}
 catch(e){toast(e.message,1)}}
if(typeof window!=='undefined')window.__review=review;
boot();
