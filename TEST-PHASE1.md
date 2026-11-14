# Phase 1 test: Content editor

## GitHub key banana (ek baar)
GitHub -> Settings -> Developer settings -> Personal access tokens -> **Fine-grained tokens** -> Generate.
- Repository access: **Only select repositories** -> sirf school ka repo
- Permissions -> Repository -> **Contents: Read and write**
- Token copy karo (sirf ek baar dikhta hai).

## Test
1. Admin se login -> `admin/content.html` (menu: Website Content).
2. "GitHub settings" mein Owner, Repo, Token daalo -> **Save & test**. "OK ... (write access)" aana chahiye.
3. Notices tab -> **+ Add** -> date, Hindi/English title likho.
4. Home tab -> Hero slide add karo, **Upload** se photo chuno (badi photo khud chhoti ho jati hai).
5. Staff / Gallery / Downloads(PDF) mein bhi ek-ek try karo.
6. Neeche **Publish (N)** dabao -> "Done ... 1 commit".
7. 1-2 minute baad public site (`index.html`) kholo, badlav dikhna chahiye.

## Dhyan
- Token sirf is browser mein rehta hai. Dusre device par dobara daalna padega.
- Publish se pehle page band karoge to badlav chale jayenge (browser warning dega).
- Publish ek hi commit banata hai (Cloudflare build bachane ke liye).
