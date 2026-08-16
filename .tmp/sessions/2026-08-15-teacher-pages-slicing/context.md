# Task Context: Slicing Teacher Pages

Session ID: 2026-08-15-teacher-pages-slicing
Created: 2026-08-15T00:00:00Z
Status: in_progress

## Current Request
Slice all Teacher role pages from Figma `Muhsin V.1.0.0` canvas / `design/UI-UX/3. Teacher/` into `apps/web/src/pages/teacher/`. Create clean reusable components, static UI mock data, and wire routing for teacher role.

## Context Files (Standards to Follow)
- docs/PROJECT.md
- docs/PRD.md
- .opencode/context/core/standards/code-quality.md
- .opencode/context/ui/web/ui-styling-standards.md

## Reference Files (Source Material to Look At)
- design/UI-UX/3. Teacher/ (13 screen designs)
- apps/web/src/main.tsx
- apps/web/src/components/layout/AppHeader.tsx
- apps/web/src/components/layout/BottomNav.tsx
- apps/web/src/components/raport/*

## External Docs Fetched
None

## Components
- Teacher Pages (`apps/web/src/pages/teacher/`):
  - TeacherDashboardPage.tsx
  - TeacherStudentListPage.tsx
  - TeacherZiyadahInputPage.tsx
  - TeacherZiyadahViewPage.tsx
  - TeacherMurojaahInputPage.tsx
  - TeacherMurojaahViewPage.tsx
  - TeacherSabiqInputPage.tsx
  - TeacherSabiqViewPage.tsx
  - TeacherTalaqiInputPage.tsx
  - TeacherTalaqiViewPage.tsx
  - TeacherRaportPage.tsx
  - TeacherMonthlyRaportPage.tsx
  - TeacherSemesterRaportPage.tsx
  - TeacherProfilePage.tsx
- Shared Teacher Components (`apps/web/src/components/teacher/`):
  - TeacherMenuCard.tsx / Form primitives if needed

## Constraints
- Static UI mock data matching existing styling tokens and design files.
- Clean functional React components (<200 lines where possible).
- End-to-end type safety, zero `any`.
- Proper hash route registration in `main.tsx` under `user.role === "teacher"`.

## Exit Criteria
- [ ] Shared teacher UI components created in `apps/web/src/components/teacher/`
- [ ] All teacher role pages implemented in `apps/web/src/pages/teacher/`
- [ ] Teacher role routes registered in `main.tsx`
- [ ] `bun run build` in `apps/web` passes with 0 type errors
