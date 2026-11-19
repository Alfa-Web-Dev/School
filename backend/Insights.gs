// ---------- Weak-topic report + study planner (all computed from test/practice attempts) ----------
const WEAK_PCT=60,STRONG_PCT=80,MIN_ATT=3;
const istDay=ms=>new Date(Number(ms)+19800000).toISOString().slice(0,10);
const chOf=q=>(String(q.chapter||'General').trim()||'General');

// returns {studentId:{"sub|chapter":{subjectId,chapter,att,cor}}, days:{studentId:{day:1}}, today:{studentId:{"sub|chapter":1}}}
function topicStats(sids){
 const want={};sids.forEach(x=>want[String(x)]=1);const QM=qMap(),out={},days={},today={},td=istDay(Date.now());
 const per={};table('Attempts').rows.forEach(a=>{const sid=String(a.studentId);if(!want[sid])return;(per[sid]=per[sid]||[]).push(a)});
 Object.keys(per).forEach(sid=>{
  days[sid]={};today[sid]={};const m=out[sid]={};
  per[sid].forEach(a=>{const st=String(a.status);if(st==='reset'||!Number(a.startedAt))return;const d=istDay(a.startedAt);days[sid][d]=1;
   if(st!=='submitted')return;
   const ord=jparse(a.order,[]),ans=jparse(a.answers,{}),gr=jparse(a.grades,{});
   ord.forEach(o=>{const q=QM[o.q];if(!q)return;const ty=String(q.type||'mcq'),k=String(q.subjectId)+'|'+chOf(q);
    if(d===td)today[sid][k]=1;
    let att=0,cor=0;
    if(ty==='mcq'){att=1;cor=ans[o.q]&&ans[o.q]===String(q.correct)?1:0}
    else{const g=gr[o.q];if(!ans[o.q]||!g||g.m===undefined)return;const mk=Number(q.marks)||5;att=1;cor=Math.min(1,Math.max(0,Number(g.m)/mk))}
    const e=m[k]=m[k]||{subjectId:String(q.subjectId),chapter:chOf(q),att:0,cor:0};e.att+=att;e.cor+=cor})})});
 return{stats:out,days,today}}

const levelOf=(att,pct)=>att<MIN_ATT?'new':(pct<WEAK_PCT?'weak':(pct<STRONG_PCT?'mid':'strong'));

function streakOf(daysSet){
 let d=Date.now(),n=0;const has=ms=>!!daysSet[istDay(ms)];
 if(!has(d))d-=864e5;           // today not studied yet: streak is still alive until midnight
 while(has(d)){n++;d-=864e5}return n}

function myStudy(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{
  const sid=String(r.studentId),cid=String(r.classId),sn=nameMap('Subjects','subjectId'),T=topicStats([sid]),mine=T.stats[sid]||{};
  const bank={};table('Questions').rows.filter(q=>String(q.classId)===cid&&String(q.type||'mcq')==='mcq').forEach(q=>{const k=String(q.subjectId)+'|'+chOf(q);bank[k]=(bank[k]||0)+1});
  const topics=Object.keys(bank).map(k=>{const e=mine[k]||{subjectId:k.split('|')[0],chapter:k.slice(k.indexOf('|')+1),att:0,cor:0},pct=e.att?Math.round(e.cor/e.att*100):0;
   return{subjectId:e.subjectId,subject:sn[e.subjectId]||e.subjectId,chapter:e.chapter,att:e.att,pct,level:levelOf(e.att,pct),available:bank[k],doneToday:!!(T.today[sid]&&T.today[sid][k])}});
  const rank={weak:0,new:1,mid:2,strong:3};topics.sort((a,b)=>(rank[a.level]-rank[b.level])||(a.pct-b.pct)||(b.available-a.available));
  const focus=topics.filter(t=>t.level!=='strong');
  // today's tasks rotate through the focus list so every day brings different topics
  const dayN=Math.floor((Date.now()+19800000)/864e5),pick=(i,n)=>{const out=[];if(!focus.length)return out;for(let j=0;j<Math.min(n,focus.length);j++)out.push(focus[(i*n+j)%focus.length]);return out};
  const task=t=>({subjectId:t.subjectId,subject:t.subject,chapter:t.chapter,pct:t.pct,level:t.level,count:Math.min(10,t.available),doneToday:t.doneToday});
  const todayTasks=pick(dayN,3).map(task);
  const exams=table('Exams').rows.filter(e=>String(e.classId)===cid&&dstr(e.date)>=todayStr()).sort((a,b)=>dstr(a.date).localeCompare(dstr(b.date))).slice(0,3)
   .map(e=>({title:String(e.title),date:dstr(e.date),daysLeft:Math.round((new Date(dstr(e.date)+'T00:00:00+05:30')-new Date(todayStr()+'T00:00:00+05:30'))/864e5)}));
  const week=[];for(let i=0;i<7;i++){const dt=new Date(Date.now()+19800000+i*864e5).toISOString().slice(0,10);week.push({date:dt,tasks:pick(dayN+i,3).map(t=>({subject:t.subject,chapter:t.chapter,subjectId:t.subjectId}))})}
  const att=topics.reduce((x,t)=>x+t.att,0),cor=topics.reduce((x,t)=>x+t.pct*t.att/100,0),days=T.days[sid]||{};
  let best=0,run=0;Object.keys(days).sort().forEach((d,i,a)=>{run=(i&&(new Date(d)-new Date(a[i-1]))===864e5)?run+1:1;best=Math.max(best,run)});
  return{ok:true,streak:streakOf(days),bestStreak:best,studiedToday:!!days[istDay(Date.now())],overall:att?Math.round(cor/att*100):null,answered:att,topics,today:todayTasks,exams,week}})}

// teacher/admin: weak topics of a class + students who need help
function classInsights(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const cid=String(b.classId||'');if(!canClass(s,cid))throw new Error('Not allowed for this class');
  const subF=String(b.subjectId||''),sn=nameMap('Subjects','subjectId'),sts=activeStudents(cid),T=topicStats(sts.map(x=>x.studentId)),agg={},per=[];
  sts.forEach(st=>{const m=T.stats[String(st.studentId)]||{};let att=0,cor=0,weak=[];
   Object.keys(m).forEach(k=>{const e=m[k];if(!teachesSub(s,cid,e.subjectId)||(subF&&e.subjectId!==subF))return;att+=e.att;cor+=e.cor;const pct=Math.round(e.cor/e.att*100);
    const a=agg[k]=agg[k]||{subjectId:e.subjectId,subject:sn[e.subjectId]||e.subjectId,chapter:e.chapter,students:0,sum:0,weak:0};
    if(e.att>=MIN_ATT){a.students++;a.sum+=pct;if(pct<WEAK_PCT){a.weak++;weak.push({t:(sn[e.subjectId]||'')+' · '+e.chapter,pct})}}});
   per.push({studentId:String(st.studentId),name:String(st.name),roll:String(st.roll||''),answered:att,pct:att?Math.round(cor/att*100):null,weakCount:weak.length,weakTopics:weak.sort((x,y)=>x.pct-y.pct).slice(0,3).map(w=>w.t+' ('+w.pct+'%)')})});
  const topics=Object.keys(agg).map(k=>agg[k]).filter(a=>a.students>0).map(a=>({subjectId:a.subjectId,subject:a.subject,chapter:a.chapter,students:a.students,avg:Math.round(a.sum/a.students),weak:a.weak,level:levelOf(MIN_ATT,a.sum/a.students)})).sort((x,y)=>x.avg-y.avg);
  const active=per.filter(p=>p.answered>0);
  return{ok:true,total:sts.length,active:active.length,avg:active.length?Math.round(active.reduce((x,p)=>x+p.pct,0)/active.length):null,topics,
   needHelp:per.filter(p=>p.weakCount>0).sort((x,y)=>(y.weakCount-x.weakCount)||(x.pct-y.pct)).slice(0,20),inactive:per.filter(p=>!p.answered).map(p=>p.name).slice(0,30)}})}
