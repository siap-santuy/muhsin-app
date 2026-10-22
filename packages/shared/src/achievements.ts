import { SURAH_LIST } from "./surah";

export type BadgeCategory = "surah" | "juz" | "sabiq";
export type BadgeStatus = "unlocked" | "in_progress" | "locked";

export interface StudentBadge {
  id: string;
  category: BadgeCategory;
  code: string;
  title: string;
  subtitle: string;
  icon: string;
  status: BadgeStatus;
  progressPercent: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  unlockedAt?: string | null;
  colorScheme: "emerald" | "amber" | "blue" | "purple";
}

export interface StudentAchievementsSummary {
  totalUnlocked: number;
  totalBadges: number;
  overallPercent: number;
  surahStats: { unlocked: number; total: number; totalAyatMemorized: number };
  juzStats: { unlocked: number; total: number };
  sabiqStats: { unlocked: number; total: number; currentJilid: number; currentPage: number };
  badges: StudentBadge[];
}

export interface JuzMeta {
  no: number;
  name: string;
  surahs: number[];
}

export const JUZ_LIST: JuzMeta[] = [
  { no: 1, name: "Juz 1 (Alif Lam Mim)", surahs: [1, 2] },
  { no: 2, name: "Juz 2 (Sayaqulu)", surahs: [2] },
  { no: 3, name: "Juz 3 (Tilkar Rusul)", surahs: [2, 3] },
  { no: 4, name: "Juz 4 (Lan Tanalu)", surahs: [3, 4] },
  { no: 5, name: "Juz 5 (Wal Muhshanat)", surahs: [4] },
  { no: 6, name: "Juz 6 (La Yuhibbullah)", surahs: [4, 5] },
  { no: 7, name: "Juz 7 (Wa Iza Sami'u)", surahs: [5, 6] },
  { no: 8, name: "Juz 8 (Wa Lau Annana)", surahs: [6, 7] },
  { no: 9, name: "Juz 9 (Qalal Mala'u)", surahs: [7, 8] },
  { no: 10, name: "Juz 10 (Wa'lamu)", surahs: [8, 9] },
  { no: 11, name: "Juz 11 (Ya'taziruna)", surahs: [9, 10, 11] },
  { no: 12, name: "Juz 12 (Wa Ma Min Dabbah)", surahs: [11, 12] },
  { no: 13, name: "Juz 13 (Wa Ma Ubarri'u)", surahs: [12, 13, 14] },
  { no: 14, name: "Juz 14 (Rubama)", surahs: [15, 16] },
  { no: 15, name: "Juz 15 (Subhanallazi)", surahs: [17, 18] },
  { no: 16, name: "Juz 16 (Qala Alam)", surahs: [18, 19, 20] },
  { no: 17, name: "Juz 17 (Iqtaraba)", surahs: [21, 22] },
  { no: 18, name: "Juz 18 (Qad Aflaha)", surahs: [23, 24, 25] },
  { no: 19, name: "Juz 19 (Wa Qalal Lazina)", surahs: [25, 26, 27] },
  { no: 20, name: "Juz 20 (Amman Khalaqa)", surahs: [27, 28, 29] },
  { no: 21, name: "Juz 21 (Utlu Ma Uhiya)", surahs: [29, 30, 31, 32, 33] },
  { no: 22, name: "Juz 22 (Wa Man Yaqnut)", surahs: [33, 34, 35, 36] },
  { no: 23, name: "Juz 23 (Wa Ma Liya)", surahs: [36, 37, 38, 39] },
  { no: 24, name: "Juz 24 (Faman Azlamu)", surahs: [39, 40, 41] },
  { no: 25, name: "Juz 25 (Ilaihi Yuraddu)", surahs: [41, 42, 43, 44, 45] },
  { no: 26, name: "Juz 26 (Ha' Mim)", surahs: [46, 47, 48, 49, 50, 51] },
  { no: 27, name: "Juz 27 (Qala Fama Khatbukum)", surahs: [51, 52, 53, 54, 55, 56, 57] },
  { no: 28, name: "Juz 28 (Qad Sami'allah)", surahs: [58, 59, 60, 61, 62, 63, 64, 65, 66] },
  { no: 29, name: "Juz 29 (Tabarakallazi)", surahs: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77] },
  {
    no: 30,
    name: "Juz 30 (Juz 'Amma)",
    surahs: Array.from({ length: 37 }, (_, i) => 78 + i),
  },
];

export interface SabiqJilidMeta {
  jilid: number;
  title: string;
  subtitle: string;
  totalPages: number;
}

export const SABIQ_JILID_LIST: SabiqJilidMeta[] = [
  { jilid: 1, title: "Tuntas Jilid 1", subtitle: "Makhraj & Harokat Dasar", totalPages: 40 },
  { jilid: 2, title: "Tuntas Jilid 2", subtitle: "Mad & Sambung Huruf", totalPages: 40 },
  { jilid: 3, title: "Tuntas Jilid 3", subtitle: "Kasroh, Dhommah & Sukun", totalPages: 40 },
  { jilid: 4, title: "Tuntas Jilid 4", subtitle: "Tanwin, Tasydid & Dengung", totalPages: 40 },
  { jilid: 5, title: "Tuntas Jilid 5", subtitle: "Waqaf, Qolqolah & Ikhfa'", totalPages: 40 },
  { jilid: 6, title: "Tuntas Jilid 6", subtitle: "Mad Lazim & Kaidah Tajwid", totalPages: 40 },
  { jilid: 7, title: "Tuntas Al-Qur'an / Ghorib", subtitle: "Bacaan Khusus & Kelancaran", totalPages: 40 },
];

export interface SetoranEntryForAchievement {
  subcatCode?: string | null;
  categoryCode?: string | null;
  referenceStart?: Record<string, any> | null;
  referenceEnd?: Record<string, any> | null;
  date: string;
}

export interface MunaqosahAchievementRecord {
  juzKe: number;
  earnedAt: string | Date;
}

/**
 * Menghitung koleksi badge pencapaian (Surah, Juz, Sabiq) dari riwayat setoran siswa.
 * Logika murni tanpa query DB (memenuhi Clean Architecture).
 */
export function calculateStudentAchievements(
  setoranList: SetoranEntryForAchievement[],
  munaqosahList: MunaqosahAchievementRecord[] = []
): StudentAchievementsSummary {
  // 1. Map ayat terhafal per surah: Map<surahNumber, Set<ayatNumber>>
  const surahAyatMap = new Map<number, Set<number>>();
  // Map tanggal penyelesaian per surah: Map<surahNumber, string>
  const surahCompletedDateMap = new Map<number, string>();

  // Inisialisasi map
  for (let sNo = 1; sNo <= 114; sNo++) {
    surahAyatMap.set(sNo, new Set<number>());
  }

  // Tracking Sabiq: Map<jilid, highestPage>
  const sabiqJilidPageMap = new Map<number, number>();
  let highestSabiqJilid = 0;
  let highestSabiqPage = 0;
  const sabiqCompletedDateMap = new Map<number, string>();

  // Urutkan setoran dari terlama ke terbaru agar tanggal unlock akurat
  const sortedSetoran = [...setoranList].sort((a, b) => a.date.localeCompare(b.date));

  for (const s of sortedSetoran) {
    const subCode = (s.subcatCode || "").toUpperCase();
    const catCode = (s.categoryCode || "").toUpperCase();
    const isZiyadah = subCode.includes("ZIYADAH") || (!subCode && !!s.referenceStart?.surah);
    const isSabiq = subCode.includes("SABIQ") || catCode.includes("TAHSIN") || !!s.referenceStart?.jilid;

    // A. Proses Ziyadah (Hafalan Surah)
    if (isZiyadah && s.referenceStart) {
      const refStart = s.referenceStart;
      const refEnd = s.referenceEnd || s.referenceStart;

      const sStart = Number(refStart.surahNumber || 0);
      const sEnd = Number(refEnd.surahNumber || sStart);
      const aStart = Number(refStart.ayat || 1);
      const aEnd = Number(refEnd.ayat || aStart);

      if (sStart > 0 && sEnd > 0) {
        if (sStart === sEnd) {
          // Surah sama
          const setObj = surahAyatMap.get(sStart);
          if (setObj) {
            const minAyat = Math.min(aStart, aEnd);
            const maxAyat = Math.max(aStart, aEnd);
            for (let a = minAyat; a <= maxAyat; a++) {
              setObj.add(a);
            }
            const info = SURAH_LIST[sStart - 1];
            if (info && setObj.size >= info.totalAyat && !surahCompletedDateMap.has(sStart)) {
              surahCompletedDateMap.set(sStart, s.date);
            }
          }
        } else {
          // Lintas surah (maju maupun mundur)
          const step = sStart <= sEnd ? 1 : -1;
          for (let no = sStart; step > 0 ? no <= sEnd : no >= sEnd; no += step) {
            const info = SURAH_LIST[no - 1];
            if (!info) continue;
            const setObj = surahAyatMap.get(no);
            if (!setObj) continue;

            const fromAyat = no === sStart ? aStart : 1;
            const toAyat = no === sEnd ? aEnd : info.totalAyat;
            const startA = Math.min(fromAyat, toAyat);
            const endA = Math.max(fromAyat, toAyat);

            for (let a = startA; a <= endA; a++) {
              setObj.add(a);
            }

            if (setObj.size >= info.totalAyat && !surahCompletedDateMap.has(no)) {
              surahCompletedDateMap.set(no, s.date);
            }
          }
        }
      }
    }

    // B. Proses Sabiq (Jilid & Halaman)
    if (isSabiq && s.referenceStart) {
      const refStart = s.referenceStart;
      const refEnd = s.referenceEnd || s.referenceStart;

      const jStart = Number(refStart.jilid || 0);
      const jEnd = Number(refEnd.jilid || jStart);
      const hStart = Number(refStart.halaman || 1);
      const hEnd = Number(refEnd.halaman || hStart);

      const maxJilid = Math.max(jStart, jEnd);
      const maxPage = Math.max(hStart, hEnd);

      if (maxJilid > 0) {
        if (maxJilid > highestSabiqJilid) {
          highestSabiqJilid = maxJilid;
          highestSabiqPage = maxPage;
        } else if (maxJilid === highestSabiqJilid && maxPage > highestSabiqPage) {
          highestSabiqPage = maxPage;
        }

        const prevPage = sabiqJilidPageMap.get(maxJilid) || 0;
        if (maxPage > prevPage) {
          sabiqJilidPageMap.set(maxJilid, maxPage);
        }

        // Jika halaman mencapai 40, tandai tuntas
        if (maxPage >= 40 && !sabiqCompletedDateMap.has(maxJilid)) {
          sabiqCompletedDateMap.set(maxJilid, s.date);
        }
      }
    }
  }

  // 2. Susun Badges
  const badges: StudentBadge[] = [];

  // A. Badges Surah (1 s/d 114)
  let totalSurahUnlocked = 0;
  let totalAyatMemorized = 0;

  for (const surah of SURAH_LIST) {
    const memorizedAyatSet = surahAyatMap.get(surah.no) || new Set<number>();
    const count = memorizedAyatSet.size;
    totalAyatMemorized += count;
    const isCompleted = count >= surah.totalAyat;
    const percent = Math.min(100, Math.round((count / surah.totalAyat) * 100));

    if (isCompleted) {
      totalSurahUnlocked++;
    }

    const status: BadgeStatus = isCompleted ? "unlocked" : count > 0 ? "in_progress" : "locked";

    badges.push({
      id: `surah-${surah.no}`,
      category: "surah",
      code: String(surah.no),
      title: `Penghafal ${surah.nameLatin}`,
      subtitle: `${count}/${surah.totalAyat} Ayat • Juz ${surah.juz}`,
      icon: "book-open",
      status,
      progressPercent: percent,
      currentValue: count,
      targetValue: surah.totalAyat,
      unit: "Ayat",
      unlockedAt: isCompleted ? surahCompletedDateMap.get(surah.no) || sortedSetoran[sortedSetoran.length - 1]?.date || null : null,
      colorScheme: "emerald",
    });
  }

  // B. Badges Juz (1 s/d 30)
  let totalJuzUnlocked = 0;
  const munaqosahJuzMap = new Map<number, string>();
  for (const m of munaqosahList) {
    const dStr = m.earnedAt instanceof Date ? m.earnedAt.toISOString().slice(0, 10) : String(m.earnedAt).slice(0, 10);
    munaqosahJuzMap.set(m.juzKe, dStr);
  }

  for (const juz of JUZ_LIST) {
    const totalSurahs = juz.surahs.length;
    let completedSurahs = 0;

    for (const sNo of juz.surahs) {
      const sInfo = SURAH_LIST[sNo - 1];
      const count = surahAyatMap.get(sNo)?.size || 0;
      if (sInfo && count >= sInfo.totalAyat) {
        completedSurahs++;
      }
    }

    const munaqosahDate = munaqosahJuzMap.get(juz.no);
    const isAllSurahCompleted = totalSurahs > 0 && completedSurahs >= totalSurahs;
    const isCompleted = isAllSurahCompleted || !!munaqosahDate;
    const percent = isCompleted ? 100 : Math.min(100, Math.round((completedSurahs / totalSurahs) * 100));

    if (isCompleted) {
      totalJuzUnlocked++;
    }

    const status: BadgeStatus = isCompleted ? "unlocked" : completedSurahs > 0 ? "in_progress" : "locked";

    badges.push({
      id: `juz-${juz.no}`,
      category: "juz",
      code: String(juz.no),
      title: `Hafizh ${juz.name}`,
      subtitle: isCompleted
        ? `${totalSurahs} Surah Tuntas • Hafizh Mutqin`
        : `${completedSurahs}/${totalSurahs} Surah Tuntas`,
      icon: "crown",
      status,
      progressPercent: percent,
      currentValue: completedSurahs,
      targetValue: totalSurahs,
      unit: "Surah",
      unlockedAt: isCompleted ? munaqosahDate || sortedSetoran[sortedSetoran.length - 1]?.date || null : null,
      colorScheme: "amber",
    });
  }

  // C. Badges Sabiq (Jilid 1 s/d 7)
  let totalSabiqUnlocked = 0;
  for (const sMeta of SABIQ_JILID_LIST) {
    const curPage = sabiqJilidPageMap.get(sMeta.jilid) || 0;
    // Jilid dianggap selesai jika siswa sudah mencapai halaman >= 40 atau siswa sudah menyetor jilid di atasnya
    const isCompleted = highestSabiqJilid > sMeta.jilid || curPage >= sMeta.totalPages;
    const effectivePage = isCompleted ? sMeta.totalPages : curPage;
    const percent = Math.min(100, Math.round((effectivePage / sMeta.totalPages) * 100));

    if (isCompleted) {
      totalSabiqUnlocked++;
    }

    const status: BadgeStatus = isCompleted
      ? "unlocked"
      : curPage > 0
      ? "in_progress"
      : highestSabiqJilid >= sMeta.jilid
      ? "in_progress"
      : "locked";

    badges.push({
      id: `sabiq-${sMeta.jilid}`,
      category: "sabiq",
      code: String(sMeta.jilid),
      title: sMeta.title,
      subtitle: `${sMeta.subtitle} • Hal ${effectivePage}/${sMeta.totalPages}`,
      icon: "layers",
      status,
      progressPercent: percent,
      currentValue: effectivePage,
      targetValue: sMeta.totalPages,
      unit: "Halaman",
      unlockedAt: isCompleted ? sabiqCompletedDateMap.get(sMeta.jilid) || sortedSetoran[sortedSetoran.length - 1]?.date || null : null,
      colorScheme: "blue",
    });
  }

  const totalBadges = badges.length;
  const totalUnlocked = totalSurahUnlocked + totalJuzUnlocked + totalSabiqUnlocked;
  const overallPercent = totalBadges > 0 ? Math.min(100, Math.round((totalUnlocked / totalBadges) * 100)) : 0;

  return {
    totalUnlocked,
    totalBadges,
    overallPercent,
    surahStats: {
      unlocked: totalSurahUnlocked,
      total: 114,
      totalAyatMemorized,
    },
    juzStats: {
      unlocked: totalJuzUnlocked,
      total: 30,
    },
    sabiqStats: {
      unlocked: totalSabiqUnlocked,
      total: SABIQ_JILID_LIST.length,
      currentJilid: highestSabiqJilid,
      currentPage: highestSabiqPage,
    },
    badges,
  };
}
