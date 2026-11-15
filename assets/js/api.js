try{if(CFG.color)document.documentElement.style.setProperty('--c',CFG.color)}catch(e){}
const SK='sp_token';
// Login 30 din tak yaad rahta hai (localStorage). Server bhi 30 din ka token deta hai.
const TOK={
 get(){try{const t=localStorage.getItem(SK),x=+localStorage.getItem(SK+'_exp');if(t){if(x&&x<Date.now()){TOK.clear();return null}return t}}catch(e){}return sessionStorage.getItem(SK)},
 set(t){try{localStorage.setItem(SK,t);localStorage.setItem(SK+'_exp',String(Date.now()+30*864e5))}catch(e){sessionStorage.setItem(SK,t)}},
 clear(){try{localStorage.removeItem(SK);localStorage.removeItem(SK+'_exp')}catch(e){}try{sessionStorage.clear()}catch(e){}}};
async function api(action,data={}){
 const r=await fetch(CFG.api,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
  body:JSON.stringify({action,token:TOK.get(),...data})});
 return r.json()}
