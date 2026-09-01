import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SplashScreen } from "@/components/SplashScreen";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ParentDashboardPage } from "@/pages/parent/ParentDashboardPage";
import { ParentMonthlyRaportPage } from "@/pages/parent/ParentMonthlyRaportPage";
import { ParentMonthlySummaryPage } from "@/pages/parent/ParentMonthlySummaryPage";
import { ParentProfilePage } from "@/pages/parent/ParentProfilePage";
import { ParentRaportPage } from "@/pages/parent/ParentRaportPage";
import { ParentSemesterRaportPage } from "@/pages/parent/ParentSemesterRaportPage";
import { ParentYaumiyahPage } from "@/pages/parent/ParentYaumiyahPage";
import { ParentYaumiyahViewPage } from "@/pages/parent/ParentYaumiyahViewPage";
import { StudentDashboardPage } from "@/pages/student/StudentDashboardPage";
import { StudentMonthlyRaportPage } from "@/pages/student/StudentMonthlyRaportPage";
import { StudentMonthlySummaryPage } from "@/pages/student/StudentMonthlySummaryPage";
import { StudentProfilePage } from "@/pages/student/StudentProfilePage";
import { StudentRaportPage } from "@/pages/student/StudentRaportPage";
import { StudentSemesterRaportPage } from "@/pages/student/StudentSemesterRaportPage";
import { StudentYaumiyahInputPage } from "@/pages/student/StudentYaumiyahInputPage";
import { StudentYaumiyahPage } from "@/pages/student/StudentYaumiyahPage";
import { StudentYaumiyahViewPage } from "@/pages/student/StudentYaumiyahViewPage";
import { TeacherDashboardPage } from "@/pages/teacher/TeacherDashboardPage";
import { TeacherMonthlyRaportPage } from "@/pages/teacher/TeacherMonthlyRaportPage";
import { TeacherMurojaahInputPage } from "@/pages/teacher/TeacherMurojaahInputPage";
import { TeacherMurojaahViewPage } from "@/pages/teacher/TeacherMurojaahViewPage";
import { TeacherProfilePage } from "@/pages/teacher/TeacherProfilePage";
import { TeacherRaportPage } from "@/pages/teacher/TeacherRaportPage";
import { TeacherSabiqInputPage } from "@/pages/teacher/TeacherSabiqInputPage";
import { TeacherSabiqViewPage } from "@/pages/teacher/TeacherSabiqViewPage";
import { TeacherSemesterRaportPage } from "@/pages/teacher/TeacherSemesterRaportPage";
import { TeacherStudentListPage } from "@/pages/teacher/TeacherStudentListPage";
import { TeacherTalaqiInputPage } from "@/pages/teacher/TeacherTalaqiInputPage";
import { TeacherTalaqiViewPage } from "@/pages/teacher/TeacherTalaqiViewPage";
import { TeacherZiyadahInputPage } from "@/pages/teacher/TeacherZiyadahInputPage";
import { TeacherZiyadahViewPage } from "@/pages/teacher/TeacherZiyadahViewPage";
import { KoorDashboardPage } from "@/pages/koordinator/KoorDashboardPage";
import { KoorStudentPage } from "@/pages/koordinator/KoorStudentPage";
import { KoorTeacherPage } from "@/pages/koordinator/KoorTeacherPage";
import { KoorKurikulumPage } from "@/pages/koordinator/KoorKurikulumPage";
import { KoorMunaqosahPage } from "@/pages/koordinator/KoorMunaqosahPage";
import { NotificationPage } from "@/pages/notification/NotificationPage";
import { AboutPage } from "@/pages/settings/AboutPage";
import { ChangePasswordPage } from "@/pages/settings/ChangePasswordPage";
import { EditProfilePage } from "@/pages/settings/EditProfilePage";
import { HelpPage } from "@/pages/settings/HelpPage";
import { PrivacyPage } from "@/pages/settings/PrivacyPage";
import { useAuthStore } from "@/store/authStore";
import { ToastContainer } from "@/components/ui/Toast";
import { registerSW } from "virtual:pwa-register";
import "@/index.css";

// Auto-register service worker for PWA capabilities
registerSW({ immediate: true });

const queryClient = new QueryClient();

function useHashRoute(): string {
  const [route, setRoute] = useState(() => window.location.hash);

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route;
}

function App() {
  const [ready, setReady] = useState(false);
  const route = useHashRoute();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return <SplashScreen />;
  }

  if (!user) {
    return <LoginPage />;
  }

  const rawHash = route.replace("#/", "").replace("#", "");
  const [path, queryString] = rawHash.split("?");
  const searchParams = new URLSearchParams(queryString || "");

  // Common App Shell & Settings Routes (All Roles)
  switch (path) {
    case "notifications":
      return <NotificationPage />;
    case "edit-profile":
      return <EditProfilePage />;
    case "change-password":
      return <ChangePasswordPage />;
    case "privacy":
      return <PrivacyPage />;
    case "help":
      return <HelpPage />;
    case "about":
      return <AboutPage />;
  }

  // Role: STUDENT
  if (user.role === "student") {
    switch (path) {
      case "yaumiyah":
        return <StudentYaumiyahPage />;
      case "yaumiyah-input":
        return <StudentYaumiyahInputPage />;
      case "yaumiyah-view":
        return <StudentYaumiyahViewPage />;
      case "tahfidz-summary":
        return <StudentMonthlySummaryPage />;
      case "raport":
        return <StudentRaportPage />;
      case "monthly-raport":
        return (
          <StudentMonthlyRaportPage
            month={searchParams.get("month") || undefined}
            year={searchParams.get("year") || undefined}
          />
        );
      case "semester-raport":
        return (
          <StudentSemesterRaportPage
            semester={searchParams.get("semester") || undefined}
            year={searchParams.get("year") || undefined}
          />
        );
      case "profile":
        return <StudentProfilePage />;
      case "dashboard":
      default:
        return <StudentDashboardPage />;
    }
  }

  // Role: PARENT
  if (user.role === "parent") {
    switch (path) {
      case "yaumiyah":
        return <ParentYaumiyahPage />;
      case "yaumiyah-view":
        return <ParentYaumiyahViewPage />;
      case "tahfidz-summary":
        return <ParentMonthlySummaryPage />;
      case "raport":
        return <ParentRaportPage />;
      case "monthly-raport":
        return (
          <ParentMonthlyRaportPage
            month={searchParams.get("month") || undefined}
            year={searchParams.get("year") || undefined}
          />
        );
      case "semester-raport":
        return (
          <ParentSemesterRaportPage
            semester={searchParams.get("semester") || undefined}
            year={searchParams.get("year") || undefined}
          />
        );
      case "profile":
        return <ParentProfilePage />;
      case "dashboard":
      default:
        return <ParentDashboardPage />;
    }
  }

  // Role: TEACHER
  if (user.role === "teacher") {
    switch (path) {
      case "students":
      case "yaumiyah":
        return <TeacherStudentListPage />;
      case "ziyadah-input":
        return <TeacherZiyadahInputPage />;
      case "ziyadah-view":
        return <TeacherZiyadahViewPage />;
      case "murojaah-input":
        return <TeacherMurojaahInputPage />;
      case "murojaah-view":
        return <TeacherMurojaahViewPage />;
      case "sabiq-input":
        return <TeacherSabiqInputPage />;
      case "sabiq-view":
        return <TeacherSabiqViewPage />;
      case "talaqi-input":
        return <TeacherTalaqiInputPage />;
      case "talaqi-view":
        return <TeacherTalaqiViewPage />;
      case "raport":
        return <TeacherRaportPage />;
      case "monthly-raport":
        return (
          <TeacherMonthlyRaportPage
            month={searchParams.get("month") || undefined}
            year={searchParams.get("year") || undefined}
            studentId={searchParams.get("student") || undefined}
          />
        );
      case "semester-raport":
        return (
          <TeacherSemesterRaportPage
            semester={searchParams.get("semester") || undefined}
            year={searchParams.get("year") || undefined}
            studentId={searchParams.get("student") || undefined}
          />
        );
      case "profile":
        return <TeacherProfilePage />;
      case "dashboard":
      default:
        return <TeacherDashboardPage />;
    }
  }

  // Role: KOORDINATOR TTQ
  if (user.role === "koordinator_ttq") {
    switch (path) {
      case "students":
        return <KoorStudentPage />;
      case "teachers":
        return <KoorTeacherPage />;
      case "kurikulum":
        return <KoorKurikulumPage />;
      case "munaqosah":
        return <KoorMunaqosahPage />;
      case "dashboard":
      default:
        return <KoorDashboardPage />;
    }
  }

  // Fallback / Other roles
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-[#0C2B50]">Muhsin App</h1>
        <p className="text-sm text-muted-foreground">
          Manajemen TTQ &amp; ibadah yaumiyah siswa
        </p>
        <p className="text-sm text-[#22B8CF]">
          Selamat datang, {user.name} ({user.role})
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ToastContainer />
    </QueryClientProvider>
  </React.StrictMode>
);
