# Phase 3 test: Student portal

## Pehle Apps Script update (zaruri)
1. Naya `Code.gs` poora copy -> Apps Script mein purana delete karke paste -> Save.
2. **Deploy -> Manage deployments -> pencil (Edit) -> Version: New version -> Deploy.**

## Test
1. Admin panel -> Students -> kisi student ka **PIN** reset karo (jaise S001) -> PIN copy karo.
2. Logout. Login as **Student**, ID `S001`, wahi PIN.
3. Student panel ke menu mein ye sab kholo:
   - **Dashboard**: attendance %, fee balance, aaj ki classes, latest notices
   - **Profile**, **Attendance** (din-wise), **Fees** (due/paid/balance + receipts),
     **Report Card** (exam-wise marks, Print button), **Timetable**, **Homework**, **Class Notices**
4. **Change PIN**: purana PIN, naya PIN (4-8 digits), confirm -> Save. Logout karke naye PIN se login karo.
5. Admin aur teacher ke menu mein bhi **Change PIN** (password badalna) aa gaya hai.

## Kya dikhega (Sheet ke demo data se)
Attendance, fees, results, timetable, homework, notices Sheet ke demo rows se aate hain. Inhe app se bharne ke pages baad ke phases mein aayenge
(timetable/notices = admin, attendance/marks/homework = teacher Phase 4, fees = Phase 5, results = Phase 6). Tab tak Sheet mein seedha edit karke dekh sakte ho.

## Dhyan
- Student sirf apni hi row dekh sakta hai (server par check hota hai).
- Fee "due" monthly fee ko session start (AcademicYears mein current wali) se ab tak ke mahino se multiply karke nikalta hai. Attendance % mein Late = present.
