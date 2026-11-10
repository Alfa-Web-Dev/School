// Admin content editor (schema se chalta hai). Har badlav memory mein, "Publish" par ek commit.
const BI=(k,l)=>({k,l,type:'bi'}),BL=(k,l)=>({k,l,type:'bilong'});
const SECTIONS=[
 {id:'home',label:'Home / Hero',file:'home',root:'obj',fields:[
  {k:'logo',l:'Logo',type:'image'},
  {k:'hero',l:'Hero slides',type:'list',fields:[{k:'image',l:'Image',type:'image'},BI('title','Title'),BI('sub','Subtitle')]}]},
 {id:'site',label:'About / Admission',file:'site',root:'obj',fields:[
  BL('about','About school'),
  {k:'principal',l:'Principal',type:'group',fields:[{k:'name',l:'Name',type:'text'},{k:'photo',l:'Photo',type:'image'},BL('message','Message')]},
  {k:'academics',l:'Academics',type:'list',fields:[BI('title','Title'),BI('text','Text')]},
  {k:'achievements',l:'Achievements',type:'list',fields:[BI('title','Title'),BI('text','Text'),{k:'image',l:'Photo',type:'image'}]},
  {k:'admission',l:'Admission',type:'group',fields:[{k:'open',l:'Admission open',type:'check'},BL('text','Info')]}]},
 {id:'notices',label:'Notices',file:'notices',root:'list',fields:[{k:'date',l:'Date',type:'date'},BI('title','Title'),BL('text','Text')]},
 {id:'events',label:'Events',file:'events',root:'list',fields:[{k:'date',l:'Date',type:'date'},BI('title','Title'),BL('text','Text')]},
 {id:'staff',label:'Staff',file:'staff',root:'list',fields:[{k:'name',l:'Name',type:'text'},BI('role','Role'),{k:'photo',l:'Photo',type:'image'}]},
 {id:'downloads',label:'Downloads (PDF)',file:'downloads',root:'list',fields:[BI('title','Title'),{k:'file',l:'PDF / file',type:'file'}]},
 {id:'gallery',label:'Gallery',file:'gallery',root:'list',fields:[BI('album','Album name'),{k:'photos',l:'Photos',type:'photos'}]}];
const PREV={};            // staged file path -> dataURL (preview ke liye)
const DOCS={};            // file -> loaded doc
let cur='home';
const $=s=>document.querySelector(s);
function el(tag,at,...kids){const e=document.createElement(tag);
 Object.entries(at||{}).forEach(([k,v])=>k==='class'?e.className=v:k.startsWith('on')?e[k]=v:e.setAttribute(k,v));
 kids.flat().forEach(c=>e.append(c&&c.nodeType?c:document.createTextNode(c==null?'':c)));return e}
function dirty(sec){const d=DOCS[sec.file];
 GH.stage('content/'+sec.file+'.json',{text:JSON.stringify(sec.root==='list'?d.list:d,null,1)+'\n'})}
function blank(fields){const o={};fields.forEach(f=>o[f.k]=f.type==='bi'||f.type==='bilong'?{hi:'',en:''}:f.type==='list'||f.type==='photos'?[]:f.type==='group'?blank(f.fields):f.type==='check'?false:'');return o}
function imgSrc(p){return PREV[p]||('../'+p)}
async function upload(accept,multi,done){
 const i=el('input',{type:'file',accept});i.multiple=!!multi;
 i.onchange=async()=>{try{for(const f of i.files){const r=await prepFile(f),p='uploads/'+r.name;
  GH.stage(p,{b64:r.b64});PREV[p]='data:'+r.type+';base64,'+r.b64;done(p)}}catch(e){alert(e.message)}};i.click()}
function field(obj,f,sec,redraw){
 const ch=()=>dirty(sec),L=el('label',{},f.l||f.k);
 switch(f.type){
 case 'text':case 'date':{const i=el('input',{type:f.type==='date'?'date':'text',value:obj[f.k]||''});i.oninput=()=>{obj[f.k]=i.value;ch()};return el('div',{},L,i)}
 case 'check':{const i=el('input',{type:'checkbox',style:'width:auto'});i.checked=!!obj[f.k];i.onchange=()=>{obj[f.k]=i.checked;ch()};return el('div',{},L,i)}
 case 'bi':case 'bilong':{const v=obj[f.k]=obj[f.k]||{hi:'',en:''};
  const mk=l=>{const i=el(f.type==='bi'?'input':'textarea',{placeholder:l==='hi'?'हिंदी':'English',rows:3});i.value=v[l]||'';i.oninput=()=>{v[l]=i.value;ch()};return i};
  return el('div',{},L,el('div',{class:'two'},mk('hi'),mk('en')))}
 case 'image':case 'file':{const i=el('input',{type:'text',value:obj[f.k]||'',placeholder:'uploads/...'});
  i.oninput=()=>{obj[f.k]=i.value;ch()};
  const b=el('button',{class:'g s',type:'button',onclick:()=>upload(f.type==='image'?'image/*':'.pdf,application/pdf,image/*',false,p=>{obj[f.k]=p;ch();redraw()})},'Upload');
  const pv=f.type==='image'&&obj[f.k]?el('img',{src:imgSrc(obj[f.k]),class:'th'}):'';
  return el('div',{},L,el('div',{class:'row'},i,b),pv)}
 case 'photos':{const a=obj[f.k]=obj[f.k]||[];
  const g=el('div',{class:'thumbs'},a.map((p,ix)=>el('div',{},el('img',{src:imgSrc(p),class:'th'}),el('button',{class:'g s',type:'button',onclick:()=>{a.splice(ix,1);ch();redraw()}},'✕'))));
  return el('div',{},L,g,el('button',{class:'g s',type:'button',onclick:()=>upload('image/*',true,p=>{a.push(p);ch();redraw()})},'+ Photos'))}
 case 'group':{const g=obj[f.k]=obj[f.k]||blank(f.fields);
  return el('fieldset',{},el('legend',{},f.l),f.fields.map(x=>field(g,x,sec,redraw)))}
 case 'list':return listUI(obj,f.k,f,sec,redraw)}}
function listUI(obj,key,f,sec,redraw){
 const a=obj[key]=obj[key]||[],ch=()=>dirty(sec);
 const mv=(i,d)=>{const j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];ch();redraw()};
 const items=a.map((it,i)=>el('div',{class:'item'},
  el('div',{class:'row'},el('b',{},'#'+(i+1)),el('span',{class:'sp'}),
   el('button',{class:'g s',type:'button',onclick:()=>mv(i,-1)},'↑'),el('button',{class:'g s',type:'button',onclick:()=>mv(i,1)},'↓'),
   el('button',{class:'g s',type:'button',onclick:()=>{if(confirm('Delete?')){a.splice(i,1);ch();redraw()}}},'🗑')),
  f.fields.map(x=>field(it,x,sec,redraw))));
 return el('div',{},f.l?el('h3',{},f.l):'',items,el('button',{class:'g',type:'button',onclick:()=>{a.push(blank(f.fields));ch();redraw()}},'+ Add'))}
async function loadSec(sec){
 if(DOCS[sec.file])return;
 let txt=null;try{txt=await GH.readText('content/'+sec.file+'.json')}catch(e){throw e}
 if(txt==null){try{txt=await (await fetch('../content/'+sec.file+'.json')).text()}catch(e){txt='{}'}}
 const d=JSON.parse(txt);DOCS[sec.file]=sec.root==='list'?{list:Array.isArray(d)?d:[]}:d}
async function draw(){
 const sec=SECTIONS.find(s=>s.id===cur),box=$('#ed');
 $('#tabs').innerHTML='';SECTIONS.forEach(s=>$('#tabs').append(el('button',{class:'tab'+(s.id===cur?' on':''),onclick:()=>{cur=s.id;draw()}},s.label)));
 if(!GH.ready()){box.textContent='Pehle upar GitHub settings save karo.';return}
 box.textContent='Loading...';
 try{await loadSec(sec)}catch(e){box.textContent='Error: '+e.message;return}
 box.innerHTML='';const d=DOCS[sec.file];
 if(sec.root==='list')box.append(listUI(d,'list',{fields:sec.fields},sec,draw));
 else sec.fields.forEach(f=>box.append(field(d,f,sec,draw)))}
function bar(){const n=GH.count();$('#pb').textContent='Publish ('+n+')';$('#pb').disabled=!n}
function initContent(){
 const m=$('#main'),c=GH.cfg();
 m.innerHTML=`<h1 data-i="n_content"></h1>
 <details id="gs"${GH.ready()?'':' open'}><summary>GitHub settings</summary>
  <div class="card" style="max-width:none"><label>Owner</label><input id="go" value="${c.owner||''}"><label>Repo</label><input id="gr" value="${c.repo||''}">
  <label>Fine-grained token (sirf is repo ka Contents: Read and write)</label><input id="gt" type="password" value="${c.token||''}">
  <button id="gsv">Save &amp; test</button><div id="gm" class="mu"></div></div></details>
 <div id="tabs" class="tabs"></div><div id="ed" class="ed"></div>
 <div class="pubbar"><button id="pb" disabled>Publish (0)</button><span id="pm" class="mu"></span></div>`;
 applyI18n();
 $('#gsv').onclick=async()=>{localStorage.setItem('gh_owner',$('#go').value.trim());localStorage.setItem('gh_repo',$('#gr').value.trim());localStorage.setItem('gh_token',$('#gt').value.trim());
  try{const r=await GH.call('');$('#gm').textContent='OK: '+r.full_name+(r.permissions&&r.permissions.push?' (write access)':' (READ ONLY - token me write do)');
   Object.keys(DOCS).forEach(k=>delete DOCS[k]);draw()}catch(e){$('#gm').textContent='Error: '+e.message}};
 $('#pb').onclick=async()=>{const b=$('#pb');b.disabled=true;$('#pm').textContent='Publishing...';
  try{const n=await GH.publish('Content update from admin');$('#pm').textContent='Done: '+n+' files, 1 commit. Site 1-2 min mein update hogi.'}
  catch(e){$('#pm').textContent='Error: '+e.message;bar()}};
 GH.onchange=bar;bar();draw()}
window.addEventListener('beforeunload',e=>{if(GH.count()){e.preventDefault();e.returnValue=''}});
