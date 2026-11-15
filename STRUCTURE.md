# Structure

```
index about academics facilities admission gallery library contact privacy .html   public website
login.html      Admin / Teacher / Student login          dashboard.html  login ke baad role ke panel par bhejta hai
studio.html     hidden website editor (GitHub token)     config.js       school ki settings (naam, phone, api, theme)
admin/ teacher/ student/   har role ka alag installable panel (manifest + sw + icons)
assets/js/      site.js (website) site-data.js (text/photos) studio.js lang.js (Hindi/English) + panel pages
backend/*.gs    Apps Script source (Main.gs ROUTES: action -> function)
Code.gs         backend/*.gs ka combined version - Apps Script mein yahi paste hota hai. Rebuild: tools/build-code.sh
content/        site.json (Studio publish) library.json (Library index)     library/  PDFs + SEO pages (Studio banata hai)
docs/           UI-REFERENCE.md (design notes)           robots.txt sitemap.xml
```

Roles: sirf admin, teacher, student. Parent ke liye alag login nahi (student login se dekhte hain).
Backend badalne ke baad: `tools/build-code.sh` chalao, naya Code.gs Apps Script mein paste karo, Deploy -> Manage deployments -> Edit -> New version.

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

## Colour themes
- 16 ready themes in `THEMES` (assets/js/site.js): sunrise (default orange+cream), ocean, navy, sky, indigo, purple, teal, emerald, forest, lime, gold, coffee, maroon, crimson, rose, slate. Header/footer stay black.
- Change in one click: Studio -> 🎨 Theme -> tap a theme (live preview) -> Save & publish. Or set `theme:"ocean"` in config.js.
- To add a theme: add one line to `THEMES` (o = accent, o2 = light accent for dark areas, cream/cream2 = soft backgrounds).
