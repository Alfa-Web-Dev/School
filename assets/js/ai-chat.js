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
const FACE='<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="aibg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9ccff"/><stop offset="1" stop-color="#b7a4f7"/></linearGradient></defs><rect width="100" height="100" fill="url(#aibg)"/><circle cx="82" cy="16" r="16" fill="#fff" opacity=".3"/><path d="M16 100C16 78 32 72 50 72C68 72 84 78 84 100Z" fill="#4f46e5"/><path d="M42 72L50 82L58 72Z" fill="#fff"/><rect x="43" y="62" width="14" height="14" rx="5" fill="#f2c29b"/><ellipse cx="50" cy="48" rx="22" ry="23" fill="#f8d2ad"/><circle cx="28" cy="50" r="4.5" fill="#f2c29b"/><circle cx="72" cy="50" r="4.5" fill="#f2c29b"/><path d="M28 42C26 24 40 20 50 22C62 20 74 26 72 42C66 34 58 31 50 31C42 31 34 34 28 42Z" fill="#3a2418"/><path d="M50 22C54 14 62 14 64 18C60 18 57 20 56 24Z" fill="#3a2418"/><circle cx="41" cy="50" r="3.4" fill="#1f2937"/><circle cx="59" cy="50" r="3.4" fill="#1f2937"/><circle cx="42.2" cy="48.8" r="1.1" fill="#fff"/><circle cx="60.2" cy="48.8" r="1.1" fill="#fff"/><path d="M36 43Q41 40 46 42M54 42Q59 40 64 43" stroke="#3a2418" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M42 59Q50 69 58 59Z" fill="#7c2d12"/><path d="M45 63Q50 66 55 63" stroke="#f87171" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="34" cy="58" r="4" fill="#ff8a8a" opacity=".35"/><circle cx="66" cy="58" r="4" fill="#ff8a8a" opacity=".35"/><path d="M50 8L84 22L50 36L16 22Z" fill="#1f2937"/><path d="M30 28V38C40 44 60 44 70 38V28L50 36Z" fill="#374151"/><path d="M76 25V42" stroke="#f59e0b" stroke-width="2.5"/><circle cx="76" cy="45" r="3.4" fill="#f59e0b"/></svg>';
let hist=[],busy=false,ctl=null;
window.initAI=async function(role,u){
 if(document.getElementById('aib'))return;
 let cfg=null;try{cfg=JSON.parse(sessionStorage.getItem('ai_cfg')||'null');if(cfg&&Date.now()-cfg.t>300000)cfg=null}catch(e){}
 if(!cfg){try{const r=await call('aiGet');cfg={on:r.on,name:r.name,t:Date.now()};sessionStorage.setItem('ai_cfg',JSON.stringify(cfg))}catch(e){cfg={on:true,name:'Tuto',t:Date.now()}}}
 if(!cfg.on)return;
 const R=ROLE[role]||ROLE.student,name=cfg.name||'Tuto',first=String(u.name||'').split(' ')[0];
 const key='ai_h_'+role;try{hist=JSON.parse(sessionStorage.getItem(key)||'[]')}catch(e){hist=[]}
 const b=document.createElement('button');b.id='aib';b.type='button';b.setAttribute('aria-label',name+' AI');
 b.innerHTML=FACE;
 const w=document.createElement('div');w.id='aiw';w.hidden=true;
 w.innerHTML='<div class="aih"><span class="aix">'+FACE+'</span><div><b>'+esc(name)+'</b><small>AI study & school helper</small></div><button type="button" id="aic" aria-label="Clear chat" title="New chat">↺</button><button type="button" id="aix" aria-label="Close">×</button></div><div id="aim"></div><form id="aif"><textarea id="ait" rows="1" maxlength="800" placeholder="Type your question…"></textarea><button type="submit" id="ais" aria-label="Send"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 20l18-8L3 4v6l12 2-12 2z"/></svg></button></form><div class="aif">AI can make mistakes. Check important things.</div>';
 document.body.append(b,w);
 const M=w.querySelector('#aim'),T=w.querySelector('#ait');
 const add=(r,t)=>{const d=document.createElement('div');d.className='aim '+r;if(r==='bot')d.innerHTML=md(t);else d.textContent=t;M.append(d);M.scrollTop=M.scrollHeight;return d};
 const save=()=>{try{sessionStorage.setItem(key,JSON.stringify(hist.slice(-12)))}catch(e){}};
 const welcome=()=>{M.innerHTML='';const d=document.createElement('div');d.className='aiwel';d.innerHTML='<div class="aix big">'+FACE+'</div><b>Hi'+(first?' '+esc(first):'')+'! I\'m '+esc(name)+'</b><p>'+R.hi+'</p>'+R.chips.map(c=>'<button type="button" class="aic">'+esc(c)+'</button>').join('');M.append(d);d.onclick=e=>{const c=e.target.closest('.aic');if(c)send(c.textContent)}};
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
 let moved=false;
 const PK='ai_pos',pad=8,sz=()=>b.offsetWidth||58;
 const place=(x,y)=>{const W=innerWidth,H=innerHeight;x=Math.max(pad,Math.min(W-sz()-pad,x));y=Math.max(pad+60,Math.min(H-sz()-pad,y));b.style.left=x+'px';b.style.top=y+'px';b.style.right='auto';b.style.bottom='auto'};
 const home=()=>{let p=null;try{p=JSON.parse(localStorage.getItem(PK)||'null')}catch(e){}const W=innerWidth,H=innerHeight;if(p){place(p.r?W-sz()-pad:pad,p.y*H)}else place(W-sz()-16,H-sz()-(W<900?104:24))};
 home();addEventListener('resize',home);
 let st=null;
 b.addEventListener('pointerdown',e=>{st={x:e.clientX,y:e.clientY,l:b.offsetLeft,t:b.offsetTop};moved=false;b.setPointerCapture(e.pointerId);b.classList.add('drag')});
 b.addEventListener('pointermove',e=>{if(!st)return;const dx=e.clientX-st.x,dy=e.clientY-st.y;if(!moved&&Math.hypot(dx,dy)<6)return;moved=true;place(st.l+dx,st.t+dy)});
 const end=()=>{if(!st)return;st=null;b.classList.remove('drag');if(moved){const r=b.offsetLeft+sz()/2>innerWidth/2;try{localStorage.setItem(PK,JSON.stringify({r:r,y:b.offsetTop/innerHeight}))}catch(e){}home()}};
 b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);
 b.onclick=()=>{if(moved){moved=false;return}w.hidden?open():close()};w.querySelector('#aix').onclick=close;
 w.querySelector('#aic').onclick=()=>{if(ctl)ctl.abort();hist=[];save();busy=false;w.querySelector('#ais').disabled=false;welcome()};
 w.querySelector('#aif').onsubmit=e=>{e.preventDefault();send(T.value)};
 T.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(T.value)}};
 T.oninput=()=>{T.style.height='auto';T.style.height=Math.min(T.scrollHeight,110)+'px'};
};
})();
