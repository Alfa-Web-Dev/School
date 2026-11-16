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
async function reloadClasses(){
 const r=await call('listClasses');CL=r.classes;SUB=r.subjects;
 $('#cl').innerHTML='';$('#cl').append(tableEl([{h:'Class',f:r=>r.name},{h:'Class teacher',f:r=>tname(r.classTeacherId)},
  {h:'',f:r=>el('div',{class:'row',style:'flex-wrap:wrap'},[btn('Class teacher',()=>formModal('Class teacher - '+r.name,CFIELDS(),r,async v=>{v.classId=r.classId;await call('saveClass',{cls:v});await reloadClasses()})),
   btn('+ Section',()=>formModal('Add sections to '+(r.grade&&!/^\d+$/.test(r.grade)?r.grade:'Class '+r.grade),[{k:'sections',l:'Sections (e.g. A, B, C)',req:1}],{},async v=>{await call('saveSections',{grade:r.grade,sections:v.sections});await reloadClasses();toast('Sections added')})),
   r.section&&!r.inUse?btn('Delete',async()=>{if(confirm('Delete '+r.name+'?')){await call('deleteClass',{classId:r.classId});await reloadClasses()}}):''])}],CL,'No classes yet'));
 $('#subl').innerHTML='';$('#subl').append(tableEl([{h:'ID',f:r=>r.subjectId},{h:'Subject',f:r=>r.name},
  {h:'',f:r=>btn('Rename',()=>formModal('Rename subject',[{k:'name',l:'Name',req:1}],r,async v=>{v.subjectId=r.subjectId;await call('saveSubject',{subject:v});await reloadClasses()}))}],SUB,'No subjects yet'))}
async function initClasses(){
 const m=$('#main');m.innerHTML='';TE=(await call('listTeachers')).teachers;
 m.append(el('h1',{'data-i':'n_classes'}),
  el('p',{class:'mu'},'Nursery, Prep 1, Prep 2 and Class 1 to 10 are ready. Sections (A, B, C) are optional: tap + Section only if your school uses them.'),el('div',{id:'cl'}),
  el('h3',{},'Subjects'),el('div',{class:'bar'},btn('+ Add subject',()=>formModal('Add subject',[{k:'name',l:'Name',req:1}],{},async v=>{await call('saveSubject',{subject:v});await reloadClasses()}),false)),el('div',{id:'subl'}));
 await reloadClasses();applyI18n()}
