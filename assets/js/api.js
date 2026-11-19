try{if(CFG.color)document.documentElement.style.setProperty('--c',CFG.color)}catch(e){}
const SK='sp_token';
// Login 30 din tak yaad rahta hai (localStorage). Server bhi 30 din ka token deta hai.
const TOK={
 get(){try{const t=localStorage.getItem(SK),x=+localStorage.getItem(SK+'_exp');if(t){if(x&&x<Date.now()){TOK.clear();return null}return t}}catch(e){}return sessionStorage.getItem(SK)},
 set(t){try{localStorage.removeItem('sp_shell')}catch(e){}try{localStorage.setItem(SK,t);localStorage.setItem(SK+'_exp',String(Date.now()+30*864e5))}catch(e){sessionStorage.setItem(SK,t)}},
 clear(){try{localStorage.removeItem('sp_shell');localStorage.removeItem(SK);localStorage.removeItem(SK+'_exp')}catch(e){}try{sessionStorage.clear()}catch(e){}}};
window.__pend=0;
const READ_RE=/^(list|get|my|view|search|find|load|check|teacherHome|studentFees|defaulters|noteOptions|adminExams|reportCard|dashboard|adminHome|testResults|attemptDetail|attemptReview|violationPhoto|me$)/;
async function api(action,data={}){
 __pend++;
 if(!window.__skOnce&&/^(list|get|my|teacherHome|studentFees|defaulters|noteOptions|adminExams|reportCard|dashboard|adminHome)/.test(action)){const m=document.getElementById('main');if(m&&!document.getElementById('skm')){window.__skOnce=1;const k=document.createElement('div');k.id='skm';k.className='sk-m skp';k.innerHTML='<div class="sk-g"><i class="sk"></i><i class="sk"></i><i class="sk"></i><i class="sk"></i></div><i class="sk sk-w"></i><i class="sk sk-w"></i>';m.append(k);window.__skDone=()=>{if(!window.__pend){const x=document.getElementById('skm');if(x)x.remove()}};setTimeout(()=>{const x=document.getElementById('skm');if(x)x.remove()},12000)}}
 try{return await trackNet(fetch(CFG.api,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
  body:JSON.stringify({action,token:TOK.get(),...data})}).then(r=>r.json()),!READ_RE.test(action))}
 finally{__pend--;if(!__pend&&window.__skDone)setTimeout(window.__skDone,60)}}

/* ---- Button feedback + double-click protection (works for every button, every page) ---- */
(function(){
 const NOLOCK='.cn,.dchip,.ctab,.seg,.tg,.chip,.tab,nav,.xos,.xp,.xnav,.avg,.umenu,#aib,.aih,.mg,.roles,.tabsb';
 const LB=[[/upload/i,'Uploading…','Uploaded ✓'],[/publish|push|go live/i,'Publishing…','Published ✓'],[/delete|remove|clean/i,'Deleting…','Deleted ✓'],[/import/i,'Importing…','Imported ✓'],[/send|notify|remind/i,'Sending…','Sent ✓'],[/submit|finish/i,'Submitting…','Submitted ✓'],[/log ?in|sign in/i,'Signing in…','Signed in ✓'],[/start|begin|resume/i,'Starting…','Started ✓'],[/backup/i,'Backing up…','Backup done ✓'],[/add|create|new|\+/i,'Adding…','Added ✓'],[/save|update|apply|confirm|mark|set|pay|collect|approve|reset|retake|allow|assign|change|copy|promote/i,'Saving…','Saved ✓']];
 const B={el:null,t:0};
 const on=(b,mut)=>{if(b.classList.contains('busy'))return;b.classList.add('busy');
  if(mut&&!b.children.length){const t=b.textContent.trim(),m=LB.find(x=>x[0].test(t))||[0,'Please wait…','Done ✓'];b.__lab={orig:b.innerHTML,busy:m[1],done:m[2]};b.textContent=m[1]}};
 const off=(b,ok)=>{clearTimeout(b.__w);b.classList.remove('busy');const l=b.__lab;b.__lab=null;b.__n=0;
  if(l&&b.textContent===l.busy){if(ok&&b.__mut){b.textContent=l.done;b.classList.add('done');setTimeout(()=>{b.classList.remove('done');if(b.textContent===l.done)b.innerHTML=l.orig},1300)}else b.innerHTML=l.orig}b.__mut=0};
 document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('button');if(!b)return;
  if(b.classList.contains('busy')){e.preventDefault();e.stopImmediatePropagation();return}
  if(b.closest(NOLOCK)){B.el=null;return}
  const n=Date.now();if(b.__ck&&n-b.__ck<700){e.preventDefault();e.stopImmediatePropagation();return}b.__ck=n;
  B.el=b;B.t=n;const t=b.textContent.trim();
  if(LB.some(x=>x[0].test(t))&&t.length<30){b.__mut=1;b.__n=0;on(b,1);const long=/upload|import|publish|push|backup/i.test(t);
   b.__w=setTimeout(()=>{if(!b.__n)off(b,0)},long?25000:900)}},true);
 window.btnFail=()=>{const b=B.el;if(b&&b.classList.contains('busy')&&!b.__n)off(b,0)};
 window.btnHold=function(p){const b=B.el&&document.contains(B.el)&&Date.now()-B.t<25000?B.el:null;if(!b)return p;const t0=Date.now();b.__n=(b.__n||0)+1;b.__mut=1;clearTimeout(b.__w);on(b,1);
  return p.finally(()=>{b.__n--;setTimeout(()=>{if(!b.__n){off(b,!((window.__tb||0)>t0))}},300)})};
 window.trackNet=function(p,mut){const b=B.el&&document.contains(B.el)&&Date.now()-B.t<25000?B.el:null;if(!b)return p;
  b.__n=(b.__n||0)+1;if(mut)b.__mut=1;clearTimeout(b.__w);on(b,mut);let bad=0;
  return p.then(r=>{if(r&&r.ok===false)bad=1;return r},e=>{bad=1;throw e}).finally(()=>{b.__n--;b.__bad=b.__bad||bad;setTimeout(()=>{if(!b.__n){const x=b.__bad;b.__bad=0;off(b,!x)}},300)})}
})();
