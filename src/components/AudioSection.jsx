
import React from 'react';
import Select from './Select';
import { formatNumber } from '../utils';

export default function AudioSection({
  reciterOptions,
  selectedReciter,
  setSelectedReciter,
  audioRef,
  isPlaying,
  setIsPlaying,
  updateProgress,
  playbackProgress,
  audioIndex,
  audioQueue,
  currentAudio,
  maxAyah,
  handlePrevAudio,
  handleNextAudio,
  onAudioEnded
}) {
  return (
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
          <div className="audio__player">
            <audio
              ref={audioRef}
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={updateProgress}
              onLoadedMetadata={updateProgress}
              onEnded={onAudioEnded}
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
  );
}
