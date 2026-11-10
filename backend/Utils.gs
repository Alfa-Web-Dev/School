const VERSION='0.1.0';
const P=PropertiesService.getScriptProperties();
const SCHEMA={
 Settings:['key','value'],
 AcademicYears:['yearId','name','start','end','current'],
 Users:['userId','name','role','phone','email','passHash','salt','active'],
 Students:['studentId','admNo','name','classId','roll','gender','dob','parentId','address','pinHash','salt','status'],
 Parents:['parentId','name','phone','email','pinHash','salt'],
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
 Enquiries:['id','name','phone','message','time','status'],
 Tokens:['tokenHash','userId','role','expires'],
 Logs:['time','userId','action','details']
};
const out=o=>ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const tab=n=>SpreadsheetApp.getActive().getSheetByName(n);
function table(n){const v=tab(n).getDataRange().getValues(),h=v.shift().map(String);
 return{h,rows:v.map((r,i)=>{const o={_row:i+2};h.forEach((k,j)=>o[k]=r[j]);return o})}}
const find=(n,fn)=>table(n).rows.find(fn);
function log(uid,action,details){tab('Logs').appendRow([new Date(),uid||'',action,details||''])}
