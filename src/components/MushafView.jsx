
import React from 'react';
import Select from './Select';
import { formatNumber, stripBasmala } from '../utils';

export default function MushafView({
  selectedMushafEdition,
  setSelectedMushafEdition,
  mushafOptions,
  mushafViewMode,
  setMushafViewMode,
  mushafFontSize,
  setMushafFontSize,
  surahMeta,
  selectedSurah,
  revelationTypeLabel,
  rangeEnd,
  rangeAyahs,
  activeAyahNumber,
  handleLoadAudio,
  maxAyah
}) {
  return (
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
            onChange={(event) => setMushafFontSize(Number(event.target.value))}
          />
        </label>
        <span className="mushaf__value">{formatNumber(mushafFontSize)}</span>
        <div className="mushaf__summary">
          <div className="mushaf__summary-row">
            <strong className="mushaf__summary-value">
              {surahMeta.get(selectedSurah)?.name || "—"}
            </strong>
          </div>
          <div className="mushaf__summary-row">
            <strong className="mushaf__summary-value">
              {revelationTypeLabel}
            </strong>
          </div>
          <div className="mushaf__summary-basmala">
            <span className="mushaf__page-label">
              عدد الايات {formatNumber(rangeEnd)}
            </span>{" "}
          </div>
        </div>
      </div>

      {mushafViewMode === "flow" ? (
        <div className="mushaf__page">
          <div className="mushaf__page-header">
            <span className="mushaf__page-label">{revelationTypeLabel}</span>
            <div className="mushaf__page-title">
              {surahMeta.get(selectedSurah)?.name || "—"}
            </div>
            <span className="mushaf__page-label">
              عدد الايات {formatNumber(rangeEnd)}
            </span>
          </div>
          
          {selectedSurah !== 9 && (
             <div className="mushaf__basmala" style={{ fontFamily: 'Amiri', fontSize: '2rem', marginBottom: '24px' }}>
               بسم الله الرحمن الرحيم
             </div>
          )}

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
        </div>
      ) : (
        <>
            {selectedSurah !== 9 && (
                 <div className="mushaf__basmala" style={{ fontFamily: 'Amiri', fontSize: '2rem', margin: '16px auto 24px', textAlign: 'center', color: 'var(--accent-2)' }}>
                   بسم الله الرحمن الرحيم
                 </div>
            )}
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
                    <span>آية {formatNumber(ayah.numberInSurah)}</span>

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
        </>
      )}
    </div>
  );
}
