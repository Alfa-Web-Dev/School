// Phase 9: Activity log + Backup (admin)
async function initLogs(){
 const m=$('#main');m.innerHTML='';const box=el('div'),q=el('input',{placeholder:'Search (user, action, details)'}),note=el('p',{class:'mu'});
 async function load(){const r=await call('listLogs',{q:q.value});box.innerHTML='';note.textContent=r.total+' entries (latest 300 dikh rahi hain)';
  box.append(tableEl([{h:'Time',f:l=>l.time},{h:'User',f:l=>l.userId},{h:'Action',f:l=>l.action},{h:'Details',f:l=>l.details}],r.logs,'No logs'))}
 let t;q.oninput=()=>{clearTimeout(t);t=setTimeout(()=>load().catch(e=>toast(e.message,1)),350)};
 m.append(el('h1',{'data-i':'n_logs'}),el('div',{class:'bar'},btn('Take backup now',async()=>{try{const r=await call('backupNow');toast('Backup created: '+r.name)}catch(e){toast(e.message,1)}},false),q),
  el('p',{class:'mu'},'Backups go to the "School Backups" folder in Google Drive (the latest 14 are kept). For a daily night auto-backup, run enableAutoBackup once in Apps Script.'),note,box);
 await load();applyI18n()}
