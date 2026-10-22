import { describe, expect, it } from "vitest";
import {
  estimateQuranPages,
  validateReferenceRange,
  validateSurahAyatRange,
} from "@muhsin/shared";

describe("validateSurahAyatRange", () => {
  it("menerima rentang urut maju (78:1 s.d. 79:5)", () => {
    const result = validateSurahAyatRange(78, 1, 79, 5);
    expect(result.valid).toBe(true);
  });

  it("menerima rentang urut mundur Juz Amma (79:1 s.d. 78:5)", () => {
    const result = validateSurahAyatRange(79, 1, 78, 5);
    expect(result.valid).toBe(true);
  });

  it("menerima rentang mundur dari An-Nas ke Al-Ikhlas (114:1 s.d. 112:4)", () => {
    const result = validateSurahAyatRange(114, 1, 112, 4);
    expect(result.valid).toBe(true);
  });

  it("menolak ayat mundur dalam surah yang sama (114:5 s.d. 114:1)", () => {
    const result = validateSurahAyatRange(114, 5, 114, 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Ayat akhir tidak boleh lebih kecil dari ayat awal");
  });

  it("menolak ayat di luar batas surah", () => {
    const result = validateSurahAyatRange(114, 1, 114, 10);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Ayat akhir harus antara 1 dan 6");
  });
});

describe("validateReferenceRange", () => {
  it("menerima referenceStart & referenceEnd dengan urutan surah mundur", () => {
    const result = validateReferenceRange(
      { surah: "An-Nazi'at", surahNumber: 79, ayat: 1 },
      { surah: "An-Naba'", surahNumber: 78, ayat: 5 }
    );
    expect(result.valid).toBe(true);
  });
});

describe("estimateQuranPages urutan maju vs mundur", () => {
  it("menghitung halaman untuk urutan maju (78 ke 79)", () => {
    const forwardPages = estimateQuranPages(78, 1, 79, 46);
    expect(forwardPages).toBeGreaterThan(0);
  });

  it("menghitung halaman untuk urutan mundur (79 ke 78)", () => {
    const backwardPages = estimateQuranPages(79, 1, 78, 40);
    expect(backwardPages).toBeGreaterThan(0);
  });
});
