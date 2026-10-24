const APP_CONFIG = {
  namaSekolah: "MA Al-Riyadhul Jannah Maja",
  tahunAjaran: "2026/2027",
  jamMasukBatas: "07:00",
  jamPulangMulai: "14:30",
  dhuhaMulai: "06:30",
  dhuhaSelesai: "09:30",
  dzuhurMulai: "12:00",
  dzuhurSelesai: "13:00"
};

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxmgzCaK6H6vBpUuMqOnk5lVqt8g3tE1OKWTdNxUIlSiZVo9gmcpu0VT9WdzJD7MfiOJQ/exec";

const ADMIN_PIN = "rijan123";

const DEFAULT_SISWA = [
  { nis: "2425001", nama: "Ahmad Fauzan", kelas: "XI IPA", jk: "L" },
  { nis: "2425002", nama: "Siti Nur Aisyah", kelas: "XI IPA", jk: "P" },
  { nis: "2425003", nama: "Muhammad Rizki", kelas: "XI IPS", jk: "L" },
  { nis: "2425004", nama: "Dewi Lestari", kelas: "XI Agama", jk: "P" },
  { nis: "2425005", nama: "Fajar Nugraha", kelas: "XI IPS", jk: "L" }
];

const JUZ30_LIST = [
  "An-Naba","An-Nazi'at","Abasa","At-Takwir","Al-Infitar","Al-Muthaffifin",
  "Al-Insyiqaq","Al-Buruj","Ath-Thariq","Al-A'la","Al-Ghasyiyah","Al-Fajr",
  "Al-Balad","Asy-Syams","Al-Lail","Adh-Dhuha","Al-Insyirah","At-Tin",
  "Al-'Alaq","Al-Qadr","Al-Bayyinah","Az-Zalzalah","Al-'Adiyat","Al-Qari'ah",
  "At-Takatsur","Al-'Ashr","Al-Humazah","Al-Fil","Quraisy","Al-Ma'un",
  "Al-Kautsar","Al-Kafirun","An-Nasr","Al-Masad","Al-Ikhlas","Al-Falaq","An-Nas"
];

const SURAT_PILIHAN_LIST = [
  "Yasin","Al-Waqiah","Ar-Rahman","Al-Mulk","As-Sajdah","Al-Kahfi",
  "Al-Baqarah (ayat pilihan)","Ali Imran (ayat pilihan)","Ad-Dukhan","Al-Insan"
];

// Hapus/ganti GURU_guru_LIST lama (jika ada) dengan DEFAULT_GURU berikut:
const DEFAULT_GURU = [
  { gid:"G001", username:"admin",  password:"rijan123",  nama:"Kepala Sekolah / Admin", jabatan:"Administrator" },
  { gid:"G002", username:"guru1", password:"guru123",  nama:"Nani Roswinah, S.Pd", jabatan:"Guru" },
  { gid:"G003", username:"guru2", password:"guru123",  nama:"Yuyu Yuhartika, S.Pd", jabatan:"Guru" },
  { gid:"G004", username:"guru2", password:"guru123",  nama:"Zahrotul Uyun, S.Pd", jabatan:"Guru" },
  { gid:"G005", username:"guru2", password:"guru123",  nama:"Dzulkarnaen, S.Hi", jabatan:"Guru" },
  { gid:"G006", username:"guru2", password:"guru123",  nama:"Sumirah, S.Pd.I", jabatan:"Guru" },
  { gid:"G007", username:"guru2", password:"guru123",  nama:"Andri Kurniawan, S.Pd, M.Pd", jabatan:"Guru" },
  { gid:"G008", username:"guru2", password:"guru123",  nama:"Umayah, S.Pd", jabatan:"Guru" },
  { gid:"G009", username:"guru2", password:"guru123",  nama:"Rusmiati, S.Pd", jabatan:"Guru" },
  { gid:"G010", username:"guru2", password:"guru123",  nama:"Firman Alamsyah, S.Pd", jabatan:"Guru" },
  { gid:"G011", username:"guru2", password:"guru123",  nama:"Muhamad Yosep, S.Pd", jabatan:"Guru" },
  { gid:"G012", username:"guru2", password:"guru123",  nama:"Siti Allubabah", jabatan:"Guru" },
  { gid:"G013", username:"guru2", password:"guru123",  nama:"Miftahul Lukman, S.Pd", jabatan:"Guru" },
  { gid:"G014", username:"guru2", password:"guru123",  nama:"Tutin Sulistino, S.Pd", jabatan:"Guru" },
  { gid:"G015", username:"guru2", password:"guru123",  nama:"Moh. Ipan, S.Kom", jabatan:"Guru" },
  { gid:"G016", username:"guru2", password:"guru123",  nama:"Depan Maulana Pamungkas, S.Pd", jabatan:"Guru" },
  { gid:"G017", username:"guru3", password:"guru123",  nama:"Ikbal Nugraha, S.Pd", jabatan:"Guru" }
];