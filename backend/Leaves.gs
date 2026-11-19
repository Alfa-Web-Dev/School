// ---------- Leave requests + gate passes: student asks, class teacher / admin decides ----------
const LEAVE_TYPES=['leave','gatepass'],MAX_LEAVE_DAYS=15;
const hhmm=m=>{m=Number(m)||0;const h=Math.floor(m/60),mi=m%60;return(h%12||12)+':'+String(mi).padStart(2,'0')+' '+(h<12?'AM':'PM')};
const dayDiff=(a,b)=>Math.round((new Date(b+'T00:00:00+05:30')-new Date(a+'T00:00:00+05:30'))/864e5);

// students with an approved leave / gate pass covering this date: {studentId:1}
function leaveOn(cid,date){const m={};table('LeaveRequests').rows.forEach(l=>{if(String(l.classId)===cid&&String(l.status)==='approved'&&dstr(l.fromDate)<=date&&dstr(l.toDate)>=date)m[String(l.studentId)]=1});return m}

const leaveView=(l,sn,cn,tn)=>({leaveId:String(l.leaveId),studentId:String(l.studentId),student:sn?sn[String(l.studentId)]||'':'',classId:String(l.classId),className:cn?cn[String(l.classId)]||'':'',type:String(l.type),
 from:dstr(l.fromDate),to:dstr(l.toDate),outTime:Number(l.outMin)||0,outLabel:Number(l.outMin)?hhmm(l.outMin):'',pickupBy:String(l.pickupBy||''),reason:String(l.reason),status:String(l.status),
 decidedBy:tn?tn[String(l.decidedBy)]||'':'',remark:String(l.remark||''),created:Number(l.created)||0});

function requestLeave(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{
  const type=LEAVE_TYPES.indexOf(String(b.type))>=0?String(b.type):'',today=todayStr();if(!type)throw new Error('Choose leave or gate pass');
  const from=dstr(b.from),to=type==='gatepass'?from:dstr(b.to||b.from);
  if(!validDate(from)||!validDate(to))throw new Error('Choose valid dates');
  if(from<today)throw new Error('The date cannot be in the past');if(to<from)throw new Error('The end date cannot be before the start date');
  if(dayDiff(from,to)+1>MAX_LEAVE_DAYS)throw new Error('You can request at most '+MAX_LEAVE_DAYS+' days at a time');
  const reason=txt(b.reason,300);if(reason.length<5)throw new Error('Please write the reason');
  let out=0,pick='';
  if(type==='gatepass'){out=Number(b.outMin);if(!(out>=300&&out<=1200))throw new Error('Choose the time you will leave school');pick=txt(b.pickupBy,80);if(pick.length<2)throw new Error('Write who will pick you up')}
  const mine=table('LeaveRequests').rows.filter(l=>String(l.studentId)===String(r.studentId));
  if(mine.filter(l=>String(l.status)==='pending').length>=3)throw new Error('You already have 3 requests waiting. Please wait for them to be decided.');
  if(mine.some(l=>String(l.type)===type&&['pending','approved'].indexOf(String(l.status))>=0&&dstr(l.fromDate)<=to&&dstr(l.toDate)>=from))throw new Error('You already have a request for these dates');
  const id=nextId('LeaveRequests','leaveId','L');
  addRow('LeaveRequests',{leaveId:id,studentId:String(r.studentId),classId:String(r.classId),type,fromDate:from,toDate:to,outMin:out,pickupBy:pick,reason,status:'pending',created:Date.now()});
  return{ok:true,leaveId:id}}))}

function myLeaves(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const tn=nameMap('Users','userId'),today=todayStr();
  const list=table('LeaveRequests').rows.filter(l=>String(l.studentId)===String(r.studentId)).reverse().slice(0,40).map(l=>leaveView(l,null,null,tn));
  return{ok:true,today,student:String(r.name),roll:String(r.roll||''),className:String(nameMap('Classes','classId')[String(r.classId)]||''),leaves:list}})}

function cancelLeave(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{const l=find('LeaveRequests',x=>String(x.leaveId)===String(b.leaveId)&&String(x.studentId)===String(r.studentId));if(!l)throw new Error('Request not found');
  if(['pending','approved'].indexOf(String(l.status))<0)throw new Error('This request cannot be cancelled');if(dstr(l.toDate)<todayStr())throw new Error('This request is already over');
  setRow('LeaveRequests',l._row,{status:'cancelled'});return{ok:true}}))}

// who may decide: admin, or the class teacher of that class
const canDecide=(s,l)=>s.role==='admin'||isClassTeacher(s,String(l.classId));

function listLeaves(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const want=String(b.status||'pending'),today=todayStr(),sn=nameMap('Students','studentId'),cn=nameMap('Classes','classId'),tn=nameMap('Users','userId');
  const mineRows=table('LeaveRequests').rows.filter(l=>canDecide(s,l)),st=l=>String(l.status);
  const pending=mineRows.filter(l=>st(l)==='pending').length;
  let rows;
  if(want==='today')rows=mineRows.filter(l=>st(l)==='approved'&&dstr(l.fromDate)<=today&&dstr(l.toDate)>=today);
  else if(want==='pending')rows=mineRows.filter(l=>st(l)==='pending');
  else rows=mineRows.filter(l=>st(l)!=='pending');
  rows.sort((a,b2)=>want==='today'?(Number(a.outMin)||0)-(Number(b2.outMin)||0):Number(b2.created)-Number(a.created));
  return{ok:true,pending,today,leaves:rows.slice(0,80).map(l=>leaveView(l,sn,cn,tn))}})}

function decideLeave(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const l=find('LeaveRequests',x=>String(x.leaveId)===String(b.leaveId));if(!l||!canDecide(s,l))throw new Error('Request not found');
  if(String(l.status)!=='pending')throw new Error('This request was already decided');
  const d=String(b.decision);if(d!=='approved'&&d!=='rejected')throw new Error('Invalid decision');
  if(dstr(l.toDate)<todayStr())throw new Error('This request date has passed');
  setRow('LeaveRequests',l._row,{status:d,decidedBy:s.userId,decidedAt:Date.now(),remark:txt(b.remark,200)});log(s.userId,'leave_'+d,l.leaveId);return{ok:true}}))}
