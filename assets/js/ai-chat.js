// Floating AI helper for all three panels. Default engine = free key-less OpenAI-compatible endpoint (no key stored in the repo).
// Admin can switch it off in Settings (Settings sheet: ai_enabled). Optional override in config.js: CFG.ai={endpoint,model,apiKey}.
(function(){
const DEF={endpoint:'https://text.pollinations.ai/openai',model:'openai'};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function md(t){let h=esc(t);h=h.replace(/```([\s\S]*?)```/g,(m,c)=>'<pre>'+c.trim()+'</pre>').replace(/`([^`\n]+)`/g,'<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g,'<b>$1</b>').replace(/^#{1,4}\s*(.+)$/gm,'<b>$1</b>');
 h=h.replace(/(?:^|\n)((?:[-*•]\s+.+\n?)+)/g,(m,b)=>'<ul>'+b.trim().split('\n').map(l=>'<li>'+l.replace(/^[-*•]\s+/,'')+'</li>').join('')+'</ul>');
 h=h.replace(/(?:^|\n)((?:\d+[.)]\s+.+\n?)+)/g,(m,b)=>'<ol>'+b.trim().split('\n').map(l=>'<li>'+l.replace(/^\d+[.)]\s+/,'')+'</li>').join('')+'</ol>');
 return h.replace(/\n{2,}/g,'<br><br>').replace(/\n/g,'<br>').replace(/<br>(<\/?(ul|ol|pre))/g,'$1').replace(/(<\/(ul|ol|pre)>)<br>/g,'$1')}
const ROLE={
 student:{hi:'Ask me your doubts',chips:['Explain photosynthesis simply','Help me with fractions','Give me a study plan for exams'],
  sys:'You are a friendly, patient study helper for a school student. Explain concepts step by step in simple words with small examples. For homework, guide the student to the answer instead of just giving it. Keep answers short. Be safe and age-appropriate; politely decline anything unrelated to learning or unsafe.'},
 teacher:{hi:'How can I help you teach?',chips:['Make a lesson plan on fractions','Write 5 MCQs on the water cycle','Draft a note to parents'],
  sys:'You are an assistant for school teachers. Help with lesson plans, question papers, rubrics, classroom ideas and parent communication. Be practical and concise.'},
 admin:{hi:'How can I help you run the school?',chips:['Draft a holiday notice','Write a fee reminder message','Ideas to improve attendance'],
  sys:'You are an assistant for a school administrator. Help draft notices, circulars, emails and messages, policies and plans. Be professional, practical and concise.'}};
let hist=[],busy=false,ctl=null;
window.initAI=async function(role,u){
 if(document.getElementById('aib'))return;
 let cfg=null;try{cfg=JSON.parse(sessionStorage.getItem('ai_cfg')||'null');if(cfg&&Date.now()-cfg.t>300000)cfg=null}catch(e){}
 if(!cfg){try{const r=await call('aiGet');cfg={on:r.on,name:r.name,t:Date.now()};sessionStorage.setItem('ai_cfg',JSON.stringify(cfg))}catch(e){cfg={on:true,name:'Tuto',t:Date.now()}}}
 if(!cfg.on)return;
 const R=ROLE[role]||ROLE.student,name=cfg.name||'Tuto',first=String(u.name||'').split(' ')[0];
 const key='ai_h_'+role;try{hist=JSON.parse(sessionStorage.getItem(key)||'[]')}catch(e){hist=[]}
 const b=document.createElement('button');b.id='aib';b.type='button';b.setAttribute('aria-label',name+' AI');
 b.innerHTML='<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>';
 const w=document.createElement('div');w.id='aiw';w.hidden=true;
 w.innerHTML='<div class="aih"><span class="aix">✦</span><div><b>'+esc(name)+'</b><small>AI study & school helper</small></div><button type="button" id="aic" aria-label="Clear chat" title="New chat">↺</button><button type="button" id="aix" aria-label="Close">×</button></div><div id="aim"></div><form id="aif"><textarea id="ait" rows="1" maxlength="800" placeholder="Type your question…"></textarea><button type="submit" id="ais" aria-label="Send"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 20l18-8L3 4v6l12 2-12 2z"/></svg></button></form><div class="aif">AI can make mistakes. Check important things.</div>';
 document.body.append(b,w);
 const M=w.querySelector('#aim'),T=w.querySelector('#ait');
 const add=(r,t)=>{const d=document.createElement('div');d.className='aim '+r;if(r==='bot')d.innerHTML=md(t);else d.textContent=t;M.append(d);M.scrollTop=M.scrollHeight;return d};
 const save=()=>{try{sessionStorage.setItem(key,JSON.stringify(hist.slice(-12)))}catch(e){}};
 const welcome=()=>{M.innerHTML='';const d=document.createElement('div');d.className='aiwel';d.innerHTML='<div class="aix big">✦</div><b>Hi'+(first?' '+esc(first):'')+'! I\'m '+esc(name)+'</b><p>'+R.hi+'</p>'+R.chips.map(c=>'<button type="button" class="aic">'+esc(c)+'</button>').join('');M.append(d);d.onclick=e=>{const c=e.target.closest('.aic');if(c)send(c.textContent)}};
 const render=()=>{if(!hist.length)return welcome();M.innerHTML='';hist.forEach(m=>add(m.role==='user'?'me':'bot',m.content))};
 async function send(q){q=String(q||'').trim();if(!q||busy)return;busy=true;w.querySelector('#ais').disabled=true;
  if(!hist.length)M.innerHTML='';add('me',q);hist.push({role:'user',content:q});T.value='';T.style.height='';
  const out=add('bot','…');out.classList.add('typing');ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),45000);
  const c=Object.assign({},DEF,(window.CFG&&CFG.ai)||{});
  const sys=R.sys+' Your name is '+name+'. '+(first?'The user\'s first name is '+first+'. ':'')+'School: '+(CFG.name||'the school')+'. Reply in the same language the user writes in (Hindi, English or Hinglish). You cannot see any school records, marks, fees or personal data; never claim to. Today is '+new Date().toDateString()+'.';
  try{
   const res=await fetch(c.endpoint,{method:'POST',signal:ctl.signal,headers:Object.assign({'Content-Type':'application/json'},c.apiKey?{Authorization:'Bearer '+c.apiKey}:{}),body:JSON.stringify({model:c.model,messages:[{role:'system',content:sys}].concat(hist.slice(-8)),stream:true,temperature:.5,max_tokens:900})});
   if(!res.ok)throw new Error('busy');
   let text='';const ty=res.headers.get('content-type')||'';
   if(!ty.includes('event-stream')||!res.body){const j=await res.json();text=j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content||'';out.classList.remove('typing');out.innerHTML=md(text)}
   else{const rd=res.body.getReader(),dc=new TextDecoder();let buf='';for(;;){const{done,value}=await rd.read();if(done)break;buf+=dc.decode(value,{stream:true});const ls=buf.split('\n');buf=ls.pop();for(const l0 of ls){const l=l0.trim();if(l.indexOf('data:')!==0)continue;const d=l.slice(5).trim();if(d==='[DONE]')continue;try{const t=JSON.parse(d).choices[0].delta.content;if(t){text+=t;out.classList.remove('typing');out.innerHTML=md(text);M.scrollTop=M.scrollHeight}}catch(e){}}}}
   if(!text.trim())throw new Error('empty');hist.push({role:'assistant',content:text});save();
  }catch(e){out.classList.remove('typing');out.classList.add('err');out.textContent=e.name==='AbortError'?'This is taking too long. Please try again.':name+' is busy right now. Please try again in a moment.';hist.pop()}
  clearTimeout(to);busy=false;w.querySelector('#ais').disabled=false;M.scrollTop=M.scrollHeight;T.focus()}
 const open=()=>{w.hidden=false;b.classList.add('on');if(!M.children.length)render();setTimeout(()=>T.focus(),50)},close=()=>{w.hidden=true;b.classList.remove('on')};
 b.onclick=()=>w.hidden?open():close();w.querySelector('#aix').onclick=close;
 w.querySelector('#aic').onclick=()=>{if(ctl)ctl.abort();hist=[];save();busy=false;w.querySelector('#ais').disabled=false;welcome()};
 w.querySelector('#aif').onsubmit=e=>{e.preventDefault();send(T.value)};
 T.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(T.value)}};
 T.oninput=()=>{T.style.height='auto';T.style.height=Math.min(T.scrollHeight,110)+'px'};
};
})();
