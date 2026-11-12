// Public website: sab kuch content/*.json aur config.js se aata hai (admin panel se edit hota hai)
const L=o=>o&&typeof o==='object'?(o[getLang()]||o.en||''):(o||'');
const J=f=>fetch('content/'+f+'.json').then(r=>r.json()).catch(()=>null);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=id=>document.getElementById(id);
const safeSrc=u=>/^(uploads\/|https:\/\/|assets\/)/.test(String(u||''))?esc(u):'';
const S={en:{open:'Admissions open',new:'New',apply:'Apply now',call:'Call us',about:'About us',learn:'Our school',acad:'Academics',acad_h:'What we teach',achieve:'Achievements',achieve_h:'Proud moments',news:'Notices',events:'Events',noNews:'No notices yet',noEv:'No events yet',team:'Our team',team_h:'Meet our teachers',gal:'Gallery',gal_h:'Life at school',dl:'Downloads',dl_h:'Forms & documents',adm:'Admission',adm_h:'Admissions are open. Enquire today!',adm_t:'Leave your details and we will call you back.',cont:'Contact',cont_h:'We would love to hear from you',addr:'Address',ph:'Phone',em:'Email',wa:'WhatsApp',chat:'Chat with us',rights:'All rights reserved.',princ:'Principal'},
 hi:{open:'प्रवेश जारी हैं',new:'नया',apply:'अभी आवेदन करें',call:'कॉल करें',about:'हमारे बारे में',learn:'हमारा स्कूल',acad:'शिक्षा',acad_h:'हम क्या सिखाते हैं',achieve:'उपलब्धियाँ',achieve_h:'गर्व के पल',news:'सूचनाएँ',events:'कार्यक्रम',noNews:'अभी कोई सूचना नहीं',noEv:'अभी कोई कार्यक्रम नहीं',team:'हमारी टीम',team_h:'हमारे शिक्षक',gal:'गैलरी',gal_h:'स्कूल की झलकियाँ',dl:'डाउनलोड',dl_h:'फ़ॉर्म और दस्तावेज़',adm:'प्रवेश',adm_h:'प्रवेश जारी हैं। आज ही पूछताछ करें!',adm_t:'अपनी जानकारी भरें, हम आपको वापस कॉल करेंगे।',cont:'संपर्क',cont_h:'हमसे बात कीजिए',addr:'पता',ph:'फ़ोन',em:'ईमेल',wa:'व्हाट्सऐप',chat:'हमसे चैट करें',rights:'सर्वाधिकार सुरक्षित।',princ:'प्रधानाचार्य'}};
const s_=k=>(S[getLang()]||S.en)[k]||k;
const I=(p)=>'<svg class="i" viewBox="0 0 24 24">'+p+'</svg>';
const ICONS=['<path d="M22 10L12 5 2 10l10 5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>','<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5"/>','<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>','<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>','<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>','<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14a5 5 0 0 1 5 5"/>'];
const T=['t1','t2','t3','t4','t5','t6'],ARW=I('<path d="M7 17L17 7M8 7h9v9"/>');
const fmtD=d=>{const x=new Date(d+'T00:00:00');if(isNaN(x))return{d:'',m:''};return{d:x.getDate(),m:x.toLocaleDateString(getLang()==='hi'?'hi-IN':'en-IN',{month:'short'})}};
const set=(id,v)=>{const e=$(id);if(e)e.textContent=v};
let heroTimer=null;

async function render(){
 applyI18n();document.title=CFG.name;document.documentElement.lang=getLang();
 $('sn').textContent=CFG.name;$('fn').textContent=CFG.name;$('lg').textContent=getLang()==='hi'?'EN':'हिं';
 $('cp').textContent='© '+new Date().getFullYear()+' '+CFG.name+'. '+s_('rights');
 const [site,home,nt,ev,st,dls,gls]=await Promise.all(['site','home','notices','events','staff','downloads','gallery'].map(J));

 // hero
 const slides=((home&&home.hero)||[]),imgs=slides.filter(h=>h.image).map(h=>h.image);let last={t:'',s:''};
 const txt=slides.find(h=>L(h.title))||{};const title=L(txt.title)||CFG.name,sub=L(txt.sub);
 // headline: aakhri shabd ko rang do
 const w=title.trim().split(/\s+/);const h1=w.length>1?esc(w.slice(0,-1).join(' '))+' <em>'+esc(w[w.length-1])+'</em>':'<em>'+esc(title)+'</em>';
 $('ht').innerHTML=h1;$('hs').textContent=sub;$('chb').textContent=s_('new');$('chs').textContent=s_('open');
 $('c1').textContent=s_('apply');$('tel').innerHTML=I('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>')+' '+esc(s_('call'));$('tel').href='tel:'+CFG.phone;
 const fr=$('fr');fr.innerHTML=imgs.length?imgs.map((u,i)=>'<img class="'+(i?'':'on')+'" src="'+safeSrc(u)+'" alt="">').join(''):'<div class="ph">🎓</div>';
 const dots=$('dots');dots.innerHTML=imgs.length>1?imgs.map((_,i)=>'<i class="'+(i?'':'on')+'"></i>').join(''):'';
 clearInterval(heroTimer);if(imgs.length>1){let k=0;heroTimer=setInterval(()=>{k=(k+1)%imgs.length;fr.querySelectorAll('img').forEach((e,i)=>e.classList.toggle('on',i===k));dots.querySelectorAll('i').forEach((e,i)=>e.classList.toggle('on',i===k))},4500)}
 const stats=CFG.stats||[];
 const fcs=[['fa','a',stats[0],'var(--p1)',ICONS[5]],['fb','b',stats[1],'var(--p2)',ICONS[3]]];
 fcs.forEach(([id,c,x,bg,ic])=>{$(id).innerHTML=x?'<div class="fc '+c+'"><span class="ic" style="background:'+bg+'">'+I(ic)+'</span><div><b>'+esc(x.n)+'</b><small>'+esc(L(x.l))+'</small></div></div>':''});
 $('stats').hidden=!stats.length;$('sg').innerHTML=stats.map(x=>'<div class="st"><b>'+esc(x.n)+'</b><span>'+esc(L(x.l))+'</span></div>').join('');

 // logo
 const lg=$('logo');if(home&&home.logo&&safeSrc(home.logo)){lg.src=home.logo;lg.hidden=false;$('lm').hidden=true}else{lg.hidden=true;$('lm').hidden=false}

 // about
 set('ab_e',s_('about'));set('ab_h',s_('learn'));
 if(site){$('ab').textContent=L(site.about);const p=site.principal||{};
  const ai=imgs[1]||imgs[0]||p.photo;$('abi').innerHTML=safeSrc(ai)?'<img src="'+safeSrc(ai)+'" alt="">':'<div class="ph">🏫</div>';
  $('pm').innerHTML=p.name||L(p.message)?(safeSrc(p.photo)?'<img src="'+safeSrc(p.photo)+'" alt="">':'<span class="av">'+esc((p.name||'P').trim().charAt(0))+'</span>')+'<div><b>'+esc(p.name)+'</b><small>'+esc(s_('princ'))+'</small><p>'+esc(L(p.message))+'</p></div>':'';
  const ac=site.academics||[];$('academics').hidden=!ac.length;set('ac_e',s_('acad'));set('ac_h',s_('acad_h'));
  $('ac').innerHTML=ac.map((a,i)=>'<div class="cd rv '+T[i%6]+'"><span class="ic">'+I(ICONS[i%6])+'</span><span class="ar">'+ARW+'</span><h3>'+esc(L(a.title))+'</h3><p>'+esc(L(a.text))+'</p></div>').join('');
  const av=site.achievements||[];$('achieve').hidden=!av.length;set('av_e',s_('achieve'));set('av_h',s_('achieve_h'));
  $('av').innerHTML=av.map(a=>'<div class="ach rv">'+(safeSrc(a.image)?'<img loading="lazy" data-z src="'+safeSrc(a.image)+'" alt="">':'')+'<div><h3>'+esc(L(a.title))+'</h3><p>'+esc(L(a.text))+'</p></div></div>').join('');
  set('ad_e',s_('adm'));set('ad_h',s_('adm_h'));$('ad').textContent=L(site.admission&&site.admission.text)||s_('adm_t')}

 // notices & events
 set('nl_h',s_('news'));set('el_h',s_('events'));
 $('nl').innerHTML=(nt||[]).length?nt.map((n,i)=>{const d=fmtD(n.date);return'<div class="li"><div class="db '+T[i%6]+'"><b>'+d.d+'</b><small>'+d.m+'</small></div><div><h4>'+esc(L(n.title))+'</h4><p>'+esc(L(n.text))+'</p></div></div>'}).join(''):'<p class="emp">'+esc(s_('noNews'))+'</p>';
 $('el').innerHTML=(ev||[]).length?ev.map((n,i)=>{const d=fmtD(n.date);return'<div class="li"><div class="db '+T[(i+2)%6]+'"><b>'+d.d+'</b><small>'+d.m+'</small></div><div><h4>'+esc(L(n.title))+'</h4><p>'+esc(L(n.text))+'</p></div></div>'}).join(''):'<p class="emp">'+esc(s_('noEv'))+'</p>';

 // staff
 $('staff').hidden=!(st||[]).length;set('sl_e',s_('team'));set('sl_h',s_('team_h'));
 $('sl').innerHTML=(st||[]).map((x,i)=>'<div class="tm rv '+T[i%6]+'"><div class="pic">'+(safeSrc(x.photo)?'<img loading="lazy" src="'+safeSrc(x.photo)+'" alt="">':esc((x.name||'?').trim().charAt(0).toUpperCase()))+'</div><b>'+esc(x.name)+'</b><span>'+esc(L(x.role))+'</span></div>').join('');

 // gallery + downloads
 const al=(gls||[]).filter(a=>(a.photos||[]).some(safeSrc));$('gallery').hidden=!al.length;set('gl_e',s_('gal'));set('gl_h',s_('gal_h'));
 $('gl').innerHTML=al.map(a=>'<div class="alb"><h3>'+esc(L(a.album))+'</h3><div class="gg">'+(a.photos||[]).filter(safeSrc).map(p=>'<img loading="lazy" data-z src="'+safeSrc(p)+'" alt="">').join('')+'</div></div>').join('');
 const dl=(dls||[]).filter(d=>safeSrc(d.file));$('downloads').hidden=!dl.length;set('dl_e',s_('dl'));set('dl_h',s_('dl_h'));
 $('dl').innerHTML=dl.map(d=>'<a href="'+safeSrc(d.file)+'" target="_blank" rel="noopener">'+I('<path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/>')+esc(L(d.title))+'</a>').join('');

 // contact
 set('ct_e',s_('cont'));set('ct_h',s_('cont_h'));
 const card=(h,bg,ic,lab,val)=>'<'+(h?'a href="'+esc(h)+'" target="_blank" rel="noopener"':'div')+' class="cc"><span class="ic" style="background:'+bg+'">'+I(ic)+'</span><b>'+esc(lab)+'</b><span>'+esc(val)+'</span></'+(h?'a':'div')+'>';
 $('ct').innerHTML=card('tel:'+CFG.phone,'var(--p1)','<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',s_('ph'),CFG.phone)
  +card('https://wa.me/'+CFG.whatsapp,'var(--p5)','<path d="M21 12a9 9 0 0 1-13.4 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z"/>',s_('wa'),s_('chat'))
  +card('mailto:'+CFG.email,'var(--p3)','<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 7l9 6 9-6"/>',s_('em'),CFG.email)
  +card('','var(--p2)','<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',s_('addr'),CFG.address);
 const mp=$('map');if(CFG.mapEmbed&&/^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/.test(CFG.mapEmbed)){mp.hidden=false;mp.innerHTML='<iframe loading="lazy" src="'+esc(CFG.mapEmbed)+'" referrerpolicy="no-referrer-when-downgrade"></iframe>'}else mp.hidden=true;
 $('wa').href='https://wa.me/'+CFG.whatsapp;
 reveal()}

// scroll reveal
let io=null;function reveal(){if(!('IntersectionObserver' in window)){document.querySelectorAll('.rv').forEach(e=>e.classList.add('in'));return}
 io=io||new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
 document.querySelectorAll('.rv:not(.in)').forEach(e=>io.observe(e))}

// UI events
$('lg').onclick=()=>{setLang(getLang()==='hi'?'en':'hi');render()};
$('mb').onclick=()=>$('links').classList.toggle('open');
$('links').onclick=e=>{if(e.target.tagName==='A')$('links').classList.remove('open')};
document.addEventListener('click',e=>{const i=e.target.closest&&e.target.closest('img[data-z]');if(!i)return;const d=document.createElement('div');d.className='lb';d.innerHTML='<img alt="">';d.firstChild.src=i.src;d.onclick=()=>d.remove();document.body.append(d)});
$('ef').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),m=$('m'),b=e.target.querySelector('button');m.className='';b.disabled=true;
 try{const r=await api('enquiry',{name:f.get('name'),phone:f.get('phone'),message:f.get('message'),website:f.get('website')});
  m.className=r.ok?'ok':'';m.textContent=r.ok?t('sent'):(r.error||'Error');if(r.ok)e.target.reset()}catch(x){m.textContent=t('neterr')}b.disabled=false};
render();
