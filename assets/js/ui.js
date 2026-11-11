// Admin pages ke common UI helpers (modal, form, table, CSV, toast)
const $=s=>document.querySelector(s);
function el(tag,at,...kids){const e=document.createElement(tag);
 Object.entries(at||{}).forEach(([k,v])=>k==='class'?e.className=v:k.startsWith('on')?e[k]=v:e.setAttribute(k,v));
 kids.flat().forEach(c=>e.append(c&&c.nodeType?c:document.createTextNode(c==null?'':c)));return e}
async function call(action,data){
 const r=await api(action,data||{});
 if(!r.ok){if(r.error==='expired'){sessionStorage.clear();location.href='../login.html'}throw new Error(r.error||'Error')}
 return r}
function toast(msg,bad){const t=el('div',{class:'toast'+(bad?' bad':'')},msg);document.body.append(t);setTimeout(()=>t.remove(),4000)}
function modal(title,body,btns){
 const d=el('dialog',{class:'dlg'}),err=el('div',{class:'err'});
 d.append(el('h2',{},title),body,err,el('div',{class:'row end'},btns.map(b=>el('button',{class:b.g?'g':'',type:'button',
  onclick:async()=>{err.textContent='';try{if(await b.fn(d)!==false)d.close()}catch(e){err.textContent=e.message}}},b.t))));
 document.body.append(d);d.onclose=()=>d.remove();d.showModal();return d}
// fields: [{k,l,type:text|tel|date|select|textarea,opts:[[value,label]],req}]
function formModal(title,fields,vals,onSave){
 vals=vals||{};const inp={};
 const body=el('div',{class:'frm'},fields.map(f=>{
  const i=f.type==='select'?el('select',{},f.opts.map(([v,l])=>el('option',{value:v},l))):
   f.type==='textarea'?el('textarea',{rows:3}):el('input',{type:f.type||'text'});
  i.value=vals[f.k]==null?'':vals[f.k];if(f.type==='select'&&i.selectedIndex<0)i.selectedIndex=0;inp[f.k]=i;
  return el('div',{},el('label',{},f.l+(f.req?' *':'')),i)}));
 return modal(title,body,[{t:'Cancel',g:1,fn:()=>true},{t:'Save',fn:async()=>{
  const v={};for(const f of fields){v[f.k]=inp[f.k].value.trim();if(f.req&&!v[f.k])throw new Error(f.l+' zaruri hai')}
  await onSave(v)}}])}
function showSecret(title,rows,note){
 const txt=rows.map(r=>r.join(': ')).join('\n');
 modal(title,el('div',{},el('pre',{class:'sec'},txt),el('p',{class:'mu'},note||'Yeh sirf abhi dikh raha hai. Copy karke student/parent ko de do.')),
  [{t:'Copy',g:1,fn:async()=>{try{await navigator.clipboard.writeText(txt);toast('Copied')}catch(e){toast('Copy nahi hua',1)}return false}},{t:'OK',fn:()=>true}])}
function tableEl(cols,rows,empty){
 if(!rows.length)return el('p',{class:'mu'},empty||'Kuch nahi mila');
 return el('div',{class:'tw'},el('table',{class:'tbl'},el('thead',{},el('tr',{},cols.map(c=>el('th',{},c.h)))),
  el('tbody',{},rows.map(r=>el('tr',{},cols.map(c=>el('td',{},c.f(r))))))))}
function btn(t,fn,g){return el('button',{class:'s'+(g===false?'':' g'),type:'button',onclick:fn},t)}
function csvParse(text){
 const rows=[];let row=[],f='',q=false;text=text.replace(/^﻿/,'');
 for(let i=0;i<text.length;i++){const c=text[i];
  if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
  else if(c==='"')q=true;
  else if(c===','){row.push(f);f=''}
  else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(f);rows.push(row);row=[];f=''}
  else f+=c}
 if(f!==''||row.length){row.push(f);rows.push(row)}
 return rows}
function downloadCSV(name,rows){
 const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
 const a=el('a',{href:URL.createObjectURL(new Blob(['﻿'+rows.map(r=>r.map(q).join(',')).join('\n')],{type:'text/csv'})),download:name});
 document.body.append(a);a.click();a.remove()}
