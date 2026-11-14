# Structure

```
index.html      public school website (link kholte hi yahi khulti hai; text/data assets/js/site-data.js mein). Menu mein "Login" link
login.html      Admin / Teacher / Student login (neeche "Visit website" link)
dashboard.html  login ke baad role ke panel par bhejta hai
config.js       school ki settings
admin/ teacher/ student/   har role ka alag app-jaisa panel (apne alag pages)
assets/js/  api.js i18n.js i18n-extra.js shell.js site.js
backend/*.gs            Apps Script (Main.gs ROUTES me action -> function)
manifest-*.webmanifest  sw.js  robots.txt  sitemap.xml
```

Phases: 1 website, 2 admin core, 3 student portal, 4 teacher+attendance, 5 fees, 6 results, 7 enquiry, 8 PWA polish, 9 dashboard/logs/backup.
Baaki ke pages abhi "Coming in Phase N" dikhate hain.

Roles: sirf admin, teacher, student. Parent ke liye alag login nahi (student login se dekhte hain). Parent ka naam/phone Students tab mein record ke liye.

## Public website (multi-page, black theme)
index, about, academics, facilities, admission, gallery, contact .html — each has `<body data-page=..>` and is rendered by `assets/js/site.js` from `assets/js/site-data.js` (all text/photos, bilingual) + `config.js` (name/phone/address). Photos = Unsplash keys in `PH` (fallback illustration from art.js if a photo fails). Replace with own photos: set `PH.key='uploads/xyz.jpg'`.

## Website Studio (hidden editor)
`studio.html` (noindex, no link anywhere) — enter `owner/repo` + GitHub fine-grained token (Contents: Read and write, only this repo). Opens a live clone of the website; every card has ✏️ (edit text hi/en, icon, colour, photo upload/URL), 🗑 (delete), "＋ Naya add karo". Publish commits `content/site.json` (+ `uploads/*.jpg`) to GitHub; the public site merges that file over `site-data.js` at load. Logic: `assets/js/studio.js`, style `assets/css/studio.css`; renderer hooks `data-e` / `data-ea` attributes in `site.js`.

## Language (Hindi / English, one at a time)
`assets/js/lang.js` (loaded on every panel page, login, receipt, report card, studio) maps every visible phrase to clean English or Hindi at runtime (text, placeholders, alert/confirm/prompt, server messages). New UI text: add one line `[source, hindi]` (or `[source, english, hindi]` if the source is Hinglish) to the list in lang.js. Website text lives bilingual in `site-data.js` / `site.js` (`b(hi,en)`); school name/address: `CFG.name`/`CFG.nameHi`, `CFG.address`/`CFG.addressHi`. Typed data (student names etc.) is shown as entered.

## Public Library (website `library.html`)
- PDFs live **in this repo** so they load fast (GitHub Pages CDN) and Google can index them: `library/files/<id>.pdf`, one static SEO page `library/<id>.html` per file, index in `content/library.json`, and each page is added to `sitemap.xml`.
- Manage everything from **Studio → 📚 Library** (add PDF with category / class / subject / description, or delete). Categories: Notes, Books, Previous Year Papers, Sample Papers, Magazines, Syllabus, Other. Limit 30 MB per file; keep total repo under ~1 GB.
- Students' private class notes still use Google Drive in the panels (not public).
