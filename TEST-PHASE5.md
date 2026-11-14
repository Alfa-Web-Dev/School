# Phase 5 test: Fees + receipt + UPI QR

## Pehle Apps Script update (zaruri)
1. Naya `Code.gs` poora copy -> Apps Script mein purana delete karke paste -> Save.
2. **Deploy -> Manage deployments -> pencil (Edit) -> Version: New version -> Deploy.**

## Admin -> Fees (4 tabs)
1. **Fee structure**: **+ Add fee** -> class, fee ka naam (jaise Tuition), amount, kab ("Monthly" ya ek mahina). Edit/Delete bhi hai.
2. **Collect**: student dhundo (naam/ID) -> uske due/paid/balance dikhenge -> fee type, amount, mode (cash/upi/bank/cheque), date -> **Receive payment**. Nayi tab mein **receipt** khulegi: **Print / Save as PDF** dabao.
3. **Payments**: sabhi payments, date/naam se filter, CSV download. Galti ho to **Void** (karan likhna zaruri). Purani entry delete nahi hoti, ulti (negative) entry judti hai aur receipt par CANCELLED dikhta hai.
4. **Defaulters**: class-wise baaki wale students, parent phone par tap karke call, CSV download.

## Hisaab kaise hota hai
- Monthly fee = amount x (session shuru hone se ab tak ke mahine). Session = AcademicYears mein `current` wala.
- One-time fee tab "due" hoti hai jab uska mahina aa jaye.
- Is session se pehle ki payments gino mein nahi aati.

## Student login se
**Fees** page: due/paid/balance, payments, har receipt par click karke receipt.
Student sirf apni receipt dekh sakta hai.

## UPI QR (optional)
`config.js` mein `upi:{id:"school@upi",name:"School ka naam"}` bharo (GitHub par file edit karke).
Student ke Fees page par QR + "UPI app mein kholo" button aayega (baaki amount ke saath).
Payment office confirm karti hai (Collect tab mein mode = upi) tabhi receipt banti hai.
Jab tak `upi.id` khali hai, QR nahi dikhta.

## Dhyan
- Receipt number Settings tab ke `receipt_prefix` (default R) se banta hai: R0001, R0002...
- Fee ka naam payment aur structure mein bilkul same hona chahiye (Tuition = Tuition).
