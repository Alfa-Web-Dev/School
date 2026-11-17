// Admin pages: dashboard, students, teachers, classes
let CL=[],ST=[],TE=[],SUB=[];
const cname=id=>(CL.find(c=>c.classId===id)||{}).name||id;
const tname=id=>(TE.find(t=>t.userId===id)||{}).name||'';

/* ---------- Dashboard ---------- */
async function initDash(){
 const m=$('#main');m.innerHTML='';m.append(el('h1',{'data-i':'n_dashboard'}));
 const r=await call('dashboardStats'),s=r.stats;
 m.append(helloCard(__U.name,__U.userId,'School administrator'),quickActions([['students.html','students','Students','q0'],['fees.html','fees','Fees','q1'],['notices.html','notices','Notices','q2'],['enquiries.html','enquiries','Enquiries','q3']]),el('div',{class:'grid'},[['Students',s.students],['Teachers',s.teachers],['Classes',s.classes],['New enquiries',s.newEnquiries],['Present today',s.today.marked?s.today.present+' / '+s.today.marked:'-'],['This month\'s fees','₹'+Number(s.monthFees).toLocaleString('en-IN')]].map(([l,v])=>el('div',{class:'card stat'},el('div',{class:'big'},v),el('div',{class:'mu'},l)))));
 m.append(el('h3',{},'Class-wise students'),tableEl([{h:'Class',f:r=>r.name},{h:'Students',f:r=>r.count}],s.byClass,'No classes yet'));
 applyI18n()}

/* ---------- Students ---------- */
const SFIELDS=()=>[
 {k:'name',l:'Name',req:1},{k:'classId',l:'Class',type:'select',opts:CL.map(c=>[c.classId,c.name])},
 {k:'roll',l:'Roll no'},{k:'gender',l:'Gender',type:'select',opts:[['','-'],['M','Male'],['F','Female'],['O','Other']]},
 {k:'dob',l:'Date of birth',type:'date'},{k:'admNo',l:'Admission no (blank = auto)'},
 {k:'parentName',l:'Parent name'},{k:'parentPhone',l:'Parent phone (for records only)',type:'tel'},
 {k:'address',l:'Address',type:'textarea'},{k:'status',l:'Status',type:'select',opts:[['active','Active'],['inactive','Inactive'],['passed-out','Passed out']]}];
function showStudentCreds(r){showSecret('Student login',[['Student ID',r.studentId],['PIN',r.pin]],'This is shown only now. Give it to the student/parent (parents will use the same login).')}
async function reloadStudents(){const r=await call('listStudents');ST=r.students;CL=r.classes;drawStudents()}
function drawStudents(){
 const q=($('#sq').value||'').toLowerCase(),c=$('#sc').value;
 const rows=ST.filter(s=>(!c||s.classId===c)&&(!q||(s.name+' '+s.studentId+' '+s.admNo+' '+s.parentPhone).toLowerCase().includes(q)));
 $('#sl').innerHTML='';$('#sl').append(el('p',{class:'mu'},rows.length+' students'),tableEl([
  {h:'ID',f:r=>r.studentId},{h:'Name',f:r=>r.name},{h:'Class',f:r=>cname(r.classId)},{h:'Roll',f:r=>r.roll},
  {h:'Parent',f:r=>r.parentName+(r.parentPhone?' ('+r.parentPhone+')':'')},{h:'Status',f:r=>r.status},
  {h:'',f:r=>el('div',{class:'row'},
   btn('Edit',()=>formModal('Edit student',SFIELDS(),r,async v=>{v.studentId=r.studentId;const x=await call('saveStudent',{student:v});await reloadStudents();})),
   btn('PIN',()=>resetFor('student',r.studentId,r.name)))}],rows))}
async function resetFor(kind,id,name){
 if(!confirm('"'+name+'" - create a new '+(kind==='teacher'?'password':'PIN')+'? The old one will stop working.'))return;
 const r=await call('resetSecret',{kind,id});
 showSecret('New '+(kind==='teacher'?'password':'PIN'),[['ID',id],['Name',name],[kind==='teacher'?'Password':'PIN',r.secret]])}
const KEYS=['name','classId','roll','gender','dob','admNo','parentName','parentPhone','address'];
function importCSV(){
 const i=el('input',{type:'file',accept:'.csv,text/csv'});
 i.onchange=async()=>{try{
  const rows=csvParse(await i.files[0].text());if(rows.length<2)throw new Error('The CSV is empty');
  const head=rows[0].map(h=>KEYS.find(k=>k.toLowerCase()===h.trim().toLowerCase())||h.trim());
  if(head.indexOf('name')<0||head.indexOf('classId')<0)throw new Error('The header must have name and classId');
  const data=rows.slice(1).filter(r=>r.some(x=>x.trim())).map(r=>{const o={};head.forEach((h,j)=>o[h]=(r[j]||'').trim());return o});
  if(!confirm(data.length+' students to import. Continue?'))return;
  toast('Import in progress, do not close the page...');const out=[['row','studentId','name','PIN','error']];let bad=0;
  for(let k=0;k<data.length;k+=40){const r=await call('importStudents',{rows:data.slice(k,k+40)});
   r.results.forEach((x,j)=>{if(x.error)bad++;out.push([k+j+2,x.studentId||'',x.name||'',x.pin||'',x.error||''])})}
  await reloadStudents();downloadCSV('import-result.csv',out);
  toast((data.length-bad)+' added, '+bad+' errors. Result CSV (with PINs) downloaded.',bad>0)}catch(e){toast(e.message,1)}};i.click()}
function promote(){
 const opts=CL.map(c=>[c.classId,c.name]);
 formModal('Promote students',[{k:'f',l:'From class',type:'select',opts},{k:'t',l:'To class',type:'select',opts:opts.concat([['PASSOUT','Passed out (left school)']])}],{},async v=>{
  if(!confirm('Active students '+cname(v.f)+' to '+(v.t==='PASSOUT'?'Passed out':cname(v.t))+' will be moved there. Sure?'))throw new Error('Cancelled');
  const r=await call('promoteStudents',{fromClassId:v.f,toClassId:v.t});toast(r.moved+' students moved');await reloadStudents()})}
async function initStudents(){
 const m=$('#main');m.innerHTML='';
 m.append(el('h1',{'data-i':'n_students'}),
  el('div',{class:'bar'},el('select',{id:'sc'}),el('input',{id:'sq',placeholder:'Search name / ID / phone'}),
   btn('+ Add',()=>formModal('Add student',SFIELDS(),{status:'active'},async v=>{const x=await call('saveStudent',{student:v});await reloadStudents();showStudentCreds(x)}),false),
   btn('Import CSV',importCSV),btn('Template',()=>downloadCSV('students-template.csv',[KEYS,['Aarav Sharma','C5A','1','M','2015-03-12','','Rajesh Sharma','9100000001','Demo Road']])),btn('Promote',promote)),
  el('div',{id:'sl'}));
 await reloadStudents();
 const sc=$('#sc');sc.append(el('option',{value:''},'All classes'),CL.map(c=>el('option',{value:c.classId},c.name)));
 sc.onchange=drawStudents;$('#sq').oninput=drawStudents;applyI18n()}

/* ---------- Teachers ---------- */
const TFIELDS=[{k:'name',l:'Name',req:1},{k:'phone',l:'Phone',type:'tel'},{k:'email',l:'Email'},{k:'active',l:'Status',type:'select',opts:[['true','Active'],['false','Inactive']]}];
async function reloadTeachers(){TE=(await call('listTeachers')).teachers;
 $('#tl').innerHTML='';$('#tl').append(tableEl([{h:'ID (login)',f:r=>r.userId},{h:'Name',f:r=>r.name},{h:'Phone',f:r=>r.phone},{h:'Email',f:r=>r.email},
  {h:'Status',f:r=>String(r.active).toUpperCase()==='TRUE'?'Active':'Inactive'},
  {h:'',f:r=>el('div',{class:'row'},btn('Edit',()=>formModal('Edit teacher',TFIELDS,Object.assign({},r,{active:String(String(r.active).toUpperCase()==='TRUE')}),async v=>{v.userId=r.userId;await call('saveTeacher',{teacher:v});await reloadTeachers()})),
   btn('Password',()=>resetFor('teacher',r.userId,r.name)))}],TE,'No teachers yet'))}
async function initTeachers(){
 const m=$('#main');m.innerHTML='';
 m.append(el('h1',{'data-i':'n_teachers'}),el('div',{class:'bar'},btn('+ Add teacher',()=>formModal('Add teacher',TFIELDS,{active:'true'},async v=>{
  const x=await call('saveTeacher',{teacher:v});await reloadTeachers();showSecret('Teacher login',[['User ID',x.userId],['Password',x.password]])}),false)),el('div',{id:'tl'}));
 await reloadTeachers();applyI18n()}

/* ---------- Classes & Subjects ---------- */
const CFIELDS=()=>[{k:'classTeacherId',l:'Class teacher',type:'select',opts:[['','-']].concat(TE.map(t=>[t.userId,t.name+' ('+t.userId+')']))}];
const nextLetter=l=>{const u=l.map(x=>x.section);for(const c of 'ABCDEFGH')if(!u.includes(c))return c;return ''};
async function reloadClasses(){
 const r=await call('listClasses');CL=r.classes;SUB=r.subjects;
 const G=[],mp={};CL.forEach(c=>{const k=String(c.grade);if(!mp[k]){mp[k]={grade:k,base:null,secs:[]};G.push(mp[k])}c.section?mp[k].secs.push(c):mp[k].base=c});
 const row=(c,label)=>el('div',{class:'cgr'},el('b',{class:'cgn'},label||c.name),el('span',{class:'cgt'},c.classTeacherId?tname(c.classTeacherId):'No class teacher'),
  el('div',{class:'row'},[btn('Class teacher',()=>formModal('Class teacher - '+c.name,CFIELDS(),c,async v=>{v.classId=c.classId;await call('saveClass',{cls:v});await reloadClasses()})),
   c.section&&!c.inUse?btn('Delete',async()=>{if(confirm('Delete '+c.name+'?')){await call('deleteClass',{classId:c.classId});await reloadClasses()}}):'']));
 const box=$('#cl');box.innerHTML='';
 G.forEach(g=>{const t=g.base?g.base.name:(g.secs[0].name.slice(0,-g.secs[0].section.length)).trim(),any=g.base||g.secs[0];
  const h=el('div',{class:'cgh'},el('b',{},t),el('em',{},g.secs.length?g.secs.length+(g.secs.length>1?' sections':' section'):'No sections'),
   btn('+ Section',()=>formModal('Add sections to '+t,[{k:'sections',l:'Section letters (e.g. A, B, C)',req:1}],{sections:g.secs.length?nextLetter(g.secs):'A'},async v=>{await call('saveSections',{grade:g.grade,sections:v.sections});await reloadClasses();toast('Sections added')})));
  const body=el('div',{class:'cgb'});
  if(g.base)body.append(row(g.base,g.secs.length?t+' (no section)':t));
  g.secs.forEach(c=>body.append(row(c)));
  box.append(el('section',{class:'cg'},h,body))});
 $('#subl').innerHTML='';$('#subl').append(tableEl([{h:'ID',f:r=>r.subjectId},{h:'Subject',f:r=>r.name},
  {h:'',f:r=>btn('Rename',()=>formModal('Rename subject',[{k:'name',l:'Name',req:1}],r,async v=>{v.subjectId=r.subjectId;await call('saveSubject',{subject:v});await reloadClasses()}))}],SUB,'No subjects yet'))}
async function initClasses(){
 const m=$('#main');m.innerHTML='';TE=(await call('listTeachers')).teachers;
 m.append(el('h1',{'data-i':'n_classes'}),
  el('p',{class:'mu'},'Nursery, Prep 1, Prep 2 and Class 1 to 10 are ready. Sections are optional: tap + Section on a class only if it has divisions like 6A, 6B, 6C.'),el('div',{id:'cl'}),
  el('h3',{},'Subjects'),el('div',{class:'bar'},btn('+ Add subject',()=>formModal('Add subject',[{k:'name',l:'Name',req:1}],{},async v=>{await call('saveSubject',{subject:v});await reloadClasses()}),false)),el('div',{id:'subl'}));
 await reloadClasses();applyI18n()}
