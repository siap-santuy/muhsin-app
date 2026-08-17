# Task Context: Slicing Page Koordinator TTQ

Session ID: 2026-08-17-koordinator-page-slicing
Created: 2026-08-17T09:40:00Z
Status: completed

## Current Request
Slicing UI halaman Koordinator TTQ dari Figma (4 frame: Dashboard, Student, Teacher, Kurikulum) dengan penyesuaian yang direkomendasikan & improvisasi fitur Munaqosah per PRD #4.3c dan PROJECT.md.

## Context Files (Standards Followed)
- `.opencode/context/core/standards/code-quality.md`
- `.opencode/context/core/standards/typescript.md`
- `.opencode/context/ui/web/react-patterns.md`
- `.opencode/context/ui/web/ui-styling-standards.md`

## Reference Files
- `docs/PROJECT.md`
- `docs/PRD.md`
- `apps/web/src/main.tsx`
- `apps/web/src/store/authStore.ts`
- `apps/web/tailwind.config.ts`

## Deliverables Created
1. `apps/web/src/components/layout/KoorShell.tsx` (desktop SideNav + TopBar + mobile collapse)
2. `apps/web/src/pages/koordinator/KoorDashboardPage.tsx` (overview, stats, weekly chart, live feed)
3. `apps/web/src/pages/koordinator/KoorStudentPage.tsx` (directory, summary cards, searchable table, pagination)
4. `apps/web/src/pages/koordinator/KoorTeacherPage.tsx` (teacher stats, halaqah plotting cards)
5. `apps/web/src/pages/koordinator/KoorKurikulumPage.tsx` (2-level config, dynamic score_fields, lock indicator per PROJECT.md #4.2.1, grading scale)
6. `apps/web/src/pages/koordinator/KoorMunaqosahPage.tsx` (PRD #4.3c approval queue, examiner assignment modal)
7. `apps/web/src/store/authStore.ts` (added `koordinator@demo.com`)
8. `apps/web/src/pages/auth/LoginPage.tsx` (added Demo Koor button)
9. `apps/web/src/main.tsx` (wired routes for `koordinator_ttq` role)

## Exit Criteria
- [x] KoorShell layout created with active link highlighting & mobile responsiveness
- [x] 5 Koordinator pages created with mock data
- [x] Auth store updated with `koordinator_ttq` demo account
- [x] `main.tsx` routes wired for `koordinator_ttq` role
- [x] Type check & build clean: `bun run --cwd apps/web build` passed
