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
const ROUTES={
 noteOptions:'noteOptions',listNotes:'listNotes',uploadNote:'uploadNote',updateNote:'updateNote',
 deleteNote:'deleteNote',deleteFee:'deleteFee',studentFees:'studentFees',voidPayment:'voidPayment',
 getReceipt:'getReceipt',defaulters:'defaulters',getMarks:'getMarks',deleteAssignment:'deleteAssignment',
 deleteLesson:'deleteLesson',deleteClassNotice:'deleteClassNotice',teacherHome:'teacherHome',resetSecret:'resetSecret',
 myDashboard:'myDashboard',myProfile:'myProfile',myAttendance:'myAttendance',myFees:'myFees',
 myResults:'myResults',myTimetable:'myTimetable',myHomework:'myHomework',myNotices:'myNotices',
 changeSecret:'changeSecret',listStudents:'listStudents',saveStudent:'saveStudent',importStudents:'importStudents',
 promoteStudents:'promoteStudents',listTeachers:'listTeachers',saveTeacher:'saveTeacher',listClasses:'listClasses',
 saveClass:'saveClass',saveSections:'saveSections',deleteClass:'deleteClass',saveSubject:'saveSubject',listLessons:'listLessons',
 saveLesson:'saveLesson',listClassNotices:'listClassNotices',saveClassNotice:'saveClassNotice',getAttendance:'getAttendance',
 markAttendance:'markAttendance',listAssignments:'listAssignments',saveAssignment:'saveAssignment',getFeeStructure:'getFeeStructure',
 saveFeeStructure:'saveFeeStructure',listPayments:'listPayments',addPayment:'addPayment',listExams:'listExams',
 issueCertificate:'issueCertificate',adminExams:'adminExams',deleteExam:'deleteExam',reportCard:'reportCard',
 saveExam:'saveExam',getResults:'getResults',saveMarks:'saveMarks',enquiry:'enquiry',
 listEnquiries:'listEnquiries',updateEnquiry:'updateEnquiry',dashboardStats:'dashboardStats',listLogs:'listLogs',
 backupNow:'backupNow',aiGet:'aiGet',aiSave:'aiSave',
 listQuestions:'listQuestions',saveQuestion:'saveQuestion',importQuestions:'importQuestions',deleteQuestion:'deleteQuestion',listTests:'listTests',saveTest:'saveTest',
 deleteTest:'deleteTest',testResults:'testResults',attemptDetail:'attemptDetail',gradeAttempt:'gradeAttempt',doubtOptions:'doubtOptions',askDoubt:'askDoubt',updateAiAnswer:'updateAiAnswer',closeDoubt:'closeDoubt',myDoubts:'myDoubts',listDoubts:'listDoubts',answerDoubt:'answerDoubt',myStudy:'myStudy',listCards:'listCards',saveCard:'saveCard',deleteCard:'deleteCard',importCards:'importCards',myDeck:'myDeck',reviewCards:'reviewCards',classInsights:'classInsights',violationPhoto:'violationPhoto',resetAttempt:'resetAttempt',myTests:'myTests',startTest:'startTest',
 saveProgress:'saveProgress',checkAnswer:'checkAnswer',submitTest:'submitTest',attemptReview:'attemptReview',reportViolation:'reportViolation'};
