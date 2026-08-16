# Task Context: Complete Missing Pages & Dead CTAs

Session ID: 2026-08-16-complete-missing-pages
Created: 2026-08-16T12:00:00Z
Status: in_progress

## Current Request
Check all active pages, identify non-existent pages from existing CTA buttons, cards, and menus, and implement them in groups with updated documentation (PRD.md & PROJECT.md).

## Context Files (Standards to Follow)
- docs/PROJECT.md
- AGENTS.md

## Reference Files (Source Material to Look At)
- docs/PRD.md
- apps/web/src/main.tsx
- apps/web/src/components/layout/AppHeader.tsx
- apps/web/src/pages/student/StudentProfilePage.tsx
- apps/web/src/pages/parent/ParentProfilePage.tsx
- apps/web/src/pages/teacher/TeacherProfilePage.tsx
- apps/web/src/pages/parent/ParentDashboardPage.tsx

## Components
1. Documentation updates (PRD.md D5/D6, NFR, section 4.8; PROJECT.md #3.2 structure & PDF note)
2. Group 1: Notifications page (`#/notifications`) + AppHeader bell + ParentDashboard ReminderBanner
3. Group 2: Settings sub-pages (`#/edit-profile`, `#/change-password`, `#/privacy`, `#/help`, `#/about`) + Profile pages wiring
4. Group 3: UNDUH RAPORT window.print() wiring in 6 raport pages
5. Router main.tsx integration & verification

## Exit Criteria
- [ ] PRD.md and PROJECT.md updated with D5/D6 decision log and new feature specifications
- [ ] NotificationPage implemented and wired from AppHeader bell and ReminderBanner
- [ ] 5 Settings pages implemented and wired from Student/Parent/Teacher profile pages
- [ ] 6 Raport pages wired with window.print() on UNDUH RAPORT buttons
- [ ] Hash routes registered in main.tsx for all roles
- [ ] `tsc --noEmit` builds cleanly without errors
