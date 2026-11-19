// QR attendance: the student shows a live QR (changes every 30 s); the teacher scans it
let JSQR_P=null;
const loadJsQR=()=>JSQR_P||(JSQR_P=new Promise((ok,no)=>{if(window.jsQR)return ok();const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js';s.onload=ok;s.onerror=()=>{JSQR_P=null;no(new Error('Scanner could not load. Check internet.'))};document.head.append(s)}));

/* ---------------- student: ID card with live QR ---------------- */
async function initIdCard(){
 const m=page('n_idcard'),box=el('div',{class:'qrcard'}),note=el('p',{class:'mu qrnote'},'Show this QR to your teacher at the door or in class. It changes every 30 seconds, so a photo or screenshot will not work.');
 m.append(box,note);let timer=null,left=0,cv=null,tick=null;
 async function fetchQr(){
  try{const r=await call('myQr',{__quiet:1});
   box.innerHTML='';cv=QR.draw(r.code,240);cv.className='qrcv';tick=el('div',{class:'qrleft'});
   box.append(el('div',{class:'qrname'},r.name),el('div',{class:'mu'},[r.className,r.roll?'Roll '+r.roll:'',r.admNo?'Adm '+r.admNo:''].filter(Boolean).join(' · ')),cv,tick);
   left=Math.max(3,r.ttl-3);paint()}
  catch(e){box.innerHTML='';box.append(el('p',{class:'err'},e.message),btn('Try again',()=>fetchQr(),true))}}
 function paint(){if(tick)tick.textContent='Refreshes in '+left+'s'}
 function loop(){clearInterval(timer);timer=setInterval(()=>{if(!document.body.contains(box)){clearInterval(timer);return}
  left--;paint();if(left<=0){left=99;fetchQr()}},1000)}
 await fetchQr();loop();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)fetchQr()})}

/* ---------------- staff: scanner ---------------- */
function openScanner(classId,onDone){
 let stream=null,alive=true,busy=false,late=false,seen={},count=0,det=null,raf=0;
 const vid=el('video',{playsinline:'',muted:'',autoplay:'',class:'scvid'}),work=document.createElement('canvas'),res=el('div',{class:'scres mu'},'Point the camera at the student QR'),log=el('div',{class:'sclog'}),cnt=el('b',{},'0');
 const lt=el('input',{type:'checkbox'});lt.onchange=()=>{late=lt.checked};
 const body=el('div',{class:'scan'},el('div',{class:'scbox'},vid,el('div',{class:'scframe'})),res,el('label',{class:'row'},lt,el('span',{},'Mark as Late')),el('div',{class:'mu'},['Marked in this session: ',cnt]),log);
 function stop(){alive=false;cancelAnimationFrame(raf);if(stream)stream.getTracks().forEach(t=>t.stop());stream=null}
 const flash=(t,k)=>{res.className='scres '+(k||'');res.textContent=t};
 async function got(code){
  if(busy||seen[code]&&Date.now()-seen[code]<6000)return;seen[code]=Date.now();busy=true;
  try{const r=await api('scanAttendance',{classId,code,late:late?1:0,__quiet:1});
   if(!r.ok)throw new Error(r.error||'Failed');
   const lab=r.status==='L'?'Late':'Present';
   if(r.already){flash(r.name+' was already marked '+lab,'warn')}else{count++;cnt.textContent=count;flash('✓ '+r.name+' – '+lab,'ok');log.prepend(el('div',{class:'scrow'},(r.roll?r.roll+'. ':'')+r.name+' · '+lab));if(navigator.vibrate)navigator.vibrate(60)}}
  catch(e){flash(e.message,'bad')}
  setTimeout(()=>{busy=false},1200)}
 async function scan(){
  if(!alive)return;
  try{if(vid.readyState>=2&&!busy){let code='';
    if(det){const f=await det.detect(vid);if(f.length)code=f[0].rawValue}
    else if(window.jsQR){const w=vid.videoWidth,h=vid.videoHeight;if(w){work.width=w;work.height=h;const c=work.getContext('2d',{willReadFrequently:true});c.drawImage(vid,0,0,w,h);const q=jsQR(c.getImageData(0,0,w,h).data,w,h);if(q)code=q.data}}
    if(code)await got(code)}}catch(e){}
  raf=requestAnimationFrame(()=>setTimeout(scan,120))}
 modal('Scan student QR',body,[{t:'Done',g:0,fn:()=>{stop();if(onDone)onDone(count)}}]);
 // closing with Esc also stops the camera
 const dlg=document.querySelector('dialog');if(dlg)dlg.addEventListener('close',()=>{stop()});
 (async()=>{try{
   if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('Camera is not available on this browser');
   if('BarcodeDetector' in window){try{det=new BarcodeDetector({formats:['qr_code']})}catch(e){det=null}}
   if(!det)await loadJsQR();
   stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
   vid.srcObject=stream;await vid.play().catch(()=>{});scan()}
  catch(e){flash(e.name==='NotAllowedError'?'Camera permission denied. Allow camera in browser settings.':e.message,'bad')}})()}
