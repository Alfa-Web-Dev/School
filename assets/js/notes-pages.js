// Notes library pages (ui.js + portal-pages.js ke baad). Files Google Drive mein, yahan sirf upload form aur cards.
const fmtSize=n=>n>=1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
const gThumb=id=>'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w400';
const gView=id=>'https://drive.google.com/file/d/'+encodeURIComponent(id)+'/preview';
const gDown=id=>'https://drive.google.com/uc?export=download&id='+encodeURIComponent(id);
const NOTE_MAX=20*1024*1024;

function viewNote(n){
 const d=modal(n.title+' · '+n.subject,el('iframe',{src:gView(n.fileId),allow:'autoplay',style:'width:100%;height:70vh;border:0;background:#fff'}),
  [{t:'Download',g:1,fn:()=>{window.open(gDown(n.fileId),'_blank','noopener');return false}},{t:'Close',fn:()=>true}]);
 d.classList.add('wide')}

function noteCard(n,actions){
 const img=el('img',{src:gThumb(n.fileId),loading:'lazy',alt:'',referrerpolicy:'no-referrer'});
 img.onerror=()=>img.replaceWith(el('div',{class:'nph'},n.mime==='application/pdf'?'PDF':'IMG'));
 return el('div',{class:'ncard'},el('div',{class:'nth',onclick:()=>viewNote(n)},img),
  el('div',{class:'nb'},el('b',{},n.title),el('div',{class:'mu'},n.subject+' · '+n.chapter),el('div',{class:'mu'},fmtSize(n.size)+' · '+n.by+' · '+n.date),
   el('div',{class:'row',style:'flex-wrap:wrap;margin-top:8px'},[btn('View',()=>viewNote(n),false)].concat(actions||[]))))}

function noteGroups(box,notes,actionsFor){
 box.innerHTML='';if(!notes.length){box.append(el('p',{class:'mu'},'Abhi koi notes nahi'));return}
 const bySub={};notes.forEach(n=>{(bySub[n.className+'|'+n.subject]=bySub[n.className+'|'+n.subject]||[]).push(n)});
 Object.keys(bySub).forEach(k=>{const [c,s]=k.split('|'),byCh={};bySub[k].forEach(n=>(byCh[n.chapter]=byCh[n.chapter]||[]).push(n));
  box.append(el('h3',{},s+' · '+c));
  Object.keys(byCh).forEach(ch=>box.append(el('h4',{class:'mu',style:'margin:10px 0 6px'},ch),el('div',{class:'ngrid'},byCh[ch].map(n=>noteCard(n,actionsFor?actionsFor(n):[])))))})}

// Image ho to browser mein chhoti karo, PDF jaisi hai. Base64 bhejte hain.
async function prepNote(file){
 const b64=b=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result.split(',')[1]);r.onerror=no;r.readAsDataURL(b)});
 let blob=file,mime=file.type;
 if(/^image\/(jpeg|png|webp)$/.test(mime)&&file.size>250*1024){
  const bm=await createImageBitmap(file),s=Math.min(1,1600/Math.max(bm.width,bm.height)),cv=document.createElement('canvas');
  cv.width=Math.round(bm.width*s);cv.height=Math.round(bm.height*s);cv.getContext('2d').drawImage(bm,0,0,cv.width,cv.height);
  blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',0.82));mime='image/jpeg'}
 if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(mime))throw new Error('Sirf PDF ya photo (JPG/PNG/WEBP) chalegi');
 if(blob.size>NOTE_MAX)throw new Error('File '+fmtSize(blob.size)+' hai, limit 20 MB. PDF chhoti karke dalo.');
 return{data:await b64(blob),mime}}

async function initNotesMgr2(){   // admin + teacher
 const m=page('n_notes'),o=await call('noteOptions');
 if(!o.classes.length){m.append(el('p',{class:'mu'},'Abhi koi class assign nahi hai'));return}
 const cs=el('select',{},o.classes.map(c=>el('option',{value:c.classId},c.name))),ss=el('select'),ch=el('input',{placeholder:'Chapter (jaise: Ch 1 - Numbers)'}),ti=el('input',{placeholder:'Title (jaise: Chapter 1 notes)'}),
  fi=el('input',{type:'file',accept:'application/pdf,image/jpeg,image/png,image/webp'}),msg=el('div',{class:'err'}),go=el('button',{type:'button'},'Upload');
 const fillSub=()=>{const c=o.classes.find(x=>x.classId===cs.value);ss.innerHTML='';(c?c.subjects:[]).forEach(s=>ss.append(el('option',{value:s.subjectId},s.name)))};fillSub();
 cs.onchange=()=>{fillSub();fc.value=cs.value;load()};
 go.onclick=async()=>{msg.style.color='';msg.textContent='';go.disabled=true;
  try{if(!fi.files[0])throw new Error('File chuno');if(!ss.value)throw new Error('Is class mein aapka koi subject nahi hai');
   msg.textContent='Upload ho raha hai... (badi file mein thoda time lagta hai, page band mat karo)';
   const f=await prepNote(fi.files[0]);await call('uploadNote',{classId:cs.value,subjectId:ss.value,chapter:ch.value,title:ti.value,mime:f.mime,data:f.data});
   toast('Notes upload ho gaye');ti.value='';fi.value='';msg.textContent='';await load()}
  catch(e){msg.style.color='';msg.textContent=e.message}go.disabled=false};
 m.append(el('div',{class:'card',style:'max-width:520px'},el('h3',{style:'margin-top:0'},'Naye notes upload karo'),el('label',{},'Class'),cs,el('label',{},'Subject'),ss,el('label',{},'Chapter'),ch,el('label',{},'Title'),ti,el('label',{},'File (PDF ya photo, max 20 MB)'),fi,go,msg));
 const fc=el('select',{},o.classes.map(c=>el('option',{value:c.classId},c.name))),q=el('input',{placeholder:'Search title / chapter'}),list=el('div');let all=[];
 m.append(el('h3',{},'Upload kiye hue notes'),el('div',{class:'bar'},fc,q),list);
 const act=n=>n.editable?[btn('Edit',()=>formModal('Edit notes',[{k:'title',l:'Title',req:1},{k:'chapter',l:'Chapter',req:1}],n,async v=>{await call('updateNote',{noteId:n.noteId,title:v.title,chapter:v.chapter});await load()})),
  btn('Delete',async()=>{if(confirm('"'+n.title+'" delete karein? File Drive ke trash mein jayegi.')){await call('deleteNote',{noteId:n.noteId});await load()}})]:[];
 const draw=()=>{const t=q.value.toLowerCase();noteGroups(list,all.filter(n=>!t||(n.title+' '+n.chapter).toLowerCase().includes(t)),act)};
 async function load(){all=(await call('listNotes',{classId:fc.value})).notes;draw()}
 fc.onchange=load;q.oninput=draw;await load()}

async function initSNotes(){
 const m=page('n_notes'),q=el('input',{placeholder:'Search title / chapter'}),list=el('div'),r=await call('listNotes');
 const draw=()=>{const t=q.value.toLowerCase();noteGroups(list,r.notes.filter(n=>!t||(n.title+' '+n.chapter+' '+n.subject).toLowerCase().includes(t)))};
 q.oninput=draw;m.append(el('div',{class:'bar'},q),list);draw()}
