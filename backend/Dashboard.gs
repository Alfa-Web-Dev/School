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
  byClass:classes.map(c=>({classId:String(c.classId),name:c.name,count:cnt[String(c.classId)]||0}))}}}
function listLogs(b){return{ok:false,error:'Not built yet (Phase 9)'}}
