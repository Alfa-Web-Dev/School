// Dashboard: admin ke counts (Phase 2). Logs/charts Phase 9 me.
function dashboardStats(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 const st=table('Students').rows.filter(r=>String(r.status).toLowerCase()==='active'),cnt={};
 st.forEach(r=>cnt[String(r.classId)]=(cnt[String(r.classId)]||0)+1);
 const classes=table('Classes').rows;
 return{ok:true,stats:{
  students:st.length,
  teachers:table('Users').rows.filter(r=>r.role==='teacher'&&String(r.active).toUpperCase()==='TRUE').length,
  classes:classes.length,
  newEnquiries:table('Enquiries').rows.filter(r=>String(r.status)==='new').length,
  today:todayAtt(),monthFees:monthFees(),
  byClass:classes.map(c=>({classId:String(c.classId),name:c.name,count:cnt[String(c.classId)]||0}))}}}

// Aaj ki attendance (latest row per student) aur is mahine ki fee collection (void rows judti hain)
function todayAtt(){const t=todayStr(),by={};table('Attendance').rows.forEach(r=>{if(dstr(r.date)===t)by[String(r.studentId)]=String(r.status).toUpperCase()});
 const act={};table('Students').rows.forEach(r=>{if(String(r.status).toLowerCase()==='active')act[String(r.studentId)]=1});
 let p=0,a=0;Object.keys(by).forEach(k=>{if(!act[k])return;if(by[k]==='A')a++;else if(by[k]==='P'||by[k]==='L')p++});
 return{present:p,absent:a,marked:p+a,total:Object.keys(act).length}}
function monthFees(){const m=todayStr().slice(0,7);let sum=0;table('Payments').rows.forEach(r=>{if(dstr(r.date).slice(0,7)===m)sum+=Number(r.amount)||0});return Math.round(sum*100)/100}

function listLogs(b){
 const s=guard(b,['admin']);if(!s)return DENIED;
 return safe(()=>{const q=clean(b.q,40).toLowerCase(),rows=table('Logs').rows.map(r=>({time:r.time instanceof Date?Utilities.formatDate(r.time,'Asia/Kolkata','yyyy-MM-dd HH:mm'):String(r.time),userId:String(r.userId),action:String(r.action),details:String(r.details)}));
  const f=q?rows.filter(r=>(r.userId+' '+r.action+' '+r.details).toLowerCase().indexOf(q)>=0):rows;
  return{ok:true,logs:f.slice(-300).reverse(),total:f.length}})}
