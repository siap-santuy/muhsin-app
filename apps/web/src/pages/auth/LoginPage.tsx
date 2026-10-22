import { useState, useEffect } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Send, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useTenantStore } from "@/store/tenantStore";
import { Button } from "@/components/ui/button";
import { PWAInstallLoginBanner } from "@/components/pwa/PWAInstallPrompt";
import { APP_VERSION } from "@/lib/appVersion";
import { api } from "@/lib/api";

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const school = useTenantStore((s) => s.school);
  const resolveTenant = useTenantStore((s) => s.resolveTenant);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // State Modal Request Reset Password
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

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

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetIdentifier.trim()) return;
    setResetLoading(true);
    setResetError(null);
    setResetSuccessMessage(null);
    try {
      const res = await api.requestPasswordReset(resetIdentifier.trim(), school?.id);
      setResetSuccessMessage(
        res?.message || "Permintaan reset password telah dikirim ke koordinator sekolah."
      );
    } catch (err: any) {
      setResetError(err.message || "Gagal mengirim permohonan reset password");
    } finally {
      setResetLoading(false);
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
          <button
            type="button"
            onClick={() => {
              setResetIdentifier(email || "");
              setResetSuccessMessage(null);
              setResetError(null);
              setIsResetModalOpen(true);
            }}
            className="font-semibold text-[#1CB8CE] hover:underline cursor-pointer"
          >
            Hubungi admin sekolah
          </button>
        </p>
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

      {/* Modal Request Reset Password */}
      {isResetModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsResetModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1CB8CE]/10 text-[#1CB8CE]">
                <Send className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0C2B50]">Permintaan Reset Password</h3>
                <p className="text-[11px] text-slate-500">Notifikasi langsung ke Koordinator TTQ</p>
              </div>
            </div>

            {resetSuccessMessage ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="text-xs font-bold text-emerald-900">Permintaan Terkirim!</h4>
                  <p className="mt-1 text-xs text-emerald-700 leading-relaxed">
                    {resetSuccessMessage}
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-full rounded-xl bg-[#1CB8CE] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#18A5BA]"
                >
                  Selesai
                </Button>
              </div>
            ) : (
              <form onSubmit={handleRequestReset} className="mt-4 space-y-3.5">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Masukkan <strong>email</strong> atau <strong>username</strong> akun Anda (Siswa, Orang Tua, atau Guru). Sistem akan mengirimkan notifikasi push ke Koordinator Sekolah untuk me-reset password akun ke default.
                </p>

                <div className="space-y-1">
                  <label htmlFor="reset-identifier" className="text-xs font-semibold text-[#0C2B50]">
                    Username atau Email
                  </label>
                  <input
                    id="reset-identifier"
                    type="text"
                    required
                    placeholder="Contoh: ahmad / ahmad@sekolah.sch.id"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-[#F8FAFC] px-3.5 text-xs text-[#0C2B50] placeholder:text-slate-400 focus:border-[#1CB8CE] focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {resetError && (
                  <p className="rounded-xl bg-red-50 p-2.5 text-xs text-red-600">
                    {resetError}
                  </p>
                )}

                <div className="pt-1 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsResetModalOpen(false)}
                    className="flex-1 rounded-xl border-slate-200 text-xs font-bold text-slate-600"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={resetLoading || !resetIdentifier.trim()}
                    className="flex-1 rounded-xl bg-[#1CB8CE] text-xs font-bold text-white shadow-sm hover:bg-[#18A5BA] disabled:opacity-60"
                  >
                    {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kirim Permintaan"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
