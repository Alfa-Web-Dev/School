// Class notices (Phase 4): admin sab ko (ALL) ya kisi class ko; teacher sirf apni classes ko
function listClassNotices(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 const mine=s.role==='teacher'?teacherClassIds(s.userId):null,cn=nameMap('Classes','classId');
 return{ok:true,notices:table('ClassNotices').rows.filter(n=>!mine||String(n.classId)==='ALL'||mine[String(n.classId)]).map(n=>({id:String(n.id),classId:String(n.classId),
  className:String(n.classId)==='ALL'?'All classes':(cn[String(n.classId)]||String(n.classId)),title:n.title,text:n.text,date:dstr(n.date),
  editable:s.role==='admin'||!!(mine&&mine[String(n.classId)])})).sort((a,c)=>a.date<c.date?1:-1)}}

function saveClassNotice(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const d=b.notice||{},raw=clean(d.classId,40),cid=raw==='ALL'?'ALL':resolveClass(raw),title=clean(d.title,120),text=clean(d.text,1000),date=dstr(d.date)||todayStr();
  if(!cid)throw new Error('Class chuno');if(cid==='ALL'&&s.role!=='admin')throw new Error('Sab classes ko sirf admin bhej sakta hai');
  if(cid!=='ALL'&&!canClass(s,cid))throw new Error('Is class ki permission nahi hai');
  if(!title)throw new Error('Title zaruri hai');if(!validDate(date))throw new Error('Date galat hai');
  const o={classId:cid,title,text,date};
  if(d.id){const ex=find('ClassNotices',n=>String(n.id)===String(d.id));if(!ex)throw new Error('Notice nahi mili');
   if(!(s.role==='admin'||canClass(s,String(ex.classId))&&String(ex.classId)!=='ALL'))throw new Error('Is notice ko edit nahi kar sakte');
   setRow('ClassNotices',ex._row,o);return{ok:true,id:String(ex.id)}}
  const id=nextId('ClassNotices','id','N',3);addRow('ClassNotices',Object.assign(o,{id}));log(s.userId,'notice_add',id);return{ok:true,id}}))}

function deleteClassNotice(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const ex=find('ClassNotices',n=>String(n.id)===String(b.id));if(!ex)throw new Error('Notice nahi mili');
  if(!(s.role==='admin'||canClass(s,String(ex.classId))&&String(ex.classId)!=='ALL'))throw new Error('Is notice ko delete nahi kar sakte');
  tab('ClassNotices').deleteRow(ex._row);log(s.userId,'notice_delete',ex.id);return{ok:true}}))}
