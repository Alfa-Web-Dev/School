// 48 cartoon avatars (24 boys + 24 girls), pure SVG. Index 0-23 = boy, 24-47 = girl.
(function(){
const BG=['#c9b8ff','#9ee6dc','#ffe08a','#ffb8d9','#b9d7ff','#ffc9a8','#c8f2b8','#e2c8ff','#bfe3ff','#fcd5ce'];
const SK=['#f6d3b6','#eebd94','#dfa57a','#c68a5e','#a8704a','#8d5a3b'];
const HC=['#1f1611','#2b1d17','#3b2a20','#5a3a24','#7a4b2a','#111827'];
const SH=['#111111','#0ea5a0','#f97316','#ec4899','#22a06b','#334155','#e11d48','#2563eb','#7c3aed','#ca8a04'];
function svg(i){
 i=((+i||0)%48+48)%48;const girl=i>=24,k=i%24,st=k%6,bg=BG[k%10],sk=SK[(k*5+1)%6],hc=HC[(k*7+(girl?2:0))%6],sh=SH[(k*3+(girl?3:1))%10];
 let back='',front='',acc='';
 if(!girl){
  if(st===2)back='<circle cx="50" cy="34" r="22" fill="'+hc+'"/>';
  front=['<path d="M28 44C26 18 74 18 72 44C66 32 36 32 28 44Z" fill="'+hc+'"/>',
   '<path d="M27 46C24 16 76 14 73 46C70 34 58 28 46 28C38 34 32 38 27 46Z" fill="'+hc+'"/>',
   '<path d="M27 46C22 26 32 16 42 22C46 14 58 14 60 22C70 20 78 32 73 46C68 34 34 34 27 46Z" fill="'+hc+'"/><circle cx="34" cy="26" r="7" fill="'+hc+'"/><circle cx="66" cy="26" r="7" fill="'+hc+'"/>',
   '<path d="M28 44L30 22L40 30L46 16L54 30L62 18L70 30L72 44C64 34 36 34 28 44Z" fill="'+hc+'"/>',
   '<path d="M29 42C30 24 70 24 71 42C64 34 36 34 29 42Z" fill="'+hc+'" opacity=".85"/>',
   '<path d="M26 44C26 22 74 22 74 44L80 46H20Z" fill="'+SH[(k+4)%10]+'"/><path d="M26 44C26 22 74 22 74 44Z" fill="'+SH[(k+4)%10]+'"/><path d="M20 46h60" stroke="#0003" stroke-width="2"/>'][st];
 }else{
  if(st===0)back='<path d="M26 50C22 14 78 14 74 50L80 92H20Z" fill="'+hc+'"/>';
  if(st===1)back='<path d="M26 52C24 14 76 14 74 52Z" fill="'+hc+'"/>';
  if(st===2)back='<path d="M70 30C90 36 90 70 76 84C80 62 76 50 70 44Z" fill="'+hc+'"/>';
  if(st===3)back='<circle cx="50" cy="16" r="11" fill="'+hc+'"/>';
  if(st===4)back='<circle cx="24" cy="48" r="10" fill="'+hc+'"/><circle cx="76" cy="48" r="10" fill="'+hc+'"/>';
  if(st===5)back='<path d="M25 50C22 14 78 14 75 50L82 96H18Z" fill="'+hc+'"/>';
  front='<path d="M27 48C24 14 76 14 73 48C66 30 36 28 27 48Z" fill="'+hc+'"/>'+(st===5?'<path d="M28 34C40 22 60 22 72 34" fill="none" stroke="'+SH[(k+5)%10]+'" stroke-width="4" stroke-linecap="round"/>':'')+(st===1?'<path d="M27 52C26 40 30 34 36 34C32 42 32 48 33 56Z M73 52C74 40 70 34 64 34C68 42 68 48 67 56Z" fill="'+hc+'"/>':'');
 }
 if(k%4===2)acc='<g fill="none" stroke="#1f2937" stroke-width="2"><circle cx="41" cy="52" r="7"/><circle cx="59" cy="52" r="7"/><path d="M48 52h4"/></g>';
 if(girl&&k%3===0)acc+='<circle cx="50" cy="40" r="2" fill="#e11d48"/>';
 return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"><rect width="100" height="100" fill="'+bg+'"/><circle cx="84" cy="18" r="17" fill="#fff" opacity=".28"/>'+back+
 '<path d="M14 100C14 76 30 70 50 70C70 70 86 76 86 100Z" fill="'+sh+'"/><path d="M42 70L50 80L58 70" fill="'+sk+'"/><rect x="43" y="60" width="14" height="14" rx="5" fill="'+sk+'"/>'+
 '<ellipse cx="50" cy="48" rx="21" ry="23" fill="'+sk+'"/><circle cx="29" cy="50" r="4" fill="'+sk+'"/><circle cx="71" cy="50" r="4" fill="'+sk+'"/>'+front+
 '<circle cx="41" cy="52" r="2.4" fill="#1f2937"/><circle cx="59" cy="52" r="2.4" fill="#1f2937"/><path d="M42 62Q50 69 58 62" fill="none" stroke="#7c2d12" stroke-width="2.2" stroke-linecap="round"/><circle cx="35" cy="59" r="3.5" fill="#ff8a8a" opacity=".3"/><circle cx="65" cy="59" r="3.5" fill="#ff8a8a" opacity=".3"/>'+acc+'</svg>';
}
const MALE_A=/^(?:krishna|rama|sudama|arya|aarya|aditya|ashutosh|harsha|atul|vikrama|ravindra|kanha|shiva|vishnu|hari|ravi|rishi|kavi|abhishek|anil|sunil|amit|rohit|rajesh|suresh|ramesh|mukesh|dinesh|mahesh|sachin|vijay|ajay|sanjay|manoj|pankaj|arun|varun|tarun|karan|aarav|arjun|rahul|rohan|aman|raman|nitin|deepak|vivek|ashish|girish|satish|jagdish|harish|naresh|yogesh|lokesh|ganesh|prakash|vikas|akash|aakash|ankit|sumit|mohit|lalit|jitendra|devendra|surendra|mahendra|narendra|rajendra|virendra|dharmendra|pushpendra|yash|aryan|ishaan|kabir|veer)$/i;
function guess(name){const f=String(name||'').trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g,'');if(!f)return 0;if(MALE_A.test(f))return 0;return /(a|i|ee|ya|ni)$/.test(f)?1:0}
function hash(s){let h=7;s=String(s);for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h}
function def(id,name,gender){const g=gender?(String(gender).toUpperCase()==='F'?1:0):guess(name);return g*24+hash(id||name)%24}
function get(id,name,gender){try{const v=localStorage.getItem('av_'+id);if(v!==null&&v!=='')return +v%48}catch(e){}return def(id,name,gender)}
function set(id,i){try{localStorage.setItem('av_'+id,String(i))}catch(e){}}
window.AV={svg,get,set,def,count:48,html:(i,cls)=>'<span class="av pic '+(cls||'')+'">'+svg(i)+'</span>'};
})();
