
export const API_BASE = import.meta.env.DEV ? "/api" : "https://api.alquran.cloud/v1";

export const TABS = [
  { id: "mushaf", label: "المصحف" },
  { id: "tafsir", label: "التفسير" },
  { id: "search", label: "بحث شامل" },
  { id: "sajda", label: "سجدات التلاوة" },
];

export const TAFSIR_EDITIONS = [
  { id: "ar.muyassar", label: "التفسير الميسر" },
  { id: "ar.jalalayn", label: "تفسير الجلالين" },
  { id: "ar.qurtubi", label: "تفسير القرطبي" },
  { id: "ar.waseet", label: "التفسير الوسيط" },
  { id: "ar.baghawi", label: "تفسير البغوي" },
  { id: "ar.miqbas", label: "تنوير المقباس" },
];

export const MUSHAF_EDITIONS = [
  { id: "quran-simple", label: "الرسم المبسّط" },
  { id: "quran-uthmani", label: "الرسم العثماني" },
  { id: "quran-uthmani-min", label: "عثماني (مختصر)" },
  { id: "quran-simple-clean", label: "مبسّط (منقّى)" },
];

export const CDN_BASE = "https://cdn.islamic.network/quran/audio/128";
export const CDN_BASE1 = "https://cdn.islamic.network/quran/audio/64";

export const EXTRA_RECITERS = [
  {
    identifier: "ar.minshawi",
    name: "محمد صديق المنشاوي",
    englishName: "Al-Minshawi",
    source: "cdn",
  },
  {
    identifier: "ar.husary",
    name: "محمود خليل الحصري",
    englishName: "Al-Husary",
    source: "cdn",
  },
  {
    identifier: "ar.alafasy",
    name: "مشاري راشد العفاسي",
    englishName: "Al-Afasy",
    source: "cdn",
  },
  {
    identifier: "ar.shaatree",
    name: "أبو بكر الشاطري",
    englishName: "Al-Shaatree",
    source: "cdn",
  },
  {
    identifier: "ar.mahermuaiqly",
    name: "ماهر المعيقلي",
    englishName: "Al-Muaiqly",
    source: "cdn",
  },
  {
    identifier: "ar.hudhaify",
    name: "علي الحذيفي",
    englishName: "Al-Hudhaify",
    source: "cdn",
  },
  {
    identifier: "ar.muhammadayyoub",
    name: "محمد أيوب",
    englishName: "Muhammad Ayyoub",
    source: "cdn",
  },
  {
    identifier: "ar.minshawimujawwad",
    name: "محمد صديق المنشاوي (مجود)",
    englishName: "Al-Minshawi (Mujawwad)",
    source: "cdn",
    baseUrl: "https://cdn.islamic.network/quran/audio/64",
  },
  {
    identifier: "ar.abdulbasitmurattal-2",
    name: " عبدالباسط عبدالصمد  (مرتل)",
    englishName: "Abdulbasit Murattal",
    source: "cdn",
    baseUrl: "https://cdn.islamic.network/quran/audio/64",
  },
];

export const JUZ_START_MAPPING = [
  { juz: 1, surah: 1, ayah: 1 },
  { juz: 2, surah: 2, ayah: 142 },
  { juz: 3, surah: 2, ayah: 253 },
  { juz: 4, surah: 3, ayah: 93 },
  { juz: 5, surah: 4, ayah: 24 },
  { juz: 6, surah: 4, ayah: 148 },
  { juz: 7, surah: 5, ayah: 82 },
  { juz: 8, surah: 6, ayah: 111 },
  { juz: 9, surah: 7, ayah: 88 },
  { juz: 10, surah: 8, ayah: 41 },
  { juz: 11, surah: 9, ayah: 93 },
  { juz: 12, surah: 11, ayah: 6 },
  { juz: 13, surah: 12, ayah: 53 },
  { juz: 14, surah: 15, ayah: 1 },
  { juz: 15, surah: 17, ayah: 1 },
  { juz: 16, surah: 18, ayah: 75 },
  { juz: 17, surah: 21, ayah: 1 },
  { juz: 18, surah: 23, ayah: 1 },
  { juz: 19, surah: 25, ayah: 21 },
  { juz: 20, surah: 27, ayah: 56 },
  { juz: 21, surah: 29, ayah: 46 },
  { juz: 22, surah: 33, ayah: 31 },
  { juz: 23, surah: 36, ayah: 28 },
  { juz: 24, surah: 39, ayah: 32 },
  { juz: 25, surah: 41, ayah: 47 },
  { juz: 26, surah: 46, ayah: 1 },
  { juz: 27, surah: 51, ayah: 31 },
  { juz: 28, surah: 58, ayah: 1 },
  { juz: 29, surah: 67, ayah: 1 },
  { juz: 30, surah: 78, ayah: 1 },
];
