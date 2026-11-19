// Doubt Box: student asks -> AI tutor answers -> unresolved doubts go to the teacher
const D_ST={ai:['AI answered','sch'],open:['With teacher','pc'],answered:['Teacher answered','live'],resolved:['Resolved','ok']};
const D_WHEN=ms=>new Date(ms).toLocaleString('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
const D_SYS=cls=>'You are a friendly, patient school tutor for '+(cls||'school')+' students in India. Explain step by step in very simple English with short sentences. For maths or science problems show every step and the final answer. Use a small everyday example when it helps. Keep the answer under 180 words. If you are not sure, say so honestly and tell the student to ask their teacher. Never invent facts.';
const dChip=(t,k)=>el('span',{class:'tchip '+(k||'')},t);

/* ---------------- student ---------------- */
async function initMyDoubts(){
 const m=page('n_doubts'),o=await call('doubtOptions');
 const sub=el('select',{},o.subjects.map(s=>el('option',{value:s.subjectId},s.name))),ch=el('input',{placeholder:'Chapter or topic (optional)'}),q=el('textarea',{rows:4,maxlength:800,placeholder:'Type your doubt here. Example: Why do we flip the second fraction when dividing?'}),msg=el('div',{class:'err'});
 const ask=el('button',{type:'button',class:'s'},'Ask AI tutor');
 const list=el('div',{class:'flist'});
 m.append(el('div',{class:'card pick'},el('h3',{},'Ask a doubt'),el('p',{class:'mu'},'The AI tutor answers right away. If it does not clear your doubt, send it to your teacher.'),el('div',{class:'tf'},el('label',{},'Subject'),sub),el('div',{class:'tf'},el('label',{},'Chapter'),ch),el('div',{class:'tf'},el('label',{},'Your doubt'),q),msg,ask),el('h3',{class:'sh'},'My doubts'),list);
 const load=async()=>{const r=await call('myDoubts');list.innerHTML='';if(!r.doubts.length){list.append(emptyState('No doubts yet','Ask your first doubt above.'));return}r.doubts.forEach(d=>list.append(doubtCard(d,o.className,load)))};
 ask.onclick=async()=>{msg.textContent='';const text=q.value.trim();if(text.length<5){msg.textContent='Please write your doubt in a little more detail';return}
  const orig=ask.textContent;ask.disabled=true;ask.classList.add('busy');ask.textContent='AI tutor is thinking…';let ai='';
  try{const s=sub.options[sub.selectedIndex].text;try{ai=await aiAsk(D_SYS(o.className),[{role:'user',content:'Subject: '+s+(ch.value?'\nChapter: '+ch.value:'')+'\nStudent doubt: '+text}])}catch(e){ai=''}
   ask.textContent='Saving…';await call('askDoubt',{subjectId:sub.value,chapter:ch.value,question:text,aiAnswer:ai});q.value='';toast(ai?'Answer ready':'AI is busy, so your doubt was sent to your teacher');await load()}
  catch(e){msg.textContent=e.message}
  ask.disabled=false;ask.classList.remove('busy');ask.textContent=orig};
 await load()}

function doubtCard(d,cls,reload){
 const c=el('div',{class:'tcard dq'}),st=D_ST[d.status]||['',''];
 c.append(el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},d.question),el('span',{class:'mu'},d.subject+(d.chapter?' · '+d.chapter:'')+' · '+D_WHEN(d.date))),dChip(st[0],st[1])));
 if(d.aiAnswer){const box=el('div',{class:'dai'},el('small',{class:'mu'},'AI tutor'),mdLite(d.aiAnswer));c.append(box)}
 else if(d.status==='open')c.append(el('p',{class:'mu'},'The AI tutor could not answer this, so it was sent to your teacher.'));
 if(d.teacherAnswer)c.append(el('div',{class:'dta'},el('small',{class:'mu'},d.answeredBy+' replied'),mdLite(d.teacherAnswer)));
 if(d.status==='open')c.append(el('p',{class:'mu'},'Waiting for your teacher to reply. You will see the answer here.'));
 const row=el('div',{class:'row',style:'flex-wrap:wrap'}),act=(t,f,g)=>btn(t,async()=>{try{await f();await reload()}catch(e){toast(e.message,1)}},g);
 const follow=(label,prompt)=>act(label,async()=>{const t=await aiAsk(D_SYS(cls),[{role:'user',content:'Subject: '+d.subject+'\nStudent doubt: '+d.question},{role:'assistant',content:d.aiAnswer},{role:'user',content:prompt}]);
   await call('updateAiAnswer',{doubtId:d.doubtId,aiAnswer:d.aiAnswer+'\n\n'+label.toUpperCase()+'\n'+t})},true);
 if(d.status==='ai'){row.append(act('Got it ✓',()=>call('closeDoubt',{doubtId:d.doubtId,do:'resolve'}),false),
   follow('Explain simpler','Explain the same thing even more simply, like I am 10 years old.'),follow('Quiz me','Give me 3 short practice questions on this, with the answers at the end.'),
   act('Ask my teacher',()=>call('closeDoubt',{doubtId:d.doubtId,do:'forward'}),true))}
 if(d.status==='answered')row.append(act('Got it ✓',()=>call('closeDoubt',{doubtId:d.doubtId,do:'resolve'}),false));
 if(row.children.length)c.append(row);return c}

/* ---------------- teacher / admin ---------------- */
async function initDoubtsStaff(){
 const m=page('n_doubts');let tab='open';const body=el('div'),seg=el('div',{class:'seg'});
 const go=async t=>{tab=t;[...seg.children].forEach(b=>b.classList.toggle('on',b.dataset.t===t));body.innerHTML='';
  const r=await call('listDoubts',{status:t});seg.firstChild.textContent='Waiting for you'+(r.open?' ('+r.open+')':'');
  if(!r.doubts.length){body.append(emptyState(t==='open'?'No doubts waiting':'Nothing here yet',t==='open'?'Doubts the AI tutor could not clear will appear here.':'Answered doubts will appear here.'));return}
  const l=el('div',{class:'flist'});r.doubts.forEach(d=>l.append(staffDoubt(d,()=>go(tab))));body.append(l)};
 [['open','Waiting for you'],['answered','Answered']].forEach(([k,l])=>seg.append(el('button',{type:'button','data-t':k,onclick:()=>go(k)},l)));
 m.append(seg,body);await go('open')}

function staffDoubt(d,reload){
 const c=el('div',{class:'tcard dq'});
 c.append(el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},d.question),el('span',{class:'mu'},d.student+' · '+d.className+' · '+d.subject+(d.chapter?' · '+d.chapter:'')+' · '+D_WHEN(d.date))),dChip(d.status==='open'?'Waiting':'Answered',d.status==='open'?'pc':'live')));
 if(d.aiAnswer)c.append(el('details',{},el('summary',{},'What the AI tutor told the student'),el('div',{class:'dai'},mdLite(d.aiAnswer))));
 if(d.teacherAnswer)c.append(el('div',{class:'dta'},el('small',{class:'mu'},'Reply by '+d.answeredBy),mdLite(d.teacherAnswer)));
 if(d.status==='open'){const ta=el('textarea',{rows:3,maxlength:2000,placeholder:'Type your answer for the student'}),row=el('div',{class:'row',style:'flex-wrap:wrap'});
  if(d.aiAnswer)row.append(btn('Start from AI answer',()=>{ta.value=d.aiAnswer.split('\n\n')[0];ta.focus()},true));
  row.append(btn('Send answer',async()=>{try{if(ta.value.trim().length<2)throw new Error('Please write an answer');await call('answerDoubt',{doubtId:d.doubtId,answer:ta.value});toast('Answer sent');await reload()}catch(e){toast(e.message,1)}},false));c.append(ta,row)}
 return c}
