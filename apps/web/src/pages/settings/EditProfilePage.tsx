import { useState, useEffect } from "react";
import { Camera, Check, Loader2, Save } from "lucide-react";
import { SettingsPageShell } from "@/components/settings/SettingsPageShell";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { toast } from "@/store/toastStore";
import { api } from "@/lib/api";

export function EditProfilePage() {
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadProfile() {
      try {
        const profile = await api.getMyProfile();
        if (isMounted && profile) {
          if (profile.name) setName(profile.name);
          if (profile.email) setEmail(profile.email);
          if (profile.phone) setPhone(profile.phone);
        }
      } catch {
        // Silent fallback to local auth store values
      }
    }
    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const updated = await api.updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      });

      // Update auth store with new user data
      useAuthStore.setState((state) => ({
        ...state,
        user: state.user
          ? { ...state.user, name: updated.name, email: updated.email }
          : null,
      }));

      toast.success("Profile berhasil diperbarui!");
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        window.location.hash = "#/profile";
      }, 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui profile";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SettingsPageShell title="Ubah Profile" subtitle="Perbarui informasi akun Anda">
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"
              alt="Avatar"
              className="h-24 w-24 rounded-full border-4 border-brand-cyan object-cover shadow-sm"
            />
            <button
              type="button"
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-brand-cyan text-white shadow-md hover:bg-brand-cyan-dark"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-[11px] text-brand-text-muted">
            Klik kamera untuk mengunggah foto baru
          </p>
        </div>

        {/* Error notification */}
        {error ? (
          <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
            {error}
          </div>
        ) : null}

        {/* Input Fields */}
        <div className="space-y-3 rounded-2xl border border-brand-line bg-white p-4 shadow-sm">
          <div>
            <label className="text-xs font-bold text-brand-navy">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-brand-line bg-gray-50 p-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-brand-navy">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-brand-line bg-gray-50 p-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-brand-navy">No. WhatsApp / Telepon</label>
            <input
              type="tel"
              value={phone}
              placeholder="08xxxxxxxxxx"
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-brand-line bg-gray-50 p-2.5 text-xs font-semibold text-brand-navy outline-none focus:border-brand-cyan focus:bg-white"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full rounded-xl bg-brand-cyan font-bold uppercase tracking-wider text-white shadow-sm hover:bg-brand-cyan-dark disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Profile Diperbarui!
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
            </>
          )}
        </Button>
      </form>
    </SettingsPageShell>
  );
}
