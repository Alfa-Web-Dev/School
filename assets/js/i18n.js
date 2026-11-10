const I18N={
 en:{login:'Login',as:'Login as',admin:'Admin',teacher:'Teacher',student:'Student',parent:'Parent',uid:'ID / Phone',pw:'Password / PIN',go:'Login',wait:'Please wait...',neterr:'Network error. Try again.',hello:'Welcome',logout:'Logout',ok:'Phase 0 working: login and session are OK.',lang:'हिंदी'},
 hi:{login:'लॉगिन',as:'इस रूप में लॉगिन करें',admin:'एडमिन',teacher:'शिक्षक',student:'छात्र',parent:'अभिभावक',uid:'आईडी / फ़ोन',pw:'पासवर्ड / पिन',go:'लॉगिन',wait:'कृपया प्रतीक्षा करें...',neterr:'नेटवर्क एरर। फिर कोशिश करें।',hello:'स्वागत है',logout:'लॉगआउट',ok:'Phase 0 चालू है: लॉगिन और सेशन ठीक हैं।',lang:'English'}};
function getLang(){return localStorage.getItem('sp_lang')||CFG.defaultLang||'hi'}
function t(k){return(I18N[getLang()]||I18N.en)[k]||k}
function applyI18n(){document.documentElement.lang=getLang();
 document.querySelectorAll('[data-i]').forEach(e=>e.textContent=t(e.dataset.i));
 document.querySelectorAll('[data-ph]').forEach(e=>e.placeholder=t(e.dataset.ph))}
function setLang(l){localStorage.setItem('sp_lang',l);applyI18n()}
