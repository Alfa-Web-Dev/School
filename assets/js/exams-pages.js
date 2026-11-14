// Phase 6: admin Exams page + teacher (class teacher) Class Results page. ui.js, portal-pages.js, teacher-pages.js ke baad load hota hai.
const RC=(ex,st)=>'../reportcard.html?exam='+encodeURIComponent(ex)+(st?'&student='+encodeURIComponent(st):'');
async function resultSheet(box,examId){
 box.innerHTML='';const r=await call('getResults',{examId});
 const cols=[{h:'Roll',f:s=>s.roll},{h:'Name',f:s=>s.name}].concat(r.subjects.map(u=>({h:u.name,f:s=>s.marks[u.subjectId]===undefined?'-':s.marks[u.subjectId]})),
  [{h:'Total',f:s=>s.max?s.total+'/'+s.max:'-'},{h:'%',f:s=>s.max?s.percent:'-'},{h:'Grade',f:s=>s.grade||'-'},{h:'Rank',f:s=>s.rank||'-'},
   {h:'Result',f:s=>!s.max?'-':s.pass?'Pass':'Fail'},{h:'',f:s=>s.max?el('a',{href:RC(examId,s.studentId),target:'_blank',rel:'noopener'},'Report card'):''}]);
 box.append(el('h3',{},r.exam.title+' · '+r.exam.date+' (max '+r.exam.maxMarks+' per subject)'),
  el('div',{class:'bar'},btn('Download CSV',()=>downloadCSV('results-'+examId+'.csv',[['Roll','Name'].concat(r.subjects.map(u=>u.name),['Total','Max','Percent','Grade','Rank','Result'])]
    .concat(r.students.map(s=>[s.roll,s.name].concat(r.subjects.map(u=>s.marks[u.subjectId]===undefined?'':s.marks[u.subjectId]),[s.total,s.max,s.percent,s.grade,s.rank,s.max?(s.pass?'Pass':'Fail'):'']))))),
   btn('Print all report cards',()=>window.open(RC(examId)+'&all=1','_blank'),false)),
  tableEl(cols,r.students,'Is class mein student nahi'),
  el('p',{class:'mu'},'Grade: A+ 90+, A 80+, B+ 70+, B 60+, C 50+, D 40+, E 33+, F neeche. Pass = har subject mein 33% ya zyada. Marks teacher "Marks Entry" se bharte hain.'))}

const EXFIELDS=(cls,edit)=>[{k:'title',l:'Exam name (e.g. Unit Test 1)',req:1}].concat(edit?[]:[{k:'classId',l:'Class',type:'select',opts:[['*','Saari classes']].concat(cls.map(c=>[c.classId,c.name]))}],
 [{k:'date',l:'Date',type:'date',req:1},{k:'maxMarks',l:'Max marks per subject',type:'number',req:1}]);

async function initAExams(){
 const m=$('#main');m.innerHTML='';const cls=(await call('listClasses')).classes,box=el('div'),res=el('div');
 m.append(el('h1',{'data-i':'n_exams'}),el('div',{class:'bar'},btn('+ Create exam',()=>formModal('Create exam',EXFIELDS(cls),{maxMarks:100,date:today()},async v=>{
   const d={title:v.title,date:v.date,maxMarks:Number(v.maxMarks)};if(v.classId==='*')d.classIds=cls.map(c=>c.classId);else d.classId=v.classId;
   await call('saveExam',{exam:d});toast('Exam ban gaya');await load()}),false)),box,res);
 async function load(){const r=await call('adminExams');box.innerHTML='';
  box.append(tableEl([{h:'Exam',f:e=>e.title},{h:'Class',f:e=>e.className},{h:'Date',f:e=>e.date},{h:'Max',f:e=>e.maxMarks},{h:'Marks bhare',f:e=>e.entries},
   {h:'',f:e=>el('span',{class:'bar'},btn('Results',()=>resultSheet(res,e.examId).catch(x=>toast(x.message,1)).then(()=>res.scrollIntoView()),false),
     btn('Edit',()=>formModal('Edit exam',EXFIELDS(cls,1),e,async v=>{await call('saveExam',{exam:{examId:e.examId,title:v.title,date:v.date,maxMarks:Number(v.maxMarks)}});toast('Save hua');await load()}),false),
     btn('Delete',async()=>{if(!confirm('Exam "'+e.title+'" delete karein?'))return;try{await call('deleteExam',{examId:e.examId});toast('Delete hua');await load()}catch(x){toast(x.message,1)}},false))}],r.exams,'Abhi koi exam nahi. "+ Create exam" dabao.'))}
 await load();applyI18n()}

async function initTResults(){
 const m=page('n_results'),h=await teacherHomeData(),mine=h.classes.filter(c=>c.isClassTeacher);
 if(!mine.length){m.append(el('p',{class:'mu'},'Poora result sirf class teacher dekh sakta hai. Aap kisi class ke class teacher nahi hain.'));return}
 const box=el('div'),res=el('div'),es=el('select');let cs;
 async function loadEx(){es.innerHTML='';const r=await call('listExams',{classId:cs.value});r.exams.forEach(e=>es.append(el('option',{value:e.examId},e.title+' ('+e.date+')')));
  res.innerHTML='';if(!r.exams.length)res.append(el('p',{class:'mu'},'Is class ka koi exam nahi'));else await show()}
 async function show(){try{await resultSheet(res,es.value)}catch(e){toast(e.message,1)}}
 cs=classSelect(mine,loadEx);es.onchange=show;m.append(el('div',{class:'bar'},cs,es),res);await loadEx()}
