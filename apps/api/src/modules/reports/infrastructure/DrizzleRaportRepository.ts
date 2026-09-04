import type { Db } from "../../../db/client";
import {
  users,
  classes,
  studentClassEnrollment,
  studentTeacherMapping,
  setoranEntries,
  dailyIbadah,
  evaluasiBulanan,
} from "../../../db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { IRaportRepository } from "../domain/repositories/IRaportRepository";
import type { MonthlyRaportData, SemesterRaportData } from "../domain/entities/Raport";

function scoreToGrade(score: number): { grade: string; arabic: string } {
  if (score >= 90) return { grade: "A", arabic: "ممتاز" };
  if (score >= 80) return { grade: "B", arabic: "جيد جدا" };
  if (score >= 70) return { grade: "C", arabic: "جيد" };
  if (score > 0) return { grade: "D", arabic: "مقبول" };
  return { grade: "-", arabic: "-" };
}

export class DrizzleRaportRepository implements IRaportRepository {
  constructor(private readonly db: Db) {}

  async getMonthlyRaport(
    studentId: string,
    month: string,
    schoolId: string
  ): Promise<MonthlyRaportData> {
    // 1. Get student profile & mapping
    const studentRows = await this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        className: classes.name,
      })
      .from(users)
      .leftJoin(
        studentClassEnrollment,
        and(
          eq(studentClassEnrollment.studentId, users.id),
          eq(studentClassEnrollment.schoolId, schoolId)
        )
      )
      .leftJoin(classes, eq(classes.id, studentClassEnrollment.classId))
      .where(and(eq(users.id, studentId), eq(users.schoolId, schoolId)))
      .limit(1);

    const studentInfo = studentRows[0] ?? {
      id: studentId,
      name: "Siswa",
      email: "",
      className: "-",
    };

    // Get teacher name
    const teacherRows = await this.db
      .select({ teacherName: users.name })
      .from(studentTeacherMapping)
      .innerJoin(users, eq(users.id, studentTeacherMapping.teacherId))
      .where(
        and(
          eq(studentTeacherMapping.studentId, studentId),
          eq(studentTeacherMapping.schoolId, schoolId)
        )
      )
      .limit(1);

    const pembimbingName = teacherRows[0]?.teacherName ?? "Ustadz Pembimbing";

    // 2. Aggregate setoran monthly scores
    const setoranRows = await this.db
      .select()
      .from(setoranEntries)
      .where(
        and(
          eq(setoranEntries.studentId, studentId),
          eq(setoranEntries.schoolId, schoolId),
          sql`to_char(${setoranEntries.date}, 'YYYY-MM') = ${month}`
        )
      );

    let tahfidzTotal = 0;
    let tahfidzCount = 0;
    let tahsinTotal = 0;
    let tahsinCount = 0;
    let lastZiyadahCapaian = "-";
    let lastTahsinCapaian = "-";

    let ziyadahSum = 0, ziyadahCnt = 0;
    let murojaahSum = 0, murojaahCnt = 0;
    let makhrojSum = 0, makhrojCnt = 0;
    let madSum = 0, madCnt = 0;
    let ghunnahSum = 0, ghunnahCnt = 0;
    let kelancaranSum = 0, kelancaranCnt = 0;

    for (const s of setoranRows) {
      const scores = s.scores as Record<string, number>;
      const vals = Object.values(scores).filter((v) => typeof v === "number");
      if (vals.length > 0) {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        if (s.referenceStart && (s.referenceStart as any).surah) {
          tahfidzTotal += avg;
          tahfidzCount++;
          const ref = s.referenceStart as any;
          const refEnd = s.referenceEnd as any;
          lastZiyadahCapaian = `${ref.surah}:${ref.ayat ?? 1} - ${refEnd?.ayat ?? ref.ayat ?? 1}`;
          if (scores.ziyadah) { ziyadahSum += scores.ziyadah; ziyadahCnt++; }
          if (scores.murojaah) { murojaahSum += scores.murojaah; murojaahCnt++; }
        } else {
          tahsinTotal += avg;
          tahsinCount++;
          const ref = s.referenceStart as any;
          lastTahsinCapaian = ref?.jilid ? `${ref.jilid} Hal ${ref.halaman ?? 1}` : (ref?.materi ?? "Tahsin");
          if (scores.makhroj) { makhrojSum += scores.makhroj; makhrojCnt++; }
          if (scores.mad) { madSum += scores.mad; madCnt++; }
          if (scores.ghunnah) { ghunnahSum += scores.ghunnah; ghunnahCnt++; }
          if (scores.kelancaran) { kelancaranSum += scores.kelancaran; kelancaranCnt++; }
        }
      }
    }

    const tahfidzAvg = tahfidzCount > 0 ? Math.round(tahfidzTotal / tahfidzCount) : 0;
    const tahsinAvg = tahsinCount > 0 ? Math.round(tahsinTotal / tahsinCount) : 0;

    const tahfidzGrade = scoreToGrade(tahfidzAvg);
    const tahsinGrade = scoreToGrade(tahsinAvg);

    // 3. Aggregate Mutabaah from daily_ibadah
    const ibadahRows = await this.db
      .select()
      .from(dailyIbadah)
      .where(
        and(
          eq(dailyIbadah.studentId, studentId),
          eq(dailyIbadah.schoolId, schoolId),
          sql`to_char(${dailyIbadah.date}, 'YYYY-MM') = ${month}`
        )
      );

    let tilawahCount = 0;
    let fardhuCount = 0;
    let rawatibCount = 0;
    let tahajudCount = 0;
    let dhuhaCount = 0;
    let shaumCount = 0;

    for (const ib of ibadahRows) {
      if (ib.tilawah && (ib.tilawah as any).surahStart) tilawahCount++;
      if (ib.sholatFardhu) {
        const fVals = Object.values(ib.sholatFardhu as Record<string, string>);
        fardhuCount += fVals.filter((v) => v === "BA" || v === "MA" || v === "H").length;
      }
      if (Array.isArray(ib.sholatRawatib)) rawatibCount += ib.sholatRawatib.length;
      if (ib.tahajud) tahajudCount++;
      if (ib.dhuha) dhuhaCount++;
      if (ib.puasaSunnah) shaumCount++;
    }

    // 4. Evaluasi guru
    const evalRows = await this.db
      .select({ catatan: evaluasiBulanan.catatan })
      .from(evaluasiBulanan)
      .where(
        and(
          eq(evaluasiBulanan.studentId, studentId),
          eq(evaluasiBulanan.schoolId, schoolId),
          eq(evaluasiBulanan.bulan, month)
        )
      )
      .limit(1);

    const evaluasiText = evalRows[0]?.catatan ?? null;

    const yearStr = month.split("-")[0] ?? "2026";

    return {
      student: {
        id: studentInfo.id,
        name: studentInfo.name,
        email: studentInfo.email,
        className: studentInfo.className ?? "-",
        pembimbingName,
      },
      period: {
        month,
        year: yearStr,
      },
      nilaiTtq: {
        tahfidz: {
          grade: tahfidzGrade.grade,
          score: `${tahfidzAvg}/100`,
          arabicPredicate: tahfidzGrade.arabic,
          capaian: lastZiyadahCapaian,
        },
        tahsin: {
          grade: tahsinGrade.grade,
          score: `${tahsinAvg}/100`,
          arabicPredicate: tahsinGrade.arabic,
          capaian: lastTahsinCapaian,
        },
      },
      detailTtq: {
        ziyadah: ziyadahCnt > 0 ? Math.round((ziyadahSum / ziyadahCnt) * 10) / 10 : 0,
        murojaah: murojaahCnt > 0 ? Math.round((murojaahSum / murojaahCnt) * 10) / 10 : 0,
        makhroj: makhrojCnt > 0 ? Math.round((makhrojSum / makhrojCnt) * 10) / 10 : 0,
        mad: madCnt > 0 ? Math.round((madSum / madCnt) * 10) / 10 : 0,
        ghunnah: ghunnahCnt > 0 ? Math.round((ghunnahSum / ghunnahCnt) * 10) / 10 : 0,
        kelancaran: kelancaranCnt > 0 ? Math.round((kelancaranSum / kelancaranCnt) * 10) / 10 : 0,
      },
      absensi: {
        kehadiranRatio: `${setoranRows.length}/30`,
        tidakSetoranCount: Math.max(0, 30 - setoranRows.length),
        sakitCount: 0,
        izinCount: 0,
        alpaCount: 0,
      },
      mutabaah: [
        { label: "Tilawah", ratio: `${tilawahCount}/30`, grade: tilawahCount >= 20 ? "A" : tilawahCount > 0 ? "B" : "-", color: "text-emerald-500" },
        { label: "Shalat Fardhu", ratio: `${fardhuCount}/150`, grade: fardhuCount >= 120 ? "A" : fardhuCount > 0 ? "B" : "-", color: "text-brand-cyan" },
        { label: "Shalat Sunnah", ratio: `${rawatibCount}/240`, grade: rawatibCount >= 60 ? "B" : rawatibCount > 0 ? "C" : "-", color: "text-amber-500" },
        { label: "Tahajud", ratio: `${tahajudCount}/30`, grade: tahajudCount >= 10 ? "B" : tahajudCount > 0 ? "C" : "-", color: "text-amber-500" },
        { label: "Dhuha", ratio: `${dhuhaCount}/30`, grade: dhuhaCount >= 10 ? "B" : dhuhaCount > 0 ? "C" : "-", color: "text-amber-500" },
        { label: "Shaum", ratio: `${shaumCount}/8`, grade: shaumCount >= 4 ? "A" : shaumCount > 0 ? "B" : "-", color: "text-emerald-500" },
      ],
      evaluasi: evaluasiText,
    };
  }

  async getSemesterRaport(
    studentId: string,
    semester: string,
    tahunAjaran: string,
    schoolId: string
  ): Promise<SemesterRaportData> {
    const isSem1 = semester.toLowerCase().includes("ganjil") || semester === "1";
    const [startYearStr, endYearStr] = tahunAjaran.split("/").map((s) => s.trim());
    const startYr = Number(startYearStr) || 2026;
    const endYr = Number(endYearStr) || startYr + 1;

    const months: string[] = isSem1
      ? [`${startYr}-07`, `${startYr}-08`, `${startYr}-09`, `${startYr}-10`, `${startYr}-11`, `${startYr}-12`]
      : [`${endYr}-01`, `${endYr}-02`, `${endYr}-03`, `${endYr}-04`, `${endYr}-05`, `${endYr}-06`];

    const monthlyResults = await Promise.all(
      months.map((m) => this.getMonthlyRaport(studentId, m, schoolId))
    );

    const studentInfo = monthlyResults[0].student;
    
    let sumTahfidz = 0, cntTahfidz = 0;
    let sumTahsin = 0, cntTahsin = 0;
    let sumTilawah = 0, sumFardhu = 0, sumRawatib = 0, sumTahajud = 0, sumDhuha = 0, sumShaum = 0;
    let sumZiyadah = 0, sumMurojaah = 0, sumMakhroj = 0, sumMad = 0, sumGhunnah = 0, sumKelancaran = 0;
    let setoranCountTotal = 0;

    for (const res of monthlyResults) {
      const tfScore = Number(res.nilaiTtq.tahfidz.score.replace("/100", ""));
      if (tfScore > 0) { sumTahfidz += tfScore; cntTahfidz++; }
      const tsScore = Number(res.nilaiTtq.tahsin.score.replace("/100", ""));
      if (tsScore > 0) { sumTahsin += tsScore; cntTahsin++; }

      const tRatio = Number(res.mutabaah[0]?.ratio.split("/")[0]) || 0; sumTilawah += tRatio;
      const fRatio = Number(res.mutabaah[1]?.ratio.split("/")[0]) || 0; sumFardhu += fRatio;
      const rRatio = Number(res.mutabaah[2]?.ratio.split("/")[0]) || 0; sumRawatib += rRatio;
      const thRatio = Number(res.mutabaah[3]?.ratio.split("/")[0]) || 0; sumTahajud += thRatio;
      const dhRatio = Number(res.mutabaah[4]?.ratio.split("/")[0]) || 0; sumDhuha += dhRatio;
      const shRatio = Number(res.mutabaah[5]?.ratio.split("/")[0]) || 0; sumShaum += shRatio;

      if (res.detailTtq.ziyadah > 0) sumZiyadah += res.detailTtq.ziyadah;
      if (res.detailTtq.murojaah > 0) sumMurojaah += res.detailTtq.murojaah;
      if (res.detailTtq.makhroj > 0) sumMakhroj += res.detailTtq.makhroj;
      if (res.detailTtq.mad > 0) sumMad += res.detailTtq.mad;
      if (res.detailTtq.ghunnah > 0) sumGhunnah += res.detailTtq.ghunnah;
      if (res.detailTtq.kelancaran > 0) sumKelancaran += res.detailTtq.kelancaran;

      setoranCountTotal += Number(res.absensi.kehadiranRatio.split("/")[0]) || 0;
    }

    const avgTahfidz = cntTahfidz > 0 ? Math.round(sumTahfidz / cntTahfidz) : 0;
    const avgTahsin = cntTahsin > 0 ? Math.round(sumTahsin / cntTahsin) : 0;
    const validScores = [avgTahfidz, avgTahsin].filter((s) => s > 0);
    const nilaiAkhir = validScores.length > 0 ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10 : 0;
    const grade = scoreToGrade(nilaiAkhir);

    const tahfidzGrade = scoreToGrade(avgTahfidz);
    const tahsinGrade = scoreToGrade(avgTahsin);

    const lastMonthlyWithEval = [...monthlyResults].reverse().find((m) => m.evaluasi !== null);

    return {
      student: studentInfo,
      period: {
        semester: semester || (isSem1 ? "Ganjil" : "Genap"),
        tahunAjaran: tahunAjaran || "2026/2027",
      },
      nilaiAkhir,
      gradeAkhir: grade.grade,
      arabicPredicate: grade.arabic,
      nilaiTtq: {
        tahfidz: {
          grade: tahfidzGrade.grade,
          score: `${avgTahfidz}/100`,
          arabicPredicate: tahfidzGrade.arabic,
          capaian: monthlyResults.map(m => m.nilaiTtq.tahfidz.capaian).filter(c => c !== "-").pop() || "-",
        },
        tahsin: {
          grade: tahsinGrade.grade,
          score: `${avgTahsin}/100`,
          arabicPredicate: tahsinGrade.arabic,
          capaian: monthlyResults.map(m => m.nilaiTtq.tahsin.capaian).filter(c => c !== "-").pop() || "-",
        },
      },
      detailTtq: {
        ziyadah: cntTahfidz > 0 ? Math.round((sumZiyadah / cntTahfidz) * 10) / 10 : 0,
        murojaah: cntTahfidz > 0 ? Math.round((sumMurojaah / cntTahfidz) * 10) / 10 : 0,
        makhroj: cntTahsin > 0 ? Math.round((sumMakhroj / cntTahsin) * 10) / 10 : 0,
        mad: cntTahsin > 0 ? Math.round((sumMad / cntTahsin) * 10) / 10 : 0,
        ghunnah: cntTahsin > 0 ? Math.round((sumGhunnah / cntTahsin) * 10) / 10 : 0,
        kelancaran: cntTahsin > 0 ? Math.round((sumKelancaran / cntTahsin) * 10) / 10 : 0,
      },
      absensi: {
        kehadiranRatio: `${setoranCountTotal}/180`,
        tidakSetoranCount: Math.max(0, 180 - setoranCountTotal),
        sakitCount: 0,
        izinCount: 0,
        alpaCount: 0,
      },
      kategoriList: [
        {
          name: "Tahfidz Al-Qur'an",
          grade: tahfidzGrade.grade,
          score: avgTahfidz,
          arabicPredicate: tahfidzGrade.arabic,
        },
        {
          name: "Tahsin Al-Qur'an",
          grade: tahsinGrade.grade,
          score: avgTahsin,
          arabicPredicate: tahsinGrade.arabic,
        },
      ],
      mutabaah: [
        { label: "Tilawah", ratio: `${sumTilawah}/180`, grade: sumTilawah >= 120 ? "A" : sumTilawah > 0 ? "B" : "-", color: "text-emerald-500" },
        { label: "Shalat Fardhu", ratio: `${sumFardhu}/900`, grade: sumFardhu >= 720 ? "A" : sumFardhu > 0 ? "B" : "-", color: "text-brand-cyan" },
        { label: "Shalat Sunnah", ratio: `${sumRawatib}/1440`, grade: sumRawatib >= 360 ? "B" : sumRawatib > 0 ? "C" : "-", color: "text-amber-500" },
        { label: "Tahajud", ratio: `${sumTahajud}/180`, grade: sumTahajud >= 60 ? "B" : sumTahajud > 0 ? "C" : "-", color: "text-amber-500" },
        { label: "Dhuha", ratio: `${sumDhuha}/180`, grade: sumDhuha >= 60 ? "B" : sumDhuha > 0 ? "C" : "-", color: "text-amber-500" },
        { label: "Shaum", ratio: `${sumShaum}/48`, grade: sumShaum >= 24 ? "A" : sumShaum > 0 ? "B" : "-", color: "text-emerald-500" },
      ],
      evaluasi: lastMonthlyWithEval?.evaluasi ?? null,
    };
  }
}
