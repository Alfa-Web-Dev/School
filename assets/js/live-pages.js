// Live classes: teacher schedules an online class (Meet/Zoom/Teams link); students of the class join with one tap
const LDAY=d=>new Date(d+'T00:00:00+05:30').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',timeZone:'Asia/Kolkata'});
const lChip=(t,k)=>el('span',{class:'tchip '+(k||'')},t);
const lTime=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})$/);return m?(+m[1])*60+(+m[2]):0};
const lFld=(l,i,h)=>el('div',{class:'tf'},el('label',{},l),i,h?el('small',{class:'mu'},h):'');
const lJoin=l=>window.open(l,'_blank','noopener');
const lVideo='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="14" height="12" rx="3"/><path d="M16 10l6-3v10l-6-3z"/></svg>';

function liveHero(v){
 const h=el('div',{class:'lvhero'});
 h.append(el('div',{class:'lvtag'},el('i',{class:'lvdot'}),'LIVE NOW'),el('b',{},v.title),el('span',{},v.label+' · '+v.teacher+(v.className?' · '+v.className:'')));
 const b=el('button',{type:'button',class:'lvjoin',onclick:()=>lJoin(v.link)});b.innerHTML=lVideo+'<span>Join class</span>';h.append(b);return h}

/* ---------------- student ---------------- */
async function initMyLive(){
 const m=page('n_live'),r=await call('myLive'),box=el('div'),past=el('div',{class:'flist'});
 const now=r.upcoming.filter(x=>x.state==='live'),next=r.upcoming.filter(x=>x.state!=='live');
 now.forEach(v=>m.append(liveHero(v)));
 m.append(box);
 if(!r.upcoming.length)box.append(emptyState('No online classes scheduled','When your teacher schedules a live class, it will appear here with a Join button.'));
 if(next.length){box.append(el('h3',{class:'sh'},'Upcoming'));next.forEach(v=>box.append(liveCard(v)))}
 if(r.past.length){m.append(el('h3',{class:'sh'},'Earlier'),past);r.past.forEach(v=>past.append(el('div',{class:'tcard'},el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},v.title),el('span',{class:'mu'},LDAY(v.date)+' · '+v.label+' · '+v.teacher)),lChip('Ended','end')))))}}

function liveCard(v){
 const c=el('div',{class:'tcard'});
 c.append(el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},v.title),el('span',{class:'mu'},LDAY(v.date)+' · '+v.label),el('span',{class:'mu'},v.teacher)),lChip(v.date===(new Date(Date.now()+19800000).toISOString().slice(0,10))?'Today':'Scheduled','sch')));
 if(v.note)c.append(el('p',{class:'mu'},v.note));
 c.append(el('p',{class:'mu lvhint'},'The Join button opens 10 minutes before the class starts.'));
 return c}

/* dashboard banner (student): shows a class that is live now or starts later today */
async function liveBanner(m){
 try{const r=await call('myLive'),t=r.today,x=r.upcoming.find(v=>v.state==='live')||r.upcoming.find(v=>v.date===t);if(!x)return;
  const c=x.state==='live'?liveHero(x):el('a',{class:'lvsoon',href:'live.html'},el('span',{class:'lvic'}),el('div',{},el('b',{},'Live class today · '+x.title),el('small',{},x.label+' · '+x.teacher)));
  if(c.classList.contains('lvsoon'))c.firstChild.innerHTML=lVideo;
  const hc=m.querySelector('.hello');if(hc)hc.after(c);else m.prepend(c)}catch(e){}}

/* ---------------- teacher / admin ---------------- */
async function initLiveStaff(){
 const m=page('n_live'),opt=await call('noteOptions'),classes=opt.classes;
 if(!classes.length){m.append(emptyState('No classes yet','Classes appear here once you are assigned to them'));return}
 let when='upcoming';const body=el('div'),seg=el('div',{class:'seg'});
 const go=async w=>{when=w;[...seg.children].forEach(b=>b.classList.toggle('on',b.dataset.t===w));body.innerHTML='';
  const r=await call('listLive',{when:w});
  if(!r.items.length){body.append(emptyState(w==='past'?'No past classes':'No upcoming online classes','Schedule a class and paste your Meet link. Students of the class will get a Join button.'));return}
  r.items.forEach(v=>body.append(staffLive(v,w==='past',()=>go(when))))};
 [['upcoming','Upcoming'],['past','Past']].forEach(([k,l])=>seg.append(el('button',{type:'button','data-t':k,onclick:()=>go(k)},l)));
 m.append(el('div',{class:'bar'},btn('Schedule class',()=>newLive(classes,()=>go('upcoming')),false)),seg,body);await go('upcoming')}

function staffLive(v,isPast,reload){
 const c=el('div',{class:'tcard'});
 c.append(el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},v.title),el('span',{class:'mu'},LDAY(v.date)+' · '+v.label),el('span',{class:'mu'},v.className+(v.teacher?' · '+v.teacher:''))),
  v.status==='cancelled'?lChip('Cancelled','end'):v.state==='live'?lChip('Live','bad'):isPast?lChip('Ended','end'):lChip('Scheduled','sch')));
 if(v.note)c.append(el('p',{class:'mu'},v.note));
 if(!isPast&&v.status==='open'){
  const row=el('div',{class:'row'});
  row.append(btn('Start class',()=>lJoin(v.link),false),btn('Copy link',async()=>{try{await navigator.clipboard.writeText(v.link);toast('Link copied')}catch(e){toast('Could not copy',1)}},true),
   btn('Cancel',async()=>{if(!confirm('Cancel this class? Students will no longer see it.'))return;try{await call('cancelLive',{liveId:v.liveId});toast('Class cancelled');await reload()}catch(e){toast(e.message,1)}},true));
  c.append(row)}
 return c}

function newLive(classes,done){
 const today=new Date(Date.now()+19800000).toISOString().slice(0,10);
 const cls=el('select',{},classes.map(c=>el('option',{value:c.classId},c.name))),title=el('input',{placeholder:'Example: Maths – Fractions revision',maxlength:100}),date=el('input',{type:'date',value:today,min:today}),
  st=el('input',{type:'time',value:'16:00'}),en=el('input',{type:'time',value:'17:00'}),link=el('input',{type:'url',placeholder:'https://meet.google.com/abc-defg-hij',maxlength:300}),
  rep=el('select',{},[[0,'Only once'],[3,'Every week for 4 weeks'],[7,'Every week for 8 weeks'],[11,'Every week for 12 weeks']].map(([v,l])=>el('option',{value:v},l))),note=el('textarea',{rows:2,maxlength:200,placeholder:'Optional note for students'});
 const mk=el('button',{type:'button',class:'lvmk',onclick:()=>window.open('https://meet.new','_blank','noopener')},'Create a new Meet link ↗');
 const body=el('div',{class:'tform'},lFld('Class',cls),lFld('Subject / topic',title),lFld('Date',date),el('div',{class:'row'},lFld('From',st),lFld('To',en)),lFld('Meeting link',link,'Google Meet, Zoom or Teams. Create a meeting, copy its link and paste it here.'),mk,lFld('Repeat',rep),lFld('Note',note));
 modal('Schedule class',body,[{t:'Cancel',g:1,fn:()=>true},{t:'Schedule',fn:async()=>{try{const r=await call('createLive',{classId:cls.value,title:title.value,date:date.value,startMin:lTime(st.value),endMin:lTime(en.value),link:link.value.trim(),weeks:rep.value,note:note.value});toast(r.count>1?r.count+' classes scheduled':'Class scheduled');await done()}catch(e){toast(e.message,1);return false}}}])}
