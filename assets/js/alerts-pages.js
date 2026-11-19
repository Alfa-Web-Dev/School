// Parent alerts: ready-made messages, one tap opens WhatsApp with the parent's number and text filled in
const PD=d=>new Date(d+'T00:00:00+05:30').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Kolkata'});
const pSch=()=>String(typeof SN==='function'?SN():'School').replace(/\s+/g,' ').trim();
const pMsg={
 absent:(s,r)=>'Dear '+(s.parent||'Parent')+', '+s.name+(s.roll?' (Roll '+s.roll+')':'')+' of '+r.className+' was absent from '+pSch()+' on '+PD(r.tag)+'. Please let us know the reason. Thank you.',
 fees:(s,r)=>'Dear '+(s.parent||'Parent')+', a fee balance of Rs. '+s.info.balance+' is pending for '+s.name+' ('+r.className+'). Please pay at the earliest. If already paid, please ignore this message. - '+pSch(),
 class:(s,r,txt)=>txt.split('{name}').join(s.name)};
const pHash=t=>{let h=5381;for(let i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))>>>0;return 'm'+h.toString(36)};
const pChip=(t,k)=>el('span',{class:'tchip '+(k||'')},t);

async function initAlerts(){
 const m=page('n_alerts'),opt=await call('noteOptions'),classes=opt.classes,isAdmin=(window.__U&&__U.role==='admin')||location.pathname.indexOf('/admin/')>=0;
 if(!classes.length){m.append(emptyState('No classes yet','Classes appear here once you are assigned to them'));return}
 const today=new Date(Date.now()+19800000).toISOString().slice(0,10);
 let kind='absent';const cs=el('select',{},classes.map(c=>el('option',{value:c.classId},c.name))),dt=el('input',{type:'date',value:today,max:today}),
  txt=el('textarea',{rows:3,maxlength:300,placeholder:'Write your message. Use {name} to put the student name. Example: Dear Parent, PTM for {name} is on Saturday at 10 AM.'}),seg=el('div',{class:'seg'}),tools=el('div',{class:'bar'}),body=el('div');
 const kinds=[['absent','Absent today'],['class','Message']];if(isAdmin)kinds.splice(1,0,['fees','Fee due']);
 kinds.forEach(([k,l])=>seg.append(el('button',{type:'button','data-t':k,onclick:()=>{kind=k;draw()}},l)));
 cs.onchange=dt.onchange=()=>go();
 const show=()=>{[...seg.children].forEach(b=>b.classList.toggle('on',b.dataset.t===kind));tools.innerHTML='';tools.append(cs);if(kind==='absent')tools.append(dt);
  if(kind==='class')tools.append(txt,btn('Show list',()=>go(),false))};
 function draw(){show();body.innerHTML='';if(kind!=='class')go()}
 m.append(el('p',{class:'mu'},'Tap WhatsApp next to a parent. The message opens with the number and text ready, you only press Send. Done parents are marked ✓.'),seg,tools,body);
 async function go(){body.innerHTML='';let p={kind,classId:cs.value};
  if(kind==='absent')p.date=dt.value;
  if(kind==='class'){const t=txt.value.trim();if(t.length<5){toast('Write the message first',1);return}p.tag=pHash(t)}
  const r=await call('parentAlerts',p);
  if(kind==='absent'&&!r.marked){body.append(emptyState('Attendance not marked yet','Mark attendance for this day first, then absent parents appear here.'));return}
  if(!r.rows.length){body.append(emptyState(kind==='absent'?'No absent students':kind==='fees'?'No pending fees':'No students','Nothing to send for this class.'));return}
  const left=()=>r.rows.filter(x=>!x.sent&&x.phone).length,info=el('p',{class:'mu'});const upd=()=>{info.textContent=r.rows.length+' parents · '+left()+' left to message'};upd();body.append(info);
  const list=el('div',{class:'flist'});body.append(list);
  r.rows.forEach(s=>{const row=el('div',{class:'tcard'}),act=el('div',{class:'row'});
   const paint=()=>{act.innerHTML='';
    if(!s.phone){act.append(pChip('No valid parent number','bad'));return}
    const text=pMsg[kind](s,r,txt.value.trim());
    const b=el('button',{type:'button',class:'s'+(s.sent?' g':'')},s.sent?'Send again':'WhatsApp');
    b.onclick=()=>{window.open('https://wa.me/'+s.phone+'?text='+encodeURIComponent(text),'_blank');
     if(!s.sent)api('markAlertSent',{keys:[s.key],__quiet:1}).then(x=>{if(x&&x.ok){s.sent=true;upd();paint()}}).catch(()=>toast('Could not save the ✓. The message was still opened.',1))};
    act.append(b);if(s.sent)act.append(pChip('Sent ✓','ok'))};
   paint();row.append(el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},(s.roll?s.roll+'. ':'')+s.name),el('span',{class:'mu'},(s.parent?s.parent+' · ':'')+(s.phone?'+'+s.phone:'no number')+(kind==='fees'?' · Rs. '+s.info.balance+' due':'')))),act);list.append(row)})}
 draw()}
