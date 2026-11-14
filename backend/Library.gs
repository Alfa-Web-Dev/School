// Notes library (Phase 6a): file Google Drive mein, list Sheet ke "Notes" tab mein.
// Folder: School Notes / <Class> / <Subject> /. File "anyone with link can view" hoti hai; list sirf login wale ko milti hai.
const NOTE_MAX_BYTES=20*1024*1024,NOTE_TYPES={'application/pdf':'.pdf','image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp'};
function magicOk(b,mime){const u=i=>b[i]&255;
 if(mime==='application/pdf')return u(0)===0x25&&u(1)===0x50&&u(2)===0x44&&u(3)===0x46;
 if(mime==='image/jpeg')return u(0)===0xFF&&u(1)===0xD8;
 if(mime==='image/png')return u(0)===0x89&&u(1)===0x50&&u(2)===0x4E&&u(3)===0x47;
 if(mime==='image/webp')return u(0)===0x52&&u(1)===0x49&&u(2)===0x46&&u(3)===0x46;return false}
function subFolder(parent,name){const it=parent.getFoldersByName(name);return it.hasNext()?it.next():parent.createFolder(name)}
const safeName=s=>String(s).replace(/[\\/:*?"<>|\r\n]+/g,' ').replace(/\s+/g,' ').trim().slice(0,60)||'note';

// Public library: teacher/admin jis note ko "public" karein wahi website par dikhta hai (Drive se, repo mein kuch nahi).
// Purane sheet mein 'public' column (11th) apne aap jud jata hai.
const PUB_KEY='pub_notes';
function notesCol(){const sh=tab('Notes');if(String(sh.getRange(1,11).getValue())!=='public')sh.getRange(1,11).setValue('public')}
const isPub=n=>String(n.public).toLowerCase()==='yes';
const pubBust=()=>{try{CacheService.getScriptCache().remove(PUB_KEY)}catch(e){}};
function publicNotes(b){   // bina login; sirf public-flag wale notes ka metadata, 10 min cache
 return safe(()=>{
  const c=CacheService.getScriptCache(),hit=c.get(PUB_KEY);if(hit)return JSON.parse(hit);
  notesCol();
  const sn=nameMap('Subjects','subjectId'),cn=nameMap('Classes','classId');
  let list=table('Notes').rows.filter(isPub).map(n=>({id:String(n.noteId),t:String(n.title),ch:String(n.chapter),c:cn[String(n.classId)]||'',s:sn[String(n.subjectId)]||'',d:dstr(n.date),m:String(n.mime)==='application/pdf'?'pdf':'img',z:Number(n.size)||0,f:String(n.fileId)}));
  list.sort((a,z)=>a.d<z.d?1:-1);list=list.slice(0,400);
  let r={ok:true,notes:list},j=JSON.stringify(r);
  while(j.length>90000&&list.length){list=list.slice(0,Math.floor(list.length*0.8));r={ok:true,notes:list};j=JSON.stringify(r)}
  c.put(PUB_KEY,j,600);return r})}

function setNotePublic(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Notes',n=>String(n.noteId)===String(b.noteId));if(!ex)throw new Error('Note nahi mila');
  if(s.role!=='admin'&&String(ex.uploadedBy)!==s.userId)throw new Error('Sirf apna note badal sakte ho');
  const on=b.on===true;if(on&&b.original!==true)throw new Error('Pehle confirm karo ki yeh content aapka apna / allowed hai');
  notesCol();setRow('Notes',ex._row,{public:on?'yes':''});pubBust();log(s.userId,on?'note_public':'note_private',ex.noteId);return{ok:true}}))}

// Upload form ke dropdown: kis class mein kaun se subject ke notes daal sakte ho
function noteOptions(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 const mine=s.role==='teacher'?teacherClassIds(s.userId):null;
 return{ok:true,classes:table('Classes').rows.filter(c=>!mine||mine[String(c.classId)]).map(c=>({classId:String(c.classId),name:c.name,subjects:subjectsFor(s,String(c.classId))}))}}

function listNotes(b){
 const s=guard(b,['admin','teacher','student']);if(!s)return DENIED;
 let cid='';
 if(s.role==='student'){const r=find('Students',x=>String(x.studentId)===s.userId&&String(x.status).toLowerCase()==='active');if(!r)return DENIED;cid=String(r.classId)}
 const mine=s.role==='teacher'?teacherClassIds(s.userId):null,want=s.role==='student'?cid:(b.classId?resolveClass(b.classId):'');
 const sn=nameMap('Subjects','subjectId'),cn=nameMap('Classes','classId'),un=nameMap('Users','userId');
 const notes=table('Notes').rows.filter(n=>(!mine||mine[String(n.classId)])&&(!want||String(n.classId)===want)&&(!b.subjectId||String(n.subjectId)===String(b.subjectId)))
  .map(n=>({noteId:String(n.noteId),classId:String(n.classId),className:cn[String(n.classId)]||String(n.classId),subjectId:String(n.subjectId),subject:sn[String(n.subjectId)]||String(n.subjectId),
   chapter:n.chapter,title:n.title,fileId:String(n.fileId),mime:String(n.mime),size:Number(n.size)||0,by:un[String(n.uploadedBy)]||String(n.uploadedBy),date:dstr(n.date),
   isPublic:isPub(n),editable:s.role==='admin'||String(n.uploadedBy)===s.userId}));
 notes.sort((a,c)=>a.subject.localeCompare(c.subject)||a.chapter.localeCompare(c.chapter,undefined,{numeric:true})||(a.date<c.date?1:-1));
 return{ok:true,notes:notes.slice(0,1000)}}

function uploadNote(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{
  const cid=resolveClass(b.classId),sub=clean(b.subjectId,20),chapter=clean(b.chapter,100),title=clean(b.title,120),mime=clean(b.mime,40).toLowerCase(),data=String(b.data||'');
  if(!cid||!canClass(s,cid))throw new Error('Is class ki permission nahi hai');
  const subj=find('Subjects',x=>String(x.subjectId)===sub);if(!subj)throw new Error('Subject chuno');
  if(!teachesSub(s,cid,sub))throw new Error('Aap is class mein yeh subject nahi padhate');
  if(!title)throw new Error('Title zaruri hai');if(!chapter)throw new Error('Chapter zaruri hai');
  if(!NOTE_TYPES[mime])throw new Error('Sirf PDF ya photo (JPG/PNG/WEBP) chalegi');
  if(!data||data.length>NOTE_MAX_BYTES*1.4)throw new Error('File 20 MB se badi hai');
  const root=P.getProperty('NOTES_FOLDER_ID');if(!root)throw new Error('Drive folder set nahi hai. Apps Script mein setupDrive chalao.');
  const bytes=Utilities.base64Decode(data);
  if(bytes.length>NOTE_MAX_BYTES)throw new Error('File 20 MB se badi hai');if(!magicOk(bytes,mime))throw new Error('File ka type galat hai (extension badla hua lagta hai)');
  return withLock(()=>{
   const cls=find('Classes',c=>String(c.classId)===cid),folder=subFolder(subFolder(DriveApp.getFolderById(root),safeName(cls.name)),safeName(subj.name));
   const file=folder.createFile(Utilities.newBlob(bytes,mime,safeName(title)+NOTE_TYPES[mime]));
   try{file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW)}
   catch(e){file.setTrashed(true);throw new Error('Drive sharing allowed nahi hai (Workspace admin ne roka hua hai)')}
   notesCol();const id=nextId('Notes','noteId','NT',4),pub=b.isPublic===true&&b.original===true;
   addRow('Notes',{public:pub?'yes':'',noteId:id,classId:cid,subjectId:sub,chapter,title,fileId:file.getId(),fileName:file.getName(),mime,size:bytes.length,uploadedBy:s.userId,date:todayStr()});
   if(pub)pubBust();log(s.userId,'note_upload',id+' '+cid+' '+sub+(pub?' public':''));return{ok:true,noteId:id}})})}

function updateNote(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Notes',n=>String(n.noteId)===String(b.noteId));if(!ex)throw new Error('Note nahi mila');
  if(s.role!=='admin'&&String(ex.uploadedBy)!==s.userId)throw new Error('Sirf apna note edit kar sakte ho');
  const chapter=clean(b.chapter,100),title=clean(b.title,120);if(!chapter||!title)throw new Error('Title aur chapter zaruri hain');
  notesCol();setRow('Notes',ex._row,{chapter,title});pubBust();return{ok:true}}))}

function deleteNote(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Notes',n=>String(n.noteId)===String(b.noteId));if(!ex)throw new Error('Note nahi mila');
  if(s.role!=='admin'&&String(ex.uploadedBy)!==s.userId)throw new Error('Sirf apna note delete kar sakte ho');
  try{DriveApp.getFileById(String(ex.fileId)).setTrashed(true)}catch(e){}   // Drive trash mein jati hai (wapas laya ja sakta hai)
  tab('Notes').deleteRow(ex._row);pubBust();log(s.userId,'note_delete',ex.noteId);return{ok:true}}))}
