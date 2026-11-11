// Teacher panel + admin ke timetable/notices pages (ui.js, portal-pages.js ke baad load hota hai)
const today=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())};
const opt=(arr,v,l)=>arr.map(x=>[x[v],x[l]]);
let TH=null;
async function teacherHomeData(){if(!TH)TH=await call('teacherHome');return TH}
function classSelect(classes,onchange){const s=el('select',{},classes.map(c=>el('option',{value:c.classId},c.name)));s.onchange=onchange;return s}

async function initTHome(){
 const m=page('n_dashboard'),r=await teacherHomeData();
 m.append(el('h3',{},'Aaj ke periods'),tableEl([{h:'Time',f:l=>l.start+' - '+l.end},{h:'Class',f:l=>l.className},{h:'Subject',f:l=>l.subject}],r.today,'Aaj koi period nahi'),
  el('h3',{},'Meri classes'),tableEl([{h:'Class',f:c=>c.name+(c.isClassTeacher?' (Class teacher)':'')},{h:'Students',f:c=>c.students},{h:'Subjects',f:c=>c.subjects.join(', ')}],r.classes,'Abhi koi class assign nahi hai. Admin se kaho.'))}

async function initTAtt(){
 const m=page('n_attendance'),h=await teacherHomeData();
 if(!h.classes.length){m.append(el('p',{class:'mu'},'Abhi koi class assign nahi hai'));return}
 const cs=classSelect(h.classes,load),dt=el('input',{type:'date',value:today(),max:today()}),box=el('div'),msg=el('div',{class:'err'});
 dt.onchange=load;m.append(el('div',{class:'bar'},cs,dt),box,msg);
 let st=[];
 async function load(){box.innerHTML='';msg.textContent='';
  const r=await call('getAttendance',{classId:cs.value,date:dt.value});st=r.students.map(s=>Object.assign({},s));draw(r.marked)}
 function draw(marked){box.innerHTML='';
  if(!st.length){box.append(el('p',{class:'mu'},'Is class mein koi active student nahi'));return}
  box.append(el('div',{class:'bar'},btn('Sab Present',()=>{st.forEach(s=>s.status='P');draw(marked)}),el('span',{class:'mu'},marked?'Is din ki attendance pehle lag chuki hai (badalne par nayi entry banegi)':'')),
   tableEl([{h:'Roll',f:s=>s.roll},{h:'Name',f:s=>s.name},{h:'Status',f:s=>el('div',{class:'row'},['P','A','L'].map(k=>el('button',{type:'button',class:'s tg'+(s.status===k?' on '+k:''),onclick:()=>{s.status=k;draw(marked)}},k==='P'?'Present':k==='A'?'Absent':'Late')))}],st),
   el('div',{class:'bar'},btn('Save attendance',async()=>{
    const un=st.filter(s=>!s.status).length;if(un&&!confirm(un+' students ka status khali hai (save nahi hoga). Phir bhi save karein?'))return;
    try{const r=await call('markAttendance',{classId:cs.value,date:dt.value,marks:st.filter(s=>s.status).map(s=>({studentId:s.studentId,status:s.status}))});toast(r.saved?r.saved+' entries save hui':'Koi badlav nahi');await load()}catch(e){msg.textContent=e.message}},false)))}
 await load()}

async function initTMarks(){
 const m=page('n_marks'),h=await teacherHomeData();
 if(!h.classes.length){m.append(el('p',{class:'mu'},'Abhi koi class assign nahi hai'));return}
 const cs=classSelect(h.classes,loadExams),es=el('select'),ss=el('select'),box=el('div'),msg=el('div',{class:'err'});let mx=0,rows=[];
 es.onchange=ss.onchange=loadMarks;m.append(el('div',{class:'bar'},cs,es,ss),box,msg);
 async function loadExams(){box.innerHTML='';es.innerHTML=ss.innerHTML='';const r=await call('listExams',{classId:cs.value});
  r.exams.forEach(e=>es.append(el('option',{value:e.examId},e.title+' ('+e.date+', max '+e.maxMarks+')')));r.subjects.forEach(s=>ss.append(el('option',{value:s.subjectId},s.name)));
  if(!r.exams.length)box.append(el('p',{class:'mu'},'Is class ka koi exam nahi (admin exam banayega)'));else if(!r.subjects.length)box.append(el('p',{class:'mu'},'Is class mein aapka koi subject nahi'));else await loadMarks()}
 async function loadMarks(){if(!es.value||!ss.value)return;box.innerHTML='';msg.textContent='';
  const r=await call('getMarks',{examId:es.value,subjectId:ss.value});mx=r.maxMarks;rows=r.students;
  const inp={};box.append(el('p',{class:'mu'},'Max marks: '+mx),tableEl([{h:'Roll',f:s=>s.roll},{h:'Name',f:s=>s.name},{h:'Marks',f:s=>{const i=el('input',{type:'number',min:0,max:mx,step:'0.5',value:s.marks,style:'width:90px'});inp[s.studentId]=i;return i}}],rows),
   el('div',{class:'bar'},btn('Save marks',async()=>{try{const r2=await call('saveMarks',{examId:es.value,subjectId:ss.value,marks:rows.map(s=>({studentId:s.studentId,marks:inp[s.studentId].value}))});toast(r2.saved?r2.saved+' marks save hue':'Koi badlav nahi');await loadMarks()}catch(e){msg.textContent=e.message}},false)))}
 await loadExams()}

async function initTHw(){
 const m=page('n_homework'),h=await teacherHomeData(),subs=(await call('listClasses')).subjects;
 const F=()=>[{k:'classId',l:'Class',type:'select',opts:opt(h.classes,'classId','name')},{k:'subjectId',l:'Subject',type:'select',opts:opt(subs,'subjectId','name')},{k:'title',l:'Homework',type:'textarea',req:1},{k:'due',l:'Last date',type:'date',req:1},{k:'link',l:'Link (optional, https://...)'}];
 const box=el('div');m.append(el('div',{class:'bar'},btn('+ Add homework',()=>formModal('Add homework',F(),{due:today()},async v=>{await call('saveAssignment',{assignment:v});await load()}),false)),box);
 async function load(){const r=await call('listAssignments');box.innerHTML='';box.append(tableEl([{h:'Due',f:a=>a.due},{h:'Class',f:a=>a.className},{h:'Subject',f:a=>a.subject},{h:'Homework',f:a=>a.title},{h:'By',f:a=>a.byName},
  {h:'',f:a=>a.editable?el('div',{class:'row'},btn('Edit',()=>formModal('Edit homework',F(),a,async v=>{v.id=a.id;await call('saveAssignment',{assignment:v});await load()})),btn('Delete',async()=>{if(confirm('Delete karein?')){await call('deleteAssignment',{id:a.id});await load()}})):''}],r.assignments,'Abhi koi homework nahi'))}
 await load()}

async function initTClasses(){
 const m=page('n_classes'),h=await teacherHomeData(),r=await call('listStudents');
 if(!h.classes.length)m.append(el('p',{class:'mu'},'Abhi koi class assign nahi hai'));
 h.classes.forEach(c=>m.append(el('h3',{},c.name+' ('+r.students.filter(s=>s.classId===c.classId&&s.status==='active').length+' students)'),
  tableEl([{h:'Roll',f:s=>s.roll},{h:'Name',f:s=>s.name},{h:'ID',f:s=>s.studentId},{h:'Parent',f:s=>s.parentName+(s.parentPhone?' ('+s.parentPhone+')':'')}],r.students.filter(s=>s.classId===c.classId&&s.status==='active'),'Koi student nahi')))}

function timetableView(m,lessons,showClass,showTeacher){
 if(!lessons.length)m.append(el('p',{class:'mu'},'Timetable abhi set nahi hai'));
 DAYS_UI.forEach(d=>{const ls=lessons.filter(l=>l.day===d);if(ls.length)m.append(el('h3',{},d),tableEl([{h:'Time',f:l=>l.start+' - '+l.end}].concat(showClass?[{h:'Class',f:l=>l.className}]:[],[{h:'Subject',f:l=>l.subject}],showTeacher?[{h:'Teacher',f:l=>l.teacher}]:[]),ls))})}
async function initTTime(){const m=page('n_timetable');timetableView(m,(await call('listLessons')).lessons,true,false)}

async function initATime(){
 const m=page('n_timetable'),[ls,cl,te]=await Promise.all([call('listLessons'),call('listClasses'),call('listTeachers')]);
 const F=()=>[{k:'classId',l:'Class',type:'select',opts:opt(cl.classes,'classId','name')},{k:'subjectId',l:'Subject',type:'select',opts:opt(cl.subjects,'subjectId','name')},
  {k:'teacherId',l:'Teacher',type:'select',opts:opt(te.teachers,'userId','name')},{k:'day',l:'Day',type:'select',opts:DAYS_UI.map(d=>[d,d])},{k:'start',l:'Start',type:'time',req:1},{k:'end',l:'End',type:'time',req:1}];
 const fl=el('select',{},el('option',{value:''},'All classes'),cl.classes.map(c=>el('option',{value:c.classId},c.name))),box=el('div');let all=ls.lessons;
 fl.onchange=draw;m.append(el('div',{class:'bar'},fl,btn('+ Add period',()=>formModal('Add period',F(),{day:'Mon'},async v=>{await call('saveLesson',{lesson:v});await reload()}),false)),box);
 async function reload(){all=(await call('listLessons')).lessons;draw()}
 function draw(){box.innerHTML='';const rows=all.filter(l=>!fl.value||l.classId===fl.value);
  box.append(tableEl([{h:'Day',f:l=>l.day},{h:'Time',f:l=>l.start+' - '+l.end},{h:'Class',f:l=>l.className},{h:'Subject',f:l=>l.subject},{h:'Teacher',f:l=>l.teacher},
   {h:'',f:l=>el('div',{class:'row'},btn('Edit',()=>formModal('Edit period',F(),l,async v=>{v.lessonId=l.lessonId;await call('saveLesson',{lesson:v});await reload()})),btn('Delete',async()=>{if(confirm('Period delete karein?')){await call('deleteLesson',{lessonId:l.lessonId});await reload()}}))}],rows,'Abhi koi period nahi'))}
 draw()}

async function initNoticesMgr(isAdmin){
 const m=page('n_notices');let classes;
 if(isAdmin)classes=[{classId:'ALL',name:'All classes'}].concat((await call('listClasses')).classes);else classes=(await teacherHomeData()).classes;
 const F=()=>[{k:'classId',l:'Class',type:'select',opts:opt(classes,'classId','name')},{k:'title',l:'Title',req:1},{k:'text',l:'Message',type:'textarea'},{k:'date',l:'Date',type:'date'}];
 const box=el('div');m.append(el('div',{class:'bar'},btn('+ New notice',()=>formModal('New notice',F(),{date:today()},async v=>{await call('saveClassNotice',{notice:v});await load()}),false)),box);
 async function load(){const r=await call('listClassNotices');box.innerHTML='';box.append(tableEl([{h:'Date',f:n=>n.date},{h:'For',f:n=>n.className},{h:'Title',f:n=>n.title},{h:'Message',f:n=>n.text},
  {h:'',f:n=>n.editable?el('div',{class:'row'},btn('Edit',()=>formModal('Edit notice',F(),n,async v=>{v.id=n.id;await call('saveClassNotice',{notice:v});await load()})),btn('Delete',async()=>{if(confirm('Delete karein?')){await call('deleteClassNotice',{id:n.id});await load()}})):''}],r.notices,'Abhi koi notice nahi'))}
 await load()}
