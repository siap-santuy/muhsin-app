import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useTenantStore } from "@/store/tenantStore";
import { Button } from "@/components/ui/button";
import { PWAInstallLoginBanner } from "@/components/pwa/PWAInstallPrompt";
import { APP_VERSION } from "@/lib/appVersion";

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const school = useTenantStore((s) => s.school);
  const resolveTenant = useTenantStore((s) => s.resolveTenant);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    resolveTenant();
  }, [resolveTenant]);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password, school?.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  const headerContent = (
    <div className="flex flex-col items-center text-center">
      <img
        src={school?.logoUrl || "/brand/TTQ_Logo.png"}
        alt={school?.name || "Logo TTQ Al Fitrah"}
        className="h-48 w-48 object-contain md:h-52 md:w-52"
      />
      <div className="font-extrabold leading-snug tracking-wide text-[#0C2B50]">
        <p className="text-xl uppercase md:text-lg">TAHSIN TAHFIZH QURAN</p>
        <p className="text-xl uppercase md:text-lg">
          {school?.name ? school.name.toUpperCase() : "SMP ISLAM TERPADU AL FITRAH"}
        </p>
      </div>
    </div>
  );

  const loginCard = (
    <div className="w-full max-w-[340px] space-y-4 rounded-3xl border border-slate-100/80 bg-white p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] sm:max-w-[360px] md:p-7">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-sm font-semibold text-[#0C2B50]"
          >
            Username/email
          </label>
          <div className="relative">
            <input
              id="email"
              type="text"
              placeholder="Masukan username/email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200/70 bg-[#F8FAFC] pl-10 pr-4 text-sm text-[#0C2B50] placeholder:text-slate-400 focus:border-[#1CB8CE] focus:bg-white focus:outline-none transition-all"
            />
            <img
              src="/brand/person_icon.svg"
              alt=""
              className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-[#0C2B50]"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200/70 bg-[#F8FAFC] pl-10 pr-10 text-sm text-[#0C2B50] placeholder:text-slate-400 focus:border-[#1CB8CE] focus:bg-white focus:outline-none transition-all"
            />
            <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <button
              type="button"
              aria-label={
                showPassword ? "Sembunyikan password" : "Tampilkan password"
              }
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={!canSubmit}
          className="h-11 w-full rounded-xl bg-[#1CB8CE] text-xl font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#18A5BA] disabled:opacity-60 transition-all"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "LOGIN"}
        </Button>

        <p className="pt-1 text-center text-xs text-slate-500">
          Lupa password?{" "}
          <a href="#" className="font-semibold text-[#1CB8CE] hover:underline">
            Hubungi admin sekolah
          </a>
        </p>

        <div className="relative my-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200/80" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-2 font-bold text-slate-400">uji coba</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => (window.location.hash = "#/isi-yaumiyah")}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#1CB8CE]/30 bg-[#1CB8CE]/5 py-2.5 text-xs font-bold text-[#0E7A8A] hover:bg-[#1CB8CE]/15 transition-all"
        >
          <span>Isi Jurnal Yaumiyah Mandiri</span>
          <span>&rarr;</span>
        </button>
      </form>
    </div>
  );

  const footerContent = (
    <div className="space-y-0.5 text-center text-xs text-slate-400">
      <p>
        Powered by <span className="font-semibold text-slate-600">MuhsinApp</span>
      </p>
      <p className="text-[10px] text-slate-400">{APP_VERSION}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white md:grid md:grid-cols-2">
      {/* Desktop Left Side */}
      <div className="hidden flex-col items-center justify-center bg-[#EBF7FC] md:flex">
        {headerContent}
      </div>

      {/* Mobile Layout & Desktop Right Side */}
      <div className="flex min-h-screen flex-col items-center justify-between bg-white px-6 py-16 md:py-12">
        {/* Mobile Top Header (hidden on Desktop) */}
        <div className="w-full md:hidden my-auto flex flex-col items-center">
          {headerContent}
        </div>

        {/* Form Card (Centered on Desktop and Mobile) */}
        <div className="my-auto flex w-full flex-col items-center">
          {loginCard}
          <PWAInstallLoginBanner />
        </div>

        {/* Footer */}
        <div className="w-full pt-4">{footerContent}</div>
      </div>
    </div>
  );
}
