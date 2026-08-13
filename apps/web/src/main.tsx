import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SplashScreen } from "@/components/SplashScreen";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ParentDashboardPage } from "@/pages/parent/ParentDashboardPage";
import { StudentDashboardPage } from "@/pages/student/StudentDashboardPage";
import { StudentMonthlyRaportPage } from "@/pages/student/StudentMonthlyRaportPage";
import { StudentMonthlySummaryPage } from "@/pages/student/StudentMonthlySummaryPage";
import { StudentProfilePage } from "@/pages/student/StudentProfilePage";
import { StudentRaportPage } from "@/pages/student/StudentRaportPage";
import { StudentSemesterRaportPage } from "@/pages/student/StudentSemesterRaportPage";
import { StudentYaumiyahInputPage } from "@/pages/student/StudentYaumiyahInputPage";
import { StudentYaumiyahPage } from "@/pages/student/StudentYaumiyahPage";
import { StudentYaumiyahViewPage } from "@/pages/student/StudentYaumiyahViewPage";
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

  const cleanRoute = route.replace("#/", "").replace("#", "");

  // Role: STUDENT
  if (user.role === "student") {
    switch (cleanRoute) {
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
        return <StudentMonthlyRaportPage />;
      case "semester-raport":
        return <StudentSemesterRaportPage />;
      case "profile":
        return <StudentProfilePage />;
      case "dashboard":
      default:
        return <StudentDashboardPage />;
    }
  }

  // Role: PARENT
  if (user.role === "parent") {
    switch (cleanRoute) {
      case "dashboard":
      default:
        return <ParentDashboardPage />;
    }
  }

  // Role: TEACHER / KOOR (Fallback baseline)
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
    </QueryClientProvider>
  </React.StrictMode>
);
