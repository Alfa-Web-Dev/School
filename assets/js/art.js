// Demo illustrations (koi internet photo nahi, sab SVG). Asli photo ho to site-data.js mein photo: "uploads/x.jpg" likh do, nahi to yeh drawing dikhegi.
const SKIN=['#f4cfae','#e8b48a','#cf9468','#a8704a'],HAIR=['#2b1d17','#3b2a20','#5a3a24','#111827','#7a4b2a'];
const BG=['#c9b8ff','#9ee6dc','#ffe08a','#ffb8d9','#b9d7ff','#ffc9a8','#c8f2b8','#e2c8ff'];
const SHIRT=['#111111','#0ea5a0','#f97316','#ec4899','#22a06b','#334155','#e11d48','#2563eb'];
function avatar(i,o){o=o||{};const sk=SKIN[(i*3+1)%4],hr=HAIR[(i*2)%5],bg=o.bg||BG[i%8],sh=SHIRT[(i*5+2)%8],st=o.style!=null?o.style:i%4,fem=o.fem!=null?o.fem:(i%2===1);
 let back='',front='';
 if(fem||st===1)back='<path d="M50 104C44 40 156 40 150 104L158 178H42Z" fill="'+hr+'"/>';
 if(st===2)back+='<circle cx="100" cy="42" r="17" fill="'+hr+'"/>';
 if(st===3)front='<path d="M34 54L100 28l66 26-66 24z" fill="#1f2937"/><path d="M68 66v12c18 10 46 10 64 0V66l-32 12z" fill="#374151"/><path d="M160 56v24" stroke="#f59e0b" stroke-width="3"/><circle cx="160" cy="84" r="5" fill="#f59e0b"/>';
 else front='<path d="M62 94C58 46 142 46 138 94C130 74 72 72 62 94Z" fill="'+hr+'"/>'+(fem?'<path d="M62 92C60 70 66 64 70 64C64 78 64 88 66 100Z M138 92C140 70 134 64 130 64C136 78 136 88 134 100Z" fill="'+hr+'"/>':'');
 const gl=o.glasses||(i%5===2)?'<g fill="none" stroke="#1f2937" stroke-width="2.5"><circle cx="82" cy="100" r="11"/><circle cx="118" cy="100" r="11"/><path d="M93 100h14"/></g>':'';
 return '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><rect width="200" height="200" fill="'+bg+'"/><circle cx="165" cy="40" r="34" fill="#fff" opacity=".28"/><circle cx="30" cy="170" r="40" fill="#fff" opacity=".2"/>'+back
  +'<path d="M16 204C20 164 58 150 100 150s80 14 84 54z" fill="'+sh+'"/><path d="M84 150l16 22 16-22" fill="#fff" opacity=".9"/><rect x="86" y="124" width="28" height="32" rx="12" fill="'+sk+'"/><rect x="86" y="140" width="28" height="12" fill="#000" opacity=".08"/>'
  +'<ellipse cx="100" cy="98" rx="36" ry="42" fill="'+sk+'"/><ellipse cx="64" cy="102" rx="5" ry="8" fill="'+sk+'"/><ellipse cx="136" cy="102" rx="5" ry="8" fill="'+sk+'"/>'+front
  +'<circle cx="82" cy="100" r="4" fill="#1f2937"/><circle cx="118" cy="100" r="4" fill="#1f2937"/><circle cx="83.5" cy="98.5" r="1.3" fill="#fff"/><circle cx="119.5" cy="98.5" r="1.3" fill="#fff"/>'+gl
  +'<path d="M74 88q8-5 16 0M110 88q8-5 16 0" stroke="'+hr+'" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M88 118q12 12 24 0" stroke="#8a3b2a" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="72" cy="114" r="6" fill="#f87171" opacity=".25"/><circle cx="128" cy="114" r="6" fill="#f87171" opacity=".25"/>'
  +(o.book?'<g transform="rotate(-8 60 170)"><rect x="34" y="150" width="62" height="46" rx="6" fill="#f59e0b"/><rect x="40" y="156" width="50" height="34" rx="3" fill="#fff" opacity=".9"/><path d="M45 166h40M45 174h30" stroke="#f59e0b" stroke-width="3"/></g>':'')+'</svg>'}
// Scene tile: gradient + bada icon (program / activity cards ki photo ki jagah)
const GRAD=[['#222222','#c4b5fd'],['#14b8a6','#99f6e4'],['#f59e0b','#fde68a'],['#ec4899','#fbcfe8'],['#3b82f6','#bfdbfe'],['#f97316','#fed7aa'],['#22c55e','#bbf7d0'],['#a855f7','#e9d5ff']];
const PATHS={book:'<path d="M12 70q36-14 60 0v66q-24-14-60 0z"/><path d="M132 70q-36-14-60 0v66q24-14 60 0z" opacity=".75"/>',
 cap:'<path d="M10 56L72 28l62 28-62 28z"/><path d="M34 72v34c22 14 56 14 76 0V72l-38 18z" opacity=".75"/>',
 atom:'<circle cx="72" cy="70" r="10"/><ellipse cx="72" cy="70" rx="56" ry="20" fill="none" stroke="#fff" stroke-width="6"/><ellipse cx="72" cy="70" rx="56" ry="20" fill="none" stroke="#fff" stroke-width="6" transform="rotate(60 72 70)"/><ellipse cx="72" cy="70" rx="56" ry="20" fill="none" stroke="#fff" stroke-width="6" transform="rotate(120 72 70)"/>',
 ball:'<circle cx="72" cy="70" r="50"/><path d="M72 20v100M22 70h100M36 34q36 36 72 0M36 106q36-36 72 0" stroke="#111111" stroke-width="5" fill="none" opacity=".55"/>',
 music:'<path d="M54 30l66-14v76"/><circle cx="42" cy="104" r="16"/><circle cx="108" cy="92" r="16"/><path d="M54 30v74" stroke="#fff" stroke-width="8" fill="none"/>',
 brush:'<path d="M110 14l24 24-56 56-24-24z"/><path d="M54 84c-22 0-24 22-34 30 20 8 48 2 52-24z" opacity=".8"/>',
 pc:'<rect x="14" y="26" width="116" height="76" rx="10"/><rect x="52" y="108" width="40" height="8"/><rect x="34" y="116" width="76" height="8" rx="4" opacity=".8"/>',
 star:'<path d="M72 14l16 34 36 5-26 26 6 37-32-18-32 18 6-37L20 53l36-5z"/>',
 flask:'<path d="M56 18h32v34l32 62q4 12-10 12H34q-14 0-10-12l32-62z"/><path d="M40 98h64" stroke="#111111" stroke-width="5" opacity=".5"/>',
 trophy:'<path d="M42 18h60v34q0 30-30 36-30-6-30-36z"/><path d="M42 28H18q0 28 26 34M102 28h24q0 28-26 34" fill="none" stroke="#fff" stroke-width="7"/><rect x="62" y="88" width="20" height="20"/><rect x="44" y="108" width="56" height="14" rx="5"/>'};
function scene(i,icon,o){o=o||{};const g=GRAD[i%8];
 return '<svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g'+i+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="'+g[0]+'"/><stop offset="1" stop-color="'+g[1]+'"/></linearGradient></defs><rect width="320" height="200" fill="url(#g'+i+')"/>'
  +'<circle cx="270" cy="30" r="70" fill="#fff" opacity=".16"/><circle cx="20" cy="190" r="80" fill="#fff" opacity=".14"/><circle cx="60" cy="40" r="6" fill="#fff" opacity=".6"/><circle cx="290" cy="150" r="9" fill="#fff" opacity=".5"/><path d="M230 170l8-14 8 14z" fill="#fff" opacity=".5"/>'
  +'<g transform="translate(88 28) scale(1.05)" fill="#fff">'+(PATHS[icon]||PATHS.star)+'</g></svg>'}
// Chhote icon (stroke) - cards aur stats ke liye
const IC={cap:'<path d="M22 10L12 5 2 10l10 5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14a5 5 0 0 1 5 5"/>',star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 award:'<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 22l5-3 5 3-1.5-8"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 7l9 6 9-6"/>',pin:'<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',chat:'<path d="M21 12a9 9 0 0 1-13.4 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z"/>',
 check:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',arrow:'<path d="M7 17L17 7M8 7h9v9"/>',dl:'<path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/>',flask:'<path d="M9 3h6M10 3v6L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9V3"/>',ball:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/>',music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',brush:'<path d="M18 3l3 3-9 9-3-3zM9 15c-3 0-3 3-5 5 4 1 8 0 8-4z"/>',pc:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',chart:'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'};
const ic=(k,c)=>'<svg class="i" viewBox="0 0 24 24"'+(c?' style="color:'+c+'"':'')+'>'+(IC[k]||IC.star)+'</svg>';
