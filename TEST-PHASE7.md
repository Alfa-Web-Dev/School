# Phase 7 test: Enquiry form + email + Admin inbox

1. Naya `Code.gs` paste, Save. **Deploy → Manage deployments → ✏️ Edit → New version → Deploy.**
2. Pehli baar email ki permission: Apps Script editor mein koi function (jaise `setupDrive`) dobara Run karo, "Gmail se email bhejna" permission Allow karo. Bina iske email nahi jayegi (enquiry phir bhi save hoti hai).
3. Email kahan jayegi: default = tumhara Apps Script wala Gmail. Dusra email chahiye to Sheet ke **Settings** tab mein nayi row: key `notify_email`, value `school@gmail.com`.
4. Website (home page) ke Enquiry form se test enquiry bhejo. "Bhej diya" dikhna chahiye, email aani chahiye.
5. **Admin → Enquiries:** enquiry dikhe, Call/WhatsApp link, status (new/contacted/closed) badlo, delete.
6. Spam rokne ke upay: hidden honeypot field, ek phone se 1 ghante mein max 3, poori site se max 40.
