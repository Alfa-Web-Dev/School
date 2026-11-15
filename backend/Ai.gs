// AI assistant on/off + naam (Settings sheet: ai_enabled = on/off, ai_name). Sab roles padh sakte hain, sirf admin badal sakta hai.
function aiRead(){const g=k=>{const r=find('Settings',x=>String(x.key)===k);return r?String(r.value):''};
 const en=g('ai_enabled').toLowerCase();return{on:en!=='off',name:clean(g('ai_name'),20)||'Tuto'}}
function aiGet(b){
 const s=guard(b,['admin','teacher','student']);if(!s)return DENIED;
 return safe(()=>Object.assign({ok:true},aiRead()))}
function aiSave(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const put=(k,v)=>{const r=find('Settings',x=>String(x.key)===k);if(r)setRow('Settings',r._row,{key:k,value:v});else addRow('Settings',{key:k,value:v})};
  put('ai_enabled',b.on===false||b.on==='off'?'off':'on');
  const nm=clean(b.name,20);if(nm)put('ai_name',nm);
  log(s.userId,'ai_settings',b.on===false?'off':'on');return Object.assign({ok:true},aiRead())}))}
