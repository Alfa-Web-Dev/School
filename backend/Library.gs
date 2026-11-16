// Notes library (Phase 6a): file Google Drive mein, list Sheet ke "Notes" tab mein.
// Folder: School Notes / <Class> / <Subject> /. File "anyone with link can view" hoti hai; list sirf login wale ko milti hai.
const NOTE_MAX_BYTES=20*1024*1024,NOTE_TYPES={'application/pdf':'.pdf','image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp'};
function magicOk(b,mime){const u=i=>b[i]&255;
 if(mime==='application/pdf')return u(0)===0x25&&u(1)===0x50&&u(2)===0x44&&u(3)===0x46;
 if(mime==='image/jpeg')return u(0)===0xFF&&u(1)===0xD8;
 if(mime==='image/png')return u(0)===0x89&&u(1)===0x50&&u(2)===0x4E&&u(3)===0x47;
 if(mime==='image/webp')return u(0)===0x52&&u(1)===0x49&&u(2)===0x46&&u(3)===0x46;return false}
function subFolder(parent,name){const it=parent.getFoldersByName(name);return it.hasNext()?it.next():parent.createFolder(name)}
const NOTE_CATS=['short','chapter','pyq','sample','ref','mag','syll','work','other'];
// Purani Notes sheet mein 'category' column na ho to ek baar header daal do
function ensureNoteCat(){const t=tab('Notes');if(String(t.getRange(1,11).getValue())!=='category')t.getRange(1,11).setValue('category').setFontWeight('bold')}
const safeName=s=>String(s).replace(/[\\/:*?"<>|\r\n]+/g,' ').replace(/\s+/g,' ').trim().slice(0,60)||'note';

// Upload form ke dropdown: kis class mein kaun se subject ke notes daal sakte ho
function noteOptions(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 const mine=s.role==='teacher'?teacherClassIds(s.userId):null;
 return{ok:true,classes:table('Classes').rows.filter(c=>!mine||mine[String(c.classId)]).map(c=>({classId:String(c.classId),name:c.name,subjects:subjectsFor(s,String(c.classId))}))}}

function listNotes(b){
 const s=guard(b,['admin','teacher','student']);if(!s)return DENIED;
 ensureNoteCat();
 let cid='';
 if(s.role==='student'){const r=find('Students',x=>String(x.studentId)===s.userId&&String(x.status).toLowerCase()==='active');if(!r)return DENIED;cid=String(r.classId)}
 const mine=s.role==='teacher'?teacherClassIds(s.userId):null,want=s.role==='student'?cid:(b.classId?resolveClass(b.classId):'');
 const sn=nameMap('Subjects','subjectId'),cn=nameMap('Classes','classId'),un=nameMap('Users','userId');
 const notes=table('Notes').rows.filter(n=>(!mine||mine[String(n.classId)])&&(!want||String(n.classId)===want)&&(!b.subjectId||String(n.subjectId)===String(b.subjectId)))
  .map(n=>({noteId:String(n.noteId),classId:String(n.classId),className:cn[String(n.classId)]||String(n.classId),subjectId:String(n.subjectId),subject:sn[String(n.subjectId)]||String(n.subjectId),
   chapter:n.chapter,category:NOTE_CATS.indexOf(String(n.category))>=0?String(n.category):'chapter',title:n.title,fileId:String(n.fileId),mime:String(n.mime),size:Number(n.size)||0,by:un[String(n.uploadedBy)]||String(n.uploadedBy),date:dstr(n.date),
   editable:s.role==='admin'||String(n.uploadedBy)===s.userId}));
 notes.sort((a,c)=>a.subject.localeCompare(c.subject)||a.chapter.localeCompare(c.chapter,undefined,{numeric:true})||(a.date<c.date?1:-1));
 return{ok:true,notes:notes.slice(0,1000)}}

function uploadNote(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{
  const cid=resolveClass(b.classId),sub=clean(b.subjectId,20),chapter=clean(b.chapter,100)||'General',category=clean(b.category,12),title=clean(b.title,120),mime=clean(b.mime,40).toLowerCase(),data=String(b.data||'');
  if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
  const subj=find('Subjects',x=>String(x.subjectId)===sub);if(!subj)throw new Error('Select a subject');
  if(!teachesSub(s,cid,sub))throw new Error('You do not teach this subject in this class');
  if(!title)throw new Error('Title is required');if(NOTE_CATS.indexOf(category)<0)throw new Error('Choose a section (category)');ensureNoteCat();
  if(!NOTE_TYPES[mime])throw new Error('Only PDF or photo (JPG/PNG/WEBP) is allowed');
  if(!data||data.length>NOTE_MAX_BYTES*1.4)throw new Error('File is larger than 20 MB');
  const root=P.getProperty('NOTES_FOLDER_ID');if(!root)throw new Error('Drive folder is not set. Run setupDrive in Apps Script.');
  const bytes=Utilities.base64Decode(data);
  if(bytes.length>NOTE_MAX_BYTES)throw new Error('File is larger than 20 MB');if(!magicOk(bytes,mime))throw new Error('Invalid file type (the extension seems changed)');
  return withLock(()=>{
   const cls=find('Classes',c=>String(c.classId)===cid),folder=subFolder(subFolder(DriveApp.getFolderById(root),safeName(cls.name)),safeName(subj.name));
   const file=folder.createFile(Utilities.newBlob(bytes,mime,safeName(title)+NOTE_TYPES[mime]));
   try{file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW)}
   catch(e){file.setTrashed(true);throw new Error('Drive sharing is not allowed (blocked by the Workspace admin)')}
   const id=nextId('Notes','noteId','NT',4);
   addRow('Notes',{noteId:id,classId:cid,subjectId:sub,chapter,title,fileId:file.getId(),fileName:file.getName(),mime,size:bytes.length,uploadedBy:s.userId,date:todayStr(),category});
   log(s.userId,'note_upload',id+' '+cid+' '+sub);return{ok:true,noteId:id}})})}

function updateNote(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Notes',n=>String(n.noteId)===String(b.noteId));if(!ex)throw new Error('Note not found');
  if(s.role!=='admin'&&String(ex.uploadedBy)!==s.userId)throw new Error('You can edit only your own note');
  const chapter=clean(b.chapter,100)||'General',title=clean(b.title,120),category=clean(b.category,12);if(!title)throw new Error('Title is required');if(NOTE_CATS.indexOf(category)<0)throw new Error('Choose a section');ensureNoteCat();
  setRow('Notes',ex._row,{chapter,title,category});return{ok:true}}))}

function deleteNote(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const ex=find('Notes',n=>String(n.noteId)===String(b.noteId));if(!ex)throw new Error('Note not found');
  if(s.role!=='admin'&&String(ex.uploadedBy)!==s.userId)throw new Error('You can delete only your own note');
  try{DriveApp.getFileById(String(ex.fileId)).setTrashed(true)}catch(e){}   // Drive trash mein jati hai (wapas laya ja sakta hai)
  tab('Notes').deleteRow(ex._row);log(s.userId,'note_delete',ex.noteId);return{ok:true}}))}
