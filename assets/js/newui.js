// NEW LOOK (demo) - dashboard in the "indigo header + white cards" style. Loaded only when ui_demo=1.
window.nlStudentDash=async function(){
 const m=page('n_dashboard');
 const [r,hw,lv]=await Promise.all([call('myDashboard'),call('myHomework').catch(()=>null),call('myLive').catch(()=>null)]);
 const p=r.profile,first=String(p.name||'').split(' ')[0],hr=new Date().getHours(),g=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening';
 const today=new Date(Date.now()+19800000).toISOString().slice(0,10);
 const due=hw&&hw.homework?hw.homework.filter(h=>h.due>=today).length:0;
 const live=lv&&lv.upcoming?lv.upcoming.filter(x=>x.state==='live').length:0,soon=lv&&lv.upcoming?lv.upcoming.filter(x=>x.date===today).length:0;
 const I=(k,c)=>{const s=el('span',{class:'nli',style:'background:'+c});s.innerHTML=icon(k);return s};
 const head=el('div',{class:'nlhead'},el('h2',{},g+', '+first+' 👋'));
 const av=el('span',{class:'av lg pic'});av.innerHTML=AV.svg(AV.get(p.studentId,p.name));
 const pc=el('a',{class:'nlpc',href:'profile.html'},av,el('div',{},el('b',{},p.name),el('small',{},p.className+(p.roll?' · Roll '+p.roll:''))),el('i',{class:'nlch'},'›'));
 const card=(href,k,c,label,val,cls)=>el('a',{class:'nlc',href},I(k,c),el('div',{},el('small',{},label),el('b',{class:cls||''},val)),el('i',{class:'nlch'},'›'));
 const grid=el('div',{class:'nlg'},
  card('attendance.html','attendance','#5b57e6','Attendance',r.attendance.percent+'%'),
  card('fees.html','fees','#f59f1b','Fees Due',rupee(r.fees.balance)),
  card('homework.html','homework','#3b82f6','Homework',String(due)),
  card('live.html','live','#1fa971','Live Class',live?'Live':soon?soon+' today':'None',live?'nlgreen':''));
 const rows=[];
 r.notices.forEach(n=>rows.push(['notices','#5b57e6',n.title,n.text?String(n.text).slice(0,48):'Notice',n.date]));
 if(r.fees.balance>0)rows.push(['fees','#f59f1b','Fees payment due',rupee(r.fees.balance),'']);
 rows.push(['attendance','#1fa971','Attendance',r.attendance.present+r.attendance.late+'/'+r.attendance.total+' days present','']);
 const act=el('div',{class:'nlr'},el('div',{class:'nlrh'},el('b',{},'Recent Activity'),el('a',{href:'notices.html'},'View all')),
  ...rows.slice(0,5).map(x=>el('div',{class:'nlrow'},I(x[0],x[1]),el('div',{},el('b',{},x[2]),el('small',{},x[3])),el('span',{},x[4]))));
 m.append(head,pc,grid,act);
 if(r.today.length)m.append(el('h3',{class:'nlsh'},'Today\'s classes'),tableEl([{h:'Time',f:l=>l.start+' - '+l.end},{h:'Subject',f:l=>l.subject},{h:'Teacher',f:l=>l.teacher}],r.today,'No classes today'));
 if(typeof liveBanner==='function'&&live)liveBanner(m)};
