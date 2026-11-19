// Doubt / extra-class slots: teacher opens a slot, students book a seat
const SDAY=d=>new Date(d+'T00:00:00+05:30').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',timeZone:'Asia/Kolkata'});
const sChip=(t,k)=>el('span',{class:'tchip '+(k||'')},t);
const sTime=v=>{const m=String(v||'').match(/^(\d{1,2}):(\d{2})$/);return m?(+m[1])*60+(+m[2]):0};
const sFld=(l,i,h)=>el('div',{class:'tf'},el('label',{},l),i,h?el('small',{class:'mu'},h):'');

/* ---------------- student ---------------- */
async function initMySlots(){
 const m=page('n_slots'),box=el('div',{class:'flist'}),past=el('div',{class:'flist'});
 m.append(el('p',{class:'mu'},'Book a seat in a doubt-clearing or extra class. You can hold up to 3 upcoming bookings.'),box,el('h3',{class:'sh'},'Earlier'),past);
 const load=async()=>{const r=await call('mySlots');box.innerHTML=past.innerHTML='';
  if(!r.slots.length)box.append(emptyState('No slots open right now','When your teacher opens a doubt class, it will appear here.'));
  r.slots.forEach(s=>box.append(slotCard(s,load)));
  if(!r.past.length)past.append(el('p',{class:'mu'},'Nothing yet'));
  r.past.forEach(s=>{const st={booked:['Booked','sch'],attended:['Attended','ok'],absent:['Missed','bad'],cancelled:['Cancelled','end']}[s.mine.status]||['',''];
   past.append(el('div',{class:'tcard'},el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},s.title),el('span',{class:'mu'},SDAY(s.date)+' · '+s.label+' · '+s.teacher)),sChip(st[0],st[1]))))});};
 await load()}

function slotCard(s,reload){
 const c=el('div',{class:'tcard'}),left=s.capacity-s.taken;
 c.append(el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},s.title),el('span',{class:'mu'},SDAY(s.date)+' · '+s.label),el('span',{class:'mu'},s.teacher+(s.place?' · '+s.place:''))),
  s.mine?sChip('Booked','ok'):s.full?sChip('Full','bad'):sChip(left+' seat'+(left===1?'':'s')+' left','sch')));
 if(s.note)c.append(el('p',{class:'mu'},s.note));
 if(s.mine){if(s.mine.topic)c.append(el('p',{class:'mu'},'Your doubt: '+s.mine.topic));
  c.append(el('div',{class:'row'},btn('Cancel booking',async()=>{if(!confirm('Cancel this booking?'))return;try{await call('cancelBooking',{bookingId:s.mine.bookingId});toast('Booking cancelled');await reload()}catch(e){toast(e.message,1)}},true)))}
 else if(!s.full)c.append(el('div',{class:'row'},btn('Book a seat',()=>{
  const t=el('textarea',{rows:3,maxlength:150,placeholder:'What do you want to ask? (optional)'});
  modal('Book: '+s.title,el('div',{},el('p',{class:'mu'},SDAY(s.date)+' · '+s.label),sFld('Your doubt',t)),[{t:'Cancel',g:1,fn:()=>true},{t:'Book',fn:async()=>{try{await call('bookSlot',{slotId:s.slotId,topic:t.value});toast('Seat booked');await reload()}catch(e){toast(e.message,1);return false}}}])})));
 return c}

/* ---------------- teacher / admin ---------------- */
async function initSlotsStaff(){
 const m=page('n_slots'),opt=await call('noteOptions'),classes=opt.classes;
 if(!classes.length){m.append(emptyState('No classes yet','Classes appear here once you are assigned to them'));return}
 let when='upcoming';const body=el('div'),seg=el('div',{class:'seg'});
 const go=async w=>{when=w;[...seg.children].forEach(b=>b.classList.toggle('on',b.dataset.t===w));body.innerHTML='';
  const r=await call('listSlots',{when:w});
  if(!r.slots.length){body.append(emptyState(w==='past'?'No past slots':'No upcoming slots','Create a slot so students can book a seat for doubts or an extra class.'));return}
  r.slots.forEach(s=>body.append(staffSlot(s,w==='past',r.today,()=>go(when))))};
 [['upcoming','Upcoming'],['past','Past']].forEach(([k,l])=>seg.append(el('button',{type:'button','data-t':k,onclick:()=>go(k)},l)));
 m.append(el('div',{class:'bar'},btn('New slot',()=>newSlot(classes,()=>go('upcoming')),false)),seg,body);await go('upcoming')}

function staffSlot(s,isPast,today,reload){
 const c=el('div',{class:'tcard'});
 c.append(el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},s.title),el('span',{class:'mu'},SDAY(s.date)+' · '+s.label+' · '+s.className+(s.place?' · '+s.place:''))),sChip(s.bookings.length+'/'+s.capacity+' booked',s.status==='cancelled'?'end':'sch')));
 if(s.status==='cancelled')c.append(sChip('Cancelled','end'));
 if(!s.bookings.length)c.append(el('p',{class:'mu'},'No bookings yet'));
 s.bookings.forEach(k=>{const row=el('div',{class:'scrow'},el('b',{},k.student),k.topic?el('span',{class:'mu'},' — '+k.topic):'');
  if(k.status==='booked'&&s.date<=today&&(isPast||true)&&s.date<=today)row.append(el('span',{class:'row'},btn('Came',async()=>{try{await call('markSlotAttendance',{bookingId:k.bookingId,status:'attended'});await reload()}catch(e){toast(e.message,1)}},true),btn('Absent',async()=>{try{await call('markSlotAttendance',{bookingId:k.bookingId,status:'absent'});await reload()}catch(e){toast(e.message,1)}},true)));
  else if(k.status!=='booked')row.append(sChip(k.status==='attended'?'Came':'Absent',k.status==='attended'?'ok':'bad'));
  c.append(row)});
 if(!isPast&&s.status==='open')c.append(el('div',{class:'row'},btn('Cancel slot',async()=>{if(!confirm('Cancel this slot? Booked students will lose their seat.'))return;try{await call('cancelSlot',{slotId:s.slotId});toast('Slot cancelled');await reload()}catch(e){toast(e.message,1)}},true)));
 return c}

function newSlot(classes,done){
 const today=new Date(Date.now()+19800000).toISOString().slice(0,10);
 const cls=el('select',{},classes.map(c=>el('option',{value:c.classId},c.name))),title=el('input',{placeholder:'Example: Maths doubts – Fractions',maxlength:100}),date=el('input',{type:'date',value:today,min:today}),
  st=el('input',{type:'time',value:'16:00'}),en=el('input',{type:'time',value:'17:00'}),cap=el('input',{type:'number',min:1,max:60,value:10}),place=el('input',{placeholder:'Room 5 / Online link',maxlength:80}),note=el('textarea',{rows:2,maxlength:200,placeholder:'Optional note for students'});
 const body=el('div',{class:'tform'},sFld('Class',cls),sFld('Topic',title),sFld('Date',date),el('div',{class:'row'},sFld('From',st),sFld('To',en)),sFld('Seats',cap),sFld('Place',place),sFld('Note',note));
 modal('New slot',body,[{t:'Cancel',g:1,fn:()=>true},{t:'Create',fn:async()=>{try{await call('createSlot',{classId:cls.value,title:title.value,date:date.value,startMin:sTime(st.value),endMin:sTime(en.value),capacity:cap.value,place:place.value,note:note.value});toast('Slot created');await done()}catch(e){toast(e.message,1);return false}}}])}
