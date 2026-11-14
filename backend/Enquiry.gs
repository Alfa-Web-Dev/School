// Phase 7: website enquiry form (public, bina login) + admin inbox. Email owner ko jaati hai (ya Settings tab: key notify_email).
const ENQ_STATUS=['new','contacted','closed'];
function enqMail(){
 const st=find('Settings',x=>String(x.key)==='notify_email'),v=st&&clean(st.value,100);
 if(v)return v;try{return Session.getEffectiveUser().getEmail()}catch(e){return ''}}
function enqLimit(key,max,secs){const c=CacheService.getScriptCache(),n=Number(c.get(key)||0);if(n>=max)return false;c.put(key,String(n+1),secs);return true}

// Purane sheet mein 7-10 columns (type, role, email, details) apne aap jud jate hain.
function enqCols(){const sh=tab('Enquiries'),add=['type','role','email','details'],h=sh.getRange(1,7,1,4).getValues()[0];add.forEach((k,i)=>{if(String(h[i])!==k)sh.getRange(1,7+i).setValue(k)})}
const ENQ_TYPES={admission:'Admission enquiry',complaint:'Complaint',review:'Review',general:'Question'},ENQ_ROLES=['parent','student','teacher','visitor','alumni'];
const ENQ_DETAIL={admission:['child','cls'],complaint:['cat','cls','urgent'],review:['rating','title','show'],general:['topic']};
function enquiry(b){
 return safe(()=>{
  if(clean(b.website,50))return{ok:true};   // honeypot: bot ko "ok" dikhao, kuch save mat karo
  const type=ENQ_TYPES[b.type]?b.type:'admission',role=ENQ_ROLES.indexOf(b.role)>=0?b.role:'visitor';
  const name=clean(b.name,60),phone=clean(b.phone,15).replace(/[\s\-()]/g,''),email=clean(b.email,80),msg=clean(b.message,1000);
  if(name.length<2)throw new Error('Naam likhiye');
  if((phone||type!=='review')&&!/^\+?\d{8,14}$/.test(phone))throw new Error('Sahi phone number likhiye');
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))throw new Error('Sahi email likhiye');
  if(msg.length<3&&type!=='admission')throw new Error('Message likhiye');
  const d={};(ENQ_DETAIL[type]||[]).forEach(k=>{const v=clean(b.details&&b.details[k],120);if(v)d[k]=v});
  if(type==='review'){const r=parseInt(d.rating,10);if(!(r>=1&&r<=5))throw new Error('Rating (stars) chuniye');d.rating=String(r)}
  if(!enqLimit('enq_all',60,3600)||!enqLimit('enq_'+(phone||email||name),3,3600))throw new Error('Bahut zyada requests. Thodi der baad try karein');
  const details=JSON.stringify(d);
  const id=withLock(()=>{enqCols();const i=nextId('Enquiries','id','Q',4);addRow('Enquiries',{id:i,name,phone,message:msg,time:new Date(),status:'new',type,role,email,details});return i});
  log('public','enquiry_'+type,id);
  try{const to=enqMail();if(to)MailApp.sendEmail({to,subject:'['+ENQ_TYPES[type]+'] '+id+': '+name,body:'Type: '+ENQ_TYPES[type]+'\nFrom: '+role+'\nName: '+name+'\nPhone: '+phone+'\nEmail: '+email+'\nDetails: '+Object.keys(d).map(k=>k+'='+d[k]).join(', ')+'\n\n'+msg+'\n\n(Admin panel > Enquiries mein dekhein)'})}catch(e){log('system','enquiry_mail_fail',String(e.message||e).slice(0,100))}
  return{ok:true}})}

function enqTime(t){if(t instanceof Date)return Utilities.formatDate(t,'Asia/Kolkata','yyyy-MM-dd HH:mm');return String(t||'')}
function listEnquiries(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>{const rows=table('Enquiries').rows.map(r=>{let d={};try{d=JSON.parse(String(r.details||'{}'))}catch(e){}return{id:String(r.id),name:String(r.name),phone:String(r.phone),message:String(r.message),time:enqTime(r.time),status:String(r.status)||'new',type:ENQ_TYPES[r.type]?String(r.type):'admission',role:String(r.role||''),email:String(r.email||''),details:d}});
  rows.sort((a,b)=>a.id<b.id?1:-1);return{ok:true,enquiries:rows.slice(0,500),newCount:rows.filter(r=>r.status==='new').length}})}
function updateEnquiry(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const r=find('Enquiries',x=>String(x.id)===String(b.id));if(!r)throw new Error('Enquiry nahi mili');
  if(b.delete){tab('Enquiries').deleteRow(r._row);log(s.userId,'enquiry_delete',r.id);return{ok:true}}
  if(ENQ_STATUS.indexOf(b.status)<0)throw new Error('Status galat hai');
  enqCols();setRow('Enquiries',r._row,{status:b.status});log(s.userId,'enquiry_'+b.status,r.id);return{ok:true}}))}
