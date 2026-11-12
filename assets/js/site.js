// Public website renderer: data = site-data.js (SITE), art = art.js, school info = config.js (CFG)
const L=o=>o&&typeof o==='object'?(o[getLang()]||o.en||''):(o||'');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=id=>document.getElementById(id);
const PAGE=document.body.dataset.page||'home';
const T={en:{home:'Home',about:'About',acad:'Academics',fac:'Facilities',adm:'Admission',gal:'Gallery',con:'Contact',login:'Login',enq:'Enquire now',ph:'Your phone number',call:'Call me back',sent:'Thanks! We will call you back soon.',nm:'Your name',msg:'Message (optional)',send:'Send enquiry',rights:'All rights reserved.',quick:'Quick links',reach:'Reach us',hrs:'School hours',addr:'Address',phone:'Phone',mail:'Email',method:'How we teach',wa:'WhatsApp',chatus:'Chat with us',more:'Learn more',viewall:'View all',notices:'Latest notices',events:'Upcoming events',story:'About us',team:'Our team',journey:'Our journey',vision:'Mission & vision',msgp:'From the principal\'s desk',elig:'Eligibility',docs:'Documents required',dates:'Important dates',faq:'Frequently asked questions',class:'Class',age:'Minimum age',cong:'Admissions open',cong2:'Limited seats',rate:'Parent rating',school:'School',loc:'Find us',tag:'Nurturing curious minds',desc:'Learn about our classes, facilities, admission process and school life.',portal:'Student / Parent login',follow:'Admission helpline',err:'Please enter a valid name and phone',h_about:'About our school',h_acad:'Academics',h_fac:'Campus & facilities',h_adm:'Admissions',h_gal:'Photo gallery',h_con:'Contact us',s_about:'Our story, values and the people behind the school.',s_acad:'From first steps to board exams, a path built for every child.',s_fac:'Spaces designed for learning, play and growth.',s_adm:'Simple steps, clear information, friendly help.',s_gal:'Moments from classrooms, playgrounds and celebrations.',s_con:'We would love to hear from you.'},
hi:{home:'होम',about:'हमारे बारे में',acad:'शिक्षा',fac:'सुविधाएँ',adm:'प्रवेश',gal:'गैलरी',con:'संपर्क',login:'लॉगिन',enq:'पूछताछ करें',ph:'आपका फ़ोन नंबर',call:'मुझे कॉल करें',sent:'धन्यवाद! हम जल्द ही आपको कॉल करेंगे।',nm:'आपका नाम',msg:'संदेश (वैकल्पिक)',send:'पूछताछ भेजें',rights:'सर्वाधिकार सुरक्षित।',quick:'त्वरित लिंक',reach:'संपर्क करें',hrs:'स्कूल का समय',addr:'पता',phone:'फ़ोन',mail:'ईमेल',method:'हम कैसे पढ़ाते हैं',wa:'व्हाट्सऐप',chatus:'हमसे चैट करें',more:'और जानें',viewall:'सभी देखें',notices:'ताज़ा सूचनाएँ',events:'आने वाले कार्यक्रम',story:'हमारे बारे में',team:'हमारी टीम',journey:'हमारा सफ़र',vision:'मिशन और विज़न',msgp:'प्रधानाचार्य का संदेश',elig:'पात्रता',docs:'ज़रूरी दस्तावेज़',dates:'महत्वपूर्ण तिथियाँ',faq:'अक्सर पूछे जाने वाले प्रश्न',class:'कक्षा',age:'न्यूनतम आयु',cong:'प्रवेश जारी',cong2:'सीमित सीटें',rate:'अभिभावक रेटिंग',school:'स्कूल',loc:'हमें खोजें',tag:'जिज्ञासु मन का विकास',desc:'हमारी कक्षाएँ, सुविधाएँ, प्रवेश प्रक्रिया और स्कूल जीवन के बारे में जानें।',portal:'छात्र / अभिभावक लॉगिन',follow:'प्रवेश हेल्पलाइन',err:'कृपया सही नाम और फ़ोन नंबर लिखें',h_about:'हमारे स्कूल के बारे में',h_acad:'शिक्षा',h_fac:'परिसर और सुविधाएँ',h_adm:'प्रवेश',h_gal:'फ़ोटो गैलरी',h_con:'संपर्क करें',s_about:'हमारी कहानी, मूल्य और स्कूल के पीछे के लोग।',s_acad:'पहले कदम से बोर्ड परीक्षा तक, हर बच्चे के लिए बना रास्ता।',s_fac:'सीखने, खेलने और आगे बढ़ने के लिए बने स्थान।',s_adm:'आसान चरण, साफ़ जानकारी, मित्रवत सहायता।',s_gal:'कक्षाओं, खेल के मैदानों और उत्सवों के पल।',s_con:'हमें आपसे बात करके खुशी होगी।'}};
const s_=k=>(T[getLang()]||T.en)[k]||k;
const UL='<svg viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M2 8Q50 0 100 6T198 4" fill="none" stroke="var(--o)" stroke-width="4" stroke-linecap="round"/></svg>';
const PASTEL=['#fde2ef','#d7f5ee','#ffe9a8','#e4d9ff','#d6e6ff','#ffe0cc','#d4f5d9','#fff0bd'];
const hu=(a,b)=>esc(a)+' <span class="h-u">'+esc(b)+UL+'</span>';
const fmtD=d=>{const x=new Date(d+'T00:00:00');return isNaN(x)?{d:'',m:''}:{d:x.getDate(),m:x.toLocaleDateString(getLang()==='hi'?'hi-IN':'en-IN',{month:'short'})}};
const FB=[];
// Internet photo (Unsplash) with illustration fallback if it fails to load
const im=(key,fb,w)=>{FB.push(fb);return '<img loading="lazy" alt="" src="'+esc(U(key,w))+'" onerror="this.outerHTML=FB['+(FB.length-1)+']">'};
const sec=(cls,inner)=>'<section class="sec '+cls+'"><div class="wrap">'+inner+'</div></section>';
const head=(e,t,p,c)=>'<div class="sh'+(c===false?'':' c')+'">'+(e?'<span class="eyebrow">'+esc(e)+'</span>':'')+'<h2>'+t+'</h2>'+(p?'<p>'+esc(p)+'</p>':'')+'</div>';
const pill=(href,txt,cls)=>'<a class="pill '+(cls||'solid')+'" href="'+href+'">'+txt+'</a>';
const cityPhoto=(it,i,ic)=>im(it.photo,scene(i,ic||it.i||it.icon||'book'));

const NAV=[['index.html','home'],['about.html','about'],['academics.html','acad'],['facilities.html','fac'],['admission.html','adm'],['gallery.html','gal'],['contact.html','con']];
const PID={home:'home',about:'about',acad:'acad',fac:'fac',adm:'adm',gal:'gal',con:'con'};

function shell(){
 const lg=okLogo()?'<img src="'+esc(SITE.logo)+'" alt="">':'<span class="lm">'+esc((CFG.shortName||CFG.name||'S').trim().charAt(0))+'</span>';
 const links=NAV.map(n=>'<a href="'+n[0]+'"'+(PID[PAGE]===n[1]?' class="on"':'')+'>'+s_(n[1])+'</a>').join('');
 $('top').innerHTML='<div class="tb"><div class="wrap"><span>'+ic('phone')+'<a href="tel:'+esc(CFG.phone)+'">'+esc(CFG.phone)+'</a></span><span>'+ic('mail')+'<a href="mailto:'+esc(CFG.email)+'">'+esc(CFG.email)+'</a></span><span class="sp">'+ic('pin')+esc(CFG.address)+'</span></div></div>'
 +'<header class="nav"><div class="wrap nv"><a class="brand" href="index.html">'+lg+'<span>'+esc(CFG.name)+'</span></a><nav id="links">'+links+'</nav><div class="nvr"><button class="pill sm ghost" id="lg" type="button">'+(getLang()==='hi'?'EN':'हिं')+'</button><a class="pill sm orange" href="login.html">'+s_('login')+'</a><button id="mb" aria-label="Menu" type="button">☰</button></div></div></header>';
 const fl=NAV.slice(1).map(n=>'<li><a href="'+n[0]+'">'+s_(n[1])+'</a></li>').join('');
 $('foot').innerHTML='<footer><div class="wrap"><div class="fg"><div><a class="brand" href="index.html">'+lg+'<span>'+esc(CFG.name)+'</span></a><p>'+esc(s_('desc'))+'</p></div><div><h5>'+s_('quick')+'</h5><ul>'+fl+'</ul></div>'
 +'<div><h5>'+s_('hrs')+'</h5><ul>'+SITE.hours.map(h=>'<li>'+esc(L(h.d))+'<br><b style="color:#fff">'+esc(L(h.t))+'</b></li>').join('')+'</ul></div>'
 +'<div><h5>'+s_('reach')+'</h5><ul><li>'+esc(CFG.address)+'</li><li><a href="tel:'+esc(CFG.phone)+'">'+esc(CFG.phone)+'</a></li><li><a href="mailto:'+esc(CFG.email)+'">'+esc(CFG.email)+'</a></li><li><a href="login.html">'+s_('portal')+'</a></li></ul></div></div>'
 +'<div class="fbar"><span>© '+new Date().getFullYear()+' '+esc(CFG.name)+'. '+s_('rights')+'</span><span>'+esc(s_('tag'))+'</span></div></div></footer>'
 +'<a class="wa" href="https://wa.me/'+esc(CFG.whatsapp)+'" target="_blank" rel="noopener" aria-label="WhatsApp"><svg class="i" viewBox="0 0 24 24" style="width:28px;height:28px">'+IC.chat+'</svg></a>';
 $('lg').onclick=()=>{setLang(getLang()==='hi'?'en':'hi');render()};
 $('mb').onclick=()=>$('links').classList.toggle('open');
}
const okLogo=()=>/^(uploads\/|assets\/|https:\/\/)/.test(SITE.logo||'');

// ---------- blocks ----------
function hero(){
 const h=SITE.hero;
 return '<section class="hero"><div class="wrap hg"><div><span class="badge">'+esc(L(h.badge))+'</span><h1>'+esc(L(h.pre))+' <span class="hlt">'+esc(L(h.hl))+UL+'</span></h1><p class="sub">'+esc(L(h.sub))+'</p>'
 +'<form class="quick" id="qf"><input name="phone" type="tel" required maxlength="15" placeholder="'+esc(s_('ph'))+'"><input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button class="pill solid" type="submit">'+s_('call')+'</button></form><div class="qm" id="qm"></div>'
 +'<div class="happy"><div class="stack">'+[3,4,5,6].map(i=>'<i>'+avatar(i)+'</i>').join('')+'</div><span>'+esc(L(h.happy))+'</span></div></div>'
 +'<div class="hr"><div class="p p1">'+im('class1',avatar(0,{book:true,bg:'#b9a4ff'}),600)+'</div><div class="p p2">'+im('girls',avatar(1,{bg:'#8fe3d8'}),600)+'</div><div class="p p3">'+im('boyBook',avatar(2,{bg:'#ffe08a'}),600)+'</div><div class="p p4">'+im('group',avatar(3,{bg:'#ffb8d9'}),600)+'</div>'
 +'<div class="fb a"><span class="ic" style="background:#ffe7d1;color:#f97316">'+ic('award')+'</span><div><b>'+esc(s_('cong'))+'</b><small>'+esc(s_('cong2'))+'</small></div></div>'
 +'<div class="fb b"><span class="ic" style="background:#fff3c4;color:#f59e0b">'+ic('star')+'</span><div><b>4.9 ★</b><small>'+esc(s_('rate'))+'</small></div></div></div></div></section>';
}
function stats(){return '<section class="wrap"><div class="sg">'+SITE.stats.map(x=>'<div class="st"><span class="ic" style="background:'+x.c+';color:'+x.k+'">'+ic(x.i)+'</span><div><b>'+esc(x.n)+'</b><span>'+esc(L(x.l))+'</span></div></div>').join('')+'</div></section>'}
function whyUs(){const w=SITE.why;return sec('rv',head(L(w.e),hu(L(w.t),L(w.hl)))+'<div class="g3">'+w.items.map(x=>'<div class="ft" style="background:'+x.c+'"><span class="ic">'+ic(x.i)+'</span><h3>'+esc(L(x.t))+'</h3><p>'+esc(L(x.x))+'</p></div>').join('')+'</div>')}
function banner(){const b=SITE.banner;return sec('rv','<div class="bn"><div><h2>'+esc(L(b.t))+' <em>'+esc(L(b.hl))+'</em></h2><p>'+esc(L(b.x))+'</p>'+pill('admission.html',esc(L(b.btn)),'solid')+'</div><div class="im">'+im(b.photo,scene(5,'star'),900)+'</div></div>')}
function popular(){const p=SITE.popular;return sec('rv','<div class="pp"><div class="ppl"><span class="eyebrow">'+esc(L(p.e))+'</span><h2>'+esc(L(p.title))+'</h2><p>'+esc(L(SITE.banner.x))+'</p></div><div class="pt">'+p.items.map(x=>'<div class="pc" style="background:'+x.c+'"><span class="ic">'+ic(x.i)+'</span><b>'+esc(L(x.t))+'</b><span>'+esc(L(x.x))+'</span></div>').join('')+'</div></div>')}
let pcat=0;
function programs(lim){
 const p=SITE.programs;
 const items=lim?p.items.slice(0,lim):p.items.filter(x=>!pcat||x.cat===pcat);
 return sec('rv','<div class="lav">'+head(L(p.e),esc(L(p.title)))+(lim?'':'<div class="tabs" id="ptabs">'+p.cats.map((c,i)=>'<button type="button" data-c="'+i+'" class="'+(i===pcat?'on':'')+'">'+esc(L(c))+'</button>').join('')+'</div>')+'<div class="g4">'
 +items.map((x,i)=>'<article class="cd"><div class="im">'+im(x.photo,scene(i+1,x.icon),600)+'<span class="cat">'+esc(L(p.cats[x.cat]))+'</span></div><div class="bd"><h4>'+esc(L(x.t))+'</h4><div class="by"><i>'+avatar(i+2)+'</i>'+esc(x.by)+'</div><div class="ft2"><span>'+esc(L(x.m))+'</span><b>'+ic('star')+x.r+'</b></div></div></article>').join('')+'</div>'+(lim?'<div style="text-align:center;margin-top:26px">'+pill('academics.html',s_('viewall')+' →','solid')+'</div>':'')+'</div>')
}
function storyBlock(full){
 const s=SITE.story;
 return sec('rv','<div class="ab"><div class="abc"><div class="p a1">'+im('class2',scene(1,'book'),700)+'</div><div class="p a2">'+im('teacher',avatar(5),500)+'</div><div class="p a3">'+im('kids',scene(2,'star'),700)+'</div></div>'
 +'<div class="abt"><span class="eyebrow">'+esc(L(s.e))+'</span><h2>'+hu(L(s.t),L(s.hl))+'</h2>'+s.p.map(x=>'<p class="big">'+esc(L(x))+'</p>').join('')
 +(full?'':'<ul class="pts">'+SITE.method.map(m=>'<li>'+ic('check')+esc(L(m.t))+'</li>').join('')+'</ul>'+pill('about.html',s_('more')+' →','solid'))+'</div></div>')
}
function principal(){
 const p=SITE.principal;
 const ph=/^(uploads\/|https:\/\/)/.test(p.photo||'')?'<img alt="" src="'+esc(p.photo)+'">':avatar(7,{style:1,fem:false});
 return sec('rv','<div class="pr"><div class="im">'+ph+'</div><div><span class="eyebrow">'+s_('msgp')+'</span><blockquote>“'+esc(L(p.message))+'”</blockquote><b>'+esc(p.name)+'</b><small>'+esc(L(p.role))+'</small></div></div>')
}
function testimonials(){
 const t=SITE.testimonials;
 return '<section class="sec dk rv"><div class="wrap">'+head(L(t.e),esc(L(t.title)))+'<div class="g3">'+t.items.map((x,i)=>'<div class="tm"><span class="q">“</span><p>'+esc(L(x.x))+'</p><div class="who"><i>'+avatar(i+3)+'</i><div><b>'+esc(x.n)+'</b><small>'+esc(L(x.r))+'</small></div></div></div>').join('')+'</div></div></section>'
}
function notices(){
 const row=(d,t,x,c)=>{const f=fmtD(d);return '<div class="li"><div class="db" style="background:'+c+'"><b>'+f.d+'</b><small>'+f.m+'</small></div><div><h4>'+esc(L(t))+'</h4>'+(x?'<p>'+esc(L(x))+'</p>':'')+'</div></div>'};
 return sec('rv','<div class="two"><div class="panel"><h3>'+s_('notices')+'</h3>'+SITE.notices.map((n,i)=>row(n.date,n.t,n.x,PASTEL[i%8])).join('')+'</div><div class="panel"><h3>'+s_('events')+'</h3>'+SITE.events.map((n,i)=>row(n.date,n.t,'',PASTEL[(i+3)%8])).join('')+'</div></div>')
}
function ctaForm(){
 const a=SITE.admission;
 return sec('rv','<div class="cta-band"><div><span class="eyebrow lt">'+s_('follow')+'</span><h2>'+esc(L(a.t))+'</h2><p>'+esc(L(a.x))+'</p></div>'
 +'<form class="ef" id="ef"><input name="name" placeholder="'+esc(s_('nm'))+'" required maxlength="60"><input name="phone" type="tel" placeholder="'+esc(s_('ph'))+'" required maxlength="15"><input name="message" placeholder="'+esc(s_('msg'))+'" maxlength="600"><input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button class="pill orange" type="submit">'+s_('send')+'</button><div class="em" id="em"></div></form></div>')
}
function cards(){
 const c=(h,bg,i,l,v)=>(h?'<a class="cc" href="'+esc(h)+'"'+(/^https/.test(h)?' target="_blank" rel="noopener"':'')+'>':'<div class="cc">')+'<span class="ic" style="background:'+bg+'">'+ic(i)+'</span><b>'+l+'</b><span>'+esc(v)+'</span>'+(h?'</a>':'</div>');
 return '<div class="ct">'+c('tel:'+CFG.phone,'#d7f5ee','phone',s_('phone'),CFG.phone)+c('https://wa.me/'+CFG.whatsapp,'#d4f5d9','chat',s_('wa'),s_('chatus'))+c('mailto:'+CFG.email,'#e4d9ff','mail',s_('mail'),CFG.email)+c('','#ffe0cc','pin',s_('addr'),CFG.address)+'</div>'
}
function pageHero(k,photo){return '<section class="ph" style="background-image:url('+esc(U(photo,1400))+')"><div class="wrap"><h1>'+esc(s_('h_'+k))+'</h1><p>'+esc(s_('s_'+k))+'</p><div class="crumb"><a href="index.html">'+s_('home')+'</a><b>/</b>'+esc(s_('h_'+k))+'</div></div></section>'}

// ---------- pages ----------
const PAGES={
 home:()=>hero()+stats()+whyUs()+banner()+popular()+programs(4)+storyBlock()+testimonials()+notices()+ctaForm(),
 about:()=>pageHero('about','group')+storyBlock(true)
  +sec('rv',head(s_('vision'),esc(s_('vision')))+'<div class="g3">'+SITE.mvv.map(x=>'<div class="ft" style="background:'+x.c+'"><span class="ic">'+ic(x.i)+'</span><h3>'+esc(L(x.t))+'</h3><p>'+esc(L(x.x))+'</p></div>').join('')+'</div>')
  +sec('rv',head('',esc(s_('journey')))+'<div class="tl" style="max-width:760px;margin:auto">'+SITE.milestones.map(m=>'<div class="it"><b class="y">'+esc(m.y)+'</b><h4>'+esc(L(m.t))+'</h4><p>'+esc(L(m.x))+'</p></div>').join('')+'</div>')
  +principal()
  +sec('rv',head('',esc(s_('team')))+'<div class="team">'+SITE.staff.map((p,i)=>'<div class="tmc" style="background:'+PASTEL[i%8]+'"><div class="pic">'+im(p.photo,avatar(i+1),400)+'</div><b>'+esc(p.name)+'</b><span>'+esc(L(p.role))+'</span><small>'+esc(p.q||'')+'</small></div>').join('')+'</div>')
  ,
 acad:()=>pageHero('acad','class3')
  +sec('rv',head(L(SITE.levels.e),esc(L(SITE.levels.title)))+'<div class="g2">'+SITE.levels.items.map((x,i)=>'<article class="fc"><div class="im">'+im(x.photo,scene(i,x.i),800)+'<span class="tag">'+ic(x.i)+'</span><span class="gtag">'+esc(L(x.g))+'</span></div><div class="bd"><h3>'+esc(L(x.t))+'</h3><p>'+esc(L(x.x))+'</p><div class="chips">'+(x.s||[]).map(s=>'<i>'+esc(L(s))+'</i>').join('')+'</div></div></article>').join('')+'</div>')
  +sec('rv',head('',esc(s_('method')))+'<div class="g4">'+SITE.method.map((m,i)=>'<div class="ft" style="background:'+PASTEL[i]+'"><span class="ic">'+ic(m.i)+'</span><h3>'+esc(L(m.t))+'</h3><p>'+esc(L(m.x))+'</p></div>').join('')+'</div>')
  +programs(),
 fac:()=>pageHero('fac','smart')
  +sec('rv',head(L(SITE.facilities.e),esc(L(SITE.facilities.title)))+'<div class="g3">'+SITE.facilities.items.map((x,i)=>'<article class="fc"><div class="im">'+im(x.photo,scene(i,x.i),700)+'<span class="tag">'+ic(x.i)+'</span></div><div class="bd"><h3>'+esc(L(x.t))+'</h3><p>'+esc(L(x.x))+'</p></div></article>').join('')+'</div>')
  +popular(),
 adm:()=>pageHero('adm','girlsclass')
  +sec('rv',head(L(SITE.steps.e),esc(L(SITE.steps.title)))+'<div class="g4 stp">'+SITE.steps.items.map(x=>'<div class="it"><h4>'+esc(L(x.t))+'</h4><p>'+esc(L(x.x))+'</p></div>').join('')+'</div>')
  +sec('rv','<div class="two"><div><h3 style="font-size:24px;margin-bottom:14px">'+s_('elig')+'</h3><table class="tbl2"><tr><th>'+s_('class')+'</th><th>'+s_('age')+'</th></tr>'+SITE.eligibility.map(r=>'<tr><td>'+esc(L(r.c))+'</td><td>'+esc(L(r.a))+'</td></tr>').join('')+'</table></div>'
   +'<div><h3 style="font-size:24px;margin-bottom:14px">'+s_('docs')+'</h3><ul class="dl2">'+SITE.documents.map(d=>'<li>'+ic('check')+esc(L(d))+'</li>').join('')+'</ul><h3 style="font-size:24px;margin:26px 0 14px">'+s_('dates')+'</h3><ul class="dl2">'+SITE.dates.map(d=>{const f=fmtD(d.d);return '<li>'+ic('clock')+esc(L(d.t))+'<time>'+f.d+' '+f.m+'</time></li>'}).join('')+'</ul></div></div>')
  +sec('rv',head('',esc(s_('faq')))+'<div class="fq">'+SITE.faq.map(f=>'<details><summary>'+esc(L(f.q))+'</summary><p>'+esc(L(f.a))+'</p></details>').join('')+'</div>')
  +ctaForm(),
 gal:()=>pageHero('gal','twoboys')+sec('rv','<div class="tabs" id="gtabs" style="margin-top:0"></div><div class="gg" id="gg"></div>'),
 con:()=>pageHero('con','kids')+sec('rv',cards())
  +sec('rv','<div class="cg"><div class="panel"><h3>'+s_('hrs')+'</h3>'+SITE.hours.map(h=>'<div class="li"><div><h4>'+esc(L(h.d))+'</h4><p>'+esc(L(h.t))+'</p></div></div>').join('')+'</div><div class="map" id="map"></div></div>')+ctaForm()
};
let gcat=0;
function gallery(){
 const g=$('gg');if(!g)return;
 $('gtabs').innerHTML=SITE.galleryCats.map((c,i)=>'<button type="button" data-c="'+i+'" class="'+(i===gcat?'on':'')+'">'+esc(L(c))+'</button>').join('');
 const items=SITE.gallery.filter(x=>!gcat||x.c===gcat);
 g.innerHTML=items.map((x,i)=>'<div class="gi" data-k="'+x.k+'">'+im(x.k,scene(i,'star'),700)+'<div class="cap">'+esc(L(x.t))+'</div></div>').join('');
}
function mapInit(){
 const m=$('map');if(!m)return;
 m.innerHTML=(CFG.mapEmbed&&/^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/.test(CFG.mapEmbed))?'<iframe loading="lazy" title="map" src="'+esc(CFG.mapEmbed)+'"></iframe>':'<div class="mapph">'+ic('pin')+'<div><b>'+esc(CFG.name)+'</b><br>'+esc(CFG.address)+'</div></div>';
}
async function send(f,msgEl,ok){
 const d=Object.fromEntries(new FormData(f));
 if(!/^[0-9+\s-]{8,15}$/.test(d.phone||'')){msgEl.className=msgEl.className.replace(' ok','');msgEl.textContent=s_('err');return}
 msgEl.textContent='…';
 try{const r=await api('enquiry',{name:d.name||'Website visitor',phone:d.phone,message:d.message||'',website:d.website||''});
  if(r&&r.ok===false)throw new Error(r.error||'Error');
  msgEl.className=msgEl.className.split(' ')[0]+' ok';msgEl.textContent=s_('sent');f.reset()}
 catch(e){msgEl.className=msgEl.className.split(' ')[0];msgEl.textContent=e.message||'Error'}
}
function wire(){
 const qf=$('qf');if(qf)qf.onsubmit=e=>{e.preventDefault();send(qf,$('qm'))};
 const ef=$('ef');if(ef)ef.onsubmit=e=>{e.preventDefault();send(ef,$('em'))};
 const pt=$('ptabs');if(pt)pt.onclick=e=>{const b=e.target.closest('button');if(b){pcat=+b.dataset.c;render()}};
 const gt=$('gtabs');if(gt)gt.onclick=e=>{const b=e.target.closest('button');if(b){gcat=+b.dataset.c;gallery()}};
 const g=$('gg');if(g)g.onclick=e=>{const i=e.target.closest('.gi');if(!i)return;const k=i.dataset.k,l=document.createElement('div');l.className='lb';l.innerHTML='<img alt="" src="'+esc(U(k,1600))+'">';l.onclick=()=>l.remove();document.body.appendChild(l)};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){const l=document.querySelector('.lb');if(l)l.remove()}});
 if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.08});document.querySelectorAll('.rv').forEach(n=>io.observe(n))}else document.querySelectorAll('.rv').forEach(n=>n.classList.add('in'));
}
function render(){
 FB.length=0;document.documentElement.lang=getLang();document.documentElement.style.setProperty('--c',CFG.color||'#111');
 document.title=(PAGE==='home'?CFG.name+' — '+s_('tag'):s_('h_'+PAGE)+' | '+CFG.name);
 shell();$('main').innerHTML=(PAGES[PAGE]||PAGES.home)();gallery();mapInit();wire();
}
render();
