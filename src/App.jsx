
import React, { useEffect, useMemo, useRef, useState } from "react";
import Hero from "./components/Hero";
import AudioSection from "./components/AudioSection";
import MushafView from "./components/MushafView";
import TafsirView from "./components/TafsirView";
import SearchView from "./components/SearchView";
import SajdaView from "./components/SajdaView";
import ListeningView from "./components/ListeningView";
import RecitationView from "./components/RecitationView";
import {
  API_BASE,
  TABS,
  TAFSIR_EDITIONS,
  MUSHAF_EDITIONS,
  CDN_BASE,
  EXTRA_RECITERS,
  JUZ_START_MAPPING,
} from "./constants";
import {
  fetchJson,
  normalizeArabic,
  formatNumber,
  buildNumberMap,
} from "./utils";

export default function App() {
  const [appMode, setAppMode] = useState("memorization"); // memorization | listening
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
  const [selectedJuz, setSelectedJuz] = useState(null);

  const audioRef = useRef(null);
  const pendingAyahRef = useRef(null);

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
        const combinedReciters = [...arabicReciters, ...EXTRA_RECITERS].filter(
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
    if (pendingAyahRef.current) {
      setFromAyah(pendingAyahRef.current);
      setToAyah(surahData.numberOfAyahs);
    } else {
      setFromAyah(1);
      setToAyah(surahData.numberOfAyahs);
    }
    pendingAyahRef.current = null;
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

  // Sync mode with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash; // #...
      if (hash.startsWith("#listening")) {
        setAppMode("listening");
      } else if (hash.startsWith("#recitation")) {
        setAppMode("recitation");
      } else {
        setAppMode("memorization");
      }
    };

    // Initial check
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const switchMode = (mode) => {
    if (mode === "listening") {
      window.location.hash = "listening";
      setAppMode("listening");
    } else if (mode === "recitation") {
      window.location.hash = "recitation";
      setAppMode("recitation");
    } else {
      window.location.hash = "";
      setAppMode("memorization");
    }
  };

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
        englishName: edition.englishName,
      })),
    []
  );

  const mushafOptions = useMemo(
    () =>
      MUSHAF_EDITIONS.map((edition) => ({
        key: edition.id,
        value: edition.id,
        name: edition.label,
        englishName: edition.englishName,
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

  const handleJuzChange = (juzNumber) => {
    const juzData = JUZ_START_MAPPING.find((j) => j.juz === Number(juzNumber));
    if (juzData) {
      pendingAyahRef.current = juzData.ayah;
      setSelectedSurah(juzData.surah);
      setSelectedJuz(Number(juzNumber));
    }
  };

  const handleSurahChange = (surahNumber) => {
    setSelectedSurah(surahNumber);
    setSelectedJuz(null);
  };

  const selectedReciterData = useMemo(
    () => reciters.find((item) => item.identifier === selectedReciter),
    [reciters, selectedReciter]
  );

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
            audio: `${reciter.baseUrl || CDN_BASE}/${reciter.identifier}/${ayah.number}.mp3`,
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
    if (!selectedReciter || !rangeNumbers.length) return;
    handleLoadAudio();
  }, [selectedReciter]);

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

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setPlaybackProgress(0);
    if (audioIndex < audioQueue.length - 1) {
      setAudioIndex(audioIndex + 1);
    }
  };

  const currentAudio = audioQueue[audioIndex];
  const activeAyahNumber = currentAudio?.numberInSurah;
  const revelationTypeLabel = useMemo(() => {
    const type = surahMeta.get(selectedSurah)?.revelationType;
    if (type === "Meccan") return "مكية";
    if (type === "Medinan") return "مدنية";
    return "—";
  }, [surahMeta, selectedSurah]);

  return (
    <div className="page">
      <div className="mode-switcher">
        <button 
          type="button" 
          className={`mode-btn ${appMode === "memorization" ? "active" : ""}`}
          onClick={() => switchMode("memorization")}
        >
          تحفيظ
        </button>
        <button 
          type="button" 
          className={`mode-btn ${appMode === "recitation" ? "active" : ""}`}
          onClick={() => switchMode("recitation")}
        >
          تسميع
        </button>
        <button 
          type="button" 
          className={`mode-btn ${appMode === "listening" ? "active" : ""}`}
          onClick={() => switchMode("listening")}
        >
          استماع
        </button>
      </div>

      {(appMode === "memorization" || appMode === "recitation") && (
        <Hero
          surahOptions={surahOptions}
          selectedSurah={selectedSurah}
          setSelectedSurah={handleSurahChange}
          fromAyah={fromAyah}
          setFromAyah={setFromAyah}
          toAyah={toAyah}
          setToAyah={setToAyah}
          maxAyah={maxAyah}
          error={error}
          selectedJuz={selectedJuz}
          onJuzChange={handleJuzChange}
        />
      )}

      {appMode === "memorization" && (
        <>
          {/* Audio Section Moved Here */}

          <AudioSection
            reciterOptions={reciterOptions}
            selectedReciter={selectedReciter}
            setSelectedReciter={setSelectedReciter}
            audioRef={audioRef}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            updateProgress={updateProgress}
            playbackProgress={playbackProgress}
            audioIndex={audioIndex}
            audioQueue={audioQueue}
            currentAudio={currentAudio}
            maxAyah={maxAyah}
            handlePrevAudio={handlePrevAudio}
            handleNextAudio={handleNextAudio}
            onAudioEnded={handleAudioEnded}
          />

          <button
            className={`floating-play ${isPlaying ? "floating-play--active" : ""}`}
            type="button"
            onClick={togglePlayback}
            disabled={!currentAudio?.audio}
            aria-label={isPlaying ? "إيقاف مؤقت" : "تشغيل"}
          >
            {isPlaying ? "إيقاف" : "تشغيل"}
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
              <MushafView
                selectedMushafEdition={selectedMushafEdition}
                setSelectedMushafEdition={setSelectedMushafEdition}
                mushafOptions={mushafOptions}
                mushafViewMode={mushafViewMode}
                setMushafViewMode={setMushafViewMode}
                mushafFontSize={mushafFontSize}
                setMushafFontSize={setMushafFontSize}
                surahMeta={surahMeta}
                selectedSurah={selectedSurah}
                revelationTypeLabel={revelationTypeLabel}
                rangeEnd={rangeEnd}
                rangeAyahs={rangeAyahs}
                activeAyahNumber={activeAyahNumber}
                handleLoadAudio={handleLoadAudio}
                maxAyah={maxAyah}
              />
            )}

            {activeTab === "tafsir" && (
              <TafsirView
                selectedTafsir={selectedTafsir}
                setSelectedTafsir={setSelectedTafsir}
                tafsirOptions={tafsirOptions}
                rangeNumbers={rangeNumbers}
                tafsirMap={tafsirMap}
                maxAyah={maxAyah}
              />
            )}

            {activeTab === "search" && (
              <SearchView
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                handleSearch={handleSearch}
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                searchLoading={searchLoading}
                searchResults={searchResults}
              />
            )}

            {activeTab === "sajda" && (
              <SajdaView
                sajdaError={sajdaError}
                sajdaLoading={sajdaLoading}
                sajdaList={sajdaList}
              />
            )}
          </section>
        </>
      )}



      {appMode === "recitation" && (
        <section className="section">
          <RecitationView
            surahName={surahMeta.get(selectedSurah)?.name}
            rangeAyahs={rangeAyahs}
            fromAyah={fromAyah}
            toAyah={toAyah}
          />
        </section>
      )}

      {appMode === "listening" && (
        <>
            <ListeningView surahMeta={surahMeta} />
        </>
      )}

      <button
        className={`scroll-top ${showScrollTop ? "" : "scroll-top--hidden"}`}
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="العودة للأعلى"
      >
        ↑
      </button>

      <footer className="footer">
        <p>
          يعتمد التطبيق على بيانات من مصادر مختلفة لتوفير السور، التفسير،
          الترجمة والتلاوة.
        </p>
      </footer>
    </div>
  );
}
