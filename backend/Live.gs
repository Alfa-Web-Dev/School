// ---------- Live classes: teacher schedules an online class with a Meet (or Zoom/Teams) link; students of the class see Join ----------
const LIVE_HOSTS=/^https:\/\/([a-z0-9-]+\.)*(meet\.google\.com|zoom\.us|zoom\.com|teams\.microsoft\.com|teams\.live\.com)\//i;
const liveOver=x=>{const d=dstr(x.liveDate),t=todayStr();return d<t||(d===t&&Number(x.endMin)<=nowMin())};
const liveState=x=>{const d=dstr(x.liveDate),t=todayStr(),n=nowMin();if(String(x.status)!=='open')return'cancelled';if(liveOver(x))return'over';if(d===t&&n>=Number(x.startMin)-10)return'live';return'upcoming'};
function liveView(x,cn,tn){return{liveId:String(x.liveId),classId:String(x.classId),className:cn[String(x.classId)]||'',teacherId:String(x.teacherId),teacher:tn[String(x.teacherId)]||'',title:String(x.title),
 date:dstr(x.liveDate),start:Number(x.startMin),end:Number(x.endMin),label:hhmm(x.startMin)+' – '+hhmm(x.endMin),link:String(x.link),note:String(x.note||''),status:String(x.status),state:liveState(x)}}
const liveKey=x=>dstr(x.liveDate)+String(1e4+Number(x.startMin));

function createLive(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const cid=resolveClass(b.classId);if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
  const title=txt(b.title,100);if(title.length<3)throw new Error('Write the subject or topic');
  const date=dstr(b.date);if(!validDate(date)||date<todayStr())throw new Error('Choose a date that is not in the past');
  const st=Number(b.startMin),en=Number(b.endMin);if(!(st>=300&&en<=1380&&en>st))throw new Error('Choose a valid start and end time');
  if(date===todayStr()&&en<=nowMin())throw new Error('This time has already passed');
  if(en-st>240)throw new Error('A class can be at most 4 hours');
  const link=String(b.link||'').trim();if(!LIVE_HOSTS.test(link)||link.length>300)throw new Error('Paste a valid Google Meet, Zoom or Teams link (starting with https://)');
  const weeks=Math.max(0,Math.min(12,Math.floor(Number(b.weeks)||0)));
  const mine=table('LiveClasses').rows.filter(x=>String(x.teacherId)===s.userId&&String(x.status)==='open');
  const rows=[];
  for(let i=0;i<=weeks;i++){
   const d=i?Utilities.formatDate(new Date(new Date(date+'T00:00:00+05:30').getTime()+i*7*864e5),'Asia/Kolkata','yyyy-MM-dd'):date;
   if(mine.some(x=>dstr(x.liveDate)===d&&Number(x.startMin)<en&&Number(x.endMin)>st))throw new Error('You already have a live class at this time on '+d);
   rows.push(d)}
  const ids=rows.map(d=>{const id=nextId('LiveClasses','liveId','LV');
   addRow('LiveClasses',{liveId:id,classId:cid,teacherId:s.userId,title,liveDate:d,startMin:st,endMin:en,link,note:txt(b.note,200),status:'open',created:Date.now()});return id});
  log(s.userId,'live_create',ids[0]+(ids.length>1?' x'+ids.length:''));return{ok:true,count:ids.length}}))}

const canLive=(s,x)=>s.role==='admin'||String(x.teacherId)===s.userId;

function listLive(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const past=String(b.when)==='past',cn=nameMap('Classes','classId'),tn=nameMap('Users','userId');
  let rows=table('LiveClasses').rows.filter(x=>canLive(s,x));
  rows=rows.filter(x=>past?(liveOver(x)||String(x.status)!=='open'):(!liveOver(x)&&String(x.status)==='open'));
  rows.sort((a,c)=>past?liveKey(c).localeCompare(liveKey(a)):liveKey(a).localeCompare(liveKey(c)));
  return{ok:true,today:todayStr(),items:rows.slice(0,60).map(x=>liveView(x,cn,tn))}})}

function cancelLive(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const x=find('LiveClasses',y=>String(y.liveId)===String(b.liveId));if(!x||!canLive(s,x))throw new Error('Class not found');
  if(String(x.status)!=='open')throw new Error('This class is already cancelled');if(liveOver(x))throw new Error('This class is already over');
  setRow('LiveClasses',x._row,{status:'cancelled'});log(s.userId,'live_cancel',x.liveId);return{ok:true}}))}

function myLive(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const cid=String(r.classId),cn=nameMap('Classes','classId'),tn=nameMap('Users','userId');
  const mine=table('LiveClasses').rows.filter(x=>String(x.classId)===cid);
  const up=mine.filter(x=>String(x.status)==='open'&&!liveOver(x)).sort((a,c)=>liveKey(a).localeCompare(liveKey(c))).slice(0,30).map(x=>liveView(x,cn,tn));
  const past=mine.filter(x=>String(x.status)==='open'&&liveOver(x)).sort((a,c)=>liveKey(c).localeCompare(liveKey(a))).slice(0,10).map(x=>{const v=liveView(x,cn,tn);v.link='';return v});
  return{ok:true,today:todayStr(),upcoming:up,past}})}
