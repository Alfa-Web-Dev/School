// Attendance (Phase 4): har entry nayi row (purani delete nahi), latest row jeetti hai
function attMap(cid,date){const m={};
 table('Attendance').rows.forEach(r=>{if(String(r.classId)===cid&&dstr(r.date)===date)m[String(r.studentId)]=String(r.status).toUpperCase()});return m}

function getAttendance(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const cid=resolveClass(b.classId),date=dstr(b.date)||todayStr();
  if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
  if(!validDate(date))throw new Error('Invalid date');
  const m=attMap(cid,date);
  return{ok:true,date,marked:Object.keys(m).length>0,students:activeStudents(cid).map(r=>({studentId:String(r.studentId),name:r.name,roll:String(r.roll),status:m[String(r.studentId)]||''}))}})}

function markAttendance(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const cid=resolveClass(b.classId),date=dstr(b.date);
  if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
  if(!validDate(date))throw new Error('Invalid date');
  if(date>todayStr())throw new Error('Attendance cannot be marked for a future date');
  const okIds={};activeStudents(cid).forEach(r=>okIds[String(r.studentId)]=1);
  const m=attMap(cid,date),rows=[];
  (Array.isArray(b.marks)?b.marks:[]).forEach(x=>{const sid=String(x.studentId),st=String(x.status).toUpperCase();
   if(!okIds[sid])throw new Error('Student is not in this class: '+sid);
   if(st!=='P'&&st!=='A'&&st!=='L')throw new Error('Status must be P/A/L');
   if(m[sid]!==st)rows.push({date,classId:cid,studentId:sid,status:st,markedBy:s.userId})});
  addRows('Attendance',rows);log(s.userId,'attendance',cid+' '+date+' ('+rows.length+')');
  return{ok:true,saved:rows.length}}))}
