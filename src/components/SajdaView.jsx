
import React from 'react';
import { formatNumber } from '../utils';

export default function SajdaView({
    sajdaError,
    sajdaLoading,
    sajdaList
}) {
    return (
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
                    {item.sajda?.recommended ? "سجدة مستحبة" : "سجدة واجبة"}
                  </div>
                </article>
              ))}
            </div>
          </div>
    );
}
