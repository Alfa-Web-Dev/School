// Printable report card: reportcard.html?exam=E001 (student apna) | ?exam=E001&student=S001 | ?exam=E001&all=1 (admin / class teacher)
const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function cardHtml(r){const s=r.student,x=r.exam;
 return '<div class="rcpt rcard"><div class="rh"><h2>'+E(SN())+'</h2><div class="mu">'+E(SA())+' · '+E(CFG.phone)+'</div><h3>REPORT CARD · '+E(x.title)+'</h3></div>'
  +'<table class="rt"><tr><td class="mu">Student</td><td><b>'+E(s.name)+'</b></td><td class="mu">Class</td><td><b>'+E(s.className)+'</b></td></tr>'
  +'<tr><td class="mu">ID / Adm no</td><td><b>'+E(s.studentId)+(s.admNo?' / '+E(s.admNo):'')+'</b></td><td class="mu">Roll no</td><td><b>'+E(s.roll)+'</b></td></tr>'
  +'<tr><td class="mu">Parent</td><td><b>'+E(s.parentName)+'</b></td><td class="mu">Exam date</td><td><b>'+E(x.date)+'</b></td></tr></table>'
  +'<table class="tbl rm"><thead><tr><th>Subject</th><th>Marks</th><th>Max</th><th>Grade</th></tr></thead><tbody>'
  +r.rows.map(y=>'<tr><td>'+E(y.subject)+'</td><td>'+y.marks+'</td><td>'+y.max+'</td><td>'+y.grade+'</td></tr>').join('')
  +'<tr class="tot"><td>Total</td><td>'+r.total+'</td><td>'+r.max+'</td><td>'+r.grade+'</td></tr></tbody></table>'
  +'<table class="rt"><tr><td class="mu">Percentage</td><td><b>'+r.percent+'%</b></td><td class="mu">Rank</td><td><b>'+r.rank+' / '+r.classSize+'</b></td></tr>'
  +'<tr><td class="mu">Result</td><td><b>'+(r.pass?'PASS':'FAIL')+'</b></td><td class="mu">Attendance</td><td><b>'+(r.attendance==null?'-':r.attendance+'%')+'</b></td></tr></table>'
  +'<div class="sig"><span>Class teacher'+(r.classTeacher?': '+E(r.classTeacher):'')+'</span><span>Parent sign</span><span>Principal</span></div></div>'}
(async()=>{
 const box=document.getElementById('rc'),q=new URLSearchParams(location.search),ex=q.get('exam')||'',st=q.get('student')||'';
 try{
  const bad=r=>{if(!r.ok){if(r.error==='expired'||r.error==='Not allowed'){location.href='login.html';return true}throw new Error(r.error)}};
  let html='';
  if(q.get('all')){const g=await api('getResults',{examId:ex});if(bad(g))return;
   for(const s of g.students.filter(x=>x.max)){const r=await api('reportCard',{examId:ex,studentId:s.studentId});if(bad(r))return;html+=cardHtml(r)}
   if(!html)throw new Error('Abhi kisi student ka result nahi aaya')}
  else{const r=await api('reportCard',{examId:ex,studentId:st});if(bad(r))return;html=cardHtml(r)}
  box.innerHTML=html+'<button class="no-print" onclick="window.print()">Print / Save as PDF</button>'}
 catch(e){box.textContent=e.message||'Error'}})();
