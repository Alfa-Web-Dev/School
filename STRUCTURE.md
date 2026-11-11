# Structure (skeleton - abhi sirf dhancha, features phase-wise aayenge)

```
config.js  index.html  login.html  dashboard.html
content/*.json          public site ka sara content
uploads/  assets/img/   photos, PDFs
assets/js/  api.js i18n.js i18n-extra.js shell.js site.js
admin/ teacher/ student/   har role ke pages (login guard shell.js se)
backend/*.gs            Apps Script (Main.gs ROUTES me action -> function)
manifest-*.webmanifest  sw.js  robots.txt  sitemap.xml
```

Phases: 1 content editor, 2 admin core, 3 student portal, 4 teacher+attendance, 5 fees, 6 results, 7 enquiry, 8 PWA polish, 9 dashboard/logs/backup.
Baaki ke pages abhi "Coming in Phase N" dikhate hain.

Roles: sirf admin, teacher, student. Parent ke liye alag login nahi (student login se dekhte hain). Parent ka naam/phone Students tab mein record ke liye.
