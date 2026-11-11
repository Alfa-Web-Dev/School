// Core: sab modules ke common helpers (guard, lock, row read/write, id aur PIN banana)
const DENIED={ok:false,error:'Not allowed'};
const clean=(v,n)=>String(v==null?'':v).trim().slice(0,n||200);
const guard=(b,roles)=>session(b.token,roles);
function safe(fn){try{return fn()}catch(e){return{ok:false,error:String(e&&e.message||e)}}}
function withLock(fn){const l=LockService.getScriptLock();l.waitLock(20000);try{return fn()}finally{l.releaseLock()}}
function addRow(n,o){tab(n).appendRow(SCHEMA[n].map(k=>o[k]!==undefined?o[k]:''))}
function setRow(n,row,o){const h=SCHEMA[n],r=tab(n).getRange(row,1,1,h.length),cur=r.getValues()[0];
 r.setValues([h.map((k,i)=>o[k]!==undefined?o[k]:cur[i])])}
function nextId(n,col,prefix,pad){let m=0;
 table(n).rows.forEach(r=>{const x=String(r[col]);if(x.indexOf(prefix)===0){const v=parseInt(x.slice(prefix.length),10);if(v>m)m=v}});
 return prefix+String(m+1).padStart(pad,'0')}
function genPin(){return String(Math.floor(1000+Math.random()*9000))}
function genPassword(){const a='abcdefghjkmnpqrstuvwxyz23456789';let s='';for(let i=0;i<8;i++)s+=a[Math.floor(Math.random()*a.length)];return s}
function strip(o,keys){const c=Object.assign({},o);keys.concat(['_row']).forEach(k=>delete c[k]);return c}
function revokeTokens(userId){const s=tab('Tokens'),v=s.getDataRange().getValues();
 for(let i=v.length-1;i>=1;i--)if(String(v[i][1])===String(userId))s.deleteRow(i+1)}
function resolveClass(v){const x=clean(v,40).toLowerCase();
 const r=table('Classes').rows.find(c=>String(c.classId).toLowerCase()===x||String(c.name).toLowerCase()===x);
 return r?String(r.classId):''}
function teacherClassIds(uid){const ids={};
 table('Classes').rows.forEach(c=>{if(String(c.classTeacherId)===uid)ids[String(c.classId)]=1});
 table('Lessons').rows.forEach(l=>{if(String(l.teacherId)===uid)ids[String(l.classId)]=1});
 return ids}
