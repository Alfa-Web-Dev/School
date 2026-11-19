const VERSION='0.5.5';
const P=PropertiesService.getScriptProperties();
const SCHEMA={
 Settings:['key','value'],
 AcademicYears:['yearId','name','start','end','current'],
 Users:['userId','name','role','phone','email','passHash','salt','active'],
 Students:['studentId','admNo','name','classId','roll','gender','dob','parentName','parentPhone','address','pinHash','salt','status'],
 Classes:['classId','name','grade','section','classTeacherId'],
 Subjects:['subjectId','name'],
 Lessons:['lessonId','classId','subjectId','teacherId','day','start','end'],
 Attendance:['date','classId','studentId','status','markedBy'],
 Exams:['examId','title','classId','date','maxMarks'],
 Results:['examId','studentId','subjectId','marks'],
 Assignments:['id','classId','subjectId','title','due','link','by'],
 FeeStructure:['classId','feeType','amount','dueMonth'],
 Payments:['receiptNo','studentId','feeType','amount','mode','date','receivedBy'],
 ClassNotices:['id','classId','title','text','date'],
 Enquiries:['id','name','phone','message','time','status','type','role','email','details'],
 Tokens:['tokenHash','userId','role','expires'],
 Notes:['noteId','classId','subjectId','chapter','title','fileId','mime','size','uploadedBy','date','category'],
 Questions:['qid','classId','subjectId','chapter','text','a','b','c','d','correct','explain','difficulty','createdBy','date','type','marks','keyAns'],
 Tests:['testId','title','classId','subjectId','mode','durationMin','start','end','marksPer','negative','proctor','shuffle','qids','status','createdBy','date','instructions','reveal'],
 Attempts:['attemptId','testId','studentId','startedAt','submittedAt','answers','order','score','total','correct','wrong','skipped','status','strikes','flags','grades','pending'],
 Doubts:['doubtId','studentId','classId','subjectId','chapter','question','aiAnswer','status','teacherAnswer','answeredBy','date','answeredAt'],
 Flashcards:['cardId','classId','subjectId','chapter','front','back','createdBy','date'],
 CardProgress:['studentId','key','box','due','last'],
 LeaveRequests:['leaveId','studentId','classId','type','fromDate','toDate','outMin','pickupBy','reason','status','decidedBy','decidedAt','remark','created'],
 HelpSlots:['slotId','classId','teacherId','title','slotDate','startMin','endMin','capacity','place','note','status','created'],
 SlotBookings:['bookingId','slotId','studentId','topic','status','created'],
 Violations:['id','attemptId','testId','studentId','time','type','detail','photoId'],
 Logs:['time','userId','action','details']
};
const out=o=>ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
// Sheet na mile (naye features) to header ke saath apne aap ban jati hai
function ensureSheet(n){const h=SCHEMA[n];if(!h)return null;const ss=SpreadsheetApp.getActive(),s=ss.getSheetByName(n)||ss.insertSheet(n);
 if(s.getLastRow()===0){s.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold');s.setFrozenRows(1)}return s}
const _mig={},MIGRATE=['Questions','Tests','Attempts'];
// Purani sheet me naye columns aaye to unke header apne aap jud jaate hain (data wahi rehta hai)
function tab(n){const s=SpreadsheetApp.getActive().getSheetByName(n)||ensureSheet(n);
 if(!_mig[n]&&s&&SCHEMA[n]&&MIGRATE.indexOf(n)>=0&&s.getLastRow()>0){_mig[n]=1;const h=SCHEMA[n],cur=s.getRange(1,1,1,Math.max(s.getLastColumn(),1)).getValues()[0].map(String);
  for(let i=0;i<h.length;i++)if(!cur[i])s.getRange(1,i+1).setValue(h[i]).setFontWeight('bold')}
 return s}
function table(n){const v=tab(n).getDataRange().getValues(),h=v.shift().map(String);
 return{h,rows:v.map((r,i)=>{const o={_row:i+2};h.forEach((k,j)=>o[k]=r[j]);return o})}}
const find=(n,fn)=>table(n).rows.find(fn);
function log(uid,action,details){tab('Logs').appendRow([new Date(),uid||'',action,details||''])}
