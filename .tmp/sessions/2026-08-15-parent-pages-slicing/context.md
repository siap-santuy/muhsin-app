# Task Context: Slicing Parent Pages

Session ID: 2026-08-15-parent-pages-slicing
Created: 2026-08-15T00:00:00Z
Status: in_progress

## Current Request
Slicing all remaining parent-role pages from Figma canvas `Muhsin V.1.0.0` (7 frames -> 6 pages) with reusable components and clean code. Include refactoring student raport pages to consume shared raport components.

## Context Files (Standards to Follow)
- docs/PROJECT.md
- docs/PRD.md
- AGENTS.md

## Reference Files (Source Material to Look At)
- apps/web/src/pages/student/StudentMonthlyRaportPage.tsx
- apps/web/src/pages/student/StudentSemesterRaportPage.tsx
- apps/web/src/pages/student/StudentMonthlySummaryPage.tsx
- apps/web/src/pages/student/StudentYaumiyahPage.tsx
- apps/web/src/pages/student/StudentYaumiyahViewPage.tsx
- apps/web/src/pages/student/StudentRaportPage.tsx
- apps/web/src/main.tsx
- apps/web/src/pages/parent/ParentDashboardPage.tsx

## External Docs Fetched
None

## Components
- Shared Raport Components (`src/components/raport/`):
  - RaportStudentHeader.tsx
  - NilaiTtqSection.tsx
  - MutabaahSection.tsx
  - AbsensiSection.tsx
  - EvaluasiSection.tsx
- Parent Pages (`apps/web/src/pages/parent/`):
  - ParentMonthlySummaryPage.tsx
  - ParentYaumiyahPage.tsx
  - ParentYaumiyahViewPage.tsx
  - ParentRaportPage.tsx
  - ParentMonthlyRaportPage.tsx
  - ParentSemesterRaportPage.tsx

## Constraints
- Static UI mock data (matching existing page style)
- Must reuse existing UI primitives and layout components (AppHeader, BottomNav, MonthCalendar, DayStripPicker, etc.)
- Strict type safety, clean component separation
- Non-breaking refactor of student raport pages

## Exit Criteria
- [ ] 5 shared raport components created in `apps/web/src/components/raport/`
- [ ] `StudentMonthlyRaportPage` & `StudentSemesterRaportPage` refactored to use shared components
- [ ] 6 parent pages created in `apps/web/src/pages/parent/`
- [ ] Routes added in `main.tsx` for parent role
- [ ] Dashboard cards wired in `ParentDashboardPage.tsx`
- [ ] Typecheck / build succeeds via `bun --cwd apps/web run build`
