// ---------- Flashcards: teacher cards + question-bank cards, spaced repetition (Leitner boxes) ----------
const BOX_DAYS=[0,0,1,3,7,14];                       // box 1..5 -> days until next review
const dayNo=()=>Math.floor((Date.now()+19800000)/864e5);

function cardCheck(s,d){
 const cid=resolveClass(d.classId),sub=clean(d.subjectId,20);
 if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
 if(!find('Subjects',x=>String(x.subjectId)===sub))throw new Error('Select a subject');
 if(!teachesSub(s,cid,sub))throw new Error('You do not teach this subject in this class');
 const front=txt(d.front,300),back=txt(d.back,600);if(front.length<2||back.length<1)throw new Error('Both front and back are required');
 return{classId:cid,subjectId:sub,chapter:txt(d.chapter,100),front,back}}

function listCards(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const cid=resolveClass(b.classId);if(!cid||!canClass(s,cid))throw new Error('Not allowed for this class');const sub=String(b.subjectId||''),sn=nameMap('Subjects','subjectId');
  const rows=table('Flashcards').rows.filter(c=>String(c.classId)===cid&&(!sub||String(c.subjectId)===sub)&&teachesSub(s,cid,String(c.subjectId)));
  return{ok:true,cards:rows.reverse().slice(0,300).map(c=>({cardId:String(c.cardId),subjectId:String(c.subjectId),subject:sn[String(c.subjectId)]||'',chapter:String(c.chapter||''),front:String(c.front),back:String(c.back),mine:s.role==='admin'||String(c.createdBy)===s.userId})),
   fromBank:table('Questions').rows.filter(q=>String(q.classId)===cid&&String(q.type||'mcq')==='mcq'&&(!sub||String(q.subjectId)===sub)).length}})}

function saveCard(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const d=b.card||{},o=cardCheck(s,d);
  if(d.cardId){const ex=find('Flashcards',x=>String(x.cardId)===String(d.cardId));if(!ex)throw new Error('Card not found');
   if(s.role!=='admin'&&String(ex.createdBy)!==s.userId)throw new Error('You can edit only your own cards');setRow('Flashcards',ex._row,o);return{ok:true,cardId:String(ex.cardId)}}
  const id=nextId('Flashcards','cardId','F');addRow('Flashcards',Object.assign(o,{cardId:id,createdBy:s.userId,date:todayStr()}));return{ok:true,cardId:id}}))}

function importCards(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const rows=Array.isArray(b.rows)?b.rows.slice(0,100):[];if(!rows.length)throw new Error('Nothing to import');
  let id=0;table('Flashcards').rows.forEach(r=>{const v=parseInt(String(r.cardId).slice(1),10);if(v>id)id=v});const list=[],errs=[];
  rows.forEach((r,i)=>{try{const o=cardCheck(s,Object.assign({},r,{classId:b.classId,subjectId:b.subjectId,chapter:r.chapter||b.chapter}));id++;list.push(Object.assign(o,{cardId:'F'+String(id).padStart(5,'0'),createdBy:s.userId,date:todayStr()}))}catch(e){errs.push('Row '+(i+1)+': '+e.message)}});
  addRows('Flashcards',list);log(s.userId,'cards_import',list.length+' added');return{ok:true,added:list.length,errors:errs.slice(0,10)}}))}

function deleteCard(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const ex=find('Flashcards',x=>String(x.cardId)===String(b.cardId));if(!ex)throw new Error('Card not found');
  if(s.role!=='admin'&&String(ex.createdBy)!==s.userId)throw new Error('You can delete only your own cards');tab('Flashcards').deleteRow(ex._row);return{ok:true}}))}

// all cards a student can revise: teacher cards + every MCQ in the class question bank
function deckOf(cid){
 const sn=nameMap('Subjects','subjectId'),out=[];
 table('Flashcards').rows.filter(c=>String(c.classId)===cid).forEach(c=>out.push({key:'C:'+c.cardId,subjectId:String(c.subjectId),chapter:chOf(c),front:String(c.front),back:String(c.back)}));
 table('Questions').rows.filter(q=>String(q.classId)===cid&&String(q.type||'mcq')==='mcq').forEach(q=>{const f=qOf(q,true),right=f.opts.find(o=>o.k===f.correct);if(!right)return;
  out.push({key:'Q:'+q.qid,subjectId:f.subjectId,chapter:chOf(q),front:f.text,back:right.t+(f.explain?'\n'+f.explain:'')})});
 out.forEach(c=>c.subject=sn[c.subjectId]||c.subjectId);return out}

function myDeck(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const sid=String(r.studentId),cid=String(r.classId),all=deckOf(cid),today=dayNo(),sub=String(b.subjectId||''),ch=String(b.chapter||'');
  const prog={};table('CardProgress').rows.filter(p=>String(p.studentId)===sid).forEach(p=>prog[String(p.key)]=p);
  const T=topicStats([sid]).stats[sid]||{},lvl=c=>{const e=T[c.subjectId+'|'+c.chapter];return e&&e.att>=MIN_ATT?(e.cor/e.att<WEAK_PCT/100?0:1):2};
  const view=all.map(c=>{const p=prog[c.key],box=p?Number(p.box)||1:0,due=p?Number(p.due)||0:0;return Object.assign({},c,{box,isNew:!p,isDue:!!p&&due<=today,weak:lvl(c)===0})});
  const pool=view.filter(c=>(!sub||c.subjectId===sub)&&(!ch||c.chapter===ch));
  const summary={total:pool.length,due:pool.filter(c=>c.isDue).length,fresh:pool.filter(c=>c.isNew).length,mastered:pool.filter(c=>c.box>=5).length};
  // session: due cards (weak topics first, low box first), then new cards (weak topics first), shuffled inside each group
  const rnd=()=>Math.random()-.5,ord=(a,b2)=>(b2.weak-a.weak)||(a.box-b2.box)||rnd();
  const due=pool.filter(c=>c.isDue).sort(ord),fresh=pool.filter(c=>c.isNew).sort((a,b2)=>(b2.weak-a.weak)||rnd());
  const n=Math.min(30,Math.max(5,Number(b.count)||10)),deck=due.concat(fresh).slice(0,n).map(c=>({key:c.key,subject:c.subject,chapter:c.chapter,front:c.front,back:c.back,box:c.box,isNew:c.isNew}));
  const tmap={};view.forEach(c=>{const k=c.subjectId;const o=tmap[k]=tmap[k]||{subjectId:k,subject:c.subject,chapters:{}};o.chapters[c.chapter]=(o.chapters[c.chapter]||0)+1});
  return{ok:true,summary,deck,subjects:Object.keys(tmap).map(k=>({subjectId:k,subject:tmap[k].subject,chapters:Object.keys(tmap[k].chapters).sort()}))}})}

// results: [{key,knew}] -> Leitner box move
function reviewCards(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{const sid=String(r.studentId),cid=String(r.classId),res=Array.isArray(b.results)?b.results.slice(0,40):[],valid={};deckOf(cid).forEach(c=>valid[c.key]=1);
  const prog={};table('CardProgress').rows.filter(p=>String(p.studentId)===sid).forEach(p=>prog[String(p.key)]=p);const today=dayNo(),add=[];let n=0;
  res.forEach(x=>{const k=String(x.key||'');if(!valid[k])return;const p=prog[k],box=p?Number(p.box)||1:1,nb=x.knew?Math.min(5,box+1):1,o={box:nb,due:today+BOX_DAYS[nb],last:Date.now()};n++;
   if(p){setRow('CardProgress',p._row,o)}else{add.push(Object.assign({studentId:sid,key:k},o));prog[k]={}}});
  if(add.length)addRows('CardProgress',add);return{ok:true,saved:n}}))}
