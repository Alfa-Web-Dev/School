# Notes library (Drive) test

Files Google Drive mein jati hain (GitHub repo mein nahi). Sheet ke `Notes` tab mein sirf list rehti hai.

## Pehle Apps Script update + Drive permission (ek baar)
1. Naya `Code.gs` poora copy -> Apps Script mein purana delete karke paste -> Save.
2. Upar function dropdown se **`setupDrive`** chuno -> Run. Drive ki permission maangega:
   **Review permissions -> apna account -> Advanced -> Go to project (unsafe) -> Allow.**
   Log mein "Notes folder ban gaya" aana chahiye. Drive mein **School Notes** naam ka folder ban jayega (isse rename/move mat karna).
3. **Deploy -> Manage deployments -> pencil (Edit) -> Version: New version -> Deploy.**

## Test
1. Teacher (ya admin) login -> menu **Notes** -> upload form: class, subject, chapter, title, PDF/photo chuno -> **Upload**.
   Neeche cards mein dikhega. Card par click = page ke andar viewer. **Download** button bhi hai.
2. Drive mein dekho: `School Notes / Class 5 - A / Maths /` ke andar file aa gayi hogi.
3. Student login -> **Notes**: apni class ke notes subject aur chapter ke hisaab se, search bhi.
4. Teacher apne notes **Edit/Delete** kar sakta hai (delete par file Drive ke trash mein jati hai).

## Limits / dhyan
- Ek file max **20 MB**, sirf PDF ya photo (JPG/PNG/WEBP). Photo browser mein khud chhoti ho jati hai.
- Teacher sirf apni class aur apne subject mein upload kar sakta hai.
- Card ka preview Drive ke thumbnail se aata hai. Na aaye to PDF ka icon dikhta hai, viewer phir bhi chalta hai.
- Drive free storage 15 GB hai (Gmail/Photos ke saath shared). Is school ke notes ke liye alag Google account rakhna behtar hai.
- File "link wale koi bhi dekh sake" hoti hai, list sirf login wale students ko dikhti hai.
- Ek hi file par bahut zyada log ek saath khole to Drive kuch der rok sakta hai ("too many users").
