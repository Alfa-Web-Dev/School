const SESSION_HOURS=6,MAX_FAILS=5,LOCK_SEC=900;
const sha=s=>Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s,Utilities.Charset.UTF_8).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');
const newSalt=()=>Utilities.getUuid().replace(/-/g,'');
const hashSecret=(secret,salt)=>sha(salt+'|'+P.getProperty('PEPPER')+'|'+secret);
function setSecretFields(secret){const salt=newSalt();return{salt,hash:hashSecret(secret,salt)}}

function lookup(role,id){
 const lc=String(id).toLowerCase(),on=v=>v===true||String(v).toUpperCase()==='TRUE';
 if(role==='admin'||role==='teacher'){
  const r=find('Users',r=>String(r.userId).toLowerCase()===lc&&r.role===role);
  return r&&{userId:String(r.userId),name:r.name,role,salt:String(r.salt),hash:String(r.passHash),active:on(r.active)}}
 if(role==='student'){
  const r=find('Students',r=>String(r.studentId).toLowerCase()===lc);
  return r&&{userId:String(r.studentId),name:r.name,role,salt:String(r.salt),hash:String(r.pinHash),active:String(r.status).toLowerCase()==='active'}}
 if(role==='parent'){
  const r=find('Parents',r=>String(r.parentId).toLowerCase()===lc||String(r.phone).trim()===String(id).trim());
  return r&&{userId:String(r.parentId),name:r.name,role,salt:String(r.salt),hash:String(r.pinHash),active:true}}
 return null}

function login(b){
 const role=String(b.role||''),id=String(b.id||'').trim(),secret=String(b.secret||'');
 const key='fail:'+role+':'+id.toLowerCase(),cache=CacheService.getScriptCache();
 if(Number(cache.get(key)||0)>=MAX_FAILS)return{ok:false,error:'Bahut galat koshish. 15 minute baad try karo.'};
 const u=lookup(role,id);
 if(!(u&&u.active&&hashSecret(secret,u.salt)===u.hash)){
  cache.put(key,String(Number(cache.get(key)||0)+1),LOCK_SEC);
  log(id,'login_fail',role);Utilities.sleep(800);
  return{ok:false,error:'ID ya password galat hai.'}}
 cache.remove(key);
 const token=Utilities.getUuid()+newSalt();
 tab('Tokens').appendRow([sha(token),u.userId,u.role,Date.now()+SESSION_HOURS*3600000]);
 log(u.userId,'login',role);
 return{ok:true,token,user:{userId:u.userId,name:u.name,role:u.role}}}

// Doosre modules yahi use karenge: const s=session(b.token,['admin']); if(!s) return denied
function session(token,roles){
 if(!token)return null;
 const r=find('Tokens',r=>String(r.tokenHash)===sha(String(token)));
 if(!r||Number(r.expires)<Date.now())return null;
 if(roles&&roles.indexOf(r.role)<0)return null;
 return{userId:String(r.userId),role:r.role}}

function me(b){
 const s=session(b.token);if(!s)return{ok:false,error:'expired'};
 const u=lookup(s.role,s.userId);
 return{ok:true,user:{userId:s.userId,role:s.role,name:u?u.name:''}}}

function logout(b){
 if(!b.token)return{ok:true};
 const r=find('Tokens',r=>String(r.tokenHash)===sha(String(b.token)));
 if(r)tab('Tokens').deleteRow(r._row);
 return{ok:true}}

function cleanTokens(){
 const s=tab('Tokens'),v=s.getDataRange().getValues(),now=Date.now();
 for(let i=v.length-1;i>=1;i--)if(Number(v[i][3])<now)s.deleteRow(i+1)}
