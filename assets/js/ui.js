// Admin pages ke common UI helpers (modal, form, table, CSV, toast)
const $=s=>document.querySelector(s);
function el(tag,at,...kids){const e=document.createElement(tag);
 Object.entries(at||{}).forEach(([k,v])=>k==='class'?e.className=v:k.startsWith('on')?e[k]=v:e.setAttribute(k,v));
 kids.flat().forEach(c=>e.append(c&&c.nodeType?c:document.createTextNode(c==null?'':c)));return e}
async function call(action,data){
 const r=await api(action,data||{});
 if(!r.ok){if(r.error==='Session expired. Please login again.'){TOK.clear();location.href='../login.html'}throw new Error(r.error||'Error')}
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
  const v={};for(const f of fields){v[f.k]=inp[f.k].value.trim();if(f.req&&!v[f.k])throw new Error(f.l+' is required')}
  await onSave(v)}}])}
function showSecret(title,rows,note){
 const txt=rows.map(r=>r.join(': ')).join('\n');
 modal(title,el('div',{},el('pre',{class:'sec'},txt),el('p',{class:'mu'},note||'This is shown only now. Copy it and give it to the student/parent.')),
  [{t:'Copy',g:1,fn:async()=>{try{await navigator.clipboard.writeText(txt);toast('Copied')}catch(e){toast('Copy failed',1)}return false}},{t:'OK',fn:()=>true}])}
function tableEl(cols,rows,empty){
 if(!rows.length)return emptyState(empty||'Nothing found','');
 return el('div',{class:'tw'},el('table',{class:'tbl'},el('thead',{},el('tr',{},cols.map(c=>el('th',{},c.h)))),
  el('tbody',{},rows.map(r=>el('tr',{},cols.map(c=>el('td',{'data-l':c.h||''},(()=>{const v=c.f(r);return c.h==='Name'&&typeof v==='string'&&v&&window.PA?PA.nameCell(v,r):v})())))))))}
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

function helloCard(name,id,sub){const h=new Date().getHours(),g=h<12?'Good morning':h<17?'Good afternoon':'Good evening',a=el('span',{class:'av lg pic'});a.innerHTML=AV.svg(AV.get(id,name));
 const d=el('div',{class:'hello hl2'},a,el('div',{},el('small',{},g+' 👋'),el('b',{},name),el('span',{class:'mu'},sub||'')));
 const w=document.createElement('span');w.className='hs';w.innerHTML=PA.mini({student:'cap',teacher:'board'}[(window.__U||{}).role]||'chart');d.append(w);return d}
function ringCard(pct,title,sub){const p=Math.max(0,Math.min(100,+pct||0)),R=34,C=2*Math.PI*R,d=document.createElement('div');d.className='ringc';
 d.innerHTML='<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="'+R+'" fill="none" stroke="rgba(0,0,0,.08)" stroke-width="9"/><circle cx="40" cy="40" r="'+R+'" fill="none" stroke="var(--c)" stroke-width="9" stroke-linecap="round" stroke-dasharray="'+(C*p/100).toFixed(1)+' '+C.toFixed(1)+'" transform="rotate(-90 40 40)"/></svg><b>'+Math.round(p)+'%</b><div><span>'+title+'</span><small>'+(sub||'')+'</small></div>';return d}
/* ---- reference-style widgets ---- */
function calMonth(rows){const map={};rows.forEach(r=>map[r.date]=r.status);let d=new Date();d.setDate(1);const box=el('div',{class:'calc'});
 const draw=()=>{box.innerHTML='';const y=d.getFullYear(),mo=d.getMonth(),first=(new Date(y,mo,1).getDay()+6)%7,days=new Date(y,mo+1,0).getDate(),td=new Date().toISOString().slice(0,10);
  box.append(el('div',{class:'calh'},el('button',{type:'button',class:'cn',onclick:()=>{d.setMonth(d.getMonth()-1);draw()}},'‹'),el('b',{},d.toLocaleDateString('en-IN',{month:'long',year:'numeric'})),el('button',{type:'button',class:'cn',onclick:()=>{d.setMonth(d.getMonth()+1);draw()}},'›')));
  const g=el('div',{class:'calg'});['M','T','W','T','F','S','S'].forEach(x=>g.append(el('span',{class:'dw'},x)));
  for(let i=0;i<first;i++)g.append(el('span'));
  for(let i=1;i<=days;i++){const k=y+'-'+String(mo+1).padStart(2,'0')+'-'+String(i).padStart(2,'0'),s=map[k];g.append(el('span',{class:'dd'+(s?' s'+s:'')+(k===td?' td':'')},String(i)))}
  box.append(g,el('div',{class:'calk'},el('span',{class:'sP'},'Present'),el('span',{class:'sA'},'Absent'),el('span',{class:'sL'},'Late')))};draw();return box}
function barChart(items,title){const w=el('div',{class:'bars'});if(title)w.append(el('b',{class:'bt'},title));const row=el('div',{class:'brow'});
 items.forEach(x=>{const p=Math.max(0,Math.min(100,+x.pct||0));row.append(el('div',{class:'bc'},el('span',{class:'bv'},String(x.v)),el('div',{class:'bar2'},el('i',{style:'height:'+Math.max(p,4)+'%'})),el('small',{},String(x.l).slice(0,7))))});w.append(row);return w}
function dayTimetable(m,lessons,mk){const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],t=days[(new Date().getDay()+6)%7];let cur=lessons.some(l=>l.day===t)?t:(days.find(d=>lessons.some(l=>l.day===d))||t);const strip=el('div',{class:'dstrip'}),list=el('div',{class:'tlist'});
 const draw=()=>{strip.innerHTML='';days.forEach(d=>strip.append(el('button',{type:'button',class:'dchip'+(d===cur?' on':'')+(d===t?' tod':''),onclick:()=>{cur=d;draw()}},d)));
  list.innerHTML='';const ls=lessons.filter(l=>l.day===cur);if(!ls.length)list.append(emptyState('No classes','No classes on this day'));
  ls.forEach((l,i)=>list.append(el('div',{class:'tcard t'+(i%4)},el('div',{class:'tt'},el('b',{},l.start),el('small',{},l.end)),el('div',{class:'tb2'},el('b',{},l.subject),el('span',{class:'mu'},mk(l))))))};draw();m.append(strip,list)}
function emptyState(t,s){return PA.empty(t,s)}


function quickActions(list){const w=el('div',{class:'qa'});list.forEach(([href,k,label,cls])=>{const a=el('a',{href,class:'qi '+(cls||'')});a.innerHTML='<span class="ich">'+icon(k)+'</span><span class="ql"></span>'+PA.mini(PA.prop(k+' '+label));a.querySelector('.ql').textContent=label;w.append(a)});return w}

// 12 mahine ka fee status: Paid / Partial / Due / Upcoming
function monthGrid(months){
 const R=n=>'₹'+Math.abs(Number(n||0)).toLocaleString('en-IN'),ST={paid:['Paid','✓'],partial:['Partial','◐'],due:['Due','!'],upcoming:['Upcoming','·']};
 if(!months||!months.length)return el('div');
 const cnt=k=>months.filter(m=>m.status===k).length;
 const sum=el('div',{class:'mgs'},[['paid','Paid'],['partial','Partial'],['due','Due']].map(([k,l])=>el('span',{class:'mgc '+k},el('b',{},String(cnt(k))),' '+l)));
 const g=el('div',{class:'mg'},months.map(m=>{const t=el('div',{class:'mt '+m.status,title:m.items.map(i=>i.feeType+': '+R(i.paid)+' / '+R(i.due)).join('\n')},
  el('small',{},m.label+(m.status==='partial'?' · '+R(m.paid)+' paid':'')),el('b',{},R(m.status==='partial'||m.status==='due'?m.balance:m.due)),el('span',{class:'mb'},ST[m.status][1]+' '+ST[m.status][0]+(m.status==='partial'?'':'')));return t}));
 return el('div',{},sum,g)}
