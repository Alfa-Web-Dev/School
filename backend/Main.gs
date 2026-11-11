function doGet(){return out({ok:true,version:VERSION})}
function doPost(e){
 try{
  const b=JSON.parse(e.postData.contents);
  switch(b.action){
   case 'ping':return out({ok:true,version:VERSION});
   case 'login':return out(login(b));
   case 'logout':return out(logout(b));
   case 'me':return out(me(b));
   default:{const fn=ROUTES[b.action];
    if(fn&&typeof globalThis[fn]==='function')return out(globalThis[fn](b));
    return out({ok:false,error:'Unknown action'})}}
 }catch(err){return out({ok:false,error:'Server error'})}}

// action -> function ka naam. Naye features yahin jodo.
const ROUTES={noteOptions:'noteOptions',listNotes:'listNotes',uploadNote:'uploadNote',updateNote:'updateNote',deleteNote:'deleteNote',uploadNote:'uploadNote',listNotes:'listNotes',updateNote:'updateNote',deleteNote:'deleteNote',noteSubjects:'noteSubjects',deleteFee:'deleteFee',studentFees:'studentFees',voidPayment:'voidPayment',getReceipt:'getReceipt',defaulters:'defaulters',getMarks:'getMarks',deleteAssignment:'deleteAssignment',deleteLesson:'deleteLesson',deleteClassNotice:'deleteClassNotice',teacherHome:'teacherHome',resetSecret:'resetSecret',myDashboard:'myDashboard',myProfile:'myProfile',myAttendance:'myAttendance',myFees:'myFees',myResults:'myResults',myTimetable:'myTimetable',myHomework:'myHomework',myNotices:'myNotices',changeSecret:'changeSecret',listStudents:'listStudents',saveStudent:'saveStudent',importStudents:'importStudents',promoteStudents:'promoteStudents',listTeachers:'listTeachers',saveTeacher:'saveTeacher',listClasses:'listClasses',saveClass:'saveClass',listSubjects:'listSubjects',saveSubject:'saveSubject',listLessons:'listLessons',saveLesson:'saveLesson',listClassNotices:'listClassNotices',saveClassNotice:'saveClassNotice',getAttendance:'getAttendance',markAttendance:'markAttendance',listAssignments:'listAssignments',saveAssignment:'saveAssignment',getFeeStructure:'getFeeStructure',saveFeeStructure:'saveFeeStructure',listPayments:'listPayments',addPayment:'addPayment',listExams:'listExams',adminExams:'adminExams',deleteExam:'deleteExam',reportCard:'reportCard',saveExam:'saveExam',getResults:'getResults',saveMarks:'saveMarks',enquiry:'enquiry',listEnquiries:'listEnquiries',updateEnquiry:'updateEnquiry',dashboardStats:'dashboardStats',listLogs:'listLogs',backupNow:'backupNow'};
