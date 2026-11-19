#!/bin/bash
# backend/*.gs ko ek Code.gs mein jodta hai (Apps Script mein yahi paste hota hai). Backend badalne ke baad chalao.
cd "$(dirname "$0")/.."
: > Code.gs.new
for f in Utils Auth Core Setup Main Portal Students Teachers Classes Timetable Notices Attendance Homework Fees Results Library Tests Doubts Insights Cards Leaves Qr Slots Awards Enquiry Dashboard Backup Ai; do cat backend/$f.gs >> Code.gs.new; echo >> Code.gs.new; done
mv Code.gs.new Code.gs && echo "Code.gs built ($(wc -l < Code.gs) lines)"
