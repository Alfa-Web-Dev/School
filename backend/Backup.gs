// Backup: poori Sheet ki copy Drive ke "School Backups" folder mein. Purani copies (14 se zyada) trash ho jaati hain.
const BACKUP_KEEP=14;
function runBackup(by){
 const ss=SpreadsheetApp.getActive(),it=DriveApp.getFoldersByName('School Backups'),dir=it.hasNext()?it.next():DriveApp.createFolder('School Backups');
 const name=ss.getName()+' backup '+Utilities.formatDate(new Date(),'Asia/Kolkata','yyyy-MM-dd HH:mm');
 const f=DriveApp.getFileById(ss.getId()).makeCopy(name,dir);
 const files=[],all=dir.getFiles();while(all.hasNext())files.push(all.next());
 files.sort((a,b)=>b.getDateCreated()-a.getDateCreated());
 let removed=0;files.slice(BACKUP_KEEP).forEach(x=>{x.setTrashed(true);removed++});
 log(by,'backup',name+(removed?' (purani '+removed+' hataai)':''));
 return{name,url:f.getUrl(),removed,kept:Math.min(files.length,BACKUP_KEEP)}}
function backupNow(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>Object.assign({ok:true},runBackup(s.userId)))}
function autoBackup(){try{runBackup('system')}catch(e){log('system','backup_fail',String(e.message||e).slice(0,120))}}
// Editor mein ek baar chalao: roz raat auto backup
function enableAutoBackup(){
 if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='autoBackup'))ScriptApp.newTrigger('autoBackup').timeBased().atHour(2).everyDays(1).create();
 runBackup('system')}
