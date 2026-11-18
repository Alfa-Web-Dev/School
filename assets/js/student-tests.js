// Student: tests list + practice picker
const S_IST=ms=>new Date(ms).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
async function initMyTests(){
 const m=page('n_tests'),r=await call('myTests');
 const sec=(t,items,empty)=>{m.append(el('h3',{class:'sh'},t));if(!items.length){m.append(el('p',{class:'mu'},empty));return}const l=el('div',{class:'flist'});items.forEach(x=>l.append(x));m.append(l)};
 const open=t=>location.href='test.html?t='+encodeURIComponent(t.testId);
 const card=t=>{const c=el('div',{class:'tcard'}),st=t.state;
  c.append(el('div',{class:'tct'},el('div',{class:'tci'},miEl(t.mode==='practice'?'notebook':'exam')),el('div',{class:'tcm'},el('b',{},t.title),el('span',{class:'mu'},t.subject)),
   el('span',{class:'tchip '+({live:'live',upcoming:'sch',ended:'end',practice:'pr'}[st]||'')},{live:'Live',upcoming:'Upcoming',ended:'Ended',practice:'Practice'}[st])),
   el('div',{class:'tcs'},el('span',{class:'tchip'},t.count+' questions'),t.mode==='test'?el('span',{class:'tchip'},t.durationMin+' min'):'',t.proctor==='camera'?el('span',{class:'tchip pc'},'Camera proctored'):'',
    t.mode==='test'?el('span',{class:'tchip'},S_IST(t.start)+' → '+S_IST(t.end)):'',t.best?el('span',{class:'tchip '+(t.best.status==='blocked'?'bad':'ok')},(t.best.status==='blocked'?'Blocked · ':'Score ')+t.best.score+' / '+t.best.total+(t.best.pending?' · marking pending':'')):''));
  const row=el('div',{class:'row'});
  if(t.blocked)row.append(el('span',{class:'mu'},'You were blocked from this test. Contact your teacher.'));
  else if(t.mode==='practice')row.append(btn(t.inprogress?'Resume':'Practice',()=>open(t),false));
  else if(t.inprogress&&st==='live')row.append(btn('Resume test',()=>open(t),false));
  else if(st==='live'&&!t.best)row.append(btn('Start test',()=>open(t),false));
  else if(st==='upcoming')row.append(el('span',{class:'mu'},'Opens '+S_IST(t.start)));
  if(t.best&&t.best.attemptId)row.append(btn('Review answers',async()=>{try{await call('attemptReview',{attemptId:t.best.attemptId});location.href='test.html?r='+t.best.attemptId}catch(e){toast(e.message,1)}}));
  c.append(row);return c};
 const live=r.tests.filter(t=>t.mode==='test'&&(t.state==='live'||t.inprogress)&&!t.best),up=r.tests.filter(t=>t.state==='upcoming'),prac=r.tests.filter(t=>t.mode==='practice'),done=r.tests.filter(t=>t.mode==='test'&&(t.best||t.state==='ended')&&!live.includes(t));
 sec('Live now',live.map(card),'No test is live right now.');
 if(up.length)sec('Upcoming',up.map(card),'');
 // practice by topic
 m.append(el('h3',{class:'sh'},'Practice'));
 if(!r.topics.length)m.append(el('p',{class:'mu'},'Practice questions will appear once your teachers add them.'));
 else{const sub=el('select',{},r.topics.map(t=>el('option',{value:t.subjectId},t.subject+' ('+t.total+')'))),ch=el('select'),cnt=el('select',{},[5,10,15,20].map(n=>el('option',{value:n,selected:n===10},n+' questions')));
  const fill=()=>{const t=r.topics.find(z=>z.subjectId===sub.value);ch.innerHTML='';ch.append(el('option',{value:''},'All chapters'));t.chapters.forEach(c=>ch.append(el('option',{value:c.chapter},c.chapter+' ('+c.count+')')))};sub.onchange=fill;fill();
  m.append(el('div',{class:'card pick'},el('p',{class:'mu'},'Pick a topic and practice with instant feedback. Nothing here affects your marks.'),el('div',{class:'bar'},sub,ch,cnt),btn('Start practice',()=>location.href='test.html?p='+encodeURIComponent(sub.value+'|'+ch.value+'|'+cnt.value),false)))}
 if(prac.length)sec('Practice sets from teachers',prac.map(card),'');
 sec('Completed',done.map(card),'Completed tests will appear here.')}
