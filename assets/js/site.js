// Public website: data assets/js/site-data.js se, illustrations art.js se, school ki settings config.js se
const L=o=>o&&typeof o==='object'?(o[getLang()]||o.en||''):(o||'');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=id=>document.getElementById(id);
const okSrc=u=>/^(uploads\/|assets\/|https:\/\/)/.test(String(u||''));
const pic=(u,fb)=>okSrc(u)?'<img loading="lazy" alt="" src="'+esc(u)+'">':fb;
const S={en:{call:'Call me back',ph:'Your phone number',sent:'Thanks! We will call you.',classes:'Classes',progs:'Programs',cont:'Contact',cont_h:'We would love to hear from you',addr:'Address',phone:'Phone',em:'Email',wa:'WhatsApp',chat:'Chat with us',rights:'All rights reserved.',princ:'Principal',news:'Notices',events:'Events',noNews:'No notices yet',noEv:'No events yet',team:'Our team',team_h:'Meet our teachers',dl:'Downloads',cong:'Congratulations!',cong2:'Admission 2026-27',rate:'Parent rating',adm:'Admission'},
 hi:{call:'मुझे कॉल करें',ph:'आपका फ़ोन नंबर',sent:'धन्यवाद! हम आपको कॉल करेंगे।',classes:'कक्षाएँ',progs:'कार्यक्रम',cont:'संपर्क',cont_h:'हमसे बात कीजिए',addr:'पता',phone:'फ़ोन',em:'ईमेल',wa:'व्हाट्सऐप',chat:'हमसे चैट करें',rights:'सर्वाधिकार सुरक्षित।',princ:'प्रधानाचार्य',news:'सूचनाएँ',events:'कार्यक्रम',noNews:'अभी कोई सूचना नहीं',noEv:'अभी कोई कार्यक्रम नहीं',team:'हमारी टीम',team_h:'हमारे शिक्षक',dl:'डाउनलोड',cong:'बधाई हो!',cong2:'प्रवेश 2026-27',rate:'अभिभावक रेटिंग',adm:'प्रवेश'}};
const s_=k=>(S[getLang()]||S.en)[k]||k;
const UL='<svg viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M2 8Q50 0 100 6T198 4" fill="none" stroke="var(--o)" stroke-width="4" stroke-linecap="round"/></svg>';
const PASTEL=['#fde2ef','#d7f5ee','#ffe9a8','#e4d9ff','#d6e6ff','#ffe0cc','#d4f5d9','#fff0bd'];
const fmtD=d=>{const x=new Date(d+'T00:00:00');return isNaN(x)?{d:'',m:''}:{d:x.getDate(),m:x.toLocaleDateString(getLang()==='hi'?'hi-IN':'en-IN',{month:'short'})}};
const set=(id,v)=>{const e=$(id);if(e)e.textContent=v};
const hl=(a,b)=>esc(a)+' <span class="h-u">'+esc(b)+UL+'</span>';
let cat=0;

function render(){
 applyI18n();document.title=CFG.name;document.documentElement.lang=getLang();
 document.documentElement.style.setProperty('--c',CFG.color||'#7c3aed');
 $('sn').textContent=CFG.name;$('fn').textContent=CFG.name;$('lg').textContent=getLang()==='hi'?'EN':'हिं';
 $('cp').textContent='© '+new Date().getFullYear()+' '+CFG.name+'. '+s_('rights');
 $('n_cl').textContent=s_('classes');$('n_pr').textContent=s_('progs');$('f_pr').textContent=s_('progs');
 const lg=$('logo'),lm=$('lm');lm.textContent=(CFG.shortName||CFG.name||'S').trim().charAt(0);
 if(okSrc(SITE.logo)){lg.src=SITE.logo;lg.hidden=false;lm.hidden=true}else{lg.hidden=true;lm.hidden=false}

 // hero
 const h=SITE.hero;$('badge').textContent=L(h.badge);
 $('ht').innerHTML=esc(L(h.pre))+' <span class="hlt">'+esc(L(h.hl))+UL+'</span>';$('hs').textContent=L(h.sub);
 $('qp').placeholder=s_('ph');$('qb').textContent=s_('call');$('hp').textContent=L(h.happy);
 $('stk').innerHTML=[3,4,5,6].map(i=>'<i>'+avatar(i)+'</i>').join('');
 $('col').innerHTML='<div class="p p1">'+avatar(0,{book:true,bg:'#b9a4ff'})+'</div><div class="p p2">'+avatar(1,{bg:'#8fe3d8'})+'</div><div class="p p3">'+avatar(2,{bg:'#ffe08a'})+'</div><div class="p p4">'+avatar(3,{style:3,bg:'#ffb3d6'})+'</div>'
  +'<div class="fb a"><span class="ic" style="background:#ffe7d1;color:#f97316">'+ic('award')+'</span><div><b>'+esc(s_('cong'))+'</b><small>'+esc(s_('cong2'))+'</small></div></div>'
  +'<div class="fb b"><span class="ic" style="background:#fff3c4;color:#f59e0b">'+ic('star')+'</span><div><b>4.9 ★</b><small>'+esc(s_('rate'))+'</small></div></div>'
  +'<svg class="sq s1" viewBox="0 0 60 40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M4 30C18 4 40 4 54 22M54 22l-12-1M54 22l-3 11"/></svg>';

 // stats
 const st=SITE.stats||[];$('stats').hidden=!st.length;
 $('sg').innerHTML=st.map(x=>'<div class="st"><span class="ic" style="background:'+x.c+';color:'+x.k+'">'+ic(x.i)+'</span><div><b>'+esc(x.n)+'</b><span>'+esc(L(x.l))+'</span></div></div>').join('');

 // classes
 const C=SITE.classes||{items:[]};$('classes').hidden=!C.items.length;
 const ct=L(C.title).split(' ');$('cl_h').innerHTML=esc(ct.slice(0,-1).join(' '))+' <span class="h-u">'+esc(ct[ct.length-1])+UL+'</span>';
 $('cl').innerHTML=C.items.map(x=>'<div class="tl rv"><span class="ic" style="background:'+x.c+'">'+ic(x.i)+'</span><div><b>'+esc(L(x.t))+'</b><span>'+esc(L(x.x))+'</span></div></div>').join('');

 // banner
 const B=SITE.banner;$('banner').hidden=!B;
 if(B)$('bn').innerHTML='<div class="bt"><h2>'+esc(L(B.t))+' <em>'+esc(L(B.hl))+'</em></h2><p>'+esc(L(B.x))+'</p><a class="pill solid" href="#admission">'+esc(L(B.btn))+'</a></div><div class="im"><div class="p">'+avatar(5,{book:true,style:3,bg:'#ffd9a8'})+'</div><div class="fb"><span class="ic" style="background:#e4d9ff;color:var(--c)">'+ic('users')+'</span><div><b>'+esc(SITE.stats&&SITE.stats[0]?SITE.stats[0].n:'')+'</b><small>'+esc(SITE.stats&&SITE.stats[0]?L(SITE.stats[0].l):'')+'</small></div></div></div>';

 // popular
 const P=SITE.popular||{items:[]};$('popular').hidden=!P.items.length;set('po_e',L(P.e));$('po_h').innerHTML=esc(L(P.title));
 $('po').innerHTML=P.items.map(x=>'<div class="pc rv" style="background:'+x.c+'"><span class="ic">'+ic(x.i)+'</span><b>'+esc(L(x.t))+'</b><span>'+esc(L(x.x))+'</span></div>').join('');

 // programs
 const G=SITE.programs||{items:[],cats:[]};$('programs').hidden=!G.items.length;set('pr_e',L(G.e));
 const gt=L(G.title).split(' ');$('pr_h').innerHTML=esc(gt.slice(0,-1).join(' '))+' <span class="h-u">'+esc(gt[gt.length-1])+UL+'</span>';
 $('tabs').innerHTML=(G.cats||[]).map((c,i)=>'<button class="'+(i===cat?'on':'')+'" data-c="'+i+'">'+esc(L(c))+'</button>').join('');
 $('pg').innerHTML=G.items.map((x,i)=>({x,i})).filter(o=>!cat||o.x.cat===cat).map(({x,i})=>'<div class="cd rv"><div class="im">'+pic(x.photo,scene(i,x.icon))+'<span class="cat">'+esc(L(G.cats[x.cat]||''))+'</span></div><div class="bd"><h4>'+esc(L(x.t))+'</h4><div class="by"><i>'+avatar(i+3)+'</i>'+esc(x.by)+'</div><div class="ft"><span>'+esc(L(x.m))+'</span><b>'+ic('star')+esc(x.r)+'</b></div></div></div>').join('');

 // about
 const A=SITE.about,pr=SITE.principal||{};
 set('ab_e',L(A.e));$('ab_h').innerHTML=esc(L(A.t))+' <span class="h-u">'+esc(L(A.hl))+UL+'</span>';set('ab_p',L(A.text));set('ab_b',L(A.btn));
 $('abc').innerHTML='<div class="p a1">'+avatar(4,{book:true,bg:'#c8f2b8'})+'</div><div class="p a2">'+avatar(6,{bg:'#ffc9a8'})+'</div><div class="p a3">'+scene(1,'flask')+'</div>';
 $('pts').innerHTML=(A.points||[]).map(p=>'<li>'+ic('check')+esc(L(p))+'</li>').join('');
 $('pm').innerHTML=(pr.name?'<i>'+pic(pr.photo,avatar(7,{fem:false,style:0}))+'</i><div><b>'+esc(pr.name)+'</b><small>'+esc(s_('princ'))+'</small></div>':'');
 set('ad_e',s_('adm'));set('ad_h',L(SITE.admission.t));set('ad',L(SITE.admission.x));

 // notices / events
 set('nl_h',s_('news'));set('el_h',s_('events'));
 const li=(a,k,n)=>a&&a.length?a.map((n2,i)=>{const d=fmtD(n2.date);return'<div class="li"><div class="db" style="background:'+PASTEL[(i+k)%8]+'"><b>'+d.d+'</b><small>'+d.m+'</small></div><div><h4>'+esc(L(n2.t))+'</h4><p>'+esc(L(n2.x))+'</p></div></div>'}).join(''):'<p class="mu" style="color:var(--mu)">'+esc(n)+'</p>';
 $('nl').innerHTML=li(SITE.notices,0,s_('noNews'));$('el').innerHTML=li(SITE.events,3,s_('noEv'));
 $('notices').hidden=!((SITE.notices||[]).length||(SITE.events||[]).length);

 // staff, downloads
 $('staff').hidden=!(SITE.staff||[]).length;set('sl_e',s_('team'));set('sl_h',s_('team_h'));
 $('sl').innerHTML=(SITE.staff||[]).map((x,i)=>'<div class="tm rv" style="background:'+PASTEL[i%8]+'"><div class="pic">'+pic(x.photo,avatar(i+8,{bg:PASTEL[(i+3)%8]}))+'</div><b>'+esc(x.name)+'</b><span>'+esc(L(x.role))+'</span></div>').join('');
 const dl=(SITE.downloads||[]).filter(d=>okSrc(d.file));$('downloads').hidden=!dl.length;set('dl_h',s_('dl'));
 $('dl').innerHTML=dl.map(d=>'<a href="'+esc(d.file)+'" target="_blank" rel="noopener">'+ic('dl')+esc(L(d.t))+'</a>').join('');

 // contact
 set('ct_e',s_('cont'));set('ct_h',s_('cont_h'));
 const card=(h2,bg,k,lab,val)=>'<'+(h2?'a href="'+esc(h2)+'" target="_blank" rel="noopener"':'div')+' class="cc rv"><span class="ic" style="background:'+bg+'">'+ic(k)+'</span><b>'+esc(lab)+'</b><span>'+esc(val)+'</span></'+(h2?'a':'div')+'>';
 $('ct').innerHTML=card('tel:'+CFG.phone,'#d7f5ee','phone',s_('phone'),CFG.phone)+card('https://wa.me/'+CFG.whatsapp,'#d4f5d9','chat',s_('wa'),s_('chat'))+card('mailto:'+CFG.email,'#e4d9ff','mail',s_('em'),CFG.email)+card('','#ffe0cc','pin',s_('addr'),CFG.address);
 const mp=$('map');if(CFG.mapEmbed&&/^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/.test(CFG.mapEmbed)){mp.hidden=false;mp.innerHTML='<iframe loading="lazy" src="'+esc(CFG.mapEmbed)+'"></iframe>'}else mp.hidden=true;
 $('wa').href='https://wa.me/'+CFG.whatsapp;$('wa').innerHTML=ic('chat');$('wa').firstChild.style.cssText='width:28px;height:28px';
 reveal()}

let io=null;function reveal(){if(!('IntersectionObserver' in window)){document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));return}
 io=io||new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1});
 document.querySelectorAll('.rv:not(.in)').forEach(e=>io.observe(e))}

$('lg').onclick=()=>{setLang(getLang()==='hi'?'en':'hi');render()};
$('mb').onclick=()=>$('links').classList.toggle('open');
$('links').onclick=e=>{if(e.target.tagName==='A')$('links').classList.remove('open')};
$('tabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;cat=Number(b.dataset.c);render()};
async function send(name,phone,message,hp){return api('enquiry',{name,phone,message,website:hp||''})}
$('ef').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),m=$('m'),b=e.target.querySelector('button');m.className='';b.disabled=true;
 try{const r=await send(f.get('name'),f.get('phone'),f.get('message'),f.get('website'));m.className=r.ok?'ok':'';m.textContent=r.ok?t('sent'):(r.error||'Error');if(r.ok)e.target.reset()}catch(x){m.textContent=t('neterr')}b.disabled=false};
$('qf').onsubmit=async e=>{e.preventDefault();const m=$('qm'),b=$('qb');m.className='qm';b.disabled=true;
 try{const r=await send('Call back request',$('qp').value,'Call back request (website)');m.className='qm'+(r.ok?' ok':'');m.textContent=r.ok?s_('sent'):(r.error||'Error');if(r.ok)$('qp').value=''}catch(x){m.textContent=t('neterr')}b.disabled=false};
render();
