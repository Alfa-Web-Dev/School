// ---------- QR attendance: student shows a QR that changes every 30 seconds; teacher scans it ----------
const QR_WIN=30000;
function qrSecret(){const P=PropertiesService.getScriptProperties();let k=P.getProperty('QR_SECRET');if(!k){k=Utilities.getUuid()+Utilities.getUuid();P.setProperty('QR_SECRET',k)}return k}
function qrSig(sid,win){const raw=Utilities.computeHmacSha256Signature(sid+'.'+win,qrSecret());return raw.map(b=>('0'+(b&255).toString(16)).slice(-2)).join('').slice(0,12)}
const qrCode=(sid,win)=>sid+'.'+win+'.'+qrSig(sid,win);

function myQr(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const now=Date.now(),win=Math.floor(now/QR_WIN),c=find('Classes',x=>String(x.classId)===String(r.classId));
  return{ok:true,code:qrCode(String(r.studentId),win),ttl:Math.max(1,Math.ceil(((win+1)*QR_WIN-now)/1000)),name:String(r.name),roll:String(r.roll||''),admNo:String(r.admNo||''),className:c?String(c.name):'',window:QR_WIN/1000}})}

// verifies a scanned code, returns studentId or throws
function qrVerify(code){
 const p=String(code||'').trim().split('.');if(p.length!==3||!/^\d+$/.test(p[1]))throw new Error('This is not a valid student QR');
 const win=Number(p[1]),cur=Math.floor(Date.now()/QR_WIN);
 if(win>cur+1||win<cur-2)throw new Error('This QR is too old. Ask the student to show the live QR on their phone.');
 if(qrSig(p[0],win)!==p[2])throw new Error('This QR is not valid');return p[0]}

function scanAttendance(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const cid=resolveClass(b.classId);if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
  const sid=qrVerify(b.code),st=find('Students',x=>String(x.studentId)===sid&&String(x.status)!=='left'&&String(x.status).toLowerCase()!=='inactive');
  if(!st)throw new Error('Student not found');
  if(String(st.classId)!==cid)throw new Error(String(st.name)+' is not in this class');
  const date=todayStr(),m=attMap(cid,date),want=b.late?'L':'P',cur=m[sid];
  const out={ok:true,name:String(st.name),roll:String(st.roll||''),status:want};
  if(cur==='P'||cur==='L'){out.already=true;out.status=cur;return out}
  addRow('Attendance',{date,classId:cid,studentId:sid,status:want,markedBy:s.userId});log(s.userId,'attendance_qr',cid+' '+sid);return out}))}
