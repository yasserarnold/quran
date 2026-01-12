export const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
};

export const normalizeArabic = (text = "") =>
  text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/ـ/g, "")
    .replace(/[^\u0600-\u06FF\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const toArabicDigits = (value) =>
  String(value).replace(/[0-9]/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);

export const formatNumber = (value) => toArabicDigits(value);

export const buildNumberMap = (ayahs = []) => {
  const map = new Map();
  ayahs.forEach((ayah) => map.set(ayah.numberInSurah, ayah));
  return map;
};

const ARABIC_VARIANTS = {
  ا: "اٱأإآ",
  ة: "ةه",
  ه: "هة",
  ى: "ىا",
};

export const buildLooseArabicPattern = (phrase) => {
  let pattern = "^";
  for (const char of phrase) {
    if (/\s/.test(char)) {
      pattern += "\\s*";
      continue;
    }
    const variants = ARABIC_VARIANTS[char] || char;
    pattern +=
      `[${variants}]` + "[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640]*\\s*";
  }
  return new RegExp(pattern, "u");
};

export const BASMALA_PATTERN = buildLooseArabicPattern(
  "بسم الله الرحمن الرحيم"
);

export const stripBasmala = (text) => text.replace(BASMALA_PATTERN, "");
