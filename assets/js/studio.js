// Hidden Website Studio: edits site content visually, publishes to GitHub as content/site.json (+ uploads/*.jpg)
(()=>{
const ST={repo:'',tok:'',br:'main',dS:new Set(),dP:new Set(),dC:new Set(),rs:new Set()};
let DEF={};ST.pf={};
const q=(s,r)=>(r||document).querySelector(s),qa=(s,r)=>[...(r||document).querySelectorAll(s)];
const h=(t,a,c)=>{const e=document.createElement(t);for(const k in a||{})k==='class'?e.className=a[k]:k==='text'?e.textContent=a[k]:e.setAttribute(k,a[k]);(c||[]).forEach(x=>e.append(x));return e};
const isBi=o=>o&&typeof o==='object'&&!Array.isArray(o)&&'hi' in o&&'en' in o&&Object.keys(o).length===2;
const root=p=>p.split('.')[0]==='CFG'?CFG:SITE;
const getAt=p=>p.split('.').reduce((o,k)=>o==null?o:(o===CFG&&k==='CFG'?o:o[k]),p.split('.')[0]==='CFG'?{CFG}:SITE);
const parentOf=p=>{const a=p.split('.');a.pop();return a.length?getAt(a.join('.')):null};
const clone=o=>JSON.parse(JSON.stringify(o));
const b64=s=>btoa(unescape(encodeURIComponent(s)));
const IMGK=['photo','k'];
let toastT;const toast=(m,bad)=>{let t=q('#stt');if(!t){t=h('div',{id:'stt',class:'stt'});document.body.append(t)}t.textContent=m;t.className='stt show'+(bad?' bad':'');clearTimeout(toastT);toastT=setTimeout(()=>t.className='stt',bad?6000:3500)};
const upd=()=>{const n=ST.dS.size+ST.dP.size+ST.dC.size;const b=q('#spub');if(b){b.textContent=n?'Publish ('+n+')':'Publish';b.disabled=!n;const pn=q('#pubn');if(pn)pn.textContent=n?n+' unsaved change(s)':'All saved'}};

// ---------- image helpers ----------
const thumb=v=>PH[v]!==undefined?U(v,300):pu(v,300);
function resize(file,max){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);c.getContext('2d').drawImage(i,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.82))};i.onerror=rej;i.src=r.result};r.onerror=rej;r.readAsDataURL(file)})}
function imgField(label,get,set){
 const img=h('img',{class:'sf-th',alt:''}),setImg=()=>{const v=get();img.src=v?thumb(v):'';img.style.visibility=v?'visible':'hidden'};
 const fi=h('input',{type:'file',accept:'image/*',hidden:''});
 fi.onchange=async()=>{if(!fi.files[0])return;try{const d=await resize(fi.files[0],1400),k='u'+Date.now()+Math.floor(Math.random()*99);PH[k]=d;ST.dP.add(k);set(k);setImg()}catch(e){toast('Could not load the photo',1)}};
 const up=h('button',{type:'button',class:'sb',text:'📷 Change photo'});up.onclick=()=>fi.click();
 const ur=h('button',{type:'button',class:'sb',text:'🔗 Image URL'});ur.onclick=()=>{const u=prompt('https:// image link');if(u&&/^https:\/\//.test(u)){const k='u'+Date.now()+Math.floor(Math.random()*99);PH[k]=u.trim();ST.dP.add(k);set(k);setImg()}};
 const cl=h('button',{type:'button',class:'sb',text:'✕'});cl.title='Remove photo';cl.onclick=()=>{set('');setImg()};
 setImg();return h('div',{class:'sf'},[h('label',{text:label}),h('div',{class:'sf-im'},[img,h('div',{class:'sf-bt'},[up,ur,cl,fi])])]);
}
// ---------- generic form ----------
function field(obj,key,ctx){
 const v=obj[key],label=({t:'Title',x:'Text',e:'Small label',hl:'Highlighted words',n:'Number / value',l:'Label',i:'Icon',g:'Grade / group',s:'Chips',p:'Paragraphs',q:'Qualification',r:'Rating / role',m:'Class range',by:'By',y:'Year',d:'Date (YYYY-MM-DD)',c:'Colour / category',a:'Age',pre:'Heading',sub:'Sub text',btn:'Button text',n:'Name / number',photo:'Photo',photos:'Photos',k:'Photo',cat:'Category',msg:'Message',accent:'Accent colour',social:'Social links',facebook:'Facebook link',instagram:'Instagram link',youtube:'YouTube link',size:'File type / size',badge:'Badge',happy:'Happy parents text',name:'Name',nameHi:'School name (Hindi)',shortName:'Short name',phone:'Phone',whatsapp:'WhatsApp number',email:'Email',address:'Address',addressHi:'Address (Hindi)',mapEmbed:'Map embed link'})[key]||key;
 if(key==='f'&&typeof v==='string'){const fi=h('input',{type:'file',accept:'.pdf,.doc,.docx,.jpg,.png',hidden:''}),st=h('span',{class:'mu',text:v||'No file'});fi.onchange=()=>{const f=fi.files[0];if(!f)return;if(f.size>5*1024*1024){toast('File is larger than 5 MB',1);return}const r=new FileReader();r.onload=()=>{const nm='uploads/f'+Date.now()+'-'+f.name.replace(/[^\w.-]/g,'_');ST.pf[nm]=r.result;obj[key]=nm;st.textContent=nm};r.readAsDataURL(f)};const b=h('button',{type:'button',class:'sb',text:'📎 Upload file'});b.onclick=()=>fi.click();const c=h('button',{type:'button',class:'sb',text:'✕'});c.onclick=()=>{obj[key]='';st.textContent='No file'};return h('div',{class:'sf'},[h('label',{text:'File (PDF)'}),h('div',{class:'sf-bt'},[b,c,fi]),st])}
 if(IMGK.includes(key)&&typeof v==='string')return imgField(label,()=>obj[key],x=>obj[key]=x);
 if(key==='photos'&&Array.isArray(v))return h('div',{class:'sf grp'},[h('label',{text:label}),...v.map((_,i)=>imgField('#'+(i+1),()=>v[i],x=>v[i]=x))]);
 if(isBi(v)){const mk=l=>{const long=(v[l]||'').length>60||key==='message'||key==='a'||key==='x',e=h(long?'textarea':'input',long?{rows:3}:{type:'text'});e.value=v[l]||'';e.oninput=()=>v[l]=e.value;return h('div',{class:'bi'},[h('span',{text:l==='hi'?'हिं':'EN'}),e])};return h('div',{class:'sf'},[h('label',{text:label}),mk('hi'),mk('en')])}
 if(typeof v==='string'||typeof v==='number'){
  if(key==='i'||key==='icon'){const s=h('select');Object.keys(IC).forEach(k=>s.append(h('option',{value:k,text:k})));s.value=v;s.onchange=()=>obj[key]=s.value;return h('div',{class:'sf'},[h('label',{text:label}),s])}
  if((key==='c'&&ctx.root==='gallery')||(key==='cat'&&ctx.root==='programs')){const cats=ctx.root==='gallery'?SITE.galleryCats:SITE.programs.cats,s=h('select');cats.forEach((c,i)=>{if(i)s.append(h('option',{value:i,text:L(c)}))});s.value=v;s.onchange=()=>obj[key]=+s.value;return h('div',{class:'sf'},[h('label',{text:label}),s])}
  if(typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)){const e=h('input',{type:'color'});e.value=v;e.oninput=()=>obj[key]=e.value;return h('div',{class:'sf'},[h('label',{text:label}),e])}
  const long=typeof v==='string'&&(v.length>70||key==='mapEmbed'),e=h(long?'textarea':'input',long?{rows:3}:{type:typeof v==='number'?'number':'text'});e.value=v;e.oninput=()=>obj[key]=typeof v==='number'?+e.value:e.value;return h('div',{class:'sf'},[h('label',{text:label}),e])}
 if(Array.isArray(v))return arr(v,label,ctx);
 if(v&&typeof v==='object')return h('div',{class:'sf grp'},[h('label',{text:label}),...Object.keys(v).map(k=>field(v,k,ctx))]);
 return h('span');
}
function arr(a,label,ctx){
 const box=h('div',{class:'sf grp'},[h('label',{text:label})]),draw=()=>{qa('.ai',box).forEach(n=>n.remove());a.forEach((it,i)=>{
  const row=h('div',{class:'ai'});
  const tmp={x:it};row.append(typeof it==='object'&&!isBi(it)?h('div',{},Object.keys(it).map(k=>field(it,k,ctx))):field(tmp,'x',ctx));
  // primitive string items: write back
  if(typeof it==='string'){const inp=q('input,textarea',row);if(inp)inp.oninput=()=>a[i]=inp.value}
  const rm=h('button',{type:'button',class:'sb',text:'🗑'});rm.onclick=()=>{a.splice(i,1);draw()};row.append(rm);box.insertBefore(row,box.lastChild)})};
 const add=h('button',{type:'button',class:'sb add',text:'＋ Add'});add.onclick=()=>{a.push(a.length?clone(a[a.length-1]):'');draw()};box.append(add);draw();return box}
function editor(path,only){
 const tgt=getAt(path);if(tgt==null)return;
 const work=clone(tgt),rt=path.split('.')[0],ctx={root:rt};
 if(!only||only.split(',').includes('c')||true){const m=path.match(/^(staff|method|notices|events)\.(\d+)$/),PS=['#fde2ef','#d7f5ee','#ffe9a8','#e4d9ff','#d6e6ff','#ffe0cc','#d4f5d9','#fff0bd'];if(m&&!work.c)work.c=PS[(+m[2]+(m[1]==='events'?3:0))%8];if(path==='banner'&&!work.c)work.c='#ffe3c8'}
 const form=h('div',{class:'sfm'});
 if(Array.isArray(work))form.append(arr(work,path.split('.').pop(),ctx));
 else{const keys=only?only.split(','):Object.keys(work);keys.filter(k=>k in work).forEach(k=>form.append(field(work,k,ctx)))}
 const ov=h('div',{class:'smd'}),close=()=>ov.remove();
 const rb=h('button',{class:'pill ghost',type:'button',text:'↺ Reset to default'});rb.onclick=()=>{if(rt==='CFG'||!DEF[rt]){toast('Nothing to reset here',1);return}if(!confirm('Reset the whole "'+rt+'" section to its original default?'))return;SITE[rt]=clone(DEF[rt]);ST.dS.add(rt);ST.rs.add(rt);close();render();upd()};
 const sv=h('button',{class:'pill orange',type:'button',text:'Apply'}),cn=h('button',{class:'pill ghost',type:'button',text:'Cancel'});
 cn.onclick=close;
 sv.onclick=()=>{
  if(Array.isArray(tgt)){tgt.length=0;work.forEach(x=>tgt.push(x))}
  else{(only?only.split(','):Object.keys(work)).forEach(k=>{if(k in work)tgt[k]=work[k]})}
  if(rt==='CFG'){(only?only.split(','):Object.keys(work)).forEach(k=>ST.dC.add(k))}else ST.dS.add(rt);
  close();render();upd()};
 ov.append(h('div',{class:'sbx'},[h('div',{class:'sh2'},[h('b',{text:'✏️ Edit'}),h('small',{text:path})]),form,h('div',{class:'sact'},[rb,cn,sv])]));
 document.body.append(ov);
}
// ---------- overlay on rendered site ----------
function afterRender(){
 qa('.rv').forEach(n=>n.classList.add('in'));
 qa('[data-e]').forEach(el=>{
  const [path,only]=el.dataset.e.split('|');
  const b=h('button',{class:'ed',type:'button',title:'Edit',text:'✏️'});b.onclick=e=>{e.stopPropagation();e.preventDefault();editor(path,only)};const host=el.tagName==='DETAILS'?q('summary',el):el;host.append(b);
  const par=parentOf(path),last=path.split('.').pop();
  if(Array.isArray(par)&&/^\d+$/.test(last)){const d=h('button',{class:'ed del',type:'button',title:'Delete',text:'🗑'});d.onclick=e=>{e.stopPropagation();e.preventDefault();if(!confirm('Delete this item?'))return;par.splice(+last,1);ST.dS.add(path.split('.')[0]);render();upd()};host.append(d)}
 });
 qa('[data-ea]').forEach(el=>{
  const path=el.dataset.ea,a=getAt(path);if(!Array.isArray(a))return;
  const b=h('button',{class:'addb',type:'button',text:'＋ Add new'});
  b.onclick=()=>{if(!a.length)return;a.push(clone(a[a.length-1]));ST.dS.add(path.split('.')[0]);render();upd();editor(path+'.'+(a.length-1))};
  el.classList.contains('panel')?el.append(b):el.insertAdjacentElement('afterend',b)});
}
window.afterRender=afterRender;
// ---------- chrome ----------
const PGS=[['home','Home','index.html'],['about','About','about.html'],['acad','Academics','academics.html'],['fac','Facilities','facilities.html'],['adm','Admission','admission.html'],['gal','Gallery','gallery.html'],['con','Contact','contact.html']];
function go(p){document.body.dataset.page=p;render();scrollTo(0,0);qa('.sbar .tab').forEach(t=>t.classList.toggle('on',t.dataset.p===p))}
function bar(){
 const sb=h('div',{class:'sbar'},[h('b',{text:'✏️ Website Studio'}),h('div',{class:'tabsb'},PGS.map(p=>{const t=h('button',{class:'tab'+(p[0]===document.body.dataset.page?' on':''),type:'button',text:p[1]});t.dataset.p=p[0];t.onclick=()=>go(p[0]);return t})),
  h('span',{class:'sp'}),h('button',{class:'pill sm ghost',type:'button',text:'Exit',id:'sx'})]);
 document.body.prepend(sb);document.body.append(h('div',{class:'pubbar'},[h('span',{id:'pubn',class:'pubn'}),h('button',{id:'shist',class:'pill sm ghost',type:'button',text:'Clean history'}),h('button',{id:'spub',class:'pill orange',type:'button',text:'Publish',disabled:''})]));
 q('#spub').onclick=publish;q('#shist').onclick=cleanHistory;q('#sx').onclick=()=>{if((ST.dS.size+ST.dP.size+ST.dC.size)&&!confirm('You have unsaved changes. Exit?'))return;sessionStorage.removeItem('st_tok');localStorage.removeItem('st_tok');location.href='index.html'};
 document.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||e.target.closest('.sbar'))return;e.preventDefault();const f=(a.getAttribute('href')||'').split('/').pop();const m=PGS.find(p=>p[2]===f);if(m)go(m[0])},true);
 window.addEventListener('beforeunload',e=>{if(ST.dS.size+ST.dP.size+ST.dC.size){e.preventDefault();e.returnValue=''}});
}
// ---------- GitHub ----------
const gh=(path,opt)=>fetch('https://api.github.com'+path,{...(opt||{}),headers:{Authorization:'Bearer '+ST.tok,Accept:'application/vnd.github+json',...((opt||{}).headers||{})}});
async function getFile(p){const r=await gh('/repos/'+ST.repo+'/contents/'+p+'?t='+Date.now());if(r.status===404)return null;if(!r.ok)throw new Error('GitHub '+r.status);const j=await r.json();return{sha:j.sha,text:decodeURIComponent(escape(atob(j.content.replace(/\n/g,''))))}}
async function put(p,content,msg,sha){const r=await gh('/repos/'+ST.repo+'/contents/'+p,{method:'PUT',body:JSON.stringify({message:msg,content,...(sha?{sha}:{})})});if(!r.ok){const j=await r.json().catch(()=>({}));throw new Error(j.message||('GitHub '+r.status))}}
async function publish(){
 const btn=q('#spub');btn.disabled=true;
 try{
  toast('Publishing…');
  let old=await getFile('content/site.json'),out=old?JSON.parse(old.text):{};out.SITE=out.SITE||{};out.PH=out.PH||{};out.CFG=out.CFG||{};
  for(const k of ST.dP){const v=PH[k];if(/^data:image\//.test(v)){const path='uploads/'+k+'.jpg';await put(path,v.split(',')[1],'Studio: photo '+k);out.PH[k]=path}else out.PH[k]=v}
  ST.dS.forEach(k=>{if(ST.rs.has(k))delete out.SITE[k];else out.SITE[k]=SITE[k]});ST.dC.forEach(k=>out.CFG[k]=CFG[k]);
  // keep only photos still referenced? keep all (small)
  // drop photo keys no longer used anywhere on the site (only studio-made keys u<digits>)
  const strs=new Set(['group','class3','smart','girlsclass','twoboys','kids']);(function w(o){if(typeof o==='string')strs.add(o);else if(o&&typeof o==='object')Object.values(o).forEach(w)})(SITE);
  const used=new Set();strs.forEach(k=>{const v=out.PH[k]!==undefined?out.PH[k]:PH[k];if(/^uploads\//.test(v||''))used.add(v);if(/^uploads\//.test(k))used.add(k)});
  Object.keys(out.PH).forEach(k=>{if(/^u\d+$/.test(k)&&!strs.has(k))delete out.PH[k]});
  {const ref=JSON.stringify(SITE);for(const nm of Object.keys(ST.pf)){if(ref.includes(nm)){await put(nm,ST.pf[nm].split(',')[1],'Studio: file '+nm)}}}
  await put('content/site.json',b64(JSON.stringify(out,null,1)),'Studio: website content update',old&&old.sha);
  let gone=0;
  try{const r=await gh('/repos/'+ST.repo+'/contents/uploads?t='+Date.now());if(r.ok){const fl=await r.json();for(const f of fl){if(/^u\d+\.jpg$/.test(f.name)&&!used.has('uploads/'+f.name)){const d=await gh('/repos/'+ST.repo+'/contents/'+f.path,{method:'DELETE',body:JSON.stringify({message:'Studio: remove unused photo '+f.name,sha:f.sha})});if(d.ok)gone++}}}}catch(e){}
  ST.pf={};ST.dS.clear();ST.dP.clear();ST.dC.clear();ST.rs.clear();upd();toast('✅ Published! The live site will update in 1-2 minutes.'+(gone?' Removed '+gone+' unused photo(s).':''));
 }catch(e){toast('Publish failed: '+e.message,1);upd()}
}
async function cleanHistory(){
 if((ST.dS.size+ST.dP.size+ST.dC.size)){toast('Publish your changes first',1);return}
 if(!confirm('Clean history?\n\nThis replaces the WHOLE repository history with one single commit. Old versions of text, photos and code can no longer be restored from GitHub. The website itself stays exactly as it is.'))return;
 if(prompt('Type CLEAN to confirm')!=='CLEAN')return;
 try{toast('Cleaning history…');
  const rf=await gh('/repos/'+ST.repo+'/git/ref/heads/'+ST.br);if(!rf.ok)throw new Error('branch not found');const sha=(await rf.json()).object.sha;
  const cm=await (await gh('/repos/'+ST.repo+'/git/commits/'+sha)).json();
  const nc=await gh('/repos/'+ST.repo+'/git/commits',{method:'POST',body:JSON.stringify({message:'Clean history (single commit)',tree:cm.tree.sha,parents:[]})});if(!nc.ok)throw new Error('commit failed '+nc.status);
  const nsha=(await nc.json()).sha;
  const up=await gh('/repos/'+ST.repo+'/git/refs/heads/'+ST.br,{method:'PATCH',body:JSON.stringify({sha:nsha,force:true})});if(!up.ok){const j=await up.json().catch(()=>({}));throw new Error(j.message||('GitHub '+up.status))}
  toast('✅ History cleaned. Only one commit remains.');
 }catch(e){toast('Clean failed: '+e.message,1)}
}
async function login(){
 const ov=h('div',{class:'smd lg'}),guess=(location.hostname.split('.')[0]||'')+'/'+(location.pathname.split('/')[1]||'');
 const rp=h('input',{type:'text',placeholder:'owner/repo',value:localStorage.getItem('st_repo')||guess}),tk=h('input',{type:'password',placeholder:'GitHub token (github_pat_…)',autocomplete:'off'}),rm=h('input',{type:'checkbox'}),er=h('div',{class:'em'}),go_=h('button',{class:'pill solid',type:'button',text:'Open Studio'});
 const saved=sessionStorage.getItem('st_tok')||localStorage.getItem('st_tok');if(saved)tk.value=saved;
 ov.append(h('div',{class:'sbx narrow'},[h('h3',{text:'🔒 Website Studio'}),h('p',{class:'mu',text:'For the website admin only. The token stays only in this browser.'}),h('label',{text:'Repository'}),rp,h('label',{text:'GitHub token'}),tk,h('label',{class:'ck'},[rm,document.createTextNode(' Remember on this device')]),er,go_,
  h('details',{},[h('summary',{text:'How to create a token?'}),h('p',{class:'mu',text:'GitHub → Settings → Developer settings → Personal access tokens → Fine-grained → Generate. Repository access: only this school repo. Permissions: Contents = Read and write. Set the expiry as you like.'})])]));
 document.body.append(ov);
 return new Promise(res=>{go_.onclick=async()=>{er.textContent='';ST.repo=rp.value.trim();ST.tok=tk.value.trim();if(!/^[\w.-]+\/[\w.-]+$/.test(ST.repo)||!ST.tok){er.textContent='Enter both repo and token';return}
  go_.disabled=true;try{const r=await gh('/repos/'+ST.repo);if(!r.ok)throw new Error(r.status===401?'The token is wrong':r.status===404?'Repo not found / the token has no access':'GitHub '+r.status);const j=await r.json();ST.br=j.default_branch||'main';if(!j.permissions||!j.permissions.push)throw new Error('This token needs write permission (Contents: Read and write)');
   sessionStorage.setItem('st_tok',ST.tok);localStorage.setItem('st_repo',ST.repo);rm.checked?localStorage.setItem('st_tok',ST.tok):localStorage.removeItem('st_tok');ov.remove();res()}catch(e){er.textContent=e.message;go_.disabled=false}}});
}
(async()=>{
 await login();bar();DEF=clone(SITE);
 try{const f=await getFile('content/site.json');if(f)applyOv(JSON.parse(f.text))}catch(e){toast('Could not load saved content: '+e.message,1)}
 render();upd();
})();
})();
