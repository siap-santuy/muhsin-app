import { create } from "zustand";
import { persist } from "zustand/middleware";
import { API_BASE } from "@/lib/api";

export interface SchoolTenant {
  id: string;
  slug: string;
  name: string;
  jenjang: string;
  address?: string | null;
  logoUrl?: string | null;
}

interface TenantState {
  school: SchoolTenant | null;
  isLoading: boolean;
  error: string | null;
  resolveTenant: (overrideSlug?: string) => Promise<SchoolTenant | null>;
  setSchool: (school: SchoolTenant) => void;
}

// In-flight singleton promise to avoid race condition / duplicate simultaneous requests
let inFlightResolvePromise: Promise<SchoolTenant | null> | null = null;
let lastResolvedSlug: string | null = null;

export function detectSchoolSlugFromUrl(): string {
  if (typeof window === "undefined") return "alfitrah";

  // 1. Check query param: ?school=slug or ?tenant=slug
  const searchParams = new URLSearchParams(window.location.search);
  const paramSlug = searchParams.get("school") || searchParams.get("tenant");
  if (paramSlug) return paramSlug.trim().toLowerCase();

  // 2. Check hash param: #/...?school=slug
  if (window.location.hash.includes("?")) {
    const hashQuery = new URLSearchParams(window.location.hash.split("?")[1]);
    const hashSlug = hashQuery.get("school") || hashQuery.get("tenant");
    if (hashSlug) return hashSlug.trim().toLowerCase();
  }

  // 3. Check hostname: e.g. alfitrah.muhsin.id -> alfitrah
  const hostname = window.location.hostname.toLowerCase();
  const parts = hostname.split(".");
  const RESERVED_SUBDOMAINS = ["www", "stage", "staging", "api", "api-staging"];
  if (parts.length > 2 && !RESERVED_SUBDOMAINS.includes(parts[0])) {
    return parts[0];
  }

  // 4. Fallback to env or "alfitrah"
  return (import.meta.env.VITE_DEFAULT_SCHOOL_SLUG || "alfitrah").toLowerCase();
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      school: null,
      isLoading: false,
      error: null,
      setSchool: (school) => set({ school }),
      resolveTenant: async (overrideSlug?: string) => {
        const slug = overrideSlug || detectSchoolSlugFromUrl();

        // If already resolved and matches current slug, return immediately
        const current = get().school;
        if (current && current.slug === slug && lastResolvedSlug === slug) {
          return current;
        }

        // Return ongoing in-flight promise if identical slug is being resolved
        if (inFlightResolvePromise && lastResolvedSlug === slug) {
          return inFlightResolvePromise;
        }

        lastResolvedSlug = slug;
        set({ isLoading: true, error: null });

        inFlightResolvePromise = (async () => {
          try {
            const res = await fetch(`${API_BASE}/schools/public/${slug}`);
            if (!res.ok) {
              throw new Error("Sekolah tidak ditemukan");
            }
            const json = await res.json();
            const schoolData: SchoolTenant = json.data;
            set({ school: schoolData, isLoading: false, error: null });
            return schoolData;
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Gagal memuat profil sekolah";
            set({ error: msg, isLoading: false });
            return get().school;
          } finally {
            inFlightResolvePromise = null;
          }
        })();

        return inFlightResolvePromise;
      },
    }),
    { name: "muhsin-tenant" }
  )
);

export async function ensureActiveSchoolId(overrideSlug?: string): Promise<string> {
  const store = useTenantStore.getState();
  const targetSlug = overrideSlug || detectSchoolSlugFromUrl();

  if (store.school?.id && store.school.slug === targetSlug) {
    return store.school.id;
  }

  const resolved = await store.resolveTenant(targetSlug);
  if (resolved?.id) {
    return resolved.id;
  }

  return getActiveSchoolId();
}

export function getActiveSchoolId(): string {
  const store = useTenantStore.getState();
  if (store.school?.id) {
    return store.school.id;
  }
  // Try reading from persisted localStorage
  try {
    const raw = localStorage.getItem("muhsin-tenant");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.state?.school?.id) {
        return parsed.state.school.id;
      }
    }
  } catch {
    // Ignore
  }
  return import.meta.env.VITE_SCHOOL_ID || "school-default-id";
}
