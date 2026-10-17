/**
 * Mengembalikan string tanggal format YYYY-MM-DD sesuai zona waktu lokal pengguna (bukan UTC).
 * Menghindari bug pergeseran tanggal ke kemarin saat diakses pada jam 00:00 - 06:59 WIB.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
