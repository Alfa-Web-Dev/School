// Career guidance: interest quiz (Holland types) -> matching careers, stream hint, strengths from tests, AI counsellor
const CK=['R','I','A','S','E','C'];
const CT={
 R:{n:'Doer',d:'You like hands-on work, tools, machines, nature and building things.',stream:'Science (PCM) or a skill/technical route',
  jobs:[['Engineer (Mechanical, Civil, Electrical)','Class 12 PCM → JEE Main / state CET → B.Tech'],['Pilot / Aviation','Class 12 PCM → NDA or commercial pilot licence (DGCA)'],['Agriculture / Forestry','Class 12 PCB or PCM → ICAR / state exams → B.Sc Agriculture'],['Electrician / Technician','Class 10 → ITI or Polytechnic diploma'],['Defence services','Class 12 → NDA exam; or graduation → CDS']]},
 I:{n:'Thinker',d:'You like solving problems, asking why, experiments and research.',stream:'Science (PCM or PCB)',
  jobs:[['Doctor / Medical','Class 12 PCB → NEET → MBBS / BDS / AYUSH'],['Scientist / Researcher','Class 12 PCM or PCB → B.Sc / IISER / NEST → M.Sc → PhD'],['Data Scientist / Software','Class 12 PCM → JEE or CUET → B.Tech / B.Sc CS'],['Pharmacist','Class 12 PCB or PCM → B.Pharm'],['Mathematician / Statistician','Class 12 with Maths → B.Sc Maths or Stats → M.Sc']]},
 A:{n:'Creator',d:'You like art, design, music, writing and original ideas.',stream:'Humanities / Arts, or Science with design',
  jobs:[['Designer (Graphic, UX, Fashion)','Class 12 any stream → NID / NIFT / UCEED / CUET → B.Des'],['Architect','Class 12 with Maths → NATA / JEE Paper 2 → B.Arch'],['Writer / Journalist','Class 12 any stream → BA Journalism / Mass Communication'],['Animator / Film maker','Class 12 any stream → design or film institute / diploma'],['Musician / Performing artist','Class 10 onwards → music or arts college, regular riyaz and shows']]},
 S:{n:'Helper',d:'You like teaching, caring for people and working in a team.',stream:'Humanities, or Science (PCB) for health care',
  jobs:[['Teacher / Professor','Class 12 → graduation → B.Ed → CTET / TET (or NET for college)'],['Psychologist / Counsellor','Class 12 any stream → BA / B.Sc Psychology → M.A'],['Nurse / Physiotherapist','Class 12 PCB → B.Sc Nursing / BPT'],['Social worker / NGO','Class 12 any stream → BSW / MSW'],['Civil services (IAS, IPS)','Graduation in any subject → UPSC Civil Services']]},
 E:{n:'Leader',d:'You like leading, persuading, starting things and taking decisions.',stream:'Commerce, or Humanities',
  jobs:[['Entrepreneur / Business owner','Any stream → BBA / B.Com → start small early, learn sales and money'],['Manager (MBA)','Graduation → CAT / MAT → MBA'],['Lawyer','Class 12 any stream → CLAT / AILET → BA LLB'],['Marketing / Sales leader','Class 12 any stream → BBA / B.Com → marketing role'],['Politician / Public leader','Graduation → work in the community, student or local bodies']]},
 C:{n:'Organiser',d:'You like order, numbers, records, planning and getting details right.',stream:'Commerce',
  jobs:[['Chartered Accountant','Class 12 Commerce (or any) → CA Foundation → Inter → Final'],['Banking / Finance','Graduation → IBPS / SBI exams, or B.Com → finance jobs'],['Company Secretary','Class 12 → CS Foundation → Executive → Professional'],['Accountant / Auditor','B.Com → Tally, GST skills → job or CA articleship'],['Government clerk / officer','Class 10 / 12 / graduation → SSC exams / state exams']]}};
const CQ=[['R','I enjoy fixing things or building something with my hands'],['I','I like finding out how and why things work'],['A','I enjoy drawing, music, writing or making something new'],['S','I like helping classmates understand something'],['E','I like leading a group or organising an event'],['C','I like keeping things neat, planned and in order'],
 ['R','I like being outdoors, working with plants, animals or machines'],['I','I enjoy puzzles, maths problems or science experiments'],['A','I like to express my ideas in my own creative way'],['S','I feel good when I take care of or support other people'],['E','I enjoy convincing others or selling an idea'],['C','I am good at working with numbers, lists or records'],
 ['R','I would enjoy a job where I work with tools or equipment'],['I','I like reading or watching things that explain science and discoveries'],['A','I notice colours, design and style in things around me'],['S','I enjoy teaching or explaining things to younger children'],['E','I like to take the lead and take decisions when a group is stuck'],['C','I follow rules and finish my work step by step']];
const CSCALE=['Not me','A little','Mostly','Very much'];

// pure: answers = array of 18 numbers (1-4) -> {R..C, top}
function scoreQuiz(ans){const sc={R:0,I:0,A:0,S:0,E:0,C:0};CQ.forEach((q,i)=>{sc[q[0]]+=Number(ans[i])||0});
 sc.top=CK.slice().sort((a,b)=>(sc[b]-sc[a])||(CK.indexOf(a)-CK.indexOf(b))).slice(0,2).join('');return sc}
if(typeof module!=='undefined')module.exports={CT,CQ,scoreQuiz};

const cChip=(t,k)=>el('span',{class:'tchip '+(k||'')},t);

/* ---------------- student ---------------- */
async function initMyCareer(){
 const m=page('n_career'),r=await call('myCareer'),box=el('div');m.append(box);
 const show=()=>{box.innerHTML='';r.saved?result(box,r,()=>quiz(box,r,show)):intro(box,()=>quiz(box,r,show))};show()}

function intro(box,start){
 box.append(el('div',{class:'card pick'},el('h3',{},'Find the work that fits you'),el('p',{class:'mu'},'Answer 18 quick questions about what you enjoy. There are no right or wrong answers, so answer honestly. You will see career paths that match your interests, and the school can guide you better.'),el('div',{class:'row'},btn('Start the quiz',start,false))))}

function quiz(box,r,done){
 box.innerHTML='';const ans=new Array(CQ.length).fill(0),cnt=el('b',{},'0'),go=el('button',{type:'button',class:'s',disabled:true},'See my careers');
 const list=el('div',{class:'flist'});
 CQ.forEach((q,i)=>{const row=el('div',{class:'tcard'},el('p',{},(i+1)+'. '+q[1]));const seg=el('div',{class:'seg'});
  CSCALE.forEach((l,j)=>seg.append(el('button',{type:'button',onclick:()=>{ans[i]=j+1;[...seg.children].forEach((b,k)=>b.classList.toggle('on',k===j));const n=ans.filter(Boolean).length;cnt.textContent=n;go.disabled=n<CQ.length}},l)));row.append(seg);list.append(row)});
 go.onclick=async()=>{try{const sc=scoreQuiz(ans),o={};CK.forEach(k=>o[k]=sc[k]);await call('saveCareer',{scores:o});r.saved={scores:o,top:sc.top,updated:Date.now()};toast('Saved');done()}catch(e){toast(e.message,1)}};
 box.append(el('p',{class:'mu'},['Answered ',cnt,' of '+CQ.length]),list,el('div',{class:'bar'},go))}

function result(box,r,again){
 const sc=r.saved.scores,top=r.saved.top.split('');box.innerHTML='';
 box.append(el('div',{class:'card pick'},el('h3',{},'Your interests: '+top.map(k=>CT[k].n).join(' + ')),top.map(k=>el('p',{class:'mu'},el('b',{},CT[k].n+': '),CT[k].d)),
  el('p',{},el('b',{},'Stream to think about after Class 10: '),CT[top[0]].stream)));
 const bars=el('div',{class:'cbars'});CK.slice().sort((a,b)=>sc[b]-sc[a]).forEach(k=>bars.append(el('div',{class:'cbar'},el('span',{},CT[k].n),el('i',{style:'width:'+Math.round((sc[k]||0)/12*100)+'%'}),el('b',{},String(sc[k]||0)))));
 box.append(el('h3',{class:'sh'},'Your interest profile'),bars);
 if(r.strengths.length){box.append(el('h3',{class:'sh'},'Your strong subjects (from online tests)'),el('div',{class:'row'},r.strengths.slice(0,4).map(s=>cChip(s.subject+' '+s.pct+'%',s.pct>=70?'ok':''))),el('p',{class:'mu'},'Interest and ability together point to the best path. Keep practising your weaker subjects too.'))}
 else box.append(el('p',{class:'mu'},'Take more online tests and your strong subjects will also show up here.'));
 top.forEach(k=>{box.append(el('h3',{class:'sh'},'Careers for '+CT[k].n+'s'));CT[k].jobs.forEach(j=>box.append(el('div',{class:'tcard'},el('b',{},j[0]),el('span',{class:'mu'},j[1]))))});
 box.append(el('div',{class:'bar'},btn('Ask the AI counsellor',()=>counsellor(r),false),btn('Retake quiz',again,true)),el('p',{class:'mu'},'This is a guide, not a final decision. Talk to your parents and teachers too.'))}

function counsellor(r){
 const top=r.saved.top.split('').map(k=>CT[k].n).join(' + '),st=r.strengths.slice(0,3).map(s=>s.subject+' '+s.pct+'%').join(', ');
 const q=el('textarea',{rows:3,maxlength:300,placeholder:'Example: Which stream should I take after Class 10? What can I do after Class 12?'}),out=el('div',{class:'dai'});
 const sys='You are a kind career counsellor for Indian school students ('+(r.className||'school')+'). The student\'s interest type is '+top+(st?'; strong subjects: '+st:'')+'. Answer in simple English in under 180 words. Be honest and balanced, mention more than one option, and never promise a result. Tell the student to also talk to parents and teachers.';
 modal('AI career counsellor',el('div',{},el('div',{class:'tf'},el('label',{},'Your question'),q),out),[{t:'Close',g:1,fn:()=>true},{t:'Ask',fn:async()=>{const t=q.value.trim();if(t.length<5){toast('Write your question',1);return false}
  out.innerHTML='';out.append(el('p',{class:'mu'},'Thinking…'));try{const a=await aiAsk(sys,[{role:'user',content:t}]);out.innerHTML='';out.append(mdLite(a))}catch(e){out.innerHTML='';out.append(el('p',{class:'err'},e.message))}return false}}])}

/* ---------------- teacher / admin ---------------- */
async function initCareerStaff(){
 const m=page('n_career'),opt=await call('noteOptions'),classes=opt.classes;
 if(!classes.length){m.append(emptyState('No classes yet','Classes appear here once you are assigned to them'));return}
 const cs=el('select',{},classes.map(c=>el('option',{value:c.classId},c.name))),body=el('div');cs.onchange=()=>go();m.append(el('div',{class:'bar'},cs),body);
 async function go(){body.innerHTML='';const r=await call('classCareer',{classId:cs.value});
  if(!r.students.length){body.append(emptyState('No students','No active students in this class'));return}
  const done=r.students.filter(s=>s.top).length;
  body.append(el('p',{class:'mu'},done+' of '+r.students.length+' students have taken the quiz'),tableEl([{h:'Roll',f:s=>s.roll},{h:'Name',f:s=>s.name},{h:'Interests',f:s=>s.top?s.top.split('').map(k=>CT[k].n).join(' + '):el('span',{class:'mu'},'Not taken')},{h:'Taken on',f:s=>s.updated?new Date(s.updated).toLocaleDateString('en-IN',{day:'numeric',month:'short',timeZone:'Asia/Kolkata'}):''}],r.students))}
 await go()}
