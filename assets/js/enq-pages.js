// Phase 7: admin Enquiries inbox (ui.js ke baad)
async function initEnquiries(){
 const m=$('#main');m.innerHTML='';const box=el('div'),f=el('select',{},[['all','Sab'],['new','New'],['contacted','Contacted'],['closed','Closed']].map(([v,l])=>el('option',{value:v},l))),ft=el('select',{},[['all','All types'],['admission','Admission enquiry'],['complaint','Complaint'],['review','Review'],['general','Question']].map(([v,l])=>el('option',{value:v},l)));let all=[];
 m.append(el('h1',{'data-i':'n_enquiries'}),el('div',{class:'bar'},ft,f),box);
 async function load(){const r=await call('listEnquiries');all=r.enquiries;draw()}
 function draw(){const rows=all.filter(e=>(f.value==='all'||e.status===f.value)&&(ft.value==='all'||e.type===ft.value));box.innerHTML='';
  box.append(tableEl([{h:'Time',f:e=>e.time},{h:'Type',f:e=>el('b',{},TL[e.type]||e.type)},{h:'Name',f:e=>e.name+(e.role?' ('+e.role+')':'')},{h:'Phone',f:e=>!e.phone?'-':el('span',{},el('a',{href:'tel:'+e.phone},e.phone),' · ',el('a',{href:'https://wa.me/'+e.phone.replace('+',''),target:'_blank',rel:'noopener'},'WhatsApp'))},{h:'Message',f:e=>{const d=e.details||{},x=[];if(d.rating)x.push('★'.repeat(+d.rating)+'☆'.repeat(5-d.rating));['title','cat','child','cls','topic'].forEach(k=>d[k]&&x.push(d[k]));if(d.urgent)x.push('URGENT');if(d.show)x.push('OK to show');return el('div',{},x.length?el('div',{class:'mu'},x.join(' · ')):'',e.email?el('div',{class:'mu'},el('a',{href:'mailto:'+e.email},e.email)):'',e.message)}},
   {h:'Status',f:e=>{const s=el('select',{},ENQ.map(v=>el('option',{value:v},v)));s.value=e.status;s.onchange=async()=>{try{await call('updateEnquiry',{id:e.id,status:s.value});e.status=s.value;toast('Save hua')}catch(x){toast(x.message,1)}};return s}},
   {h:'',f:e=>btn('Delete',async()=>{if(!confirm('Delete karein?'))return;try{await call('updateEnquiry',{id:e.id,delete:1});await load()}catch(x){toast(x.message,1)}},false)}],rows,'Koi enquiry nahi'))}
 f.onchange=draw;ft.onchange=draw;await load();applyI18n()}
const TL={admission:'Admission',complaint:'Complaint',review:'Review',general:'Question'};
const ENQ=['new','contacted','closed'];
