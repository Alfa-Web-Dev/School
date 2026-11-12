// Phase 7: website enquiry form (public, bina login) + admin inbox. Email owner ko jaati hai (ya Settings tab: key notify_email).
const ENQ_STATUS=['new','contacted','closed'];
function enqMail(){
 const st=find('Settings',x=>String(x.key)==='notify_email'),v=st&&clean(st.value,100);
 if(v)return v;try{return Session.getEffectiveUser().getEmail()}catch(e){return ''}}
function enqLimit(key,max,secs){const c=CacheService.getScriptCache(),n=Number(c.get(key)||0);if(n>=max)return false;c.put(key,String(n+1),secs);return true}

function enquiry(b){
 return safe(()=>{
  if(clean(b.website,50))return{ok:true};   // honeypot: bot ko "ok" dikhao, kuch save mat karo
  const name=clean(b.name,60),phone=clean(b.phone,15).replace(/[\s\-()]/g,''),msg=clean(b.message,600);
  if(name.length<2)throw new Error('Naam likhiye');
  if(!/^\+?\d{8,14}$/.test(phone))throw new Error('Sahi phone number likhiye');
  if(msg.length<3)throw new Error('Message likhiye');
  if(!enqLimit('enq_all',40,3600)||!enqLimit('enq_'+phone,3,3600))throw new Error('Bahut zyada requests. Thodi der baad try karein');
  const id=withLock(()=>{const i=nextId('Enquiries','id','Q',4);addRow('Enquiries',{id:i,name,phone,message:msg,time:new Date(),status:'new'});return i});
  log('public','enquiry',id);
  try{const to=enqMail();if(to)MailApp.sendEmail({to,subject:'New enquiry '+id+': '+name,body:'Name: '+name+'\nPhone: '+phone+'\n\n'+msg+'\n\n(Admin panel > Enquiries mein dekhein)'})}catch(e){log('system','enquiry_mail_fail',String(e.message||e).slice(0,100))}
  return{ok:true}})}

function enqTime(t){if(t instanceof Date)return Utilities.formatDate(t,'Asia/Kolkata','yyyy-MM-dd HH:mm');return String(t||'')}
function listEnquiries(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>{const rows=table('Enquiries').rows.map(r=>({id:String(r.id),name:String(r.name),phone:String(r.phone),message:String(r.message),time:enqTime(r.time),status:String(r.status)||'new'}));
  rows.sort((a,b)=>a.id<b.id?1:-1);return{ok:true,enquiries:rows.slice(0,500),newCount:rows.filter(r=>r.status==='new').length}})}
function updateEnquiry(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const r=find('Enquiries',x=>String(x.id)===String(b.id));if(!r)throw new Error('Enquiry nahi mili');
  if(b.delete){tab('Enquiries').deleteRow(r._row);log(s.userId,'enquiry_delete',r.id);return{ok:true}}
  if(ENQ_STATUS.indexOf(b.status)<0)throw new Error('Status galat hai');
  setRow('Enquiries',r._row,{status:b.status});log(s.userId,'enquiry_'+b.status,r.id);return{ok:true}}))}
