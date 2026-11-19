// Flashcards: student revision (spaced repetition) + teacher card manager
const cfld=(l,i,h)=>el('div',{class:'tf'},el('label',{},l),i,h?el('small',{class:'mu'},h):'');
const csel=(opts,val,on)=>{const s=el('select',{},opts.map(([v,l])=>el('option',{value:v},l)));if(val!=null)s.value=val;if(on)s.onchange=on;return s};
const cstat=(big,label)=>el('div',{class:'card stat'},el('div',{class:'big'},String(big)),el('div',{class:'mu'},label));

/* ---------------- student ---------------- */
async function initCardsStudent(){
 const m=page('n_cards'),box=el('div');m.append(box);
 let filt={subjectId:'',chapter:''};
 const home=async()=>{box.innerHTML='';const r=await call('myDeck',{subjectId:filt.subjectId,chapter:filt.chapter,count:10}),S=r.summary;
  const sub=csel([['','All subjects']].concat(r.subjects.map(s=>[s.subjectId,s.subject])),filt.subjectId),ch=el('select');
  const fill=()=>{const s=r.subjects.find(x=>x.subjectId===sub.value);ch.innerHTML='';ch.append(el('option',{value:''},'All chapters'));(s?s.chapters:[]).forEach(c=>ch.append(el('option',{value:c},c)));ch.value=filt.chapter&&s&&s.chapters.includes(filt.chapter)?filt.chapter:''};
  sub.onchange=()=>{filt={subjectId:sub.value,chapter:''};home()};fill();ch.onchange=()=>{filt.chapter=ch.value;home()};
  box.append(el('div',{class:'grid'},cstat(S.due,'Due for revision'),cstat(S.fresh,'New cards'),cstat(S.mastered,'Mastered'),cstat(S.total,'Total cards')),
   el('div',{class:'bar'},sub,ch));
  if(!S.total){box.append(emptyState('No flashcards yet','Cards appear here when your teachers add flashcards or practice questions.'));return}
  if(!r.deck.length){box.append(emptyState('All caught up','Nothing is due right now. Come back tomorrow, or pick another subject.'));return}
  box.append(el('p',{class:'mu'},'Cards from your weak topics come first. Cards you miss come back sooner, cards you know come back later.'),el('div',{class:'row'},[btn('Start revision · '+r.deck.length+' cards',()=>session(r.deck),false)]))};
 const session=deck=>{let i=0,flip=false;const res=[],sent=[];
  const flush=async(all)=>{const q=res.splice(0,res.length);if(!q.length)return;try{await api('reviewCards',{results:q,__quiet:1})}catch(e){}};
  const onHide=()=>{if(document.hidden)flush()};document.addEventListener('visibilitychange',onHide);
  const finish=async()=>{document.removeEventListener('visibilitychange',onHide);await flush();const knew=sent.filter(Boolean).length;box.innerHTML='';
   box.append(el('div',{class:'xc xcen fcend'},el('h2',{},'Revision complete'),el('p',{class:'xsc'},'You knew ',el('b',{},knew+' of '+deck.length),' cards'),el('p',{class:'mu'},knew===deck.length?'Perfect. These cards will come back after a few days.':'The cards you missed will come back soon so you can master them.'),
    el('div',{class:'row'},[btn('Back',home,true),btn('Revise more',home,false)])))};
  const draw=()=>{const c=deck[i];box.innerHTML='';
   const card=el('button',{type:'button',class:'fcard2'+(flip?' back':''),onclick:()=>{flip=!flip;draw()}},el('small',{class:'mu'},c.subject+' · '+c.chapter+(c.isNew?' · New':'')),
    el('div',{class:'fct'},flip?c.back.split('\n').map((l,k)=>el('p',{class:k?'mu':''},l)):el('p',{},c.front)),el('small',{class:'mu'},flip?'Question: '+c.front.slice(0,80):'Tap to see the answer'));
   const mark=k=>{sent.push(k);res.push({key:c.key,knew:k});if(res.length>=5)flush();i++;flip=false;i>=deck.length?finish():draw()};
   box.append(el('div',{class:'pbar'},el('i',{style:'width:'+Math.round(i/deck.length*100)+'%;background:var(--c)'})),el('p',{class:'mu'},'Card '+(i+1)+' of '+deck.length),card,
    flip?el('div',{class:'row fcb'},[btn('Again',()=>mark(false),true),btn('Got it',()=>mark(true),false)]):el('p',{class:'mu xcen'},'Think of the answer first, then tap the card.'))};
  draw()};
 await home()}

/* ---------------- teacher / admin ---------------- */
function parseCards(text){
 const t=String(text||'').replace(/```[a-z]*/gi,''),i=t.indexOf('['),j=t.lastIndexOf(']');if(i<0||j<i)throw new Error('The AI reply could not be read. Please try again.');
 let arr;try{arr=JSON.parse(t.slice(i,j+1))}catch(e){throw new Error('The AI reply could not be read. Please try again.')}
 const seen={},out=[];arr.forEach(x=>{if(!x||typeof x!=='object')return;const f=String(x.front||x.q||'').trim(),b=String(x.back||x.a||x.answer||'').trim();if(f.length<2||!b||seen[f.toLowerCase()])return;seen[f.toLowerCase()]=1;out.push({front:f.slice(0,300),back:b.slice(0,600)})});
 if(!out.length)throw new Error('The AI did not return usable cards. Please try again.');return out}
async function initCardsStaff(){
 const m=page('n_cards'),opt=await call('noteOptions'),classes=opt.classes;
 if(!classes.length){m.append(emptyState('No classes yet','Classes appear here once you are assigned to them'));return}
 const cls=csel(classes.map(c=>[c.classId,c.name])),sub=el('select'),list=el('div',{class:'flist'}),note=el('p',{class:'mu'});
 const subs=()=>{const c=classes.find(x=>x.classId===cls.value);return c?c.subjects:[]};
 const fill=()=>{sub.innerHTML='';sub.append(el('option',{value:''},'All subjects'));subs().forEach(s=>sub.append(el('option',{value:s.subjectId},s.name)))};
 const load=async()=>{const r=await call('listCards',{classId:cls.value,subjectId:sub.value});list.innerHTML='';note.textContent=r.fromBank+' MCQs from your question bank are also shown to students as flashcards automatically.';
  if(!r.cards.length){list.append(emptyState('No custom flashcards','Add definitions, formulas and key points. Students revise them with spaced repetition.'));return}
  r.cards.forEach(c=>list.append(el('div',{class:'tcard'},el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},c.front),el('span',{},c.back)),el('span',{class:'tchip'},c.subject+(c.chapter?' · '+c.chapter:''))),
   c.mine?el('div',{class:'row'},[btn('Edit',()=>cardForm(c)),btn('Delete',async()=>{if(confirm('Delete this card?')){await call('deleteCard',{cardId:c.cardId});load()}})]):'')))};
 cls.onchange=()=>{fill();load()};sub.onchange=load;fill();
 const sfill=(s,v)=>{s.innerHTML='';subs().forEach(x=>s.append(el('option',{value:x.subjectId},x.name)));if(v)s.value=v};
 const cardForm=c=>{c=c||{};const sb=el('select');sfill(sb,c.subjectId||sub.value);const ch=el('input',{placeholder:'Chapter (optional)',value:c.chapter||''}),f=el('textarea',{rows:2,placeholder:'Front: a question, term or formula name'}),b=el('textarea',{rows:3,placeholder:'Back: the answer or meaning'});f.value=c.front||'';b.value=c.back||'';
  modal(c.cardId?'Edit flashcard':'Add flashcard',el('div',{class:'frm tform'},cfld('Subject',sb),cfld('Chapter',ch),cfld('Front *',f),cfld('Back *',b)),[{t:'Cancel',g:1,fn:()=>true},{t:'Save',fn:async()=>{await call('saveCard',{card:{cardId:c.cardId,classId:cls.value,subjectId:sb.value,chapter:ch.value,front:f.value,back:b.value}});toast('Saved');await load()}}])};
 const bulk=()=>{const sb=el('select');sfill(sb,sub.value);const ch=el('input',{placeholder:'Chapter (optional)'}),ta=el('textarea',{rows:8,placeholder:'Numerator | The top number of a fraction\nDenominator | The bottom number of a fraction'});
  modal('Bulk add flashcards',el('div',{class:'frm tform'},cfld('Subject',sb),cfld('Chapter',ch),el('p',{class:'mu'},'One card per line:  front | back. Up to 100 lines.'),ta),[{t:'Cancel',g:1,fn:()=>true},{t:'Import',fn:async()=>{
   const rows=ta.value.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const p=l.split(/\s*\|\s*|\t/);return{front:p[0],back:p.slice(1).join(' | ')}});if(!rows.length)throw new Error('Paste at least one line');
   const r=await call('importCards',{classId:cls.value,subjectId:sb.value,chapter:ch.value,rows});toast(r.added+' added'+(r.errors.length?' · '+r.errors.length+' skipped':''),!r.added);if(r.added)await load()}}])};
 const gen=()=>{const sb=el('select');sfill(sb,sub.value);const ch=el('input',{placeholder:'Chapter name *'}),tx=el('textarea',{rows:5,placeholder:'Paste the chapter text or key points (optional). Or just type the topic.'}),n=csel([[8,'8 cards'],[12,'12 cards'],[20,'20 cards']],12),out=el('div');let g=[];
  const draw=()=>{out.innerHTML='';out.append(el('p',{class:'mu'},'Untick any card you do not want, then press Add selected.'));g.forEach(x=>{const cb=el('input',{type:'checkbox'});cb.checked=true;x.on=true;cb.onchange=()=>x.on=cb.checked;out.append(el('div',{class:'rv'},el('label',{class:'chk'},cb,el('b',{},x.front)),el('p',{class:'mu'},x.back)))})};
  const d=modal('Generate flashcards with AI',el('div',{class:'frm tform'},cfld('Subject',sb),cfld('Chapter *',ch),cfld('Chapter text or topic',tx,'Only this text is sent to the AI.'),cfld('How many',n),out),[{t:'Cancel',g:1,fn:()=>true},{t:'Generate',g:1,fn:async()=>{
   if(!ch.value.trim())throw new Error('Enter the chapter name');const gb=[...document.querySelectorAll('dialog .row.end button')].find(x=>/Generate|Write again|AI is writing/.test(x.textContent));gb.disabled=true;const t0=gb.textContent;gb.textContent='AI is writing…';
   try{const c=classes.find(z=>z.classId===cls.value),s=sb.options[sb.selectedIndex]?sb.options[sb.selectedIndex].text:'';
    const reply=await aiAsk('You are a school teacher in India making revision flashcards for '+(c?c.name:'school')+' students. Reply with ONLY a JSON array like [{"front":"term or short question","back":"short, correct answer"}]. Keep every card short and factually correct.',[{role:'user',content:'Subject: '+s+'\nChapter: '+ch.value.trim()+'\nMake '+n.value+' flashcards.'+(tx.value.trim()?'\nBase them only on this text:\n'+tx.value.trim().slice(0,5000):'')}],{max:2500,timeout:70000,temp:.4});
    g=parseCards(reply);draw();gb.textContent='Write again'}catch(e){gb.textContent=t0;throw e}finally{gb.disabled=false}return false}},
   {t:'Add selected',fn:async()=>{const rows=g.filter(x=>x.on);if(!rows.length)throw new Error('Nothing selected yet. Press Generate first.');const r=await call('importCards',{classId:cls.value,subjectId:sb.value,chapter:ch.value.trim(),rows});toast(r.added+' cards added');await load()}}]);d.classList.add('wide')};
 m.append(el('div',{class:'bar'},cls,sub),el('div',{class:'bar'},btn('+ Add card',()=>cardForm(),false),btn('Bulk add',bulk),btn('Generate with AI',gen)),note,list);await load()}
if(typeof module!=='undefined')module.exports={parseCards};
