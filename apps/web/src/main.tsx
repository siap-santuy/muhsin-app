import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SplashScreen } from "@/components/SplashScreen";
import { LoginPage } from "@/pages/LoginPage";
import { useAuthStore } from "@/store/authStore";
import "@/index.css";

const queryClient = new QueryClient();

function App() {
  const [ready, setReady] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return <SplashScreen />;
  }

  if (user) {
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
    </QueryClientProvider>
  </React.StrictMode>
);