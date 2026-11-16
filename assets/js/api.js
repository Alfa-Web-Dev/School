try{if(CFG.color)document.documentElement.style.setProperty('--c',CFG.color)}catch(e){}
const SK='sp_token';
// Login 30 din tak yaad rahta hai (localStorage). Server bhi 30 din ka token deta hai.
const TOK={
 get(){try{const t=localStorage.getItem(SK),x=+localStorage.getItem(SK+'_exp');if(t){if(x&&x<Date.now()){TOK.clear();return null}return t}}catch(e){}return sessionStorage.getItem(SK)},
 set(t){try{localStorage.removeItem('sp_shell')}catch(e){}try{localStorage.setItem(SK,t);localStorage.setItem(SK+'_exp',String(Date.now()+30*864e5))}catch(e){sessionStorage.setItem(SK,t)}},
 clear(){try{localStorage.removeItem('sp_shell');localStorage.removeItem(SK);localStorage.removeItem(SK+'_exp')}catch(e){}try{sessionStorage.clear()}catch(e){}}};
window.__pend=0;
async function api(action,data={}){
 __pend++;
 if(!window.__skOnce&&/^(list|get|my|teacherHome|studentFees|defaulters|noteOptions|adminExams|reportCard|dashboard|adminHome)/.test(action)){const m=document.getElementById('main');if(m&&!document.getElementById('skm')){window.__skOnce=1;const k=document.createElement('div');k.id='skm';k.className='sk-m skp';k.innerHTML='<div class="sk-g"><i class="sk"></i><i class="sk"></i><i class="sk"></i><i class="sk"></i></div><i class="sk sk-w"></i><i class="sk sk-w"></i>';m.append(k);window.__skDone=()=>{if(!window.__pend){const x=document.getElementById('skm');if(x)x.remove()}};setTimeout(()=>{const x=document.getElementById('skm');if(x)x.remove()},12000)}}
 try{const r=await fetch(CFG.api,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
  body:JSON.stringify({action,token:TOK.get(),...data})});
 return await r.json()}
 finally{__pend--;if(!__pend&&window.__skDone)setTimeout(window.__skDone,60)}}
