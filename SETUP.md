# New school setup (about 30 minutes, zero cost)

1. **Copy the repo.** On GitHub use "Use this template"/fork into the school's own repo, e.g. `school-name/School`. Settings → Pages → Branch `main` / root → the site goes live at `https://<owner>.github.io/<repo>/`.
2. **Google Sheet + Apps Script.** Create a new Google Sheet. Extensions → Apps Script → paste `Code.gs` (from `backend/`). Run `setup` once and allow permissions (Sheets, Drive, Gmail). Deploy → New deployment → Web app → Execute as *Me*, access *Anyone* → copy the `/exec` URL.
3. **config.js.** Set `api` (the /exec URL), `name`, `nameHi`, `shortName`, `phone`, `whatsapp`, `email`, `address`, `addressHi`, `mapEmbed` (Google Maps → Share → Embed a map → the `src` link), `accent`/`color` (brand colours), `social`, `upi`.
4. **First login.** Admin ID/password are created by `setup` (see the Apps Script log). Change the password right away (Admin → Change PIN).
5. **Backup + email.** In Apps Script run `enableAutoBackup` once (daily 2 am). In the Sheet's Settings tab set `notify_email` (enquiry emails go there).
6. **Website content.** Open `/studio.html`, enter `owner/repo` and a fine-grained GitHub token (this repo only, Contents: Read and write). Replace demo text, staff, testimonials, results and photos with real ones, then Publish.
7. **Install the panels.** Open `/admin/`, `/teacher/`, `/student/` on a phone → "Install app". Each role installs separately.
8. **Go live checklist.** Real logo + photos, real phone/address/map, demo testimonials/rating removed, privacy page reviewed, test enquiry received by email, weak passwords changed, test students deleted.
