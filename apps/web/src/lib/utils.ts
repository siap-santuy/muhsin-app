import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDisplayName(
  name: string,
  gender: string,
  role: "teacher" | "parent" | "koordinator"
): string {
  const cleanName = name.replace(/^(ustadzah|ustadz|ummi|abi)\s+/i, "").trim();
  const g = gender.trim().toLowerCase();
  if (role === "parent") {
    if (g === "akhwat") return `Ummi ${cleanName}`;
    if (g === "ikhwan") return `Abi ${cleanName}`;
  }
  // teacher & koordinator
  if (g === "akhwat") return `Ustadzah ${cleanName}`;
  if (g === "ikhwan") return `Ustadz ${cleanName}`;
  return cleanName;
}
