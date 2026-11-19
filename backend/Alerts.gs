// ---------- Parent alerts: ready-made messages, one-tap WhatsApp from the staff phone; "sent" is remembered ----------
const ALERT_KINDS=['absent','fees','class'];
// WhatsApp wants country code + number, digits only. India by default.
function waPhone(v){let d=String(v||'').replace(/\D/g,'');if(d.length===11&&d[0]==='0')d=d.slice(1);if(d.length===10)d='91'+d;return/^\d{11,14}$/.test(d)?d:''}

function parentAlerts(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const kind=String(b.kind);if(ALERT_KINDS.indexOf(kind)<0)throw new Error('Invalid alert type');
  const cid=resolveClass(b.classId);if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
  const today=todayStr(),cn=nameMap('Classes','classId'),cls=cn[cid]||cid;let tag,list;
  if(kind==='absent'){tag=b.date?dstr(b.date):today;if(!validDate(tag)||tag>today)throw new Error('Choose a valid date');
   const m=attMap(cid,tag),lv=leaveOn(cid,tag);
   if(!Object.keys(m).length)return{ok:true,marked:false,tag,className:cls,rows:[]};
   list=activeStudents(cid).filter(x=>m[String(x.studentId)]==='A'&&!lv[String(x.studentId)]).map(x=>({r:x,info:{}}))}
  else if(kind==='fees'){if(s.role!=='admin')throw new Error('Only the admin can send fee reminders');
   tag=today.slice(0,7);const c=feeCtx();
   list=activeStudents(cid).map(x=>({r:x,info:(f=>({balance:f.balance}))(feesOfCtx(x,c))})).filter(x=>x.info.balance>0)}
  else{tag=clean(b.tag,12);if(!/^[a-z0-9]{3,12}$/i.test(tag))throw new Error('Invalid message id');list=activeStudents(cid).map(x=>({r:x,info:{}}))}
  const prefix=kind+'|'+tag+'|',sent={};table('AlertLog').rows.forEach(a=>{const k=String(a.key);if(k.indexOf(prefix)===0)sent[k]=1});
  return{ok:true,marked:true,tag,className:cls,rows:list.map(x=>{const sid=String(x.r.studentId),key=prefix+sid;
   return{studentId:sid,name:String(x.r.name),roll:String(x.r.roll||''),parent:String(x.r.parentName||''),phone:waPhone(x.r.parentPhone),info:x.info,key,sent:!!sent[key]}})}})}

function markAlertSent(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const keys=(Array.isArray(b.keys)?b.keys:[]).map(String).filter((k,i,a)=>a.indexOf(k)===i);
  if(!keys.length||keys.length>100)throw new Error('Nothing to mark');
  const have={};table('AlertLog').rows.forEach(a=>{have[String(a.key)]=1});const sts=table('Students').rows,add=[];
  keys.forEach(k=>{const p=k.split('|');if(p.length!==3||ALERT_KINDS.indexOf(p[0])<0)throw new Error('Invalid key');
   const x=sts.find(y=>String(y.studentId)===p[2]);if(!x||!canClass(s,String(x.classId)))throw new Error('Student not found');
   if(p[0]==='fees'&&s.role!=='admin')throw new Error('Only the admin can send fee reminders');
   if(!have[k]){add.push({key:k,sentAt:Date.now(),by:s.userId});have[k]=1}});
  addRows('AlertLog',add);return{ok:true,marked:add.length}}))}
