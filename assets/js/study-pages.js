// Weak-topic report + study planner (student) and class insights (teacher/admin)
const LV={weak:['Needs work','bad'],new:['Not started','sch'],mid:['Improving','pc'],strong:['Strong','ok']};
const LVC={weak:'#dc2626',mid:'#f59e0b',strong:'#16a34a',new:'#9ca3af'};
const bar=(pct,lv)=>el('div',{class:'pbar'},el('i',{style:'width:'+Math.max(2,pct||0)+'%;background:'+LVC[lv]}));
const dayName=d=>new Date(d+'T00:00:00+05:30').toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',timeZone:'Asia/Kolkata'});
const goPractice=t=>location.href='test.html?p='+encodeURIComponent(t.subjectId+'|'+(t.chapter==='General'?'':t.chapter)+'|'+(t.count||10));
const sCard=(big,label)=>el('div',{class:'card stat'},el('div',{class:'big'},String(big)),el('div',{class:'mu'},label));

async function initStudy(){
 const m=page('n_study'),r=await call('myStudy'),nx=r.exams[0];
 m.append(el('div',{class:'grid'},sCard(r.streak+(r.streak===1?' day':' days'),'Study streak'+(r.studiedToday?'':' · practise today to keep it')),sCard(r.overall==null?'-':r.overall+'%','Overall accuracy'),
  sCard(nx?nx.daysLeft+(nx.daysLeft===1?' day':' days'):'-',nx?nx.title+' · '+nx.date:'No exam scheduled')));
 m.append(el('h3',{class:'sh'},"Today's plan"));
 if(!r.topics.length)m.append(el('p',{class:'mu'},'Practice questions will appear here once your teachers add them.'));
 else if(!r.today.length)m.append(el('p',{class:'mu'},'You are strong in every topic. Keep it up!'));
 else{const l=el('div',{class:'flist'});r.today.forEach(t=>l.append(taskCard(t)));m.append(l)}
 const weak=r.topics.filter(t=>t.level!=='strong');
 m.append(el('h3',{class:'sh'},'My topics'));
 if(r.topics.length){const l=el('div',{class:'flist'});r.topics.forEach(t=>l.append(topicRow(t)));m.append(l)}
 if(r.topics.length&&r.today.length){m.append(el('h3',{class:'sh'},'This week'));
  const wk=el('div',{class:'card'});r.week.forEach((d,i)=>wk.append(el('div',{class:'wkr'},el('b',{},i?dayName(d.date):'Today'),el('span',{},d.tasks.map(t=>t.subject+': '+t.chapter).join('  ·  ')))));m.append(wk)}}

function taskCard(t){
 const c=el('div',{class:'tcard'});
 c.append(el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},t.subject+' · '+t.chapter),el('span',{class:'mu'},t.level==='new'?'Not started yet':'Your accuracy: '+t.pct+'%')),el('span',{class:'tchip '+(t.doneToday?'ok':LV[t.level][1])},t.doneToday?'Done today ✓':LV[t.level][0])),
  bar(t.pct,t.level),el('div',{class:'row'},[btn(t.doneToday?'Practice again':'Practice '+t.count+' questions',()=>goPractice(t),t.doneToday)]));return c}

function topicRow(t){
 const c=el('div',{class:'tcard trow'});
 c.append(el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},t.subject+' · '+t.chapter),el('span',{class:'mu'},t.att?t.att+' questions answered':'Not started')),el('span',{class:'tchip '+LV[t.level][1]},LV[t.level][0]+(t.att?' · '+t.pct+'%':''))),bar(t.pct,t.level),
  t.level==='strong'?'':el('div',{class:'row'},[btn('Practice',()=>goPractice(Object.assign({count:10},t)),true)]));return c}

/* ---------------- teacher / admin ---------------- */
async function initInsights(){
 const m=page('n_insights'),opt=await call('noteOptions'),classes=opt.classes;
 if(!classes.length){m.append(emptyState('No classes yet','Classes appear here once you are assigned to them'));return}
 const cls=el('select',{},classes.map(c=>el('option',{value:c.classId},c.name))),sub=el('select'),body=el('div');
 const fill=()=>{const c=classes.find(x=>x.classId===cls.value);sub.innerHTML='';sub.append(el('option',{value:''},'All subjects'));(c?c.subjects:[]).forEach(s=>sub.append(el('option',{value:s.subjectId},s.name)))};
 const load=async()=>{body.innerHTML='';body.append(el('p',{class:'mu'},'Loading…'));
  try{const r=await call('classInsights',{classId:cls.value,subjectId:sub.value});body.innerHTML='';
   body.append(el('div',{class:'grid'},sCard(r.total,'Students'),sCard(r.active,'Practising or tested'),sCard(r.avg==null?'-':r.avg+'%','Class accuracy')));
   body.append(el('h3',{class:'sh'},'Weak topics in this class'));
   if(!r.topics.length)body.append(el('p',{class:'mu'},'No data yet. Topic results appear after students take tests or practice.'));
   else{const l=el('div',{class:'flist'});r.topics.forEach(t=>l.append(el('div',{class:'tcard trow'},el('div',{class:'tct'},el('div',{class:'tcm'},el('b',{},t.subject+' · '+t.chapter),el('span',{class:'mu'},t.weak+' of '+t.students+' students are weak here')),el('span',{class:'tchip '+LV[t.level][1]},t.avg+'%')),bar(t.avg,t.level))));body.append(l)}
   body.append(el('h3',{class:'sh'},'Students who need help'));
   if(!r.needHelp.length)body.append(el('p',{class:'mu'},'No student is below 60% in any topic.'));
   else body.append(tableEl([{h:'Roll',f:x=>x.roll},{h:'Name',f:x=>x.name},{h:'Accuracy',f:x=>x.pct==null?'-':x.pct+'%'},{h:'Weak topics',f:x=>x.weakTopics.join(', ')}],r.needHelp,''));
   if(r.inactive.length)body.append(el('h3',{class:'sh'},'Not practising yet'),el('p',{class:'mu'},r.inactive.join(', ')))}
  catch(e){body.innerHTML='';body.append(el('p',{class:'err'},e.message))}};
 cls.onchange=()=>{fill();load()};sub.onchange=load;fill();
 m.append(el('div',{class:'bar'},cls,sub),body);await load()}
