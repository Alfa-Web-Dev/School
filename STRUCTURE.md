# Structure

```
index.html      public school website (link kholte hi yahi khulti hai; content/*.json se). Menu mein "Login" link
login.html      Admin / Teacher / Student login (neeche "Visit website" link)
dashboard.html  login ke baad role ke panel par bhejta hai
config.js       school ki settings
admin/ teacher/ student/   har role ka alag app-jaisa panel (apne alag pages)
assets/js/  api.js i18n.js i18n-extra.js shell.js site.js
backend/*.gs            Apps Script (Main.gs ROUTES me action -> function)
manifest-*.webmanifest  sw.js  robots.txt  sitemap.xml
```

Phases: 1 content editor, 2 admin core, 3 student portal, 4 teacher+attendance, 5 fees, 6 results, 7 enquiry, 8 PWA polish, 9 dashboard/logs/backup.
Baaki ke pages abhi "Coming in Phase N" dikhate hain.

Roles: sirf admin, teacher, student. Parent ke liye alag login nahi (student login se dekhte hain). Parent ka naam/phone Students tab mein record ke liye.
