// Test proctoring: tab/fullscreen guard + in-browser AI face monitoring (MediaPipe, runs on the student's phone; no video leaves the device except evidence photos)
const MP_BASE='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MP_MODEL='https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

// Pure judgement helpers (unit-tested in node)
const PJ={
 // detections: [{box:{w,h},kp:[{x,y}x6 (rEye,lEye,nose,mouth,rEar,lEar)]}] ; lum:{mean,sd}
 state(dets,lum){
  if(lum&&(lum.mean<16||lum.sd<5))return 'covered';
  if(!dets||!dets.length)return 'none';
  const big=dets.filter(d=>d.box&&d.box.w>0.07);
  if(big.length>1)return 'multi';
  const d=dets[0],k=d.kp||[];
  if(k.length>=3){const eye=Math.abs(k[0].x-k[1].x)||1e-3,mid=(k[0].x+k[1].x)/2,yaw=(k[2].x-mid)/eye;
   if(Math.abs(yaw)>0.42)return 'away';
   const pitch=((k[2].y)-(k[0].y+k[1].y)/2)/eye;if(pitch<0.15||pitch>1.5)return 'away'}
  return 'ok'},
 // Time-based escalation. thresholds in ms. returns event type or null.
 TH:{none:5000,multi:3000,away:5000,covered:3000},EV:{none:'face_missing',multi:'multiple_faces',away:'looking_away',covered:'camera_covered'},
 make(){return{bad:null,since:0,fired:0}},
 step(j,st,t,cool){cool=cool||15000;
  if(st==='ok'||!this.TH[st]){j.bad=null;j.fired=0;return null}
  if(j.bad!==st){j.bad=st;j.since=t;j.fired=0;return null}
  if(t-j.since>=this.TH[st]&&(!j.fired||t-j.fired>=cool)){j.fired=t;return this.EV[st]}
  return null}};

const Proctor={
 on:false,video:null,stream:null,det:null,timer:null,snapTimer:null,j:PJ.make(),cv:null,ai:false,fsOk:false,lastHidden:0,paused:false,
 async camera(video){ // permission + preview, called BEFORE the attempt starts
  const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
  this.stream=s;this.video=video;video.srcObject=s;video.muted=true;video.setAttribute('playsinline','');await video.play().catch(()=>{});return s},
 async loadAI(){
  try{const m=await Promise.race([import(MP_BASE+'/vision_bundle.mjs'),new Promise((_,r)=>setTimeout(()=>r(new Error('timeout')),15000))]);
   const fs=await m.FilesetResolver.forVisionTasks(MP_BASE+'/wasm');
   for(const dl of ['GPU','CPU']){try{this.det=await m.FaceDetector.createFromOptions(fs,{baseOptions:{modelAssetPath:MP_MODEL,delegate:dl},runningMode:'VIDEO',minDetectionConfidence:0.5});this.ai=true;return true}catch(e){}}
  }catch(e){}this.ai=false;return false},
 lum(){const c=this.cv=this.cv||document.createElement('canvas'),v=this.video;if(!v||!v.videoWidth)return null;c.width=32;c.height=24;const x=c.getContext('2d');x.drawImage(v,0,0,32,24);
  const d=x.getImageData(0,0,32,24).data;let s=0,n=d.length/4,l=[];for(let i=0;i<d.length;i+=4){const y=.299*d[i]+.587*d[i+1]+.114*d[i+2];l.push(y);s+=y}const m=s/n;let q=0;l.forEach(y=>q+=(y-m)*(y-m));return{mean:m,sd:Math.sqrt(q/n)}},
 photo(){const v=this.video;if(!v||!v.videoWidth)return '';const c=document.createElement('canvas');c.width=320;c.height=Math.round(320*v.videoHeight/v.videoWidth)||240;c.getContext('2d').drawImage(v,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.55)},
 // opts: {mode:'basic'|'camera', fullscreen:true, fire(type,detail,photo), snapshot(photo)}
 async start(o){this.o=o;this.on=true;this.paused=false;
  const f=o.fire;
  this.fsOk=!!(document.fullscreenElement||document.webkitFullscreenElement);
  this.h={vis:()=>{if(!this.on||this.paused)return;if(document.hidden){this.lastHidden=Date.now();f('tab_switch','',this.photo())}},
   blur:()=>setTimeout(()=>{if(!this.on||this.paused||document.hidden||Date.now()-this.lastHidden<1500)return;f('window_blur','',this.photo())},700),
   fs:()=>{if(!this.on||this.paused)return;const inFs=document.fullscreenElement||document.webkitFullscreenElement;if(this.fsOk&&!inFs){f('fullscreen_exit','',this.photo())}if(inFs)this.fsOk=true;if(o.onFs)o.onFs(!!inFs)},
   block:e=>{if(this.on)e.preventDefault()},
   key:e=>{if(!this.on)return;const k=(e.key||'').toLowerCase();if(e.key==='F12'||((e.ctrlKey||e.metaKey)&&['c','v','x','p','s','u','a'].includes(k))||(e.ctrlKey&&e.shiftKey&&['i','j','c'].includes(k)))e.preventDefault()}};
  document.addEventListener('visibilitychange',this.h.vis);window.addEventListener('blur',this.h.blur);
  document.addEventListener('fullscreenchange',this.h.fs);document.addEventListener('webkitfullscreenchange',this.h.fs);
  ['contextmenu','copy','cut','paste','dragstart'].forEach(e=>document.addEventListener(e,this.h.block));document.addEventListener('keydown',this.h.key);
  if(o.mode==='camera'&&this.video){
   this.stream.getVideoTracks().forEach(t=>t.addEventListener('ended',()=>{if(this.on&&!this.paused)f('camera_off','',this.photo())}));
   this.timer=setInterval(()=>this.tick(),700);
   this.snapTimer=setInterval(()=>{if(this.on&&!this.paused){const p=this.photo();if(p&&o.snapshot)o.snapshot(p)}},90000);
   setTimeout(()=>{const p=this.photo();if(p&&o.snapshot)o.snapshot(p)},4000)}},
 tick(){if(!this.on||this.paused)return;const v=this.video;if(!v||v.readyState<2)return;
  const lum=this.lum();let dets=null;
  if(this.ai&&this.det){try{const r=this.det.detectForVideo(v,performance.now());dets=(r.detections||[]).map(d=>({box:{w:d.boundingBox?d.boundingBox.width/(v.videoWidth||1):0.2,h:0},kp:(d.keypoints||[]).map(k=>({x:k.x,y:k.y}))}))}catch(e){dets=null}}
  let st;if(dets===null)st=(lum&&(lum.mean<16||lum.sd<5))?'covered':'ok';else st=PJ.state(dets,lum);
  this.state=st;if(this.o.onState)this.o.onState(st);
  const ev=PJ.step(this.j,st,Date.now());if(ev)this.o.fire(ev,'',this.photo())},
 pause(ms){this.paused=true;setTimeout(()=>{this.paused=false;this.j=PJ.make()},ms||2500)}, // short grace after a warning popup / re-entering fullscreen
 stop(){this.on=false;clearInterval(this.timer);clearInterval(this.snapTimer);
  if(this.h){document.removeEventListener('visibilitychange',this.h.vis);window.removeEventListener('blur',this.h.blur);document.removeEventListener('fullscreenchange',this.h.fs);document.removeEventListener('webkitfullscreenchange',this.h.fs);
   ['contextmenu','copy','cut','paste','dragstart'].forEach(e=>document.removeEventListener(e,this.h.block));document.removeEventListener('keydown',this.h.key)}
  try{if(this.stream)this.stream.getTracks().forEach(t=>t.stop())}catch(e){}
  try{if(document.fullscreenElement)document.exitFullscreen()}catch(e){}}};
if(typeof module!=='undefined')module.exports={PJ};
