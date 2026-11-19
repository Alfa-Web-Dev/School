// ---------- Career guidance: interest quiz result is saved so students can revisit it and teachers can guide ----------
const CAREER_KEYS=['R','I','A','S','E','C'];
const careerTop=sc=>CAREER_KEYS.slice().sort((a,b)=>(sc[b]-sc[a])||(CAREER_KEYS.indexOf(a)-CAREER_KEYS.indexOf(b))).slice(0,2).join('');

function saveCareer(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>withLock(()=>{const raw=b.scores||{},sc={};
  CAREER_KEYS.forEach(k=>{const v=Number(raw[k]);if(!isFinite(v)||v<0||v>12||Math.floor(v)!==v)throw new Error('Invalid quiz result');sc[k]=v});
  if(CAREER_KEYS.every(k=>sc[k]===0))throw new Error('Invalid quiz result');
  const sid=String(r.studentId),o={scores:JSON.stringify(sc),top:careerTop(sc),updated:Date.now()},cur=find('CareerProfiles',x=>String(x.studentId)===sid);
  if(cur)setRow('CareerProfiles',cur._row,o);else addRow('CareerProfiles',Object.assign({studentId:sid},o));
  return{ok:true,top:o.top}}))}

function myCareer(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const sid=String(r.studentId),cur=find('CareerProfiles',x=>String(x.studentId)===sid),sn=nameMap('Subjects','subjectId'),T=(topicStats([sid]).stats[sid]||{}),agg={};
  Object.keys(T).forEach(k=>{const e=T[k];(agg[e.subjectId]=agg[e.subjectId]||{att:0,cor:0});agg[e.subjectId].att+=e.att;agg[e.subjectId].cor+=e.cor});
  const strengths=Object.keys(agg).filter(k=>agg[k].att>=10).map(k=>({subject:sn[k]||k,pct:Math.round(agg[k].cor/agg[k].att*100),att:agg[k].att})).sort((a,c)=>c.pct-a.pct);
  return{ok:true,className:String(nameMap('Classes','classId')[String(r.classId)]||''),saved:cur?{scores:jparse(cur.scores,{}),top:String(cur.top),updated:Number(cur.updated)}:null,strengths}})}

function classCareer(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const cid=resolveClass(b.classId);if(!cid||!canClass(s,cid))throw new Error('You do not have permission for this class');
  const prof={};table('CareerProfiles').rows.forEach(p=>{prof[String(p.studentId)]=p});
  return{ok:true,students:activeStudents(cid).map(x=>{const p=prof[String(x.studentId)];return{studentId:String(x.studentId),name:String(x.name),roll:String(x.roll||''),top:p?String(p.top):'',updated:p?Number(p.updated):0}})}})}
