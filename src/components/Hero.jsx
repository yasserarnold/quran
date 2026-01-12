
import React from 'react';
import Select from './Select';
import { formatNumber } from '../utils';

export default function Hero({
  surahOptions,
  selectedSurah,
  setSelectedSurah,
  fromAyah,
  setFromAyah,
  toAyah,
  setToAyah,
  maxAyah,
  error,
  onJuzChange,
  selectedJuz
}) {
  const juzOptions = Array.from({ length: 30 }, (_, i) => ({
    key: i + 1,
    value: i + 1,
    name: `الجزء ${formatNumber(i + 1)}`,
  }));

  return (
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
          <div className="panel__title"> اختر السورة او الجزء </div>
          <div className="panel__grid">
            <Select
              label="  اختر الجزء"
              value={selectedJuz}
              options={juzOptions}
              onChange={onJuzChange}
              getLabel={(option) => option.name}
            />
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
  );
}
