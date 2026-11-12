// Phase 9: Activity log + Backup (admin)
async function initLogs(){
 const m=$('#main');m.innerHTML='';const box=el('div'),q=el('input',{placeholder:'Search (user, action, details)'}),note=el('p',{class:'mu'});
 async function load(){const r=await call('listLogs',{q:q.value});box.innerHTML='';note.textContent=r.total+' entries (latest 300 dikh rahi hain)';
  box.append(tableEl([{h:'Time',f:l=>l.time},{h:'User',f:l=>l.userId},{h:'Action',f:l=>l.action},{h:'Details',f:l=>l.details}],r.logs,'Koi log nahi'))}
 let t;q.oninput=()=>{clearTimeout(t);t=setTimeout(()=>load().catch(e=>toast(e.message,1)),350)};
 m.append(el('h1',{'data-i':'n_logs'}),el('div',{class:'bar'},btn('Backup abhi lo',async()=>{try{const r=await call('backupNow');toast('Backup ban gaya: '+r.name)}catch(e){toast(e.message,1)}},false),q),
  el('p',{class:'mu'},'Backup Google Drive ke "School Backups" folder mein jaata hai (aakhri 14 rakhe jaate hain). Roz raat auto backup ke liye Apps Script mein ek baar enableAutoBackup chalao.'),note,box);
 await load();applyI18n()}
