
import React from 'react';
import Select from './Select';
import { formatNumber } from '../utils';

export default function TafsirView({
    selectedTafsir,
    setSelectedTafsir,
    tafsirOptions,
    rangeNumbers,
    tafsirMap,
    maxAyah
}) {
    return (
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
                      <span>آية {formatNumber(num)}</span>
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
    );
}
