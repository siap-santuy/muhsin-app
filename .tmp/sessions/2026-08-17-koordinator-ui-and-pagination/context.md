# Task Context: Koordinator UI Adjustments & Pagination & Notification/Profile Adaptations

Session ID: 2026-08-17-koordinator-ui-and-pagination
Created: 2026-08-17T14:00:00Z
Status: in_progress

## Current Request
Pada halaman koordinator, sesuaikan gaya card icon dan lainnya seperti UI di Figma, kemudian tambahkan pagination pada setiap tabel. Lalu untuk component atau page yang hampir serupa seperti notifikasi dan halaman profile koordinator jangan samakan persis dengan page atau component dari parent/student/teacher namun sesuaikan componentnya agar dalam layout desktop koordinator. Sekarang ketika buka notifikasi sebagai koordinator, bottom navigasi dalam mode mobile masih keluar, harusnya jika mode desktop/tablet tampilannya seperti layout koor.

## Context Files (Standards to Follow)
- .opencode/context/core/standards/code-quality.md
- .opencode/context/core/standards/typescript.md
- .opencode/context/project-intelligence/technical-domain.md
- .opencode/context/ui/web/react-patterns.md
- .opencode/context/ui/web/ui-styling-standards.md

## Reference Files (Source Material to Look At)
- apps/web/src/pages/koordinator/KoorDashboardPage.tsx
- apps/web/src/pages/koordinator/KoorStudentPage.tsx
- apps/web/src/pages/koordinator/KoorTeacherPage.tsx
- apps/web/src/pages/koordinator/KoorKurikulumPage.tsx
- apps/web/src/pages/koordinator/KoorMunaqosahPage.tsx
- apps/web/src/pages/notification/NotificationPage.tsx
- apps/web/src/pages/settings/EditProfilePage.tsx
- apps/web/src/components/settings/SettingsPageShell.tsx
- apps/web/src/components/layout/KoorShell.tsx
- apps/web/src/components/ui/Pagination.tsx

## External Docs Fetched
None needed (all internal components and designs).

## Components
1. Koor UI Card Styling & Icons (Dashboard, Student, Teacher, Kurikulum)
2. Table Pagination integration using Pagination.tsx
3. Notification Page Adaptation for Koordinator Role (use KoorShell)
4. Profile & Settings Pages Adaptation for Koordinator Role (use KoorShell, no BottomNav)

## Constraints
- Multi-tenant school_id scoping preserved where applicable
- Role checking via useAuthStore
- Pure/modular components, clean architecture
- No breaking changes to student/parent/teacher views

## Exit Criteria
- [ ] Koor pages stat cards match Figma icon container styling (rounded-2xl, soft bg colors, typography)
- [ ] Every table in Koor pages has working pagination using `Pagination.tsx` with proper state slicing
- [ ] `NotificationPage` wraps in `KoorShell` when user role is `koordinator_ttq` and does NOT display mobile `BottomNav`
- [ ] Settings pages (`EditProfilePage`, `ChangePasswordPage`, `PrivacyPage`, `HelpPage`, `AboutPage`) wrap in `KoorShell` when user role is `koordinator_ttq` without `BottomNav`
- [ ] Type checks & build pass cleanly
