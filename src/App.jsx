import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE = import.meta.env.DEV
  ? "/api"
  : "https://api.alquran.cloud/v1";

const TABS = [
  { id: "mushaf", label: "المصحف" },
  { id: "tafsir", label: "التفسير" },
  { id: "search", label: "بحث شامل" },
  { id: "sajda", label: "سجدات التلاوة" },
];

const TAFSIR_EDITIONS = [
  { id: "ar.muyassar", label: "التفسير الميسر" },
  { id: "ar.jalalayn", label: "تفسير الجلالين" },
  { id: "ar.qurtubi", label: "تفسير القرطبي" },
  { id: "ar.waseet", label: "التفسير الوسيط" },
  { id: "ar.baghawi", label: "تفسير البغوي" },
  { id: "ar.miqbas", label: "تنوير المقباس" },
];
const MUSHAF_EDITIONS = [
  { id: "quran-uthmani", label: "الرسم العثماني" },
  { id: "quran-simple", label: "الرسم المبسّط" },
  { id: "quran-uthmani-min", label: "عثماني (مختصر)" },
  { id: "quran-simple-clean", label: "مبسّط (منقّى)" },
];
const CDN_BASE = "https://cdn.islamic.network/quran/audio/128";
const EXTRA_RECITERS = [
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
];

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json();
};

const normalizeArabic = (text = "") =>
  text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/ـ/g, "")
    .replace(/[^\u0600-\u06FF\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const toArabicDigits = (value) =>
  String(value).replace(/[0-9]/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);

const formatNumber = (value) => toArabicDigits(value);

const buildNumberMap = (ayahs = []) => {
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

const buildLooseArabicPattern = (phrase) => {
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

const BASMALA_PATTERN = buildLooseArabicPattern("بسم الله الرحمن الرحيم");

const stripBasmala = (text) => text.replace(BASMALA_PATTERN, "");

function Select({ label, value, options, onChange, getLabel }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption
    ? getLabel(selectedOption)
    : "اختر من القائمة";

  return (
    <div className="select" ref={containerRef}>
      <span className="select__label">{label}</span>
      <button
        className="select__button"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="select__value">{selectedLabel}</span>
        <span className="select__chevron">▾</span>
      </button>
      {open && (
        <div className="select__menu" role="listbox">
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              className="select__option"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              role="option"
              aria-selected={option.value === value}
            >
              {getLabel(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [surahs, setSurahs] = useState([]);
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [fromAyah, setFromAyah] = useState(1);
  const [toAyah, setToAyah] = useState(7);
  const [surahData, setSurahData] = useState(null);
  const [tafsirData, setTafsirData] = useState(null);
  const [selectedTafsir, setSelectedTafsir] = useState(TAFSIR_EDITIONS[0].id);
  const [reciters, setReciters] = useState([]);
  const [selectedReciter, setSelectedReciter] = useState("");
  const [activeTab, setActiveTab] = useState("mushaf");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMode, setSearchMode] = useState("word");
  const [error, setError] = useState("");
  const [audioQueue, setAudioQueue] = useState([]);
  const [audioIndex, setAudioIndex] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mushafFontSize, setMushafFontSize] = useState(28);
  const [selectedMushafEdition, setSelectedMushafEdition] = useState(
    MUSHAF_EDITIONS[0].id
  );
  const [mushafViewMode, setMushafViewMode] = useState("cards");
  const [sajdaList, setSajdaList] = useState([]);
  const [sajdaLoading, setSajdaLoading] = useState(false);
  const [sajdaError, setSajdaError] = useState("");
  const [quranCorpus, setQuranCorpus] = useState(null);

  const audioRef = useRef(null);

  useEffect(() => {
    const loadBasics = async () => {
      try {
        const [surahRes, recitersRes] = await Promise.all([
          fetchJson(`${API_BASE}/surah`),
          fetchJson(`${API_BASE}/edition?format=audio&type=versebyverse`),
        ]);
        const arabicReciters = (recitersRes.data || [])
          .filter((reciter) => reciter.language === "ar")
          .map((reciter) => ({ ...reciter, source: "cloud" }));
        const combinedReciters = [
          ...arabicReciters,
          ...EXTRA_RECITERS,
        ].filter(
          (reciter, index, list) =>
            list.findIndex((item) => item.identifier === reciter.identifier) ===
            index
        );
        const sortedReciters = [...combinedReciters].sort((a, b) => {
          const nameA = a.name || a.englishName || "";
          const nameB = b.name || b.englishName || "";
          return nameA.localeCompare(nameB, "ar", { sensitivity: "base" });
        });
        setSurahs(surahRes.data || []);
        setReciters(sortedReciters);
        if (sortedReciters.length) {
          setSelectedReciter(sortedReciters[0].identifier);
        }
      } catch (err) {
        setError("تعذر تحميل البيانات الأساسية. تأكد من الاتصال بالإنترنت.");
      }
    };
    loadBasics();
  }, []);

  useEffect(() => {
    if (!selectedSurah) return;
    const loadSurah = async () => {
      try {
        setError("");
        const [arabicRes, tafsirRes] = await Promise.all([
          fetchJson(
            `${API_BASE}/surah/${selectedSurah}/${selectedMushafEdition}`
          ),
          fetchJson(`${API_BASE}/surah/${selectedSurah}/${selectedTafsir}`),
        ]);
        setSurahData(arabicRes.data);
        setTafsirData(tafsirRes.data);
      } catch (err) {
        setError("تعذر تحميل السورة المطلوبة.");
      }
    };
    loadSurah();
  }, [selectedSurah, selectedTafsir, selectedMushafEdition]);

  useEffect(() => {
    if (!surahData?.numberOfAyahs) return;
    setFromAyah(1);
    setToAyah(surahData.numberOfAyahs);
  }, [surahData?.numberOfAyahs]);

  useEffect(() => {
    const loadSajda = async () => {
      try {
        setSajdaLoading(true);
        setSajdaError("");
        const response = await fetchJson(`${API_BASE}/sajda/quran-uthmani`);
        setSajdaList(response.data?.ayahs || []);
      } catch (err) {
        setSajdaError("تعذر تحميل قائمة السجدات.");
        setSajdaList([]);
      } finally {
        setSajdaLoading(false);
      }
    };
    loadSajda();
  }, []);

  const maxAyah = surahData?.numberOfAyahs || 1;
  const rangeStart = Math.min(Math.max(fromAyah, 1), maxAyah);
  const rangeEnd = Math.min(Math.max(toAyah, rangeStart), maxAyah);

  const arabicMap = useMemo(
    () => buildNumberMap(surahData?.ayahs),
    [surahData]
  );
  const tafsirMap = useMemo(
    () => buildNumberMap(tafsirData?.ayahs),
    [tafsirData]
  );

  const rangeNumbers = useMemo(() => {
    const nums = [];
    for (let i = rangeStart; i <= rangeEnd; i += 1) {
      nums.push(i);
    }
    return nums;
  }, [rangeStart, rangeEnd]);

  const rangeAyahs = useMemo(
    () => rangeNumbers.map((num) => arabicMap.get(num)).filter(Boolean),
    [rangeNumbers, arabicMap]
  );

  const surahMeta = useMemo(() => {
    const map = new Map();
    surahs.forEach((surah) => map.set(surah.number, surah));
    return map;
  }, [surahs]);

  const surahOptions = useMemo(
    () =>
      surahs.map((surah) => ({
        key: surah.number,
        value: surah.number,
        name: surah.name,
        englishName: surah.englishName,
        number: surah.number,
      })),
    [surahs]
  );

  const reciterOptions = useMemo(
    () =>
      reciters.map((reciter) => ({
        key: reciter.identifier,
        value: reciter.identifier,
        name: reciter.name,
        englishName: reciter.englishName,
      })),
    [reciters]
  );

  const tafsirOptions = useMemo(
    () =>
      TAFSIR_EDITIONS.map((edition) => ({
        key: edition.id,
        value: edition.id,
        name: edition.label,
      })),
    []
  );

  const mushafOptions = useMemo(
    () =>
      MUSHAF_EDITIONS.map((edition) => ({
        key: edition.id,
        value: edition.id,
        name: edition.label,
      })),
    []
  );

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setSearchLoading(true);
      let corpus = quranCorpus;
      if (!corpus) {
        const response = await fetchJson(`${API_BASE}/quran/quran-simple`);
        corpus = response.data;
        setQuranCorpus(corpus);
      }
      const query = normalizeArabic(searchQuery);
      const matches = [];
      corpus.surahs.forEach((surah) => {
        const meta = surahMeta.get(surah.number);
        surah.ayahs.forEach((ayah) => {
          const normalizedText = normalizeArabic(ayah.text);
          const words = normalizedText.split(" ").filter(Boolean);
          const isMatch =
            searchMode === "word"
              ? words.includes(query)
              : normalizedText.includes(query);
          if (isMatch) {
            matches.push({
              surahNumber: surah.number,
              surahName: meta?.name || surah.name,
              numberInSurah: ayah.numberInSurah,
              numberOfAyahs: surah.numberOfAyahs,
              text: ayah.text,
            });
          }
        });
      });
      setSearchResults(matches);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLoadAudio = async (startAyah) => {
    if (!selectedReciter || !rangeNumbers.length) return;
    setAudioLoading(true);
    try {
      const reciter = selectedReciterData;
      if (reciter?.source === "cdn") {
        let corpus = quranCorpus;
        if (!corpus) {
          const response = await fetchJson(`${API_BASE}/quran/quran-simple`);
          corpus = response.data;
          setQuranCorpus(corpus);
        }
        const surah = corpus.surahs.find(
          (item) => item.number === selectedSurah
        );
        const audioItems = (surah?.ayahs || [])
          .filter(
            (ayah) =>
              ayah.numberInSurah >= rangeStart && ayah.numberInSurah <= rangeEnd
          )
          .map((ayah) => ({
            numberInSurah: ayah.numberInSurah,
            audio: `${CDN_BASE}/${reciter.identifier}/${ayah.number}.mp3`,
          }));
        setAudioQueue(audioItems);
        if (startAyah) {
          const startIndex = audioItems.findIndex(
            (item) => item.numberInSurah === startAyah
          );
          setAudioIndex(startIndex === -1 ? 0 : startIndex);
        } else {
          setAudioIndex(0);
        }
      } else {
        const response = await fetchJson(
          `${API_BASE}/surah/${selectedSurah}/${selectedReciter}`
        );
        const ayahs = response.data?.ayahs || [];
        const audioItems = ayahs
          .filter(
            (ayah) =>
              ayah.numberInSurah >= rangeStart && ayah.numberInSurah <= rangeEnd
          )
          .map((ayah) => ({
            numberInSurah: ayah.numberInSurah,
            audio: ayah.audio,
          }));
        setAudioQueue(audioItems.filter((item) => item.audio));
        if (startAyah) {
          const startIndex = audioItems.findIndex(
            (item) => item.numberInSurah === startAyah
          );
          setAudioIndex(startIndex === -1 ? 0 : startIndex);
        } else {
          setAudioIndex(0);
        }
      }
    } catch (err) {
      setAudioQueue([]);
    } finally {
      setAudioLoading(false);
    }
  };

  useEffect(() => {
    if (!audioQueue.length || !audioRef.current) return;
    const current = audioQueue[audioIndex];
    if (current?.audio) {
      setPlaybackProgress(0);
      audioRef.current.src = current.audio;
      audioRef.current.play().catch(() => undefined);
    }
  }, [audioQueue, audioIndex]);

  const updateProgress = () => {
    if (!audioRef.current) return;
    const { currentTime, duration } = audioRef.current;
    if (!duration || Number.isNaN(duration)) {
      setPlaybackProgress(0);
      return;
    }
    setPlaybackProgress(Math.min(currentTime / duration, 1));
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 240);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => undefined);
    } else {
      audioRef.current.pause();
    }
  };

  const handleNextAudio = () => {
    setAudioIndex((prev) => Math.min(prev + 1, audioQueue.length - 1));
  };

  const handlePrevAudio = () => {
    setAudioIndex((prev) => Math.max(prev - 1, 0));
  };

  const selectedReciterData = useMemo(
    () => reciters.find((item) => item.identifier === selectedReciter),
    [reciters, selectedReciter]
  );
  const currentAudio = audioQueue[audioIndex];
  const activeAyahNumber = currentAudio?.numberInSurah;

  return (
    <div className="page">
      <header className="hero">
        <div className="hero__content">
          <span className="hero__badge">المصحف التفاعلي</span>
          <h1> القرآن الكريم</h1>
          <p>
            منصة عربية حديثة لقراءة القرأن والتدبر- تحديد نطاق الآيات، الاستماع
            للتلاوة، واستكشاف التفسير وشرح المعاني في تجربة واحدة.
          </p>
        </div>
        <div className="hero__panel">
          <div className="panel__title"> اختر السورة</div>
          <div className="panel__grid">
            <Select
              label="السورة"
              value={selectedSurah}
              options={surahOptions}
              onChange={(value) => setSelectedSurah(Number(value))}
              getLabel={(option) =>
                `${formatNumber(option.number)}. ${option.name} (${
                  option.englishName
                })`
              }
            />
            <label className="field">
              <span>من آية</span>
              <input
                type="number"
                min="1"
                max={maxAyah}
                value={fromAyah}
                onChange={(event) => setFromAyah(Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>إلى آية</span>
              <input
                type="number"
                min={fromAyah}
                max={maxAyah}
                value={toAyah}
                onChange={(event) => setToAyah(Number(event.target.value))}
              />
            </label>
            <div className="field field--meta">
              <span>عدد آيات السورة</span>
              <strong>{formatNumber(maxAyah)}</strong>
            </div>
          </div>
          {error && <div className="alert">{error}</div>}
        </div>
      </header>

      <section className="section">
        <div className="section__header">
          <h2>اختر المقرئ </h2>
          <p>اختر المقرئ ثم استمع إلى الآيات المحددة .</p>
        </div>
        <div className="audio">
          <Select
            label="المقرئ"
            value={selectedReciter}
            options={reciterOptions}
            onChange={setSelectedReciter}
            getLabel={(option) => `${option.name} (${option.englishName})`}
          />
          <button
            className="button"
            type="button"
            onClick={() => handleLoadAudio()}
            disabled={audioLoading}
          >
            {audioLoading ? "جارٍ تحميل التلاوة..." : "تحميل التلاوة"}
          </button>
          <div className="audio__player">
            <audio
              ref={audioRef}
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={updateProgress}
              onLoadedMetadata={updateProgress}
              onEnded={() => {
                setIsPlaying(false);
                setPlaybackProgress(0);
                if (audioIndex < audioQueue.length - 1) {
                  setAudioIndex(audioIndex + 1);
                }
              }}
            />
            <div className="audio__progress" aria-hidden="true">
              <div
                className="audio__progress-bar"
                style={{ width: `${Math.round(playbackProgress * 100)}%` }}
              />
            </div>
            <div className="audio__controls">
              <button
                className="button button--ghost"
                type="button"
                onClick={handlePrevAudio}
                disabled={audioIndex === 0}
              >
                السابق
              </button>
              <div className="audio__meta">
                <span>الآية الحالية</span>
                <strong>
                  {currentAudio
                    ? `${formatNumber(
                        currentAudio.numberInSurah
                      )} / ${formatNumber(maxAyah)}`
                    : "-"}
                </strong>
              </div>
              <button
                className="button button--ghost"
                type="button"
                onClick={handleNextAudio}
                disabled={audioIndex >= audioQueue.length - 1}
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      </section>

      <button
        className={`floating-play ${isPlaying ? "floating-play--active" : ""}`}
        type="button"
        onClick={togglePlayback}
        disabled={!currentAudio?.audio}
        aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
      >
        {isPlaying ? "إيقاف" : "تشغيل"}
      </button>

      <button
        className={`scroll-top ${showScrollTop ? "" : "scroll-top--hidden"}`}
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="العودة للأعلى"
      >
        ↑
      </button>

      <section className="section">
        <div className="section__header">
          <h2>محتوى المصحف والتفسير</h2>
          <p>
            تنقل بين المصحف، التفسير، وشرح المعاني، أو استخدم البحث الشامل
            للوصول السريع للآيات.
          </p>
        </div>
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab ${activeTab === tab.id ? "tab--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "mushaf" && (
          <div className="mushaf">
            <div className="mushaf__controls">
              <Select
                label="طبعة المصحف"
                value={selectedMushafEdition}
                options={mushafOptions}
                onChange={setSelectedMushafEdition}
                getLabel={(option) => option.name}
              />
              <Select
                label="طريقة العرض"
                value={mushafViewMode}
                options={[
                  { key: "cards", value: "cards", name: "بطاقات الآيات" },
                  { key: "flow", value: "flow", name: "نص متصل" },
                ]}
                onChange={setMushafViewMode}
                getLabel={(option) => option.name}
              />
              <label className="field">
                <span>حجم خط المصحف</span>
                <input
                  className="slider"
                  type="range"
                  min="20"
                  max="40"
                  value={mushafFontSize}
                  onChange={(event) =>
                    setMushafFontSize(Number(event.target.value))
                  }
                />
              </label>
              <span className="mushaf__value">
                {formatNumber(mushafFontSize)}
              </span>
            </div>
            {selectedSurah !== 9 && <div className="mushaf__basmala">﷽</div>}
            {mushafViewMode === "flow" ? (
              <div
                className="mushaf__flow"
                style={{ fontSize: `${mushafFontSize}px` }}
              >
                {rangeAyahs.map((ayah) => (
                  <span
                    key={ayah.number}
                    className={
                      activeAyahNumber === ayah.numberInSurah
                        ? "mushaf__flow-segment mushaf__flow-segment--active"
                        : "mushaf__flow-segment"
                    }
                    onClick={() => handleLoadAudio(ayah.numberInSurah)}
                  >
                    {selectedSurah !== 1 && ayah.numberInSurah === 1
                      ? stripBasmala(ayah.text)
                      : ayah.text}
                    <span className="mushaf__ayah-number">
                      {" "}
                      ﴿{formatNumber(ayah.numberInSurah)}﴾
                    </span>{" "}
                  </span>
                ))}
              </div>
            ) : (
              <div className="card-grid">
                {rangeAyahs.map((ayah) => (
                  <article
                    key={ayah.number}
                    className={
                      activeAyahNumber === ayah.numberInSurah
                        ? "ayah ayah--active"
                        : "ayah"
                    }
                    onClick={() => handleLoadAudio(ayah.numberInSurah)}
                  >
                    <div className="ayah__meta">
                      <span>آية</span>
                      <strong>
                        {formatNumber(ayah.numberInSurah)} /{" "}
                        {formatNumber(maxAyah)}
                      </strong>
                    </div>
                    <p
                      className="ayah__text"
                      style={{ fontSize: `${mushafFontSize}px` }}
                    >
                      {selectedSurah !== 1 && ayah.numberInSurah === 1
                        ? stripBasmala(ayah.text)
                        : ayah.text}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "tafsir" && (
          <div className="meaning">
            <div className="meaning__header">
              <Select
                label="مصدر التفسير"
                value={selectedTafsir}
                options={tafsirOptions}
                onChange={setSelectedTafsir}
                getLabel={(option) => option.name}
              />
            </div>
            <div className="card-grid">
              {rangeNumbers.map((num) => {
                const tafsir = tafsirMap.get(num);
                return (
                  <article key={num} className="ayah ayah--tafsir">
                    <div className="ayah__meta">
                      <span>آية</span>
                      <strong>
                        {formatNumber(num)} / {formatNumber(maxAyah)}
                      </strong>
                    </div>
                    <p>{tafsir?.text || "لا يوجد تفسير متاح"}</p>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "search" && (
          <div className="search">
            <form className="search__form" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="ابحث في كامل المصحف..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <div className="search__modes">
                <button
                  type="button"
                  className={`chip ${
                    searchMode === "word" ? "chip--active" : ""
                  }`}
                  onClick={() => setSearchMode("word")}
                >
                  مطابقة كلمة كاملة
                </button>
                <button
                  type="button"
                  className={`chip ${
                    searchMode === "partial" ? "chip--active" : ""
                  }`}
                  onClick={() => setSearchMode("partial")}
                >
                  جزء من الكلمة
                </button>
              </div>
              <button className="button" type="submit" disabled={searchLoading}>
                {searchLoading ? "جارٍ البحث..." : "بحث"}
              </button>
            </form>
            <div className="search__results">
              {searchResults.length === 0 && !searchLoading && (
                <p className="muted">لا توجد نتائج بعد. جرّب كلمة أخرى.</p>
              )}
              {searchResults.map((result) => (
                <article
                  key={`${result.surahNumber}:${result.numberInSurah}`}
                  className="ayah"
                >
                  <div className="ayah__meta">
                    <span>
                      الاية رقم {formatNumber(result.numberInSurah)} من{" "}
                      {result.surahName}
                    </span>
                  </div>
                  <p className="ayah__text">{result.text}</p>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === "sajda" && (
          <div className="sajda">
            {sajdaError && <div className="alert">{sajdaError}</div>}
            {sajdaLoading && <p className="muted">جارٍ تحميل السجدات...</p>}
            {!sajdaLoading && sajdaList.length === 0 && (
              <p className="muted">لا توجد سجدات حالياً.</p>
            )}
            <div className="card-grid">
              {sajdaList.map((item) => (
                <article
                  key={`${item.surah?.number}:${item.numberInSurah}`}
                  className="ayah"
                >
                  <div className="ayah__meta">
                    <span>{item.surah?.name || "-"}</span>
                    <strong>
                      {formatNumber(item.numberInSurah)} /{" "}
                      {formatNumber(item.surah?.numberOfAyahs || 0)}
                    </strong>
                  </div>
                  <p className="ayah__text">{item.text}</p>
                  <div className="sajda__type">
                    {item.sajda?.recommended
                      ? "سجدة مستحبة"
                      : "سجدة واجبة"}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="footer">
        <p>
          يعتمد التطبيق على بيانات من مصادر مختلفة لتوفير السور، التفسير،
          الترجمة والتلاوة.
        </p>
      </footer>
    </div>
  );
}
