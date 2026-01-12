
import React from 'react';
import { formatNumber } from '../utils';

export default function SearchView({
  searchQuery,
  setSearchQuery,
  handleSearch,
  searchMode,
  setSearchMode,
  searchLoading,
  searchResults
}) {
  return (
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
  );
}
