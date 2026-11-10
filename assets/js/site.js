// Public site: sab kuch content/*.json aur config.js se aata hai
const L=o=>o&&typeof o==='object'?(o[getLang()]||o.en||''):(o||'');
const J=f=>fetch('content/'+f+'.json').then(r=>r.json()).catch(()=>null);
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function render(){
 applyI18n();document.title=CFG.name;
 document.documentElement.style.setProperty('--c',CFG.color);
 document.getElementById('sn').textContent=CFG.name;
 document.getElementById('lg').textContent=getLang()==='hi'?'EN':'हिं';
 const [site,home,nt,ev,st,dls,gls]=await Promise.all(['site','home','notices','events','staff','downloads','gallery'].map(J));
 const hs_=(home&&home.hero)||[];let hi=0;
 const showHero=()=>{const h=hs_[hi%hs_.length];if(!h)return;ht.textContent=L(h.title);hs.textContent=L(h.sub);
  document.getElementById('hero').style.background=h.image?'linear-gradient(#0006,#0006),url("'+encodeURI(h.image)+'") center/cover':'';};
 showHero();clearInterval(window._hv);if(hs_.length>1)window._hv=setInterval(()=>{hi++;showHero()},5000);
 const lg_=document.getElementById('logo');if(home&&home.logo){lg_.src=home.logo;lg_.style.display='inline'}
 if(site){ab.textContent=L(site.about);pr.innerHTML=(site.principal.photo?'<img src="'+esc(site.principal.photo)+'" style="height:90px;float:left;margin:0 12px 8px 0">':'')+'<b>'+esc(site.principal.name)+'</b><br>'+esc(L(site.principal.message));
 document.getElementById('ac').innerHTML=(site.academics||[]).map(a=>'<div class="card"><b>'+esc(L(a.title))+'</b><p>'+esc(L(a.text))+'</p></div>').join('');
 document.getElementById('av').innerHTML=(site.achievements||[]).map(a=>'<div class="card">'+(a.image?'<img src="'+esc(a.image)+'">':'')+'<b>'+esc(L(a.title))+'</b><p>'+esc(L(a.text))+'</p></div>').join('');ad.textContent=L(site.admission.text)}
 nl.innerHTML=(nt||[]).map(n=>'<div class="card"><b>'+esc(L(n.title))+'</b> <span class="mu">'+esc(n.date)+'</span><p>'+esc(L(n.text))+'</p></div>').join('');
 el.innerHTML=(ev||[]).map(n=>'<div class="card"><b>'+esc(L(n.title))+'</b> <span class="mu">'+esc(n.date)+'</span></div>').join('');
 sl.innerHTML=(st||[]).map(s=>'<div class="card">'+(s.photo?'<img src="'+esc(s.photo)+'">':'')+'<b>'+esc(s.name)+'</b><br><span class="mu">'+esc(L(s.role))+'</span></div>').join('');
 document.getElementById('dl').innerHTML=(dls||[]).map(d=>'<p><a href="'+esc(d.file)+'">'+esc(L(d.title))+'</a></p>').join('');
 document.getElementById('gl').innerHTML=(gls||[]).map(a=>'<h3>'+esc(L(a.album))+'</h3><div class="grid">'+(a.photos||[]).map(p=>'<img loading="lazy" src="'+esc(p)+'">').join('')+'</div>').join('');
 ct.textContent=CFG.address+' | '+CFG.email;
 tel.href='tel:'+CFG.phone;wa.href='https://wa.me/'+CFG.whatsapp}
document.getElementById('lg').onclick=()=>{setLang(getLang()==='hi'?'en':'hi');render()};
document.getElementById('ef').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),m=document.getElementById('m');
 try{const r=await api('enquiry',{name:f.get('name'),phone:f.get('phone'),message:f.get('message'),website:f.get('website')});
  m.style.color='inherit';m.textContent=r.ok?t('sent'):(r.error||'Error');if(r.ok)e.target.reset()}catch(x){m.textContent=t('neterr')}};
render();
