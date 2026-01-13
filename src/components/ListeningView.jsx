
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchJson, formatNumber } from '../utils';

export default function ListeningView({ surahMeta }) {
  const [reciters, setReciters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedReciter, setSelectedReciter] = useState(null);
  const [selectedMoshaf, setSelectedMoshaf] = useState(null);
  const [currentSurah, setCurrentSurah] = useState(null); // { id, name, url }
  const audioRef = useRef(null);

  useEffect(() => {
    const loadReciters = async () => {
      try {
        setLoading(true);
        const response = await fetchJson('https://mp3quran.net/api/v3/reciters?language=ar');
        setReciters(response.reciters || []);
      } catch (err) {
        setError('تعذر تحميل قائمة القراء. يرجى التحقق من الاتصال.');
      } finally {
        setLoading(false);
      }
    };
    loadReciters();
  }, []);

  // Handle hash changes for internal navigation within listening mode
  useEffect(() => {
    const handleReciterHash = () => {
      const hash = window.location.hash;
      // Expected format: #listening/reciterId
      if (hash.startsWith('#listening/')) {
        const parts = hash.split('/');
        if (parts.length >= 2) {
            const reciterId = parts[1];
            if (reciterId && reciters.length) {
                // Find reciter loosely (string or int)
                const foundReciter = reciters.find(r => r.id == reciterId);
                if (foundReciter) {
                    if (selectedReciter?.id !== foundReciter.id) {
                        setSelectedReciter(foundReciter);
                        if (foundReciter.moshaf && foundReciter.moshaf.length > 0) {
                            setSelectedMoshaf(foundReciter.moshaf[0]);
                        }
                        setCurrentSurah(null);
                    }
                }
            }
        }
      } else if (hash === '#listening') {
        setSelectedReciter(null);
        setCurrentSurah(null);
      }
    };

    handleReciterHash();
    window.addEventListener('hashchange', handleReciterHash);
    return () => window.removeEventListener('hashchange', handleReciterHash);
  }, [reciters, selectedReciter]);

  const filteredReciters = useMemo(() => {
    let result = reciters;
    // Sort alphabetically
    result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    if (searchTerm) {
      result = result.filter(r => r.name.includes(searchTerm));
    }
    return result;
  }, [reciters, searchTerm]);

  const groupedReciters = useMemo(() => {
    if (searchTerm) return { 'نتائج البحث': filteredReciters };
    
    const groups = {};
    filteredReciters.forEach(reciter => {
      let firstLetter = reciter.name.charAt(0);
      // Normalize Alef variations
      if (['أ', 'إ', 'آ', 'ٱ', 'ا'].includes(firstLetter)) {
        firstLetter = 'أ';
      }
      
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(reciter);
    });
    return groups;
  }, [filteredReciters, searchTerm]);

  const handleReciterClick = (reciter) => {
    // Instead of setting state, we set hash
    window.location.hash = `listening/${reciter.id}`;
  };

  const handleBack = () => {
    window.location.hash = 'listening';
  };

  const handleSurahClick = (surahId) => {
    if (!selectedMoshaf) return;
    
    const baseUrl = selectedMoshaf.server;
    const paddedId = String(surahId).padStart(3, '0');
    const url = `${baseUrl}${paddedId}.mp3`;
    
    const surahName = surahMeta.get(surahId)?.name || `سورة ${surahId}`;
    
    setCurrentSurah({
      id: surahId,
      name: surahName,
      url: url
    });
  };

  useEffect(() => {
    if (currentSurah && audioRef.current) {
      audioRef.current.src = currentSurah.url;
      audioRef.current.play().catch(e => console.error("Auto-play failed", e));
    }
  }, [currentSurah]);

  const handleMoshafChange = (e) => {
    const moshafId = parseInt(e.target.value);
    const moshaf = selectedReciter.moshaf.find(m => m.id === moshafId);
    setSelectedMoshaf(moshaf);
    setCurrentSurah(null);
  };

  if (loading && !reciters.length) return <div className="loading">جاري تحميل القراء...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="listening-view fade-in">
      {!selectedReciter ? (
        <div className="reciters-list-container">
          <input
            type="text"
            className="search-input"
            placeholder="ابحث عن قارئ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {Object.keys(groupedReciters).map(letter => (
             <div key={letter} className="reciter-group">
                <h3 className="group-letter">{letter}</h3>
                <div className="reciters-grid">
                  {groupedReciters[letter].map((reciter) => (
                    <button
                      key={reciter.id}
                      className="reciter-card"
                      onClick={() => handleReciterClick(reciter)}
                    >
                      <h3>{reciter.name}</h3>
                      <span className="reciter-moshaf-count">
                          {reciter.moshaf?.length} روايات
                      </span>
                    </button>
                  ))}
                </div>
             </div>
          ))}
          
        </div>
      ) : (
        <div className="player-interface">
          <button className="back-button" onClick={handleBack}>
            ← العودة للقراء
          </button>
          
          <div className="player-header">
            <h2>{selectedReciter.name}</h2>
            {selectedReciter.moshaf.length > 1 && (
              <select 
                className="moshaf-select"
                value={selectedMoshaf?.id} 
                onChange={handleMoshafChange}
              >
                {selectedReciter.moshaf.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            )}
            {selectedReciter.moshaf.length === 1 && (
                <p className="moshaf-name">{selectedReciter.moshaf[0].name}</p>
            )}
          </div>

          <div className="surahs-grid">
            {selectedMoshaf?.surah_list.split(',').map(sId => {
              const id = parseInt(sId);
              const meta = surahMeta.get(id);
              const isInfoAvailable = !!meta;
              
              return (
                <button
                  key={id}
                  className={`surah-btn ${currentSurah?.id === id ? 'active' : ''}`}
                  onClick={() => handleSurahClick(id)}
                >
                  <span className="surah-num">{formatNumber(id)}</span>
                  <span className="surah-name">{isInfoAvailable ? meta.name : `سورة ${id}`}</span>
                </button>
              );
            })}
          </div>
          
          {currentSurah && (
            <div className="sticky-player">
                <div className="player-info">
                    <strong>{currentSurah.name}</strong>
                    <span>{selectedReciter.name}</span>
                </div>
                <audio ref={audioRef} controls autoPlay className="main-audio-player" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
