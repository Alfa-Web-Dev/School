try{if(CFG.color)document.documentElement.style.setProperty('--c',CFG.color)}catch(e){}
const SK='sp_token';
async function api(action,data={}){
 const r=await fetch(CFG.api,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
  body:JSON.stringify({action,token:sessionStorage.getItem(SK),...data})});
 return r.json()}
