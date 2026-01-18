import React, { useState, useEffect, useRef, useMemo } from "react";
import { normalizeForMatching } from "../utils";

const normalizeForDisplay = (text) => {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "") // remove tashkeel
    .replace(/ـ/g, "")
    .replace(/[أإآٱء]/g, "ا") // unify alef and hamza
    .trim();
};

export default function RecitationView({
  rangeAyahs,
}) {
  const [isListening, setIsListening] = useState(false);
  const [matchedWords, setMatchedWords] = useState([]);
  const [errorWord, setErrorWord] = useState(null); // For visual feedback of error
  
  const recognitionRef = useRef(null);
  const audioCtxRef = useRef(null);
  const matchedCountRef = useRef(0);

  const targetWords = useMemo(() => {
    if (!rangeAyahs) return [];
    
    const list = [];
    rangeAyahs.forEach((ayah) => {
      // Keep original text with tashkeel for display
      const originalTokens = ayah.text.replace(/ـ/g, "").split(/\s+/).filter(Boolean);
      
      originalTokens.forEach(token => {
         list.push({
           display: token, // Keep tashkeel for display
           match: normalizeForMatching(token), // Normalize for matching
           ayahNumber: ayah.numberInSurah
         });
      });
    });
    return list;
  }, [rangeAyahs]);

  useEffect(() => {
    // Reset state when selection changes
    setMatchedWords([]);
    matchedCountRef.current = 0;
    setIsListening(false);
    setErrorWord(null);
    if (recognitionRef.current) recognitionRef.current.stop();
  }, [targetWords]);

  const playErrorSound = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(130, ctx.currentTime); 
      osc.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error(e);
    }
  };

  const startListening = () => {
    // Initialize Audio Context on user gesture to ensure playback is allowed
    if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
    }

    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) {
      alert("عذراً، المتصفح لا يدعم التعرف الصوتي.");
      return;
    }

    const recognition = new Speech();
    recognition.lang = "ar-SA";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let lastResultIndex = -1;
    let wordsConsumedInCurrentResult = 0;

    recognition.onresult = (event) => {
      const currentResultIndex = event.resultIndex;
      const result = event.results[currentResultIndex];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;

      if (currentResultIndex !== lastResultIndex) {
        wordsConsumedInCurrentResult = 0;
        lastResultIndex = currentResultIndex;
      }

      const allWords = normalizeForMatching(transcript).split(/\s+/).filter(Boolean);
      const validWords = allWords.slice(wordsConsumedInCurrentResult);

      let i = 0;
      while (i < validWords.length) {
        const currentIdx = matchedCountRef.current;
        if (currentIdx >= targetWords.length) break;

        const target = targetWords[currentIdx];
        const expected = target.match;
        const word = validWords[i];

        // Direct match
        if (word === expected) {
          matchedCountRef.current++;
          setMatchedWords(prev => [...prev, target]);
          wordsConsumedInCurrentResult++;
          setErrorWord(null);
          i++;
          continue;
        }

        // Check if current + next word(s) combine to match expected
        // This handles cases where speech splits "أَوَآبَاؤُنَا" into "أو آباؤنا"
        let combined = word;
        let lookahead = 1;
        let foundCombinedMatch = false;
        
        while (i + lookahead < validWords.length && combined.length < expected.length + 3) {
          combined += validWords[i + lookahead];
          if (normalizeForMatching(combined) === expected) {
            // Found a match by combining words
            matchedCountRef.current++;
            setMatchedWords(prev => [...prev, target]);
            wordsConsumedInCurrentResult += lookahead + 1;
            setErrorWord(null);
            i += lookahead + 1;
            foundCombinedMatch = true;
            break;
          }
          lookahead++;
        }
        
        if (foundCombinedMatch) continue;

        // Check if word is a prefix of expected (partial speech)
        if (expected.startsWith(word) && !isFinal && word.length < expected.length) {
          // Wait for more input
          break;
        }

        // Check if expected starts with word (word is first part of expected)
        // Don't error yet - wait for next words that might complete it
        if (expected.startsWith(word) && i === validWords.length - 1 && !isFinal) {
          // Word could be start of a split, wait
          break;
        }

        // Wrong word
        playErrorSound();
        setErrorWord(word);
        wordsConsumedInCurrentResult++;
        i++;
      }
      
      // Auto-stop if done
      if (matchedCountRef.current >= targetWords.length) {
          recognition.stop();
          setIsListening(false);
      }
    };

    recognition.onerror = (e) => {
        if (e.error === 'not-allowed') {
            setIsListening(false);
            alert("يرجى السماح باستخدام الميكروفون.");
        }
    };

    recognition.onend = () => {
        if (matchedCountRef.current < targetWords.length && isListening) {
             try { recognition.start(); } catch(e){}
        } else {
             setIsListening(false);
        }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  // Group matched words by ayah
  const groupedByAyah = useMemo(() => {
    const groups = [];
    let currentGroup = null;
    
    matchedWords.forEach((item) => {
      if (!currentGroup || currentGroup.ayahNumber !== item.ayahNumber) {
        currentGroup = { ayahNumber: item.ayahNumber, words: [] };
        groups.push(currentGroup);
      }
      currentGroup.words.push(item);
    });
    
    return groups;
  }, [matchedWords]);

  // Get current ayah being recited
  const currentAyahNumber = targetWords[matchedCountRef.current]?.ayahNumber;

  return (
    <div className="recitation-container fade-in">
      <div className="recitation-controls">
         <button 
           className={`button ${isListening ? "button--ghost" : ""}`}
           onClick={isListening ? stopListening : startListening}
         >
           {isListening ? "إيقاف التسميع" : matchedWords.length > 0 ? "استئناف التسميع" : "بدء التسميع"}
         </button>
         
         <div className="recitation-stats">
             <span>إنجاز: {Math.round((matchedWords.length / Math.max(targetWords.length, 1)) * 100)}%</span>
         </div>
      </div>

      <div className="recitation-paper">
         {matchedWords.length === 0 && !isListening && (
             <div className="recitation-placeholder">
                 اضغط على "بدء التسميع" وابدأ بقراءة الآيات...
             </div>
         )}
         
         <div className="recitation-ayahs">
             {groupedByAyah.map((group) => (
                 <div key={group.ayahNumber} className="recitation-ayah">
                     <p className="recitation-text">
                         {group.words.map((item, idx) => (
                             <span key={idx} className="recitation-word">
                                 {item.display}{" "}
                             </span>
                         ))}
                         <span className="recitation-ayah-number">﴿{group.ayahNumber}﴾</span>
                     </p>
                 </div>
             ))}
             
             {isListening && currentAyahNumber && !groupedByAyah.some(g => g.ayahNumber === currentAyahNumber) && (
                 <div className="recitation-ayah recitation-ayah--current">
                     <span className="cursor">|</span>
                     <span className="recitation-ayah-number recitation-ayah-number--current">
                         ﴿{currentAyahNumber}﴾
                     </span>
                 </div>
             )}
         </div>
         
         {errorWord && isListening && (
            <div className="recitation-feedback error-shake">
                خطأ: سمعت "{errorWord}"
            </div>
         )}
      </div>
    </div>
  );
}
