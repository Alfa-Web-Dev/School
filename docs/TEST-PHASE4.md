# Phase 4 test: Teacher panel + admin timetable/notices

## Pehle Apps Script update (zaruri)
1. Naya `Code.gs` poora copy -> Apps Script mein purana delete karke paste -> Save.
2. **Deploy -> Manage deployments -> pencil (Edit) -> Version: New version -> Deploy.**

## Admin se taiyari
1. **Teachers** -> T001 ka **Password** reset karke note karo.
2. **Classes** -> kisi class ka **Edit** -> Class teacher = T001.
3. **Timetable** -> **+ Add period**: class, subject, teacher, din, start/end time. Same teacher/class ko same time pe do period doge to error aayega (clash check).
4. **Class Notices** -> **+ New notice**: "All classes" ya ek class.

## Teacher se test (Login as: Teacher, ID T001)
- **Dashboard**: aaj ke periods aur meri classes.
- **Attendance**: class + date chuno -> Present/Absent/Late dabao (ya "Sab Present") -> Save. Dobara kholne par wahi status dikhega. Badalkar save karo to nayi entry banti hai (purani Sheet mein rahti hai).
- **Marks Entry**: class -> exam -> subject chuno -> marks bharo -> Save. (Exam abhi Sheet ke Exams tab mein banate hain; app se exam banana Phase 6.)
  Sirf wohi subjects dikhte hain jo us class mein aap padhate ho (class teacher ko sab subjects).
- **Homework**: add/edit/delete (sirf apna).
- **My Classes**: class-wise students list.
- **Timetable**, **Class Notices** (sirf apni classes ke liye likh sakte ho).

## Student se check
Student login (S001) -> Attendance/Report Card/Homework/Notices mein ab teacher ka bhara data dikhna chahiye.

## Dhyan
- Attendance aur marks mein purani rows kabhi delete nahi hoti, sabse nayi row maani jaati hai.
- Aane wali date ki attendance nahi lag sakti.
- Marks 0 se exam ke max marks ke beech hi.
