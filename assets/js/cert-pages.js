// Phase 10: Certificates (Bonafide, TC, Character) + ID cards. ui.js, qr.js ke baad load hota hai.
const E2=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hdr=t=>'<div class="rh"><h2>'+E2(CFG.name)+'</h2><div class="mu">'+E2(CFG.address)+' · '+E2(CFG.phone)+'</div><h3>'+t+'</h3></div>';
const heshe=g=>g==='F'?['She','her','daughter']:['He','his','son'];
const sig=()=>'<div class="sig"><span>Class teacher</span><span>Principal / Seal</span></div>';
function certHtml(type,r,x){const s=r.student,[he,his,child]=heshe(s.gender),meta='<div class="cmeta"><span>Ref: '+r.ref+'</span><span>Date: '+r.date+'</span></div>',
 who='<b>'+E2(s.name)+'</b>, '+child+' of <b>'+E2(s.parentName||'-')+'</b>',dob=s.dob?' (Date of birth: '+E2(s.dob)+')':'',adm=s.admNo?' (Admission no: '+E2(s.admNo)+')':'';
 if(type==='bonafide')return hdr('BONAFIDE CERTIFICATE')+meta+'<p class="cbody">This is to certify that '+who+dob+' is a bonafide student of this school, studying in <b>'+E2(s.className)+'</b>'+(r.year?' during the session <b>'+E2(r.year)+'</b>':'')+adm+'.'+(x.purpose?' This certificate is issued for <b>'+E2(x.purpose)+'</b>.':'')+'</p>'+sig();
 if(type==='character')return hdr('CHARACTER CERTIFICATE')+meta+'<p class="cbody">This is to certify that '+who+dob+' has studied in this school in <b>'+E2(s.className)+'</b>'+adm+'. To the best of our knowledge, '+he.toLowerCase()+' bears a good moral character and '+his+' conduct has been <b>'+E2(x.conduct||'Good')+'</b>.</p>'+sig();
 const row=(a,b)=>'<tr><td class="mu">'+a+'</td><td><b>'+E2(b||'-')+'</b></td></tr>';
 return hdr('TRANSFER CERTIFICATE')+meta+'<table class="rt">'+row('Student name',s.name)+row('Admission no',s.admNo||s.studentId)+row("Father's / Guardian's name",s.parentName)+row('Date of birth',s.dob)+row('Class last studied',s.className)
  +row('Date of leaving',x.leaveDate)+row('Reason for leaving',x.reason)+row('Conduct',x.conduct||'Good')+row('Fees paid up to date',x.feesPaid||'Yes')+row('Remarks',x.remarks)+'</table>'+sig()}

async function initCerts(){
 const m=$('#main');m.innerHTML='';const ls=await call('listStudents'),st=ls.students,cl=ls.classes,out=el('div',{id:'cert'});
 const sel=el('select',{},st.map(s=>el('option',{value:s.studentId},s.name+' ('+s.studentId+')'+(String(s.status).toLowerCase()==='active'?'':' - '+s.status)))),
  ty=el('select',{},[['bonafide','Bonafide certificate'],['tc','Transfer certificate (TC)'],['character','Character certificate']].map(([v,l])=>el('option',{value:v},l))),
  ex=el('div',{class:'frm'});
 const fld=(k,l,t)=>{const i=el('input',{type:t||'text',placeholder:l});i.dataset.k=k;return i};
 function drawFields(){ex.innerHTML='';({bonafide:[['purpose','Purpose (e.g. bank, passport)']],character:[['conduct','Conduct (e.g. Good / Excellent)']],tc:[['leaveDate','Date of leaving','date'],['reason','Reason for leaving'],['conduct','Conduct'],['feesPaid','Fees paid up to date (Yes/No)'],['remarks','Remarks']]})[ty.value].forEach(f=>ex.append(fld(...f)))}
 ty.onchange=drawFields;drawFields();
 const cls=el('select',{},cl.map(c=>el('option',{value:c.classId},c.name)));
 m.append(el('h1',{'data-i':'n_certificates'}),el('div',{class:'no-print'},el('div',{class:'bar'},sel,ty),ex,el('div',{class:'bar'},btn('Generate',async()=>{
   const x={};ex.querySelectorAll('input').forEach(i=>x[i.dataset.k]=i.value);
   try{const r=await call('issueCertificate',{type:ty.value,studentId:sel.value});out.innerHTML='<div class="rcpt cert">'+certHtml(ty.value,r,x)+'</div>';
    out.append(btn('Print / Save as PDF',()=>window.print()))}catch(e){toast(e.message,1)}},false)),
  el('h3',{},'ID cards'),el('p',{class:'mu'},'Poori class ke ID cards ek saath print karo (QR mein student ID hai).'),el('div',{class:'bar'},cls,btn('Make ID cards',()=>idCards(cls,st,out),false))),out);
 applyI18n()}
function idCards(sel,all,out){
 const cid=sel.value,cname=sel.selectedOptions[0]?sel.selectedOptions[0].text:cid,rows=all.filter(s=>String(s.classId)===cid&&String(s.status).toLowerCase()==='active');
 if(!rows.length){toast('Is class mein student nahi',1);return}
 out.innerHTML='<div class="idgrid">'+rows.map(s=>'<div class="idc"><div class="idh" style="background:'+E2(CFG.color)+'">'+E2(CFG.shortName||CFG.name)+'<small>'+E2(CFG.name)+'</small></div><div class="idb"><div class="idq">'+(typeof qrSvg==='function'?qrSvg(String(s.studentId),84):'')+'</div><div><b>'+E2(s.name)+'</b><br>ID: '+E2(s.studentId)+'<br>Class: '+E2(cname)+(s.roll?' · Roll '+E2(s.roll):'')+'<br>Parent: '+E2(s.parentName)+'<br>Ph: '+E2(s.parentPhone)+'</div></div><div class="idf">'+E2(CFG.phone)+'</div></div>').join('')+'</div>';
 out.append(btn('Print / Save as PDF',()=>window.print()))}
