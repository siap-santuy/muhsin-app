import { useState } from "react";
import { Check, Eye, EyeOff, Lock } from "lucide-react";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import { Button } from "@/components/ui/button";

export function ChangePasswordPage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      window.location.hash = "#/profile";
    }, 1200);
  }

  return (
    <SettingsPageShell title="Ubah Password" subtitle="Perbarui keamanan akun Anda">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="space-y-3 rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
          {/* Old Password */}
          <div>
            <label className="text-xs font-bold text-brand-navy">Password Saat Ini</label>
            <div className="relative mt-1">
              <input
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                placeholder="Masukkan password saat ini"
                className="w-full rounded-xl border border-brand-line bg-gray-50 p-2.5 pr-10 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-navy"
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="text-xs font-bold text-brand-navy">Password Baru</label>
            <div className="relative mt-1">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Minimal 8 karakter"
                className="w-full rounded-xl border border-brand-line bg-gray-50 p-2.5 pr-10 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-navy"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-bold text-brand-navy">Konfirmasi Password Baru</label>
            <div className="relative mt-1">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Ketik ulang password baru"
                className="w-full rounded-xl border border-brand-line bg-gray-50 p-2.5 pr-10 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-navy"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-200">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          className="h-11 w-full rounded-xl bg-brand-cyan font-bold uppercase tracking-wider text-white shadow-sm hover:bg-brand-cyan-dark"
        >
          {saved ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Password Diubah!
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" /> Simpan Password Baru
            </>
          )}
        </Button>
      </form>
    </SettingsPageShell>
  );
}
