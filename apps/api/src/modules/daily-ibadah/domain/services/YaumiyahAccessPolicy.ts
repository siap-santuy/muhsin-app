/**
 * Policy aturan buka akses izin susulan yaumiyah berdasarkan peran:
 * - Guru (teacher): Hanya boleh membuka/menyetujui untuk tanggal di bulan kalender berjalan (current month).
 * - Koordinator TTQ (koordinator_ttq): Kendali penuh (bebas tanggal kapan pun di masa lampau).
 */
export function assertYaumiyahGrantDatePolicy(
  role: string,
  startDate: string,
  endDate: string,
  referenceDate?: Date
): void {
  if (startDate > endDate) {
    throw new Error("Tanggal awal tidak boleh lebih besar dari tanggal akhir");
  }

  const now = referenceDate ?? new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  if (endDate > todayStr) {
    throw new Error("Tidak dapat membuka akses susulan untuk tanggal masa depan");
  }

  if (role === "teacher") {
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

    const startMonthPrefix = startDate.slice(0, 7);

    if (startMonthPrefix < currentMonthPrefix) {
      throw new Error(
        "Guru hanya dapat membuka akses yaumiyah untuk tanggal di bulan berjalan. Untuk bulan lalu, silakan ajukan melalui Koordinator TTQ."
      );
    }
  }
}
