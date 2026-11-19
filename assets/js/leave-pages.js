// Leave requests and gate passes: student asks, class teacher / admin decides
const LS={pending:['Waiting','sch'],approved:['Approved','live'],rejected:['Rejected','bad'],cancelled:['Cancelled','end']};
const lDay=d=>new Date(d+'T00:00:00+05:30').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',timeZone:'Asia/Kolkata'});
const lWhen=l=>l.type==='gatepass'?lDay(l.from)+' · leaves at '+l.outLabel:(l.from===l.to?lDay(l.from):lDay(l.from)+' to '+lDay(l.to));
const lf=(l,i,h)=>el('div',{class:'tf'},el('label',{},l),i,h?el('small',{class:'mu'},h):'');
const lsel=(opts,val,on)=>{const s=el('select',{},opts.map(([v,l])=>el('option',{value:v},l)));if(val!=null)s.value=val;if(on)s.onchange=on;return s};
const lchip=(t,k)=>el('span',{class:'tchip '+(k||'')},t);
const ltime=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})$/);return m?(+m[1])*60+(+m[2]):0};

/* ---------------- student ---------------- */
async function initMyLeaves(){
 const m=page('n_leave'),r=await call('myLeaves'),today=r.today;
 let type='leave';const tabs=el('div',{class:'seg'}),form=el('div',{class:'tform'}),list=el('div',{class:'flist'}),msg=el('div',{class:'err'});
 const from=el('input',{type:'date',value:today,min:today}),to=el('input',{type:'date',value:today,min:today}),tm=el('input',{type:'time',value:'13:00'}),pick=el('input',{placeholder:'Example: Father, Mother, Uncle'}),why=el('textarea',{rows:3,maxlength:300,placeholder:'Reason'});
 const fTo=lf('To date',to),fTm=lf('Leaving time',tm,'School decides the final time. Please keep it realistic.'),fPk=lf('Who will pick you up?',pick);
 const sync=()=>{[...tabs.children].forEach(b=>b.classList.toggle('on',b.dataset.t===type));fTo.style.display=type==='leave'?'':'none';fTm.style.display=fPk.style.display=type==='gatepass'?'':'none'};
 [['leave','Leave'],['gatepass','Gate pass']].forEach(([k,l])=>tabs.append(el('button',{type:'button','data-t':k,onclick:()=>{type=k;sync()}},l)));
 from.onchange=()=>{if(to.value<from.value)to.value=from.value;to.min=from.value};
 const send=el('button',{type:'button',class:'s'},'Send request');
 send.onclick=async()=>{msg.textContent='';try{await call('requestLeave',{type,from:from.value,to:to.value,outMin:ltime(tm.value),pickupBy:pick.value,reason:why.value});why.value='';pick.value='';toast('Request sent to your class teacher');await load()}catch(e){msg.textContent=e.message}};
 form.append(lf('Date',from,type==='leave'?'First day':''),fTo,fTm,fPk,lf('Reason',why),msg,send);
 m.append(el('div',{class:'card pick'},el('h3',{},'New request'),el('p',{class:'mu'},'Leave is for one or more days. A gate pass is to leave school early on one day. Your class teacher will approve or reject it.'),tabs,form),el('h3',{class:'sh'},'My requests'),list);
 const load=async()=>{const x=await call('myLeaves');list.innerHTML='';if(!x.leaves.length){list.append(emptyState('No requests yet','Your leave and gate pass requests will appear here.'));return}x.leaves.forEach(l=>list.append(leaveCard(l,x,load)))};
 sync();await load()}

function leaveCard(l,me,reload){
 const c=el('div',{class:'tcard'}),st=LS[l.status]||['',''];
 c.append(el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},(l.type==='gatepass'?'Gate pass':'Leave')+' · '+lWhen(l)),el('span',{class:'mu'},l.reason)),lchip(st[0],st[1])));
 if(l.remark)c.append(el('p',{class:'mu'},(l.decidedBy||'Teacher')+': '+l.remark));
 if(l.status==='approved'&&l.type==='gatepass'&&l.from===me.today)c.append(el('div',{class:'gpass'},el('small',{},'GATE PASS · '+l.leaveId),el('h2',{},me.student),el('p',{},me.className+(me.roll?' · Roll '+me.roll:'')),el('p',{},'Leaves at '+l.outLabel+' with '+l.pickupBy),el('p',{class:'mu'},'Approved by '+(l.decidedBy||'school')+' · '+lDay(l.from))));
 else if(l.type==='gatepass')c.append(el('p',{class:'mu'},'Picked up by: '+l.pickupBy));
 if((l.status==='pending'||l.status==='approved')&&l.to>=me.today)c.append(el('div',{class:'row'},[btn('Cancel request',async()=>{if(!confirm('Cancel this request?'))return;try{await call('cancelLeave',{leaveId:l.leaveId});toast('Request cancelled');await reload()}catch(e){toast(e.message,1)}},true)]));
 return c}

/* ---------------- teacher / admin ---------------- */
async function initLeavesStaff(){
 const m=page('n_leaves');let tab='pending';const body=el('div'),seg=el('div',{class:'seg'});
 const go=async t=>{tab=t;[...seg.children].forEach(b=>b.classList.toggle('on',b.dataset.t===t));body.innerHTML='';
  const r=await call('listLeaves',{status:t});seg.firstChild.textContent='Waiting'+(r.pending?' ('+r.pending+')':'');
  if(!r.leaves.length){body.append(emptyState(t==='pending'?'No requests waiting':t==='today'?'No one is on leave or leaving early today':'Nothing here yet',t==='pending'?'New leave and gate pass requests appear here.':''));return}
  const l=el('div',{class:'flist'});r.leaves.forEach(x=>l.append(staffLeave(x,t,()=>go(tab))));body.append(l)};
 [['pending','Waiting'],['today','Today'],['all','History']].forEach(([k,l])=>seg.append(el('button',{type:'button','data-t':k,onclick:()=>go(k)},l)));
 m.append(seg,body);await go('pending')}

function staffLeave(l,tab,reload){
 const c=el('div',{class:'tcard'}),st=LS[l.status]||['','']; 
 c.append(el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},l.student+' · '+l.className),el('span',{class:'mu'},(l.type==='gatepass'?'Gate pass · ':'Leave · ')+lWhen(l))),lchip(tab==='today'&&l.type==='gatepass'?l.outLabel:st[0],tab==='today'?'live':st[1])),el('p',{},l.reason));
 if(l.type==='gatepass')c.append(el('p',{class:'mu'},'Picked up by: '+l.pickupBy));
 if(l.remark)c.append(el('p',{class:'mu'},(l.decidedBy||'')+': '+l.remark));
 if(l.status==='pending'){const rm=el('input',{placeholder:'Remark for the student (optional)'}),dec=d=>async()=>{try{await call('decideLeave',{leaveId:l.leaveId,decision:d,remark:rm.value});toast(d==='approved'?'Approved':'Rejected');await reload()}catch(e){toast(e.message,1)}};
  c.append(rm,el('div',{class:'row'},[btn('Approve',dec('approved'),false),btn('Reject',dec('rejected'),true)]))}
 return c}
