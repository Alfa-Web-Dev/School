# Phase 0 test (Foundation: Setup + Login + Roles)

## Backend (Google Sheet)
1. Naya Google Sheet banao > Extensions > Apps Script.
2. `backend/` ki 4 files (Utils, Setup, Auth, Main) alag-alag .gs file banakar paste karo.
3. Project Settings > Script Properties: FIRST_ADMIN_ID (jaise admin), FIRST_ADMIN_PASSWORD (apna strong password), FIRST_ADMIN_NAME.
4. Editor mein function `setupSheet` chalao (permission allow karo), phir `createFirstAdmin`.
   Check: Sheet mein 18 tabs bane, Users mein admin row hai, FIRST_ADMIN_PASSWORD property hat gayi.
5. Deploy > New deployment > Web app > Execute as: Me, Access: Anyone. URL copy karo.
   (Code.gs badalne par har baar: Deploy > Manage deployments > Edit > New version.)

## Frontend
6. `config.js` mein `api` me URL paste karo. Repo par upload karo, Cloudflare connect karo.

## Test list
- [ ] Browser mein web app URL kholo: {"ok":true,"version":"0.1.0"} dikhna chahiye
- [ ] login.html: admin ID + password se login, dashboard par naam aur role dikhe
- [ ] Galat password se error aaye; 5 galat attempts ke baad lock message
- [ ] Logout ke baad dashboard.html kholo to login par wapas aaye
- [ ] Hindi/English button kaam kare
- [ ] Logs tab mein login/login_fail entries aayein, Tokens tab mein token row ho
