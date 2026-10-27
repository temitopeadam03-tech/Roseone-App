import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  duration?: number;
  className?: string;
  authorName?: string;
  isCompact?: boolean;
}

// Generate a warm fallback audio waveform for offline voice recordings
function createVoiceNoteAudio(durationSeconds: number = 30): string {
  try {
    const sampleRate = 22050;
    const numSamples = Math.floor(sampleRate * Math.min(durationSeconds, 60));
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, 1, true); // NumChannels (Mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Generate warm lofi melody chords: Cmaj7 / Am / F / G notes
    const frequencies = [261.63, 329.63, 392.0, 493.88, 440.0, 349.23];
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const noteIdx = Math.floor(t * 1.5) % frequencies.length;
      const freq = frequencies[noteIdx];
      // Tone with gentle vibrato and soft envelope
      const env = Math.min(1, (t % 0.66) * 4) * Math.max(0, 1 - (t % 0.66));
      const sample = Math.sin(2 * Math.PI * freq * t) * 0.4 * env + Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.2;
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      offset += 2;
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch {
    return '';
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  duration = 30,
  className = '',
  authorName,
  isCompact = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!src || src === 'audio_voicenote' || (!src.startsWith('data:') && !src.startsWith('blob:') && !src.startsWith('http'))) {
      const synthetic = createVoiceNoteAudio(duration);
      setResolvedSrc(synthetic);
    } else {
      setResolvedSrc(src);
    }
  }, [src, duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
        setTotalDuration(Math.round(audio.duration));
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [resolvedSrc]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    const audio = audioRef.current;
    if (!bar || !audio) return;

    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * (totalDuration || duration);

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cycleSpeed = () => {
    const rates: (1 | 1.5 | 2)[] = [1, 1.5, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // 24 waveform bar visualizer heights (simulated frequency spectrum)
  const barHeights = [
    30, 45, 60, 85, 70, 95, 80, 60, 40, 75, 90, 100,
    85, 65, 45, 70, 90, 80, 60, 50, 75, 85, 55, 35,
  ];

  return (
    <div
      className={`${
        isCompact ? 'p-2 rounded-xl gap-1' : 'p-2.5 rounded-2xl gap-1.5'
      } bg-gradient-to-r from-[#FCE7F3]/40 via-white to-[#FCE7F3]/20 dark:from-[#BE185D]/15 dark:via-[#17131A] dark:to-[#BE185D]/10 border border-[#E91E8C]/20 dark:border-[#E91E8C]/30 shadow-2xs flex flex-col ${className}`}
    >
      {resolvedSrc && (
        <audio ref={audioRef} src={resolvedSrc} preload="metadata" />
      )}

      <div className="flex items-center gap-2">
        {/* Play / Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`${
            isCompact ? 'w-7 h-7' : 'w-8 h-8'
          } rounded-full bg-[#E91E8C] hover:bg-[#BE185D] active:scale-95 text-white flex items-center justify-center shrink-0 shadow-sm transition-all focus:outline-none`}
          title={isPlaying ? 'Pause voice note' : 'Play voice note'}
          aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
        >
          {isPlaying ? (
            <Pause className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} fill-white`} />
          ) : (
            <Play className={`${isCompact ? 'w-3 h-3 ml-0.5' : 'w-4 h-4 ml-0.5'} fill-white`} />
          )}
        </button>

        {/* Interactive Waveform / Scrubber */}
        <div
          ref={progressBarRef}
          onClick={handleSeek}
          className={`flex-1 flex items-center gap-[2px] ${
            isCompact ? 'h-5' : 'h-7'
          } cursor-pointer group py-0.5 select-none`}
          title="Click to seek"
        >
          {barHeights.map((h, i) => {
            const barProgress = (i / barHeights.length) * 100;
            const isFilled = barProgress <= progressPercent;

            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-150 flex items-center justify-center"
                style={{ height: '100%' }}
              >
                <div
                  className={`w-full rounded-full transition-all ${
                    isFilled
                      ? 'bg-[#E91E8C] dark:bg-[#F472B6]'
                      : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400 dark:group-hover:bg-slate-600'
                  } ${isPlaying && isFilled ? 'animate-pulse' : ''}`}
                  style={{
                    height: `${Math.max(25, h)}%`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Speed button */}
        <button
          type="button"
          onClick={cycleSpeed}
          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-[#FCE7F3] dark:hover:bg-[#BE185D]/30 text-slate-700 dark:text-slate-300 hover:text-[#BE185D] transition-colors shrink-0 tabular-nums"
          title="Change playback speed"
        >
          {playbackRate}x
        </button>

        {/* Mute button */}
        {!isCompact && (
          <button
            type="button"
            onClick={toggleMute}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Duration & Metadata Row */}
      <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400 px-0.5">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E91E8C] animate-ping" />
          <span>Voice</span>
          {authorName && !isCompact && <span className="text-slate-400">· {authorName}</span>}
        </span>
        <span className="tabular-nums font-semibold text-slate-600 dark:text-slate-300 text-[10px]">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>
      </div>
    </div>
  );
};
