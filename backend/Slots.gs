// ---------- Doubt / extra-class slots: teacher opens a slot, students of the class book a seat ----------
const SLOT_MAX_SEATS=60,SLOT_MAX_BOOKED=3;
const nowMin=()=>{const p=Utilities.formatDate(new Date(),'Asia/Kolkata','HH:mm').split(':');return(+p[0])*60+(+p[1])};
const slotOver=s=>{const d=dstr(s.slotDate),t=todayStr();return d<t||(d===t&&Number(s.endMin)<=nowMin())};
const slotBooked=sid=>table('SlotBookings').rows.filter(x=>String(x.slotId)===sid&&['booked','attended','absent'].indexOf(String(x.status))>=0);

function slotView(s,cn,tn){return{slotId:String(s.slotId),classId:String(s.classId),className:cn[String(s.classId)]||'',teacherId:String(s.teacherId),teacher:tn[String(s.teacherId)]||'',title:String(s.title),
 date:dstr(s.slotDate),start:Number(s.startMin),end:Number(s.endMin),label:hhmm(s.startMin)+' – '+hhmm(s.endMin),capacity:Number(s.capacity)||0,place:String(s.place||''),note:String(s.note||''),status:String(s.status)}}

function createSlot(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const cid=resolveClass(b.classId);if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
  const title=txt(b.title,100);if(title.length<3)throw new Error('Write the topic or title');
  const date=dstr(b.date);if(!validDate(date)||date<todayStr())throw new Error('Choose a date that is not in the past');
  const st=Number(b.startMin),en=Number(b.endMin);if(!(st>=300&&en<=1260&&en>st))throw new Error('Choose a valid start and end time');
  if(date===todayStr()&&en<=nowMin())throw new Error('This time has already passed');
  if(en-st>240)throw new Error('A slot can be at most 4 hours');
  const cap=Math.floor(Number(b.capacity)||10);if(cap<1||cap>SLOT_MAX_SEATS)throw new Error('Seats must be between 1 and '+SLOT_MAX_SEATS);
  const mine=table('HelpSlots').rows.filter(x=>String(x.teacherId)===s.userId&&String(x.status)==='open'&&dstr(x.slotDate)===date);
  if(mine.some(x=>Number(x.startMin)<en&&Number(x.endMin)>st))throw new Error('You already have a slot at this time');
  const id=nextId('HelpSlots','slotId','SL');
  addRow('HelpSlots',{slotId:id,classId:cid,teacherId:s.userId,title,slotDate:date,startMin:st,endMin:en,capacity:cap,place:txt(b.place,80),note:txt(b.note,200),status:'open',created:Date.now()});
  log(s.userId,'slot_create',id);return{ok:true,slotId:id}}))}

const canSlot=(s,x)=>s.role==='admin'||String(x.teacherId)===s.userId;

function listSlots(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const past=String(b.when)==='past',cn=nameMap('Classes','classId'),tn=nameMap('Users','userId'),sn=nameMap('Students','studentId');
  let rows=table('HelpSlots').rows.filter(x=>canSlot(s,x));
  rows=rows.filter(x=>past?(slotOver(x)||String(x.status)!=='open'):(!slotOver(x)&&String(x.status)==='open'));
  rows.sort((a,c)=>past?(dstr(c.slotDate)+String(1e4+Number(c.startMin))).localeCompare(dstr(a.slotDate)+String(1e4+Number(a.startMin))):(dstr(a.slotDate)+String(1e4+Number(a.startMin))).localeCompare(dstr(c.slotDate)+String(1e4+Number(c.startMin))));
  const bk=table('SlotBookings').rows;
  return{ok:true,today:todayStr(),slots:rows.slice(0,60).map(x=>{const v=slotView(x,cn,tn),id=v.slotId;
   v.bookings=bk.filter(k=>String(k.slotId)===id&&String(k.status)!=='cancelled').map(k=>({bookingId:String(k.bookingId),studentId:String(k.studentId),student:sn[String(k.studentId)]||'',topic:String(k.topic||''),status:String(k.status)}));return v})}})}

function cancelSlot(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const x=find('HelpSlots',y=>String(y.slotId)===String(b.slotId));if(!x||!canSlot(s,x))throw new Error('Slot not found');
  if(String(x.status)!=='open')throw new Error('This slot is already cancelled');if(slotOver(x))throw new Error('This slot is already over');
  setRow('HelpSlots',x._row,{status:'cancelled'});
  table('SlotBookings').rows.filter(k=>String(k.slotId)===String(x.slotId)&&String(k.status)==='booked').forEach(k=>setRow('SlotBookings',k._row,{status:'cancelled'}));
  log(s.userId,'slot_cancel',x.slotId);return{ok:true}}))}

// teacher marks who actually came
function markSlotAttendance(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const k=find('SlotBookings',y=>String(y.bookingId)===String(b.bookingId));if(!k)throw new Error('Booking not found');
  const x=find('HelpSlots',y=>String(y.slotId)===String(k.slotId));if(!x||!canSlot(s,x))throw new Error('Booking not found');
  const st=String(b.status);if(st!=='attended'&&st!=='absent')throw new Error('Invalid status');if(String(k.status)==='cancelled')throw new Error('This booking was cancelled');
  if(dstr(x.slotDate)>todayStr())throw new Error('This slot has not started yet');
  setRow('SlotBookings',k._row,{status:st});return{ok:true}}))}

/* ---------------- student ---------------- */
function mySlots(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const cid=String(r.classId),cn=nameMap('Classes','classId'),tn=nameMap('Users','userId'),sid=String(r.studentId);
  const mine={};table('SlotBookings').rows.filter(k=>String(k.studentId)===sid).forEach(k=>{mine[String(k.slotId)]=k});
  const all=table('HelpSlots').rows,out=[];
  all.forEach(x=>{const id=String(x.slotId),k=mine[id],isMine=k&&String(k.status)!=='cancelled';
   if(String(x.status)!=='open'||slotOver(x)||(String(x.classId)!==cid&&!isMine))return;
   const v=slotView(x,cn,tn);v.taken=slotBooked(id).length;v.full=v.taken>=v.capacity;v.mine=isMine?{bookingId:String(k.bookingId),topic:String(k.topic||''),status:String(k.status)}:null;out.push(v)});
  out.sort((a,c)=>(a.date+String(1e4+a.start)).localeCompare(c.date+String(1e4+c.start)));
  const past=[];all.forEach(x=>{const k=mine[String(x.slotId)];if(k&&(slotOver(x)||String(x.status)!=='open')){const v=slotView(x,cn,tn);v.mine={bookingId:String(k.bookingId),topic:String(k.topic||''),status:String(k.status)};past.push(v)}});
  past.sort((a,c)=>(c.date+String(1e4+c.start)).localeCompare(a.date+String(1e4+a.start)));
  return{ok:true,today:todayStr(),slots:out,past:past.slice(0,15)}})}

function bookSlot(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{const x=find('HelpSlots',y=>String(y.slotId)===String(b.slotId));
  if(!x||String(x.classId)!==String(r.classId)||String(x.status)!=='open')throw new Error('This slot is not available');
  if(slotOver(x))throw new Error('This slot is already over');
  const sid=String(r.studentId),id=String(x.slotId),mine=table('SlotBookings').rows.filter(k=>String(k.studentId)===sid&&String(k.status)==='booked');
  if(mine.some(k=>String(k.slotId)===id))throw new Error('You have already booked this slot');
  const slots=table('HelpSlots').rows,live=mine.filter(k=>{const y=slots.find(z=>String(z.slotId)===String(k.slotId));return y&&String(y.status)==='open'&&!slotOver(y)});
  if(live.length>=SLOT_MAX_BOOKED)throw new Error('You can have at most '+SLOT_MAX_BOOKED+' upcoming bookings. Cancel one first.');
  if(live.some(k=>{const y=slots.find(z=>String(z.slotId)===String(k.slotId));return dstr(y.slotDate)===dstr(x.slotDate)&&Number(y.startMin)<Number(x.endMin)&&Number(y.endMin)>Number(x.startMin)}))throw new Error('You already have another booking at this time');
  if(slotBooked(id).length>=Number(x.capacity))throw new Error('This slot is full');
  const bid=nextId('SlotBookings','bookingId','BK');
  addRow('SlotBookings',{bookingId:bid,slotId:id,studentId:sid,topic:txt(b.topic,150),status:'booked',created:Date.now()});return{ok:true,bookingId:bid}}))}

function cancelBooking(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{const k=find('SlotBookings',y=>String(y.bookingId)===String(b.bookingId)&&String(y.studentId)===String(r.studentId));if(!k)throw new Error('Booking not found');
  if(String(k.status)!=='booked')throw new Error('This booking cannot be cancelled');
  const x=find('HelpSlots',y=>String(y.slotId)===String(k.slotId));if(x&&slotOver(x))throw new Error('This slot is already over');
  setRow('SlotBookings',k._row,{status:'cancelled'});return{ok:true}}))}
