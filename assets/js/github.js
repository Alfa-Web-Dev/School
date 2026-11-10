// GitHub API helper: content/uploads ko seedha repo mein likhta hai. Publish = ek hi commit.
const GH={
 pending:{},   // path -> {text} ya {b64}
 cfg(){const g=CFG.github||{},L=k=>localStorage.getItem(k)||'';
  return{owner:g.owner||L('gh_owner'),repo:g.repo||L('gh_repo'),branch:g.branch||'main',token:L('gh_token')}},
 ready(){const c=this.cfg();return !!(c.owner&&c.repo&&c.token)},
 async call(path,opt={}){
  const c=this.cfg();
  const r=await fetch('https://api.github.com/repos/'+c.owner+'/'+c.repo+path,{method:opt.method||'GET',
   headers:{Authorization:'Bearer '+c.token,Accept:'application/vnd.github+json','Content-Type':'application/json'},
   body:opt.body?JSON.stringify(opt.body):undefined});
  if(!r.ok){let m='';try{m=(await r.json()).message}catch(e){}throw new Error(r.status+' '+m)}
  return r.json()},
 async readText(p){
  try{const j=await this.call('/contents/'+p+'?ref='+this.cfg().branch);
   const bin=atob(j.content.replace(/\n/g,''));return new TextDecoder().decode(Uint8Array.from(bin,ch=>ch.charCodeAt(0)))}
  catch(e){if(String(e.message).startsWith('404'))return null;throw e}},
 stage(path,v){this.pending[path]=v;this.onchange&&this.onchange()},
 count(){return Object.keys(this.pending).length},
 async publish(msg){
  const paths=Object.keys(this.pending);if(!paths.length)return 0;
  const br=this.cfg().branch;
  const ref=await this.call('/git/ref/heads/'+br),head=ref.object.sha;
  const cm=await this.call('/git/commits/'+head);
  const tree=[];
  for(const p of paths){const v=this.pending[p];
   const b=await this.call('/git/blobs',{method:'POST',body:v.b64?{content:v.b64,encoding:'base64'}:{content:v.text,encoding:'utf-8'}});
   tree.push({path:p,mode:'100644',type:'blob',sha:b.sha})}
  const nt=await this.call('/git/trees',{method:'POST',body:{base_tree:cm.tree.sha,tree}});
  const nc=await this.call('/git/commits',{method:'POST',body:{message:msg||'Content update from admin',tree:nt.sha,parents:[head]}});
  await this.call('/git/refs/heads/'+br,{method:'PATCH',body:{sha:nc.sha}});
  const n=paths.length;this.pending={};this.onchange&&this.onchange();return n}
};
// Photo ko browser mein chhota karo (max 1600px, jpeg). PDF/others jaise hain (max 20 MB).
async function prepFile(file){
 if(file.size>20*1024*1024)throw new Error('File 20 MB se badi hai');
 const toB64=b=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(r.result.split(',')[1]);r.onerror=no;r.readAsDataURL(b)});
 let blob=file,name=file.name.toLowerCase().replace(/[^a-z0-9._-]/g,'-');
 if(/^image\//.test(file.type)&&file.size>250*1024&&file.type!=='image/svg+xml'){
  const bm=await createImageBitmap(file),s=Math.min(1,1600/Math.max(bm.width,bm.height));
  const cv=document.createElement('canvas');cv.width=Math.round(bm.width*s);cv.height=Math.round(bm.height*s);
  cv.getContext('2d').drawImage(bm,0,0,cv.width,cv.height);
  blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',0.82));name=name.replace(/\.[^.]+$/,'')+'.jpg'}
 return{b64:await toB64(blob),name:Date.now().toString(36)+'-'+name,type:blob.type}}
