// ---------- Achievements: teachers give awards, students also earn automatic badges ----------
const AWARD_CATS=['academic','sports','arts','conduct','other'];

const awardView=(a,sn,tn,cn)=>({awardId:String(a.awardId),studentId:String(a.studentId),student:sn?sn[String(a.studentId)]||'':'',classId:String(a.classId),className:cn?cn[String(a.classId)]||'':'',
 title:String(a.title),category:String(a.category),note:String(a.note||''),date:dstr(a.awardDate),by:tn?tn[String(a.givenBy)]||'':'',created:Number(a.created)||0});

function giveAward(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{
  const title=txt(b.title,100);if(title.length<3)throw new Error('Write the award title');
  const cat=AWARD_CATS.indexOf(String(b.category))>=0?String(b.category):'other',note=txt(b.note,200);
  const date=b.date?dstr(b.date):todayStr();if(!validDate(date)||date>todayStr())throw new Error('Choose a valid date (not in the future)');
  const ids=(Array.isArray(b.studentIds)?b.studentIds:[]).map(String).filter((x,i,a)=>x&&a.indexOf(x)===i);
  if(!ids.length)throw new Error('Choose at least one student');if(ids.length>60)throw new Error('Choose at most 60 students at a time');
  const st=table('Students').rows,rows=[];
  ids.forEach(id=>{const x=st.find(y=>String(y.studentId)===id&&String(y.status).toLowerCase()==='active');if(!x)throw new Error('Student not found');
   if(!canClass(s,String(x.classId)))throw new Error('You do not have permission for '+String(x.name));
   rows.push({studentId:id,classId:String(x.classId),title,category:cat,note,awardDate:date,givenBy:s.userId,created:Date.now()})});
  const base=table('Awards').rows.reduce((m,r)=>Math.max(m,parseInt(String(r.awardId).replace(/\D/g,''),10)||0),0);
  rows.forEach((r,i)=>{r.awardId='AW'+(base+i+1)});addRows('Awards',rows);log(s.userId,'award_give',title+' x'+rows.length);return{ok:true,given:rows.length}}))}

function listAwards(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>{const sn=nameMap('Students','studentId'),tn=nameMap('Users','userId'),cn=nameMap('Classes','classId'),cid=b.classId?resolveClass(b.classId):'';
  let rows=table('Awards').rows.filter(a=>canClass(s,String(a.classId))&&(!cid||String(a.classId)===cid));
  rows.sort((a,c)=>Number(c.created)-Number(a.created));
  return{ok:true,awards:rows.slice(0,100).map(a=>awardView(a,sn,tn,cn))}})}

function deleteAward(b){
 const s=guard(b,['admin','teacher']);if(!s)return DENIED;
 return safe(()=>withLock(()=>{const a=find('Awards',x=>String(x.awardId)===String(b.awardId));if(!a)throw new Error('Award not found');
  if(s.role!=='admin'&&String(a.givenBy)!==s.userId)throw new Error('Only the person who gave it can remove it');
  tab('Awards').deleteRow(a._row);log(s.userId,'award_delete',a.awardId);return{ok:true}}))}

// automatic badges worked out from the student's own records
function badgesOf(sid){
 const out=[];
 const at=table('Attendance').rows.filter(r=>String(r.studentId)===sid),days={};at.forEach(r=>{days[dstr(r.date)]=String(r.status).toUpperCase()});
 const dk=Object.keys(days),pres=dk.filter(d=>days[d]==='P'||days[d]==='L').length,pct=dk.length?Math.round(pres/dk.length*100):0;
 out.push({key:'att',title:'Attendance Star',desc:'95% attendance over at least 20 days',earned:dk.length>=20&&pct>=95,progress:dk.length>=20?pct+'% attendance':dk.length+' of 20 days recorded'});
 const done=table('Attempts').rows.filter(a=>String(a.studentId)===sid&&a.submittedAt&&['inprogress','blocked','reset'].indexOf(String(a.status))<0);
 const perfect=done.filter(a=>Number(a.total)>0&&Number(a.score)>=Number(a.total)).length;
 out.push({key:'perfect',title:'Perfect Score',desc:'Full marks in an online test',earned:perfect>0,progress:perfect?perfect+' test'+(perfect>1?'s':''):'Not yet'});
 out.push({key:'tests',title:'Test Regular',desc:'Finish 5 online tests',earned:done.length>=5,progress:Math.min(done.length,5)+' of 5'});
 const mastered=table('CardProgress').rows.filter(p=>String(p.studentId)===sid&&Number(p.box)>=5).length;
 out.push({key:'cards',title:'Memory Master',desc:'Master 20 flashcards',earned:mastered>=20,progress:Math.min(mastered,20)+' of 20'});
 return out}

function myAchievements(b){
 const r=stu(b);if(!r)return DENIED;
 return safe(()=>{const sid=String(r.studentId),tn=nameMap('Users','userId');
  const awards=table('Awards').rows.filter(a=>String(a.studentId)===sid).sort((a,c)=>Number(c.created)-Number(a.created)).map(a=>awardView(a,null,tn,null));
  return{ok:true,student:String(r.name),className:String(nameMap('Classes','classId')[String(r.classId)]||''),awards,badges:badgesOf(sid)}})}
