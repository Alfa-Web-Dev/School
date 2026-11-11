# Phase 2 test: Admin core (students, teachers, classes)

## Pehle Apps Script update karo (zaruri)
1. Naya `Code.gs` ka poora text copy karo (GitHub repo ke root se).
2. Apps Script mein purana code delete karke paste karo -> Save.
3. **Deploy -> Manage deployments -> pencil (Edit) -> Version: New version -> Deploy**. (New deployment mat banana, URL badal jayega.)

## Test (admin login ke baad, menu se)
1. **Dashboard**: students/teachers/classes ke counts dikhne chahiye.
2. **Teachers**: demo teachers (T001-T003) ke saamne **Password** dabao -> naya password dikhega (copy karo). Naya teacher bhi **+ Add teacher** se jodo.
3. **Classes**: class ka **Edit** -> Class teacher chuno. **+ Add class** try karo. Subjects neeche hain.
4. **Students**:
   - Demo students ke saamne **PIN** (student) aur **Parent PIN** dabao -> PIN dikhega.
   - **+ Add** se naya student jodo -> Student ID + PIN + Parent ID + PIN dikhega (sirf ek baar).
   - Same parent phone se doosra bachcha jodo -> parent same rahega.
   - **Template** download karo, usme 2-3 students bharo, **Import CSV** se upload karo -> result CSV (PIN ke saath) download hogi.
   - **Promote**: ek class ke saare active students agli class mein.
5. **Login test**: logout karo -> Student ID + PIN se (Login as: Student) aur Parent phone + PIN se (Login as: Parent) login karo. Abhi unka panel "Coming in Phase 3" dikhayega, bas login chalna chahiye.
6. Teacher ID (T001) + password se login karo (panel Phase 4 mein banega).

## Dhyan
- PIN/password sirf ek baar dikhte hain, Sheet mein sirf hash hota hai.
- PIN reset karne par us user ka purana session band ho jata hai.
- CSV mein `classId` ke bajay class ka naam (jaise "Class 5 - A") bhi chalega.
