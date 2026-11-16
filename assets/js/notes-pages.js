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

const NCATS=[['short','Short Notes','notebook'],['chapter','Chapter-wise Notes','books'],['pyq','Previous Year Papers (PYQ)','exam'],['sample','Sample Papers','clipboard'],['ref','Reference Books','cap'],['mag','Magazines','medal'],['syll','Syllabus','calendar'],['work','Worksheets','board'],['other','Other','box']];
const catName=k=>(NCATS.find(c=>c[0]===k)||NCATS[8])[1];
const subHue=s=>{let h=0;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))%360;return h};

function bookEl(n,actions){
 const h=subHue(n.subject),cv=el('div',{class:'bkc',style:'--g:linear-gradient(150deg,hsl('+h+',70%,62%),hsl('+(h+40)+',65%,46%))',onclick:()=>viewNote(n)});
 const t=el('div',{class:'bkt'},el('span',{},n.title),el('small',{},n.subject));cv.append(t);
 const img=el('img',{src:gThumb(n.fileId),loading:'lazy',alt:'',referrerpolicy:'no-referrer'});img.onload=()=>{t.style.display='none'};img.onerror=()=>img.remove();cv.append(img);
 if(n.mime==='application/pdf')cv.append(el('i',{class:'bkb'},'PDF'));
 const w=el('div',{class:'bk'},cv,el('b',{class:'bkn',title:n.title},n.title),el('span',{class:'bkm'},n.subject+(n.chapter&&n.chapter!=='General'?' · '+n.chapter:'')+' · '+n.className));
 if(actions&&actions.length)w.append(el('div',{class:'bka'},actions));return w}

function shelfEl(title,count,prop,books){
 const h=el('div',{class:'sh'},el('span',{class:'shi'}),el('b',{},title),el('em',{},String(count)));h.querySelector('.shi').innerHTML=PA.mini(prop);
 return el('section',{class:'shelf'},h,el('div',{class:'srow'},el('div',{class:'sin'},books)))}

// cat = '' (sab) ya category key. Sab mein har category ki alag shelf, ek category mein har subject ki.
function noteGroups(box,notes,actionsFor,cat){
 box.innerHTML='';if(!notes.length){box.append(emptyState('No books here yet','Nothing in this section yet'));return}
 if(!cat){NCATS.forEach(([k,nm,pr])=>{const l=notes.filter(n=>n.category===k);if(l.length)box.append(shelfEl(nm,l.length,pr,l.map(n=>bookEl(n,actionsFor?actionsFor(n):[]))))})}
 else{const pr=(NCATS.find(c=>c[0]===cat)||[])[2]||'books',by={};notes.forEach(n=>(by[n.className+'|'+n.subject]=by[n.className+'|'+n.subject]||[]).push(n));
  Object.keys(by).forEach(k=>{const [c,s]=k.split('|');box.append(shelfEl(s+' · '+c,by[k].length,pr,by[k].map(n=>bookEl(n,actionsFor?actionsFor(n):[]))))})}}

// Category chips + search; draw(cat,text) har baar chalta hai
function libBar(onChange,getNotes){
 let cat='';const q=el('input',{placeholder:'Search title, subject, chapter'}),chips=el('div',{class:'cchips'}),sub=el('select',{class:'sel'});
 const drawChips=()=>{const all=getNotes(),cnt={};all.forEach(n=>cnt[n.category]=(cnt[n.category]||0)+1);
  chips.innerHTML='';[['', 'All']].concat(NCATS.map(c=>[c[0],c[1]])).forEach(([k,nm])=>{const c=k?cnt[k]||0:all.length;if(k&&!c)return;
   chips.append(el('button',{type:'button',class:'ctab'+(cat===k?' on':''),onclick:()=>{cat=k;drawChips();go()}},nm+' ',el('em',{},String(c))))});
  const subs=[...new Set(all.map(n=>n.subject))].sort(),cur=sub.value;sub.innerHTML='';sub.append(el('option',{value:''},'All subjects'));subs.forEach(s=>sub.append(el('option',{value:s},s)));sub.value=subs.includes(cur)?cur:'';sub.style.display=subs.length>1?'':'none'};
 const go=()=>{const t=q.value.toLowerCase();onChange(getNotes().filter(n=>(!cat||n.category===cat)&&(!sub.value||n.subject===sub.value)&&(!t||(n.title+' '+n.chapter+' '+n.subject).toLowerCase().includes(t))),cat)};
 q.oninput=go;sub.onchange=go;
 return{chips,q,sub,refresh:()=>{drawChips();go()},el:el('div',{},el('div',{class:'bar'},q,sub),chips)}}

// Image ho to browser mein chhoti karo, PDF jaisi hai. Base64 bhejte hain.
async function prepNote(file){
 const b64=b=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result.split(',')[1]);r.onerror=no;r.readAsDataURL(b)});
 let blob=file,mime=file.type;
 if(/^image\/(jpeg|png|webp)$/.test(mime)&&file.size>250*1024){
  const bm=await createImageBitmap(file),s=Math.min(1,1600/Math.max(bm.width,bm.height)),cv=document.createElement('canvas');
  cv.width=Math.round(bm.width*s);cv.height=Math.round(bm.height*s);cv.getContext('2d').drawImage(bm,0,0,cv.width,cv.height);
  blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',0.82));mime='image/jpeg'}
 if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(mime))throw new Error('Only PDF or photo (JPG/PNG/WEBP) is allowed');
 if(blob.size>NOTE_MAX)throw new Error('File '+fmtSize(blob.size)+' — the limit is 20 MB. Please compress the PDF.');
 return{data:await b64(blob),mime}}

async function initNotesMgr2(){   // admin + teacher
 const m=page('n_notes'),o=await call('noteOptions');
 if(!o.classes.length){m.append(el('p',{class:'mu'},'No class is assigned yet'));return}
 const cs=el('select',{},o.classes.map(c=>el('option',{value:c.classId},c.name))),ss=el('select'),ch=el('input',{placeholder:'e.g. Ch 1 - Numbers'}),ct=el('select',{},NCATS.map(c=>el('option',{value:c[0]},c[1]))),ti=el('input',{placeholder:'Title (e.g. Chapter 1 notes)'}),
  fi=el('input',{type:'file',accept:'application/pdf,image/jpeg,image/png,image/webp'}),msg=el('div',{class:'err'}),go=el('button',{type:'button'},'Upload');
 const fillSub=()=>{const c=o.classes.find(x=>x.classId===cs.value);ss.innerHTML='';(c?c.subjects:[]).forEach(s=>ss.append(el('option',{value:s.subjectId},s.name)))};fillSub();
 cs.onchange=()=>{fillSub();fc.value=cs.value;load()};
 go.onclick=async()=>{msg.style.color='';msg.textContent='';go.disabled=true;
  try{if(!fi.files[0])throw new Error('Choose a file');if(!ss.value)throw new Error('You have no subject in this class');
   msg.textContent='Uploading... (a big file takes a while, do not close the page)';
   const f=await prepNote(fi.files[0]);await call('uploadNote',{classId:cs.value,subjectId:ss.value,category:ct.value,chapter:ch.value,title:ti.value,mime:f.mime,data:f.data});
   toast('Added to library');ti.value='';fi.value='';msg.textContent='';await load()}
  catch(e){msg.style.color='';msg.textContent=e.message}go.disabled=false};
 m.append(el('div',{class:'card',style:'max-width:520px'},el('h3',{style:'margin-top:0'},'Add to library'),el('label',{},'Class'),cs,el('label',{},'Section'),ct,el('label',{},'Subject'),ss,el('label',{},'Chapter (optional)'),ch,el('label',{},'Title'),ti,el('label',{},'File (PDF or photo, max 20 MB)'),fi,go,msg));
 const fc=el('select',{},o.classes.map(c=>el('option',{value:c.classId},c.name))),list=el('div');let all=[];
 const lb=libBar((l,c)=>noteGroups(list,l,act,c),()=>all);
 m.append(el('h3',{},'Library shelves'),el('div',{class:'bar'},fc),lb.el,list);
 const act=n=>n.editable?[el('button',{type:'button',class:'lnk',onclick:()=>formModal('Edit item',[{k:'title',l:'Title',req:1},{k:'chapter',l:'Chapter (optional)'},{k:'category',l:'Section',type:'select',opts:NCATS.map(c=>[c[0],c[1]])}],n,async v=>{await call('updateNote',{noteId:n.noteId,title:v.title,chapter:v.chapter,category:v.category});await load()})},'Edit'),
  el('button',{type:'button',class:'lnk bad',onclick:async()=>{if(confirm('"'+n.title+'" - delete it? The file will go to the Drive trash.')){await call('deleteNote',{noteId:n.noteId});await load()}}},'Delete')]:[];
 async function load(){all=(await call('listNotes',{classId:fc.value})).notes;lb.refresh()}
 fc.onchange=load;await load()}

async function initSNotes(){
 const m=page('n_notes'),r=await call('listNotes'),list=el('div'),lb=libBar((l,c)=>noteGroups(list,l,null,c),()=>r.notes);
 m.append(lb.el,list);lb.refresh()}
