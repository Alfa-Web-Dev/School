// Public website renderer: data = site-data.js (SITE), art = art.js, school info = config.js (CFG)
const L=o=>o&&typeof o==='object'?(o[getLang()]||o.en||''):(o||'');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $=id=>document.getElementById(id);
let PAGE=document.body.dataset.page||'home';
const T={en:{home:'Home',about:'About',acad:'Academics',fac:'Facilities',adm:'Admission',gal:'Gallery',con:'Contact',login:'Login',enq:'Enquire now',ph:'Your phone number',call:'Call me back',menu:'Menu',wel:'Welcome to',adm_open:'Admissions open',privacy:'Privacy policy',h_privacy:'Privacy policy',s_privacy:'How we handle your information.',dl:'Downloads',agree:'By sending you agree to our',soon:'',follow2:'Follow us',sent:'Thanks! We will call you back soon.',nm:'Your name',msg:'Message (optional)',send:'Send enquiry',rights:'All rights reserved.',quick:'Quick links',reach:'Reach us',hrs:'School hours',addr:'Address',phone:'Phone',mail:'Email',method:'How we teach',wa:'WhatsApp',chatus:'Chat with us',more:'Learn more',viewall:'View all',notices:'Latest notices',events:'Upcoming events',story:'About us',team:'Our team',journey:'Our journey',vision:'Mission & vision',msgp:'From the principal\'s desk',elig:'Eligibility',docs:'Documents required',dates:'Important dates',faq:'Frequently asked questions',class:'Class',age:'Minimum age',cong:'Admissions open',cong2:'Limited seats',rate:'Parent rating',school:'School',loc:'Find us',tag:'Nurturing curious minds',desc:'Learn about our classes, facilities, admission process and school life.',portal:'Student / Parent login',follow:'Admission helpline',err:'Please enter a valid name and phone',h_about:'About our school',h_acad:'Academics',h_fac:'Campus & facilities',h_adm:'Admissions',h_gal:'Photo gallery',h_con:'Contact us',s_about:'Our story, values and the people behind the school.',s_acad:'From first steps to board exams, a path built for every child.',s_fac:'Spaces designed for learning, play and growth.',s_adm:'Simple steps, clear information, friendly help.',s_gal:'Moments from classrooms, playgrounds and celebrations.',s_con:'We would love to hear from you.'},
hi:{home:'होम',about:'हमारे बारे में',acad:'शिक्षा',fac:'सुविधाएँ',adm:'प्रवेश',gal:'गैलरी',con:'संपर्क',login:'लॉगिन',enq:'पूछताछ करें',ph:'आपका फ़ोन नंबर',call:'मुझे कॉल करें',menu:'मेनू',wel:'स्वागत है',adm_open:'प्रवेश जारी हैं',privacy:'गोपनीयता नीति',h_privacy:'गोपनीयता नीति',s_privacy:'हम आपकी जानकारी कैसे संभालते हैं।',dl:'डाउनलोड',agree:'भेजकर आप हमारी इस नीति से सहमत होते हैं:',soon:'',follow2:'हमें फ़ॉलो करें',sent:'धन्यवाद! हम जल्द ही आपको कॉल करेंगे।',nm:'आपका नाम',msg:'संदेश (वैकल्पिक)',send:'पूछताछ भेजें',rights:'सर्वाधिकार सुरक्षित।',quick:'त्वरित लिंक',reach:'संपर्क करें',hrs:'स्कूल का समय',addr:'पता',phone:'फ़ोन',mail:'ईमेल',method:'हम कैसे पढ़ाते हैं',wa:'व्हाट्सऐप',chatus:'हमसे चैट करें',more:'और जानें',viewall:'सभी देखें',notices:'ताज़ा सूचनाएँ',events:'आने वाले कार्यक्रम',story:'हमारे बारे में',team:'हमारी टीम',journey:'हमारा सफ़र',vision:'मिशन और विज़न',msgp:'प्रधानाचार्य का संदेश',elig:'पात्रता',docs:'ज़रूरी दस्तावेज़',dates:'महत्वपूर्ण तिथियाँ',faq:'अक्सर पूछे जाने वाले प्रश्न',class:'कक्षा',age:'न्यूनतम आयु',cong:'प्रवेश जारी',cong2:'सीमित सीटें',rate:'अभिभावक रेटिंग',school:'स्कूल',loc:'हमें खोजें',tag:'जिज्ञासु मन का विकास',desc:'हमारी कक्षाएँ, सुविधाएँ, प्रवेश प्रक्रिया और स्कूल जीवन के बारे में जानें।',portal:'छात्र / अभिभावक लॉगिन',follow:'प्रवेश हेल्पलाइन',err:'कृपया सही नाम और फ़ोन नंबर लिखें',h_about:'हमारे स्कूल के बारे में',h_acad:'शिक्षा',h_fac:'परिसर और सुविधाएँ',h_adm:'प्रवेश',h_gal:'फ़ोटो गैलरी',h_con:'संपर्क करें',s_about:'हमारी कहानी, मूल्य और स्कूल के पीछे के लोग।',s_acad:'पहले कदम से बोर्ड परीक्षा तक, हर बच्चे के लिए बना रास्ता।',s_fac:'सीखने, खेलने और आगे बढ़ने के लिए बने स्थान।',s_adm:'आसान चरण, साफ़ जानकारी, मित्रवत सहायता।',s_gal:'कक्षाओं, खेल के मैदानों और उत्सवों के पल।',s_con:'हमें आपसे बात करके खुशी होगी।'}};
Object.assign(T.en,{hf_e:'Get in touch',hf_h:'How can we help you?',hf_p:'Admission, a question, a review or a complaint — choose what it is about and we will get back to you.',hf_t:'Message type',lib:'Library',h_lib:'Study Library',s_lib:'Free notes, books, previous year papers and sample papers (PDF)',lb_all:'All',lb_cls:'Class',lb_sub:'Subject',lb_q:'Search notes, chapter or subject',lb_view:'View',lb_dl:'Download',lb_none:'No notes found yet.',lb_load:'Loading library…',lb_err:'Library could not be loaded. Please try again later.',lb_read:'Read online',lb_back:'Back to Library',lb_pdfhint:'Your device may not show the PDF here. Use Read online or Download.',lb_note:'',lb_pdf:'PDF',lb_img:'Photo'});
Object.assign(T.hi,{hf_e:'संपर्क करें',hf_h:'हम आपकी कैसे मदद कर सकते हैं?',hf_p:'प्रवेश, कोई प्रश्न, समीक्षा या शिकायत — बताइए किस बारे में है, हम आपसे संपर्क करेंगे।',hf_t:'संदेश का प्रकार',lib:'लाइब्रेरी',h_lib:'अध्ययन लाइब्रेरी',s_lib:'मुफ़्त नोट्स, किताबें, पिछले वर्ष के प्रश्नपत्र और सैंपल पेपर (PDF)',lb_all:'सभी',lb_cls:'कक्षा',lb_sub:'विषय',lb_q:'नोट्स, अध्याय या विषय खोजें',lb_view:'देखें',lb_dl:'डाउनलोड',lb_none:'अभी कोई नोट्स नहीं मिले।',lb_load:'लाइब्रेरी लोड हो रही है…',lb_err:'लाइब्रेरी लोड नहीं हो सकी। कृपया बाद में कोशिश करें।',lb_read:'ऑनलाइन पढ़ें',lb_back:'लाइब्रेरी पर वापस',lb_pdfhint:'आपके डिवाइस पर PDF यहाँ न दिखे तो ऑनलाइन पढ़ें या डाउनलोड करें।',lb_note:'',lb_pdf:'PDF',lb_img:'फ़ोटो'});
Object.assign(T.en,{"f_t_adm": "Admission enquiry", "f_t_cmp": "Complaint", "f_t_rev": "Review", "f_t_gen": "Question", "f_s_adm": "Join our school", "f_s_cmp": "Tell us what went wrong", "f_s_rev": "Rate your experience", "f_s_gen": "Ask anything", "r_parent": "Parent", "r_student": "Student", "r_teacher": "Teacher", "r_visitor": "New visitor", "r_alumni": "Alumni", "f_iam": "I am a", "f_name": "Your name", "f_phone": "Phone number", "f_email": "Email (optional)", "f_child": "Child's name", "f_clsa": "Class for admission", "f_cls": "Class (optional)", "f_msg": "Message", "f_msgo": "Message (optional)", "f_cat": "Complaint about", "c_teach": "Teaching", "c_fees": "Fees", "c_trans": "Transport", "c_safe": "Safety", "c_staff": "Staff behaviour", "c_fac": "Facilities", "c_oth": "Other", "f_urgent": "This is urgent", "f_rate": "Your rating", "f_rtitle": "Review title", "f_rtext": "Your review", "f_show": "You may show my review on the website", "f_topic": "Topic", "f_cmsg": "Describe the problem", "f_b_adm": "Send enquiry", "f_b_cmp": "Submit complaint", "f_b_rev": "Post review", "f_b_gen": "Send question", "f_h_adm": "Start your child's journey", "f_p_adm": "We will call you within one working day.", "f_h_cmp": "We take every complaint seriously", "f_p_cmp": "Your complaint goes straight to the school office and is handled in confidence.", "f_h_rev": "How was your experience?", "f_p_rev": "Honest feedback helps us improve and helps other parents.", "f_h_gen": "Have a question?", "f_p_gen": "Ask about fees, timings, transport or anything else.", "f_ok_adm": "Thank you! Our office will call you soon.", "f_ok_cmp": "Your complaint is registered. We will look into it and get back to you.", "f_ok_rev": "Thank you for your review!", "f_ok_gen": "Thanks! We will reply soon.", "f_again": "Send another", "f_e_name": "Please enter your name", "f_e_phone": "Enter a valid phone number", "f_e_mail": "Enter a valid email", "f_e_msg": "Please write a message", "f_e_rate": "Please choose a star rating", "f_more": "Complaint or feedback?", "f_none": "Select", "nur": "Nursery", "lkg": "LKG", "ukg": "UKG", "cl": "Class"});
Object.assign(T.hi,{"f_t_adm": "प्रवेश पूछताछ", "f_t_cmp": "शिकायत", "f_t_rev": "समीक्षा", "f_t_gen": "प्रश्न", "f_s_adm": "हमारे स्कूल में प्रवेश", "f_s_cmp": "हमें समस्या बताइए", "f_s_rev": "अपना अनुभव बताइए", "f_s_gen": "कुछ भी पूछिए", "r_parent": "अभिभावक", "r_student": "छात्र", "r_teacher": "शिक्षक", "r_visitor": "नए विज़िटर", "r_alumni": "पूर्व छात्र", "f_iam": "मैं हूँ", "f_name": "आपका नाम", "f_phone": "फ़ोन नंबर", "f_email": "ईमेल (वैकल्पिक)", "f_child": "बच्चे का नाम", "f_clsa": "प्रवेश के लिए कक्षा", "f_cls": "कक्षा (वैकल्पिक)", "f_msg": "संदेश", "f_msgo": "संदेश (वैकल्पिक)", "f_cat": "शिकायत किस बारे में", "c_teach": "पढ़ाई", "c_fees": "फ़ीस", "c_trans": "परिवहन", "c_safe": "सुरक्षा", "c_staff": "स्टाफ़ का व्यवहार", "c_fac": "सुविधाएँ", "c_oth": "अन्य", "f_urgent": "यह ज़रूरी है", "f_rate": "आपकी रेटिंग", "f_rtitle": "समीक्षा का शीर्षक", "f_rtext": "आपकी समीक्षा", "f_show": "मेरी समीक्षा वेबसाइट पर दिखा सकते हैं", "f_topic": "विषय", "f_cmsg": "समस्या बताइए", "f_b_adm": "पूछताछ भेजें", "f_b_cmp": "शिकायत दर्ज करें", "f_b_rev": "समीक्षा भेजें", "f_b_gen": "प्रश्न भेजें", "f_h_adm": "अपने बच्चे का सफ़र शुरू करें", "f_p_adm": "हम एक कार्य-दिवस में आपको कॉल करेंगे।", "f_h_cmp": "हम हर शिकायत गंभीरता से लेते हैं", "f_p_cmp": "आपकी शिकायत सीधे स्कूल कार्यालय तक पहुँचती है और गोपनीय रखी जाती है।", "f_h_rev": "आपका अनुभव कैसा रहा?", "f_p_rev": "ईमानदार राय हमें बेहतर बनाती है और दूसरे अभिभावकों की मदद करती है।", "f_h_gen": "कोई प्रश्न है?", "f_p_gen": "फ़ीस, समय, परिवहन या कुछ भी पूछिए।", "f_ok_adm": "धन्यवाद! हमारा कार्यालय जल्द आपको कॉल करेगा।", "f_ok_cmp": "आपकी शिकायत दर्ज हो गई है। हम जाँच करके आपसे संपर्क करेंगे।", "f_ok_rev": "आपकी समीक्षा के लिए धन्यवाद!", "f_ok_gen": "धन्यवाद! हम जल्द उत्तर देंगे।", "f_again": "एक और भेजें", "f_e_name": "कृपया अपना नाम लिखें", "f_e_phone": "सही फ़ोन नंबर लिखें", "f_e_mail": "सही ईमेल लिखें", "f_e_msg": "कृपया संदेश लिखें", "f_e_rate": "कृपया स्टार रेटिंग चुनें", "f_more": "शिकायत या सुझाव?", "f_none": "चुनें", "nur": "नर्सरी", "lkg": "एलकेजी", "ukg": "यूकेजी", "cl": "कक्षा"});
const s_=k=>(T[getLang()]||T.en)[k]||k;
const UL='<svg viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M2 8Q50 0 100 6T198 4" fill="none" stroke="var(--o)" stroke-width="4" stroke-linecap="round"/></svg>';
const PASTEL=['#fde2ef','#d7f5ee','#ffe9a8','#e4d9ff','#d6e6ff','#ffe0cc','#d4f5d9','#fff0bd'];
const hu=(a,b)=>esc(a)+' <span class="h-u">'+esc(b)+UL+'</span>';
const fmtD=d=>{const x=new Date(d+'T00:00:00');return isNaN(x)?{d:'',m:''}:{d:x.getDate(),m:x.toLocaleDateString(getLang()==='hi'?'hi-IN':'en-IN',{month:'short'})}};
const E=(p,o)=>' data-e="'+p+(o?'|'+o:'')+'"',EA=p=>' data-ea="'+p+'"';
const pu=(v,w)=>PH[v]!==undefined?U(v,w):(/^(uploads\/|https:\/\/|data:image\/)/.test(v||'')?v:'');
SITE.hero.photos=SITE.hero.photos||['class1','girls','boyBook','group'];SITE.story.photos=SITE.story.photos||['class2','teacher','kids'];
const ink=c=>{const m=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(c||'');if(!m)return '#fff';const l=(.299*parseInt(m[1],16)+.587*parseInt(m[2],16)+.114*parseInt(m[3],16))/255;return l>.62?'#111':'#fff'};
const FB=[];
// Internet photo (Unsplash) with illustration fallback if it fails to load
const im=(key,fb,w)=>{FB.push(fb);return '<img loading="lazy" alt="" src="'+esc(U(key,w))+'" onerror="this.outerHTML=FB['+(FB.length-1)+']">'};
const sec=(cls,inner)=>'<section class="sec '+cls+'"><div class="wrap">'+inner+'</div></section>';
const head=(e,t,p,c,at)=>'<div class="sh'+(c===false?'':' c')+'"'+(at||'')+'>'+(e?'<span class="eyebrow">'+esc(e)+'</span>':'')+'<h2>'+t+'</h2>'+(p?'<p>'+esc(p)+'</p>':'')+'</div>';
const pill=(href,txt,cls)=>'<a class="pill '+(cls||'solid')+'" href="'+href+'">'+txt+'</a>';
const cityPhoto=(it,i,ic)=>im(it.photo,scene(i,ic||it.i||it.icon||'book'));

const NAV=[['index.html','home'],['about.html','about'],['academics.html','acad'],['facilities.html','fac'],['admission.html','adm'],['library.html','lib'],['gallery.html','gal'],['contact.html','con']];
const PID={lib:'lib',libitem:'lib',home:'home',about:'about',acad:'acad',fac:'fac',adm:'adm',gal:'gal',con:'con'};

function shell(){
 const lg=okLogo()?'<img src="'+esc(SITE.logo)+'" alt="">':'<span class="lm">'+esc((CFG.shortName||SN()||'S').trim().charAt(0))+'</span>';
 const links=NAV.map(n=>'<a href="'+n[0]+'"'+(PID[PAGE]===n[1]?' class="on"':'')+'>'+s_(n[1])+'</a>').join('');
 $('top').innerHTML='<div class="tb"><div class="mq"><div class="mqt">'+[0,1,2,3].map(()=>'<span>'+s_('wel')+' <b>'+esc(SN())+'</b></span><span class="dot">✦</span><span>'+s_('adm_open')+'</span><span class="dot">✦</span><span>'+ic('phone')+' '+esc(CFG.phone)+'</span><span class="dot">✦</span>').join('')+'</div></div></div>'
 +'<header class="nav"><div class="wrap nv"><a class="brand" href="index.html">'+lg+'<span>'+esc(SN())+'</span></a><nav id="links">'+links+'</nav><div class="nvr"><button class="pill sm ghost" id="lg" type="button">'+(getLang()==='hi'?'EN':'हिं')+'</button><a class="pill sm orange" href="login.html">'+s_('login')+'</a><button id="mb" aria-label="'+s_('menu')+'" type="button">☰</button></div></div></header>';
 const fl=NAV.slice(1).map(n=>'<li><a href="'+n[0]+'">'+s_(n[1])+'</a></li>').join('')+'<li><a href="privacy.html">'+s_('privacy')+'</a></li>';
 const SOC=[['facebook','Facebook','फ़ेसबुक'],['instagram','Instagram','इंस्टाग्राम'],['youtube','YouTube','यूट्यूब']].filter(x=>/^https:\/\//.test((CFG.social||{})[x[0]]||'')).map(x=>'<li><a href="'+esc(CFG.social[x[0]])+'" target="_blank" rel="noopener">'+(getLang()==='hi'?x[2]:x[1])+'</a></li>').join('');
 $('foot').innerHTML='<footer><div class="wrap"><div class="fg"><div><a class="brand" href="index.html">'+lg+'<span>'+esc(SN())+'</span></a><p>'+esc(s_('desc'))+'</p></div>'
 +'<div><h5>'+s_('hrs')+'</h5><ul>'+SITE.hours.map(h=>'<li>'+esc(L(h.d))+'<br><b style="color:#fff">'+esc(L(h.t))+'</b></li>').join('')+'</ul></div>'
 +'<div><h5>'+s_('reach')+'</h5><ul><li><a href="'+MAPU()+'" target="_blank" rel="noopener">'+esc(SA())+'</a></li><li><a href="tel:'+esc(CFG.phone)+'">'+esc(CFG.phone)+'</a></li><li><a href="mailto:'+esc(CFG.email)+'">'+esc(CFG.email)+'</a></li><li><a href="login.html">'+s_('portal')+'</a></li>'+SOC+'</ul></div></div>'
 +'<div class="fbar"><span>© '+new Date().getFullYear()+' '+esc(SN())+'. '+s_('rights')+'</span><span><a href="privacy.html">'+s_('privacy')+'</a></span></div></div></footer>'
 +'<a class="wa" href="https://wa.me/'+esc(CFG.whatsapp)+'" target="_blank" rel="noopener" aria-label="'+s_('wa')+'"><svg class="i" viewBox="0 0 24 24" style="width:28px;height:28px">'+IC.chat+'</svg></a>';
 $('lg').onclick=()=>{setLang(getLang()==='hi'?'en':'hi');render()};
 $('mb').onclick=()=>$('links').classList.toggle('open');
}
const okLogo=()=>/^(uploads\/|assets\/|https:\/\/)/.test(SITE.logo||'');

// ---------- blocks ----------
function hero(){
 const h=SITE.hero;
 return '<section class="hero"><div class="wrap hg"><div'+E('hero','pre,hl,sub,badge,happy,photos')+'><span class="badge">'+esc(L(h.badge))+'</span><h1>'+esc(L(h.pre))+' <span class="hlt">'+esc(L(h.hl))+UL+'</span></h1><p class="sub">'+esc(L(h.sub))+'</p>'
 +'<form class="quick" id="qf"><input name="phone" type="tel" required maxlength="15" placeholder="'+esc(s_('ph'))+'"><input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button class="pill solid" type="submit">'+s_('call')+'</button></form><div class="qm" id="qm"></div>'
 +'<div class="happy"><div class="stack">'+[3,4,5,6].map(i=>'<i>'+avatar(i)+'</i>').join('')+'</div><span>'+esc(L(h.happy))+'</span></div></div>'
 +'<div class="hr"'+E('hero','photos')+'><div class="p p1">'+im(h.photos[0],avatar(0,{book:true,bg:'#b9a4ff'}),600)+'</div><div class="p p2">'+im(h.photos[1],avatar(1,{bg:'#8fe3d8'}),600)+'</div><div class="p p3">'+im(h.photos[2],avatar(2,{bg:'#ffe08a'}),600)+'</div><div class="p p4">'+im(h.photos[3],avatar(3,{bg:'#ffb8d9'}),600)+'</div>'
 +'<div class="fb a"><span class="ic" style="background:#ffe7d1;color:#f97316">'+ic('award')+'</span><div><b>'+esc(s_('cong'))+'</b><small>'+esc(s_('cong2'))+'</small></div></div>'
 +'<div class="fb b"><span class="ic" style="background:#fff3c4;color:#f59e0b">'+ic('star')+'</span><div><b>4.9 ★</b><small>'+esc(s_('rate'))+'</small></div></div></div></div></section>';
}
function stats(){return '<section class="wrap"><div class="sg"'+EA('stats')+'>'+SITE.stats.map((x,i)=>'<div class="st"'+E('stats.'+i)+'><span class="ic" style="background:'+x.c+';color:'+x.k+'">'+ic(x.i)+'</span><div><b>'+esc(L(x.n))+'</b><span>'+esc(L(x.l))+'</span></div></div>').join('')+'</div></section>'}
function whyUs(){const w=SITE.why;return sec('rv',head(L(w.e),hu(L(w.t),L(w.hl)),'',true,E('why','e,t,hl'))+'<div class="g3"'+EA('why.items')+'>'+w.items.map((x,i)=>'<div class="ft"'+E('why.items.'+i)+' style="background:'+x.c+'"><span class="ic">'+ic(x.i)+'</span><h3>'+esc(L(x.t))+'</h3><p>'+esc(L(x.x))+'</p></div>').join('')+'</div>')}
function banner(){const b=SITE.banner;return sec('rv','<div class="bn"'+E('banner')+(b.c?' style="background:'+b.c+'"':'')+'><div><h2>'+esc(L(b.t))+' <em>'+esc(L(b.hl))+'</em></h2><p>'+esc(L(b.x))+'</p>'+pill('admission.html',esc(L(b.btn)),'solid')+'</div><div class="im">'+im(b.photo,scene(5,'star'),900)+'</div></div>')}
function popular(){const p=SITE.popular;return sec('rv','<div class="pp"><div class="ppl"'+E('popular','e,title')+'><span class="eyebrow">'+esc(L(p.e))+'</span><h2>'+esc(L(p.title))+'</h2><p>'+esc(L(SITE.banner.x))+'</p></div><div class="pt"'+EA('popular.items')+'>'+p.items.map((x,i)=>'<div class="pc"'+E('popular.items.'+i)+' style="background:'+x.c+'"><span class="ic">'+ic(x.i)+'</span><b>'+esc(L(x.t))+'</b><span>'+esc(L(x.x))+'</span></div>').join('')+'</div></div>')}
let pcat=0;
function programs(lim){
 const p=SITE.programs;
 const al=p.items.map((x,k)=>({x,k})),items=lim?al.slice(0,lim):al.filter(o=>!pcat||o.x.cat===pcat);
 return sec('rv','<div class="lav">'+head(L(p.e),esc(L(p.title)),'',true,E('programs','e,title'))+(lim?'':'<div class="tabs" id="ptabs">'+p.cats.map((c,i)=>'<button type="button" data-c="'+i+'" class="'+(i===pcat?'on':'')+'">'+esc(L(c))+'</button>').join('')+'</div>')+'<div class="g4"'+EA('programs.items')+'>'
 +items.map((o,i)=>{const x=o.x;return '<article class="cd"'+E('programs.items.'+o.k)+'><div class="im">'+im(x.photo,scene(i+1,x.icon),600)+'<span class="cat">'+esc(L(p.cats[x.cat]))+'</span></div><div class="bd"><h4>'+esc(L(x.t))+'</h4><div class="by"><i>'+avatar(i+2)+'</i>'+esc(L(x.by))+'</div><div class="ft2"><span>'+esc(L(x.m))+'</span><b>'+ic('star')+x.r+'</b></div></div></article>'}).join('')+'</div>'+(lim?'<div style="text-align:center;margin-top:26px">'+pill('academics.html',s_('viewall')+' →','solid')+'</div>':'')+'</div>')
}
function storyBlock(full){
 const s=SITE.story;
 return sec('rv','<div class="ab"><div class="abc"'+E('story','photos')+'><div class="p a1">'+im(s.photos[0],scene(1,'book'),700)+'</div><div class="p a2">'+im(s.photos[1],avatar(5),500)+'</div><div class="p a3">'+im(s.photos[2],scene(2,'star'),700)+'</div></div>'
 +'<div class="abt"'+E('story','e,t,hl,p,photos')+'><span class="eyebrow">'+esc(L(s.e))+'</span><h2>'+hu(L(s.t),L(s.hl))+'</h2>'+s.p.map(x=>'<p class="big">'+esc(L(x))+'</p>').join('')
 +(full?'':'<ul class="pts">'+SITE.method.map(m=>'<li>'+ic('check')+esc(L(m.t))+'</li>').join('')+'</ul>'+pill('about.html',s_('more')+' →','solid'))+'</div></div>')
}
function principal(){
 const p=SITE.principal;
 const pq=pu(p.photo,700),ph=pq?'<img alt="" src="'+esc(pq)+'">':avatar(7,{style:1,fem:false});
 return sec('rv','<div class="pr"'+E('principal')+'><div class="im">'+ph+'</div><div><span class="eyebrow">'+s_('msgp')+'</span><blockquote>“'+esc(L(p.message))+'”</blockquote><b>'+esc(L(p.name))+'</b><small>'+esc(L(p.role))+'</small></div></div>')
}
function testimonials(){
 const t=SITE.testimonials;
 return '<section class="sec dk rv"><div class="wrap">'+head(L(t.e),esc(L(t.title)),'',true,E('testimonials','e,title'))+'<div class="g3"'+EA('testimonials.items')+'>'+t.items.map((x,i)=>'<div class="tm"'+E('testimonials.items.'+i)+'><span class="q">“</span><p>'+esc(L(x.x))+'</p><div class="who"><i>'+avatar(i+3)+'</i><div><b>'+esc(L(x.n))+'</b><small>'+esc(L(x.r))+'</small></div></div></div>').join('')+'</div></div></section>'
}
function notices(){
 const row=(d,t,x,c,pa)=>{const f=fmtD(d);return '<div class="li"'+E(pa)+'><div class="db" style="background:'+c+'"><b>'+f.d+'</b><small>'+f.m+'</small></div><div><h4>'+esc(L(t))+'</h4>'+(x?'<p>'+esc(L(x))+'</p>':'')+'</div></div>'};
 return sec('rv','<div class="two"><div class="panel"'+EA('notices')+'><h3>'+s_('notices')+'</h3>'+SITE.notices.map((n,i)=>row(n.date,n.t,n.x,n.c||PASTEL[i%8],'notices.'+i)).join('')+'</div><div class="panel"'+EA('events')+'><h3>'+s_('events')+'</h3>'+SITE.events.map((n,i)=>row(n.date,n.t,'',n.c||PASTEL[(i+3)%8],'events.'+i)).join('')+'</div></div>')
}
function ctaForm(){
 const a=SITE.admission;
 return sec('rv','<div class="cta-band"><div'+E('admission')+'><span class="eyebrow lt">'+s_('follow')+'</span><h2>'+esc(L(a.t))+'</h2><p>'+esc(L(a.x))+'</p></div>'
 +'<form class="ef" id="ef"><input name="name" placeholder="'+esc(s_('nm'))+'" required maxlength="60"><input name="phone" type="tel" placeholder="'+esc(s_('ph'))+'" required maxlength="15"><input name="message" placeholder="'+esc(s_('msg'))+'" maxlength="600"><input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button class="pill orange" type="submit">'+s_('send')+'</button><div class="em" id="em"></div><small style="color:#6a6a76">'+s_('agree')+' <a href="privacy.html" style="text-decoration:underline">'+s_('privacy')+'</a> · <a href="contact.html?form=complaint" style="text-decoration:underline">'+s_('f_more')+'</a></small></form></div>')
}
function homeForm(){
 const o=(a,pre)=>a.map(x=>'<option value="'+x[0]+'">'+esc(s_(pre+x[1]))+'</option>').join('');
 return sec('rv','<div class="hf"><div class="hfl"><span class="eyebrow">'+esc(s_('hf_e'))+'</span><h2>'+esc(s_('hf_h'))+'</h2><p>'+esc(s_('hf_p'))+'</p><div class="hfk"><a href="contact.html?form=admission">'+ic('cap')+'<span>'+esc(s_('f_t_adm'))+'</span></a><a href="contact.html?form=review">'+ic('star')+'<span>'+esc(s_('f_t_rev'))+'</span></a><a href="contact.html?form=complaint">'+ic('shield')+'<span>'+esc(s_('f_t_cmp'))+'</span></a></div></div>'
 +'<form class="hfr" id="hf" novalidate><div class="two2"><div class="fl"><label>'+esc(s_('hf_t'))+'</label><select name="type">'+o([['admission','adm'],['general','gen'],['review','rev'],['complaint','cmp']],'f_t_')+'</select></div><div class="fl"><label>'+esc(s_('f_iam'))+'</label><select name="role">'+o([['parent','parent'],['student','student'],['teacher','teacher'],['visitor','visitor']],'r_')+'</select></div></div>'
 +'<div class="two2"><div class="fl"><label>'+esc(s_('f_name'))+'</label><input name="name" required maxlength="60"></div><div class="fl"><label>'+esc(s_('f_phone'))+'</label><input name="phone" type="tel" inputmode="tel" required maxlength="15"></div></div>'
 +'<div class="fl"><label>'+esc(s_('f_email'))+'</label><input name="email" type="email" maxlength="80"></div><div class="fl"><label>'+esc(s_('f_msgo'))+'</label><textarea name="message" rows="3" maxlength="1000"></textarea></div>'
 +'<input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><button class="pill solid" type="submit">'+esc(s_('send'))+'</button><div class="em" id="hfm"></div></form></div>')}
function results(){const r=SITE.results;if(!r)return '';const MED=['#f5b301','#a8b0ba','#c97b3d'];return sec('rv',head(L(r.e),esc(L(r.title)),'',true,E('results','e,title'))+'<div class="g4"'+EA('results.items')+'>'+r.items.map((x,i)=>'<div class="top"'+E('results.items.'+i)+' style="--k:'+(x.c2||MED[i]||'#111')+'"><div class="tpic">'+(x.photo?im(x.photo,avatar(i+2),400):avatar(i+2))+'<span class="medal">'+(i+1)+'</span></div><b>'+esc(L(x.n))+'</b><span>'+esc(L(x.c))+'</span><div class="pc2">'+esc(x.m)+'</div><small>'+esc(x.y)+'</small></div>').join('')+'</div>')}
function downloads(){const d=(SITE.downloads||[]).map((x,i)=>({x,i})).filter(o=>window.STUDIO||o.x.f);if(!d.length)return '';return sec('rv',head('',esc(s_('dl')),'',true)+'<div class="fq"'+EA('downloads')+'>'+d.map(o=>'<a class="dl2li" '+(o.x.f?'href="'+esc(o.x.f)+'" target="_blank" rel="noopener"':'')+E('downloads.'+o.i)+'>'+ic('dl')+'<span>'+esc(L(o.x.t))+'</span><time>'+esc(o.x.size||'')+'</time></a>').join('')+'</div>')}
function privacyPage(){const hi=getLang()==='hi',P=hi?[['हम कौन सी जानकारी लेते हैं','पूछताछ फ़ॉर्म में आप अपना नाम, फ़ोन नंबर और संदेश देते हैं। छात्र पोर्टल में प्रवेश के समय स्कूल द्वारा दर्ज जानकारी रखी जाती है।'],['जानकारी का उपयोग','आपकी जानकारी सिर्फ़ आपसे संपर्क करने, प्रवेश और स्कूल की सेवाओं के लिए इस्तेमाल होती है। हम इसे बेचते या विज्ञापन के लिए साझा नहीं करते।'],['जानकारी कौन देख सकता है','सिर्फ़ स्कूल के अधिकृत एडमिन और संबंधित शिक्षक। छात्र और अभिभावक अपनी ही जानकारी देख सकते हैं।'],['आपके अधिकार','अपनी जानकारी सुधारने या हटाने के लिए स्कूल कार्यालय से संपर्क करें।'],['संपर्क','इस नीति के बारे में प्रश्न हों तो ऊपर दिए गए फ़ोन या ईमेल पर संपर्क करें।']]:[['What we collect','The enquiry form collects your name, phone number and message. The student portal holds details entered by the school at admission.'],['How we use it','Your information is used only to contact you and for admissions and school services. We do not sell it or share it for advertising.'],['Who can see it','Only authorised school admins and the relevant teachers. Students and parents can see only their own information.'],['Your rights','To correct or delete your information, contact the school office.'],['Contact','For any question about this policy, use the phone or email shown on this website.']];return pageHero('privacy','books')+sec('rv','<div class="fq">'+P.map(x=>'<details open><summary>'+esc(x[0])+'</summary><p>'+esc(x[1])+'</p></details>').join('')+'</div>')}
const MAPU=()=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(CFG.address||'');
function cards(){
 const c=(h,bg,i,l,v)=>(h?'<a class="cc" href="'+esc(h)+'"'+(/^https/.test(h)?' target="_blank" rel="noopener"':'')+'>':'<div class="cc">')+'<span class="ic" style="background:'+bg+'">'+ic(i)+'</span><b>'+l+'</b><span>'+esc(v)+'</span>'+(h?'</a>':'</div>');
 return '<div class="ct"'+E('CFG','name,nameHi,shortName,phone,whatsapp,email,address,addressHi,mapEmbed,accent,social')+'>'+c('tel:'+CFG.phone,'#d7f5ee','phone',s_('phone'),CFG.phone)+c('https://wa.me/'+CFG.whatsapp,'#d4f5d9','chat',s_('wa'),s_('chatus'))+c('mailto:'+CFG.email,'#e4d9ff','mail',s_('mail'),CFG.email)+c(MAPU(),'#ffe0cc','pin',s_('addr'),SA())+'</div>'
}
function pageHero(k,photo){return '<section class="ph" style="background-image:url('+esc(U(photo,1400))+')"><div class="wrap"><h1>'+esc(s_('h_'+k))+'</h1><p>'+esc(s_('s_'+k))+'</p><div class="crumb"><a href="index.html">'+s_('home')+'</a><b>/</b>'+esc(s_('h_'+k))+'</div></div></section>'}

// ---------- pages ----------
const PAGES={
 home:()=>hero()+stats()+whyUs()+banner()+popular()+programs(4)+storyBlock()+testimonials()+notices()+homeForm(),
 about:()=>pageHero('about','group')+storyBlock(true)
  +sec('rv',head(s_('vision'),esc(s_('vision')))+'<div class="g3"'+EA('mvv')+'>'+SITE.mvv.map((x,i)=>'<div class="ft"'+E('mvv.'+i)+' style="background:'+x.c+'"><span class="ic">'+ic(x.i)+'</span><h3>'+esc(L(x.t))+'</h3><p>'+esc(L(x.x))+'</p></div>').join('')+'</div>')
  +sec('rv',head('',esc(s_('journey')))+'<div class="tl"'+EA('milestones')+' style="max-width:760px;margin:auto">'+SITE.milestones.map((m,i)=>'<div class="it"'+E('milestones.'+i)+'><b class="y">'+esc(m.y)+'</b><h4>'+esc(L(m.t))+'</h4><p>'+esc(L(m.x))+'</p></div>').join('')+'</div>')
  +principal()
  +sec('rv',head('',esc(s_('team')))+'<div class="team"'+EA('staff')+'>'+SITE.staff.map((p,i)=>'<div class="stc"'+E('staff.'+i)+' style="--k:'+(p.c||PASTEL[i%8])+'"><div class="stp">'+im(p.photo,avatar(i+1),500)+'</div><div class="stb"><b>'+esc(L(p.name))+'</b><span>'+esc(L(p.role))+'</span><small>'+esc(L(p.q)||'')+'</small></div></div>').join('')+'</div>')
  +ctaForm(),
 acad:()=>pageHero('acad','class3')+'' 
  +sec('rv',head(L(SITE.levels.e),esc(L(SITE.levels.title)),'',true,E('levels','e,title'))+'<div class="lvs"'+EA('levels.items')+'>'+SITE.levels.items.map((x,i)=>'<article class="lv'+(i%2?' rev':'')+'"'+E('levels.items.'+i)+'><div class="lim">'+im(x.photo,scene(i,x.i),800)+'</div><div class="lbd"><span class="lg" style="background:'+(x.c||'#111')+';color:'+ink(x.c||'#111')+'">'+ic(x.i)+' '+esc(L(x.g))+'</span><h3>'+esc(L(x.t))+'</h3><p>'+esc(L(x.x))+'</p><div class="chips">'+(x.s||[]).map(s=>'<i>'+esc(L(s))+'</i>').join('')+'</div></div></article>').join('')+'</div>')
  +sec('rv',head('',esc(s_('method')))+'<div class="g4"'+EA('method')+'>'+SITE.method.map((m,i)=>'<div class="ft"'+E('method.'+i)+' style="background:'+(m.c||PASTEL[i])+'"><span class="ic">'+ic(m.i)+'</span><h3>'+esc(L(m.t))+'</h3><p>'+esc(L(m.x))+'</p></div>').join('')+'</div>')
  +programs()+results()+ctaForm(),
 fac:()=>pageHero('fac','smart')
  +sec('rv',head(L(SITE.facilities.e),esc(L(SITE.facilities.title)),'',true,E('facilities','e,title'))+'<div class="g3 pfs"'+EA('facilities.items')+'>'+SITE.facilities.items.map((x,i)=>'<article class="pf"'+E('facilities.items.'+i)+'>'+im(x.photo,scene(i,x.i),700)+'<span class="tag"'+(x.c?' style="background:'+x.c+';color:'+ink(x.c)+'"':'')+'>'+ic(x.i)+'</span><div class="pbd"><h3>'+esc(L(x.t))+'</h3><p>'+esc(L(x.x))+'</p></div></article>').join('')+'</div>')
  +popular()+ctaForm(),
 adm:()=>pageHero('adm','girlsclass')
  +sec('rv',head(L(SITE.steps.e),esc(L(SITE.steps.title)),'',true,E('steps','e,title'))+'<div class="g4 stp"'+EA('steps.items')+'>'+SITE.steps.items.map((x,i)=>'<div class="it"'+E('steps.items.'+i)+'><h4>'+esc(L(x.t))+'</h4><p>'+esc(L(x.x))+'</p></div>').join('')+'</div>')
  +sec('rv','<div class="two"><div'+E('eligibility')+'><h3 style="font-size:24px;margin-bottom:14px">'+s_('elig')+'</h3><table class="tbl2"><tr><th>'+s_('class')+'</th><th>'+s_('age')+'</th></tr>'+SITE.eligibility.map(r=>'<tr><td>'+esc(L(r.c))+'</td><td>'+esc(L(r.a))+'</td></tr>').join('')+'</table></div>'
   +'<div><h3 style="font-size:24px;margin-bottom:14px">'+s_('docs')+'</h3><ul class="dl2"'+E('documents')+'>'+SITE.documents.map(d=>'<li>'+ic('check')+esc(L(d))+'</li>').join('')+'</ul><h3 style="font-size:24px;margin:26px 0 14px">'+s_('dates')+'</h3><ul class="dl2"'+E('dates')+'>'+SITE.dates.map(d=>{const f=fmtD(d.d);return '<li>'+ic('clock')+esc(L(d.t))+'<time>'+f.d+' '+f.m+'</time></li>'}).join('')+'</ul></div></div>')
  +downloads()
  +sec('rv',head('',esc(s_('faq')))+'<div class="fq"'+EA('faq')+'>'+SITE.faq.map((f,i)=>'<details'+E('faq.'+i)+'><summary>'+esc(L(f.q))+'</summary><p>'+esc(L(f.a))+'</p></details>').join('')+'</div>')
  +ctaForm(),
 gal:()=>pageHero('gal','twoboys')+sec('rv','<div class="tabs" id="gtabs" style="margin-top:0"></div><div class="gg" id="gg"'+EA('gallery')+'></div>'),
 lib:()=>pageHero('lib','books')+sec('rv','<div class="tabs" id="lct" style="margin:0 0 18px"></div><div class="lbf"><input id="lq" type="search" placeholder="'+esc(s_('lb_q'))+'" value="'+esc(LIBF.q)+'"><select id="lc" aria-label="'+esc(s_('lb_cls'))+'"></select><select id="ls" aria-label="'+esc(s_('lb_sub'))+'"></select></div><div id="lbg" class="lbg"><p class="lbm">'+esc(s_('lb_load'))+'</p></div>'),
 privacy:()=>privacyPage(),
 con:()=>pageHero('con','kids')+sec('rv',cards())
  +sec('rv','<div id="mf" class="mfw"></div>')+sec('rv','<div class="cg"><div class="panel"'+E('hours')+'><h3>'+s_('hrs')+'</h3>'+SITE.hours.map(h=>'<div class="li"><div><h4>'+esc(L(h.d))+'</h4><p>'+esc(L(h.t))+'</p></div></div>').join('')+'</div><div class="map" id="map"></div></div>')
};
const MFK=['admission','complaint','review','general'],MFS={admission:'adm',complaint:'cmp',review:'rev',general:'gen'},MFI={admission:'cap',complaint:'shield',review:'star',general:'chat'};
const MF={t:(()=>{const q=new URLSearchParams(location.search).get('form');return MFK.includes(q)?q:'admission'})()};
const MFROLES={admission:['parent','visitor','student'],complaint:['parent','student','teacher','visitor'],review:['parent','student','alumni','teacher','visitor'],general:['visitor','parent','student','teacher']};
const MFCAT=[['Teaching','c_teach'],['Fees','c_fees'],['Transport','c_trans'],['Safety','c_safe'],['Staff behaviour','c_staff'],['Facilities','c_fac'],['Other','c_oth']];
const MFCLS=[['Nursery','nur'],['LKG','lkg'],['UKG','ukg']].map(x=>[x[0],s_(x[1])]).concat(Array.from({length:12},(_,i)=>['Class '+(i+1),s_('cl')+' '+(i+1)]));
const chips=(name,list,first)=>'<div class="chp">'+list.map((x,i)=>'<label><input type="radio" name="'+name+'" value="'+esc(x[0])+'"'+(first&&i===0?' checked':'')+'><span>'+esc(s_(x[1]))+'</span></label>').join('')+'</div>';
const fld=(l,inner)=>'<div class="fl"><label>'+esc(s_(l))+'</label>'+inner+'</div>';
const inp=(n,ph,t,req,ml)=>'<input name="'+n+'"'+(t?' type="'+t+'"':'')+(req?' required':'')+' maxlength="'+(ml||80)+'"'+(n==='phone'?' inputmode="tel"':'')+'>';
const clsSel=()=>'<select name="cls"><option value="">'+esc(s_('f_none'))+'</option>'+MFCLS.map(c=>'<option value="'+esc(c[0])+'">'+esc(c[1])+'</option>').join('')+'</select>';
function mfForm(t){
 const k=MFS[t],role=fld('f_iam',chips('role',MFROLES[t].map(r=>[r,'r_'+r]),true)),nm=fld('f_name',inp('name','','text',1,60)),ph=fld('f_phone',inp('phone','','tel',t!=='review',15)),em=fld('f_email',inp('email','','email',0,80)),
  hp='<input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">',btn='<button class="pill mfb" type="submit">'+esc(s_('f_b_'+k))+'</button><div class="em" id="mfm"></div>';
 let body='';
 if(t==='admission')body='<div class="two2">'+nm+ph+'</div>'+em+role+'<div class="two2">'+fld('f_child',inp('child','','text',0,60))+fld('f_clsa',clsSel())+'</div>'+fld('f_msgo','<textarea name="message" rows="3" maxlength="1000"></textarea>');
 if(t==='complaint')body=role+fld('f_cat',chips('cat',MFCAT,true))+'<div class="two2">'+nm+ph+'</div><div class="two2">'+em+fld('f_cls',clsSel())+'</div>'+fld('f_cmsg','<textarea name="message" rows="5" required maxlength="1000"></textarea>')+'<label class="ckb"><input type="checkbox" name="urgent" value="yes"> '+esc(s_('f_urgent'))+'</label>';
 if(t==='review')body='<div class="fl"><label>'+esc(s_('f_rate'))+'</label><div class="stars" id="stars">'+[1,2,3,4,5].map(i=>'<button type="button" data-v="'+i+'" aria-label="'+i+'">★</button>').join('')+'</div><input type="hidden" name="rating"></div>'+role+nm+fld('f_rtitle',inp('title','','text',0,80))+fld('f_rtext','<textarea name="message" rows="4" required maxlength="1000"></textarea>')+'<div class="two2">'+ph.replace('Phone number','')+em+'</div><label class="ckb"><input type="checkbox" name="show" value="yes" checked> '+esc(s_('f_show'))+'</label>';
 if(t==='general')body=role+'<div class="two2">'+nm+ph+'</div>'+em+fld('f_topic',inp('topic','','text',0,80))+fld('f_msg','<textarea name="message" rows="4" required maxlength="1000"></textarea>');
 return '<form class="mf mf-'+k+'" id="mff" novalidate>'+body+hp+btn+'<small style="color:#6a6a76">'+s_('agree')+' <a href="privacy.html" style="text-decoration:underline">'+s_('privacy')+'</a></small></form>'}
function mfDraw(){
 const t=MF.t,k=MFS[t],m=$('mf');if(!m)return;
 m.innerHTML='<div class="mft">'+MFK.map(x=>'<button type="button" class="mt mt-'+MFS[x]+(x===t?' on':'')+'" data-t="'+x+'"><span class="ic">'+ic(MFI[x])+'</span><b>'+esc(s_('f_t_'+MFS[x]))+'</b><small>'+esc(s_('f_s_'+MFS[x]))+'</small></button>').join('')+'</div>'
 +'<div class="mfp mfp-'+k+'"><div class="mfa"><span class="ic">'+ic(MFI[t])+'</span><h2>'+esc(s_('f_h_'+k))+'</h2><p>'+esc(s_('f_p_'+k))+'</p></div><div class="mfc" id="mfc">'+mfForm(t)+'</div></div>';
 m.querySelectorAll('.mt').forEach(b=>b.onclick=()=>{MF.t=b.dataset.t;mfDraw()});
 const st=$('stars');if(st){const inp_=m.querySelector('[name=rating]');st.onclick=e=>{const b=e.target.closest('button');if(!b)return;inp_.value=b.dataset.v;st.querySelectorAll('button').forEach(x=>x.classList.toggle('on',+x.dataset.v<=+b.dataset.v))}}
 $('mff').onsubmit=e=>{e.preventDefault();mfSend(e.target)}}
async function mfSend(f){
 const t=MF.t,k=MFS[t],msg=$('mfm'),d=Object.fromEntries(new FormData(f)),bad=x=>{msg.className='em';msg.textContent=s_(x)};
 if(!(d.name||'').trim())return bad('f_e_name');
 if((d.phone||t!=='review')&&!/^\+?[0-9\s-]{8,15}$/.test(d.phone||''))return bad('f_e_phone');
 if(d.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email))return bad('f_e_mail');
 if(t==='review'&&!d.rating)return bad('f_e_rate');
 if(t!=='admission'&&(d.message||'').trim().length<3)return bad('f_e_msg');
 if(window.STUDIO)return;
 const b=f.querySelector('.mfb');b.disabled=true;msg.className='em';msg.textContent='…';
 const pick={admission:['child','cls'],complaint:['cat','cls','urgent'],review:['rating','title','show'],general:['topic']}[t],det={};pick.forEach(x=>{if(d[x])det[x]=d[x]});
 try{const r=await api('enquiry',{type:t,role:d.role,name:d.name,phone:(d.phone||'').trim(),email:d.email||'',message:d.message||'',details:det,website:d.website||''});
  if(r&&r.ok===false)throw new Error(r.error||'Error');
  $('mfc').innerHTML='<div class="mfok"><span class="ic">'+ic('check')+'</span><h3>'+esc(s_('f_ok_'+k))+'</h3><button type="button" class="pill ghost sm" id="mfa">'+esc(s_('f_again'))+'</button></div>';$('mfa').onclick=mfDraw}
 catch(e){msg.className='em';msg.textContent=e.message||'Error';b.disabled=false}}
let gcat=0;
const LCATS=[['notes','Notes','नोट्स'],['books','Books','किताबें'],['pyq','Previous Year Papers','पिछले वर्ष के प्रश्नपत्र'],['sample','Sample Papers','सैंपल पेपर'],['mag','Magazines','पत्रिकाएँ'],['syl','Syllabus','पाठ्यक्रम'],['other','Other','अन्य']];
const lcat=k=>{const c=LCATS.find(x=>x[0]===k)||LCATS[6];return getLang()==='hi'?c[2]:c[1]};
const LIBF={q:'',cat:(new URLSearchParams(location.search).get('cat')||''),c:'',s:''};let LIB=null,LIBERR=false;
const fz=n=>n>=1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
function libDraw(){
 const g=$('lbg');if(!g)return;
 if(LIBERR){g.innerHTML='<p class="lbm">'+esc(s_('lb_err'))+'</p>';return}
 if(!LIB){g.innerHTML='<p class="lbm">'+esc(s_('lb_load'))+'</p>';return}
 const uniq=a=>[...new Set(a.filter(Boolean))].sort((x,y)=>x.localeCompare(y,undefined,{numeric:true})),byCat=LIB.filter(n=>!LIBF.cat||n.cat===LIBF.cat),cs=uniq(byCat.map(n=>n.c)),ss=uniq(byCat.filter(n=>!LIBF.c||n.c===LIBF.c).map(n=>n.s));
 if(LIBF.c&&!cs.includes(LIBF.c))LIBF.c='';if(LIBF.s&&!ss.includes(LIBF.s))LIBF.s='';
 const used=new Set(LIB.map(n=>n.cat));
 $('lct').innerHTML=['<button type="button" data-k=""'+(!LIBF.cat?' class="on"':'')+'>'+esc(s_('lb_all'))+'</button>'].concat(LCATS.filter(c=>used.has(c[0])).map(c=>'<button type="button" data-k="'+c[0]+'"'+(LIBF.cat===c[0]?' class="on"':'')+'>'+esc(lcat(c[0]))+'</button>')).join('');
 const opt=(a,v,all)=>'<option value="">'+esc(all)+'</option>'+a.map(x=>'<option'+(x===v?' selected':'')+'>'+esc(x)+'</option>').join('');
 $('lc').innerHTML=opt(cs,LIBF.c,s_('lb_cls')+': '+s_('lb_all'));$('ls').innerHTML=opt(ss,LIBF.s,s_('lb_sub')+': '+s_('lb_all'));
 const t=LIBF.q.toLowerCase().trim(),r=byCat.filter(n=>(!LIBF.c||n.c===LIBF.c)&&(!LIBF.s||n.s===LIBF.s)&&(!t||(n.t+' '+n.s+' '+n.c+' '+(n.x||'')).toLowerCase().includes(t)));
 g.innerHTML=r.length?r.map((n,i)=>'<article class="lbc"><a class="lbt" href="library/'+esc(n.id)+'.html" style="background:'+PASTEL[i%8]+'"><span class="ic">'+ic('book')+'</span><b>'+esc(lcat(n.cat))+'</b></a><div class="lbb"><h3><a href="library/'+esc(n.id)+'.html">'+esc(n.t)+'</a></h3><p>'+esc([n.s,n.c].filter(Boolean).join(' · '))+'</p><small>PDF · '+fz(n.z||0)+' · '+esc(n.d||'')+'</small><div class="lbx"><a class="pill solid sm" href="library/'+esc(n.id)+'.html">'+esc(s_('lb_view'))+'</a><a class="pill ghost sm" download href="'+esc(n.f)+'">'+esc(s_('lb_dl'))+'</a></div></div></article>').join(''):'<p class="lbm">'+esc(s_('lb_none'))+'</p>'}
async function libInit(){
 if(PAGE==='libitem'){document.querySelectorAll('[data-k]').forEach(e=>{const k=e.dataset.k;if(k.indexOf('cat:')===0)e.textContent=lcat(k.slice(4));else if(T.en[k])e.textContent=s_(k)});return}
 if(!$('lbg'))return;
 const q=$('lq');q.oninput=()=>{LIBF.q=q.value;libDraw()};$('lc').onchange=e=>{LIBF.c=e.target.value;libDraw()};$('ls').onchange=e=>{LIBF.s=e.target.value;libDraw()};
 $('lct').onclick=e=>{const b=e.target.closest('button');if(b){LIBF.cat=b.dataset.k;libDraw()}};
 if(LIB||LIBERR){libDraw();return}
 libDraw();
 try{const r=await fetch('content/library.json?v='+Date.now());if(!r.ok)throw 0;LIB=(await r.json()).items||[]}catch(e){LIB=[]}
 libDraw()}
function gallery(){
 const g=$('gg');if(!g)return;
 $('gtabs').innerHTML=SITE.galleryCats.map((c,i)=>'<button type="button" data-c="'+i+'" class="'+(i===gcat?'on':'')+'">'+esc(L(c))+'</button>').join('');
 const items=SITE.gallery.map((x,k)=>({x,k})).filter(o=>!gcat||o.x.c===gcat);
 g.innerHTML=items.map((o,i)=>{const x=o.x;return '<div class="gi"'+E('gallery.'+o.k)+' data-k="'+x.k+'">'+im(x.k,scene(i,'star'),700)+'<div class="cap">'+esc(L(x.t))+'</div></div>'}).join('');
}
function mapInit(){
 const m=$('map');if(!m)return;
 m.innerHTML=(CFG.mapEmbed&&/^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/.test(CFG.mapEmbed))?'<iframe loading="lazy" title="map" src="'+esc(CFG.mapEmbed)+'"></iframe>':'<div class="mapph">'+ic('pin')+'<div><b>'+esc(SN())+'</b><br>'+esc(SA())+'</div></div>';
}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href]');if(!a||window.STUDIO||e.defaultPrevented||e.metaKey||e.ctrlKey||a.target==='_blank'||a.hasAttribute('download'))return;
 const h=a.getAttribute('href')||'';if(!/\.html(\?|#|$)/.test(h)||/^https?:/.test(h)&&a.origin!==location.origin)return;let b=document.getElementById('pbar');if(!b){b=document.createElement('div');b.id='pbar';document.body.append(b)}b.className='go'});
window.addEventListener('pageshow',e=>{const b=document.getElementById('pbar');if(b)b.className=''});
async function hfSend(f){
 const m=$('hfm'),d=Object.fromEntries(new FormData(f)),bad=x=>{m.className='em';m.textContent=s_(x)};
 if(!(d.name||'').trim())return bad('f_e_name');if(!/^\+?[0-9\s-]{8,15}$/.test(d.phone||''))return bad('f_e_phone');
 if(d.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email))return bad('f_e_mail');
 if(d.type!=='admission'&&(d.message||'').trim().length<3)return bad('f_e_msg');
 if(d.type==='review'){location.href='contact.html?form=review';return}
 if(window.STUDIO)return;const b=f.querySelector('button');b.disabled=true;m.className='em';m.textContent='…';
 try{const r=await api('enquiry',{type:d.type,role:d.role,name:d.name,phone:d.phone.trim(),email:d.email||'',message:d.message||'',details:{},website:d.website||''});
  if(r&&r.ok===false)throw new Error(r.error||'Error');f.innerHTML='<div class="mfok"><span class="ic">'+ic('check')+'</span><h3>'+esc(s_('f_ok_'+MFS[d.type]))+'</h3></div>'}
 catch(e){m.className='em';m.textContent=e.message||'Error';b.disabled=false}}
async function send(f,msgEl,ok){
 if(window.STUDIO)return;
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
 const hf=$('hf');if(hf)hf.onsubmit=e=>{e.preventDefault();hfSend(e.target)};const ef=$('ef');if(ef)ef.onsubmit=e=>{e.preventDefault();send(ef,$('em'))};
 const pt=$('ptabs');if(pt)pt.onclick=e=>{const b=e.target.closest('button');if(b){pcat=+b.dataset.c;render()}};
 const gt=$('gtabs');if(gt)gt.onclick=e=>{const b=e.target.closest('button');if(b){gcat=+b.dataset.c;gallery()}};
 const g=$('gg');if(g)g.onclick=e=>{const i=e.target.closest('.gi');if(!i)return;const k=i.dataset.k,l=document.createElement('div');l.className='lb';l.innerHTML='<img alt="" src="'+esc(U(k,1600))+'">';l.onclick=()=>l.remove();document.body.appendChild(l)};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){const l=document.querySelector('.lb');if(l)l.remove()}});
 if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.08});document.querySelectorAll('.rv').forEach(n=>io.observe(n))}else document.querySelectorAll('.rv').forEach(n=>n.classList.add('in'));
}
function render(){
 FB.length=0;document.documentElement.lang=getLang();document.documentElement.style.setProperty('--c',CFG.color||'#111');document.documentElement.style.setProperty('--o',CFG.accent||'#ff7a1a');
 PAGE=document.body.dataset.page||'home';if(PAGE!=='libitem')document.title=(PAGE==='home'?SN()+' — '+s_('tag'):s_('h_'+PAGE)+' | '+SN());
 if(PAGE!=='libitem'){seo();$('main').innerHTML=(PAGES[PAGE]||PAGES.home)()}shell();gallery();mapInit();wire();libInit();mfDraw();
 if(window.afterRender)afterRender();
}
function seo(){const set=(sel,mk,v)=>{let e=document.querySelector(sel);if(!e){e=document.createElement('meta');mk(e);document.head.appendChild(e)}e.setAttribute('content',v)};
 const d=PAGE==='home'?s_('desc'):s_('s_'+PAGE)||s_('desc'),t=document.title;
 set('meta[name=description]',e=>e.name='description',d);set('meta[property="og:title"]',e=>e.setAttribute('property','og:title'),t);set('meta[property="og:description"]',e=>e.setAttribute('property','og:description'),d);set('meta[property="og:image"]',e=>e.setAttribute('property','og:image'),U('group',1200));set('meta[property="og:type"]',e=>e.setAttribute('property','og:type'),'website');
 let j=document.getElementById('ld');if(!j){j=document.createElement('script');j.type='application/ld+json';j.id='ld';document.head.appendChild(j)}
 j.textContent=JSON.stringify({'@context':'https://schema.org','@type':'School',name:SN(),address:SA(),telephone:CFG.phone,email:CFG.email,url:location.origin+location.pathname.replace(/[^/]*$/,'')})}
function applyOv(o){if(!o)return;for(const k in (o.PH||{}))PH[k]=o.PH[k];for(const k in (o.SITE||{}))SITE[k]=o.SITE[k];for(const k in (o.CFG||{}))if(k!=='api')CFG[k]=o.CFG[k]}
render();
if(!window.STUDIO)fetch('content/site.json?v='+Date.now()).then(r=>r.ok?r.json():null).then(o=>{if(o){applyOv(o);render()}}).catch(()=>{});
