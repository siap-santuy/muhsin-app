import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium capitalize text-[#0C2B50]"
        >
          Email / No. HP
        </label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="Masukkan email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-lg pl-10"
          />
          <img
            src="/brand/person_icon.svg"
            alt=""
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium capitalize text-[#0C2B50]"
        >
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-lg pl-10 pr-10"
          />
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#22B8CF]" />
          <button
            type="button"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={!canSubmit}
        className="h-12 w-full rounded-lg bg-[#22B8CF] text-base font-semibold text-white shadow hover:bg-[#1aa8bc] disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "LOGIN"}
      </Button>

      <p className="text-center text-sm text-[#22B8CF]">
        Lupa password? Hubungi admin sekolah
      </p>
    </form>
  );

  return (
    <div className="min-h-screen bg-white md:grid md:grid-cols-2">
      <div className="hidden items-center justify-center bg-[#E6F7FD] md:flex">
        <div className="max-w-md space-y-6 p-8 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white shadow">
            <img
              src="/brand/TTQ_Logo.png"
              alt="Logo TTQ"
              className="h-20 w-20 rounded-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#0C2B50]">Muhsin</h1>
            <p className="mt-3 leading-relaxed text-[#0C2B50]/70">
              Manajemen TTQ &amp; Ibadah Yaumiyah Siswa bekerja sama dengan
              sekolah untuk memantau hafalan dan ibadah harian putra putri
              Kita.
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-10">
        <div className="w-full max-w-md space-y-6 sm:mt-0 mt-6">
          <div className="flex flex-col items-center gap-4 sm:items-start md:hidden">
            <img
              src="/brand/TTQ_Logo.png"
              alt="Logo TTQ"
              className="h-16 w-16 rounded-full object-cover"
            />
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-[#0C2B50]">Muhsin</h1>
              <p className="text-sm text-[#0C2B50]/60 sm:sr-only">
                Manajemen TTQ &amp; Ibadah Yaumiyah Siswa
              </p>
            </div>
          </div>

          <div className="md:hidden">
            <h2 className="text-xl font-semibold text-[#0C2B50]">Login</h2>
            <p className="text-sm text-[#0C2B50]/60">
              Masuk untuk melanjutkan
            </p>
          </div>

          <div className="rounded-2xl bg-white md:border md:border-gray-100 md:p-8 md:shadow-sm">
            <div className="mb-6 hidden md:block">
              <h2 className="text-2xl font-bold text-[#0C2B50]">Login</h2>
              <p className="text-sm text-[#0C2B50]/60">
                Masuk untuk melanjutkan ke dashboard
              </p>
            </div>
            {form}
          </div>

          <p className="text-center text-xs text-[#0C2B50]/50">
            Powered by MuhsinApp v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}