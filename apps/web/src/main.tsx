import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SplashScreen } from "@/components/SplashScreen";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ParentDashboardPage } from "@/pages/parent/ParentDashboardPage";
import { StudentDashboardPage } from "@/pages/student/StudentDashboardPage";
import { StudentMonthlySummaryPage } from "@/pages/student/StudentMonthlySummaryPage";
import { StudentYaumiyahInputPage } from "@/pages/student/StudentYaumiyahInputPage";
import { StudentYaumiyahPage } from "@/pages/student/StudentYaumiyahPage";
import { StudentYaumiyahViewPage } from "@/pages/student/StudentYaumiyahViewPage";
import { StudentRaportPage } from "@/pages/student/StudentRaportPage";
import { StudentMonthlyRaportPage } from "@/pages/student/StudentMonthlyRaportPage";
import { StudentSemesterRaportPage } from "@/pages/student/StudentSemesterRaportPage";
import { StudentProfilePage } from "@/pages/student/StudentProfilePage";
import { useAuthStore } from "@/store/authStore";
import "@/index.css";

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

const PREVIEW_ROUTES = [
  "#/student",
  "#/parent",
  "#/student-tahfidz",
  "#/student-yaumiyah",
  "#/student-yaumiyah-input",
  "#/student-yaumiyah-view",
  "#/student-raport",
  "#/student-monthly-raport",
  "#/student-semester-raport",
  "#/student-profile",
];

function DevPreviewSwitcher() {
  const route = useHashRoute();
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex max-w-[90vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-full border border-brand-line bg-white p-1.5 shadow-lg no-scrollbar">
      {PREVIEW_ROUTES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => (window.location.hash = r)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
            route === r ? "bg-brand-cyan text-white" : "text-brand-navy"
          }`}
        >
          {r.replace("#/", "")}
        </button>
      ))}
    </div>
  );
}

function App() {
  const [ready, setReady] = useState(false);
  const route = useHashRoute();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (route === "#/student") {
    return <StudentDashboardPage />;
  }

  if (route === "#/student-tahfidz") {
    return <StudentMonthlySummaryPage />;
  }

  if (route === "#/student-yaumiyah") {
    return <StudentYaumiyahPage />;
  }

  if (route === "#/student-yaumiyah-input") {
    return <StudentYaumiyahInputPage />;
  }

  if (route === "#/student-yaumiyah-view") {
    return <StudentYaumiyahViewPage />;
  }

  if (route === "#/student-raport") {
    return <StudentRaportPage />;
  }

  if (route === "#/student-monthly-raport") {
    return <StudentMonthlyRaportPage />;
  }

  if (route === "#/student-semester-raport") {
    return <StudentSemesterRaportPage />;
  }

  if (route === "#/student-profile") {
    return <StudentProfilePage />;
  }

  if (route === "#/parent") {
    return <ParentDashboardPage />;
  }

  if (!ready) {
    return <SplashScreen />;
  }

  if (user) {
    if (user.role === "student") {
      return <StudentDashboardPage />;
    }

    if (user.role === "parent") {
      return <ParentDashboardPage />;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-[#0C2B50]">
            Muhsin App
          </h1>
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

  return <LoginPage />;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV ? <DevPreviewSwitcher /> : null}
    </QueryClientProvider>
  </React.StrictMode>
);
