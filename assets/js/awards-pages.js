// Achievements: awards from teachers + automatic badges; printable award certificate
const aE=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const A_CAT={academic:'Academic',sports:'Sports',arts:'Arts',conduct:'Conduct',other:'Other'};
const aDay=d=>new Date(d+'T00:00:00+05:30').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kolkata'});
const aChip=(t,k)=>el('span',{class:'tchip '+(k||'')},t);
const aF=(l,i,h)=>el('div',{class:'tf'},el('label',{},l),i,h?el('small',{class:'mu'},h):'');

function printAward(a,student,className){
 const w=window.open('','_blank');if(!w){toast('Allow pop-ups to print the certificate',1);return}
 const sch=typeof SN==='function'?SN():'School';
 w.document.write('<!doctype html><meta charset="utf-8"><title>Certificate</title><style>@page{size:A4 landscape;margin:12mm}body{font-family:Georgia,serif;margin:0;color:#111}.c{border:6px double #333;padding:36px 48px;min-height:165mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}h1{font-size:34px;letter-spacing:4px;margin:6px 0}h2{font-size:26px;margin:0}.n{font-size:36px;border-bottom:1px solid #333;padding:4px 40px;margin:14px 0}p{font-size:18px;margin:8px 0}.s{display:flex;justify-content:space-between;width:100%;margin-top:60px;font-size:15px}.s span{border-top:1px solid #333;padding-top:6px;min-width:180px}button{margin:14px;padding:8px 16px}@media print{button{display:none}}</style><div class="c"><h2>'+aE(sch)+'</h2><h1>CERTIFICATE OF ACHIEVEMENT</h1><p>This is proudly presented to</p><div class="n">'+aE(student)+'</div><p>'+(className?'of '+aE(className)+' ':'')+'for</p><p><b>'+aE(a.title)+'</b></p>'+(a.note?'<p>'+aE(a.note)+'</p>':'')+'<p>'+aE(aDay(a.date))+'</p><div class="s"><span>'+aE(a.by||'Class teacher')+'</span><span>Principal / Seal</span></div></div><div style="text-align:center"><button onclick="window.print()">Print / Save as PDF</button></div>');w.document.close()}

/* ---------------- student ---------------- */
async function initMyAwards(){
 const m=page('n_awards'),r=await call('myAchievements');
 const g=el('div',{class:'bdgrid'});r.badges.forEach(b=>g.append(el('div',{class:'bdg'+(b.earned?' on':'')},el('b',{},b.title),el('small',{},b.desc),el('span',{class:'mu'},b.earned?'Earned ✓':b.progress))));
 m.append(el('h3',{class:'sh'},'Badges'),g,el('h3',{class:'sh'},'Awards'));
 if(!r.awards.length){m.append(emptyState('No awards yet','Awards from your teachers will appear here.'));return}
 r.awards.forEach(a=>m.append(el('div',{class:'tcard'},el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},a.title),el('span',{class:'mu'},aDay(a.date)+(a.by?' · '+a.by:'')),a.note?el('span',{class:'mu'},a.note):''),aChip(A_CAT[a.category]||'Other','ok')),
  el('div',{class:'row'},btn('Certificate',()=>printAward(a,r.student,r.className),true)))))}

/* ---------------- teacher / admin ---------------- */
async function initAwardsStaff(){
 const m=page('n_awards'),opt=await call('noteOptions'),classes=opt.classes;
 if(!classes.length){m.append(emptyState('No classes yet','Classes appear here once you are assigned to them'));return}
 const body=el('div'),cs=el('select',{},classes.map(c=>el('option',{value:c.classId},c.name)));cs.onchange=()=>go();
 m.append(el('div',{class:'bar'},cs,btn('Give award',()=>give(cs.value,go),false)),body);
 async function go(){body.innerHTML='';const r=await call('listAwards',{classId:cs.value});
  if(!r.awards.length){body.append(emptyState('No awards for this class','Use "Give award" to recognise a student.'));return}
  r.awards.forEach(a=>body.append(el('div',{class:'tcard'},el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},a.student+' — '+a.title),el('span',{class:'mu'},aDay(a.date)+(a.by?' · '+a.by:'')),a.note?el('span',{class:'mu'},a.note):''),aChip(A_CAT[a.category]||'Other','ok')),
   el('div',{class:'row'},btn('Certificate',()=>printAward(a,a.student,a.className),true),btn('Remove',async()=>{if(!confirm('Remove this award?'))return;try{await call('deleteAward',{awardId:a.awardId});toast('Removed');await go()}catch(e){toast(e.message,1)}},true)))))}
 await go()}

async function give(classId,done){
 const today=new Date(Date.now()+19800000).toISOString().slice(0,10),r=await call('getAttendance',{classId,date:today});
 if(!r.students.length){toast('No active students in this class',1);return}
 const title=el('input',{placeholder:'Example: Class Topper, Best in Science',maxlength:100}),cat=el('select',{},Object.keys(A_CAT).map(k=>el('option',{value:k},A_CAT[k]))),date=el('input',{type:'date',value:today,max:today}),note=el('textarea',{rows:2,maxlength:200,placeholder:'Optional note'});
 const checks=r.students.map(s=>{const c=el('input',{type:'checkbox'});return{s,c,row:el('label',{class:'row'},c,el('span',{},(s.roll?s.roll+'. ':'')+s.name))}});
 const all=el('input',{type:'checkbox'});all.onchange=()=>checks.forEach(x=>{x.c.checked=all.checked});
 const body=el('div',{class:'tform'},aF('Award',title),aF('Type',cat),aF('Date',date),aF('Note',note),el('label',{class:'row'},all,el('b',{},'Select all')),el('div',{class:'sclog'},checks.map(x=>x.row)));
 const d=modal('Give award',body,[{t:'Cancel',g:1,fn:()=>true},{t:'Give',fn:async()=>{const ids=checks.filter(x=>x.c.checked).map(x=>x.s.studentId);
  try{const x=await call('giveAward',{studentIds:ids,title:title.value,category:cat.value,date:date.value,note:note.value});toast('Award given to '+x.given+' student'+(x.given>1?'s':''));await done()}catch(e){toast(e.message,1);return false}}}])}
