import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { books } from '../data/books';
import { getCurrentUser, getProgress, saveProgress } from '../services/storage';
import { 
  ArrowLeft, Play, Pause, SkipBack, SkipForward, 
  Volume2, VolumeX, Headphones, Clock, ChevronRight 
} from 'lucide-react';

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const book = books.find(b => b.id === id);
  
  const [currentChapter, setCurrentChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [audioError, setAudioError] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressInterval = useRef<number | null>(null);

  useEffect(() => {
    if (!book) {
      navigate('/');
      return;
    }

    // Check for saved progress
    const user = getCurrentUser();
    if (user) {
      // Find the most recent chapter with progress for this book
      const historyEntries = book.chapters.map(ch => ({
        chapter: ch,
        progress: getProgress(user.id, book.id, ch.chapter_number)
      })).filter(e => e.progress);

      if (historyEntries.length > 0) {
        const lastEntry = historyEntries[historyEntries.length - 1];
        const chapterIndex = book.chapters.findIndex(c => c.chapter_number === lastEntry.chapter.chapter_number);
        if (chapterIndex >= 0) {
          setCurrentChapter(chapterIndex);
          // Start 10 seconds before saved position
          const startPos = Math.max(0, lastEntry.progress!.current_position - 10);
          // Use a longer timeout to ensure audio element is ready after key change
          const timer = setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.currentTime = startPos;
              setCurrentTime(startPos);
            }
          }, 300);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [book, navigate]);

  // Auto-save progress every 5 seconds
  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = window.setInterval(() => {
        const user = getCurrentUser();
        if (user && book && audioRef.current) {
          saveProgress(
            user.id,
            book.id,
            book.chapters[currentChapter].chapter_number,
            audioRef.current.currentTime
          );
        }
      }, 5000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, currentChapter, book]);

  // Save progress on pause/stop
  const handlePause = useCallback(() => {
    const user = getCurrentUser();
    if (user && book && audioRef.current) {
      saveProgress(
        user.id,
        book.id,
        book.chapters[currentChapter].chapter_number,
        audioRef.current.currentTime
      );
    }
  }, [book, currentChapter]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      handlePause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 1;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const changeChapter = (direction: 'prev' | 'next') => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsLoading(true);
    setAudioError(false);
    handlePause();
    
    let newIndex = currentChapter;
    if (direction === 'prev' && currentChapter > 0) {
      newIndex = currentChapter - 1;
    } else if (direction === 'next' && currentChapter < book!.chapters.length - 1) {
      newIndex = currentChapter + 1;
    }
    
    setCurrentChapter(newIndex);
    setCurrentTime(0);
    
    // Load saved progress for new chapter
    const user = getCurrentUser();
    if (user && book) {
      const progress = getProgress(user.id, book.id, book.chapters[newIndex].chapter_number);
      if (progress) {
        const startPos = Math.max(0, progress.current_position - 10);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = startPos;
            setCurrentTime(startPos);
          }
        }, 200);
      }
    }
  };

  const selectChapter = (index: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsLoading(true);
    setAudioError(false);
    handlePause();
    setCurrentChapter(index);
    setCurrentTime(0);
    
    // Load saved progress for selected chapter
    const user = getCurrentUser();
    if (user && book) {
      const progress = getProgress(user.id, book.id, book.chapters[index].chapter_number);
      if (progress) {
        const startPos = Math.max(0, progress.current_position - 10);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = startPos;
            setCurrentTime(startPos);
          }
        }, 200);
      }
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Книга не найдена</p>
      </div>
    );
  }

  const chapter = book.chapters[currentChapter];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-medium text-white truncate">{book.title}</h1>
            <p className="text-xs text-gray-400 truncate">{book.author}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Book Info */}
        <div className={`rounded-2xl bg-gradient-to-br ${book.cover_color} p-6 mb-6`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
              <Headphones className="w-8 h-8 text-white/80" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{book.title}</h2>
              <p className="text-white/70">{book.author}</p>
              {book.series.name && (
                <p className="text-white/50 text-sm mt-1">
                  {book.series.name} • Книга {book.series.book_number}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Chapter List */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Главы ({book.chapters.length})
          </h3>
          <div className="space-y-1">
            {book.chapters.map((ch, index) => {
              const user = getCurrentUser();
              const progress = user ? getProgress(user.id, book.id, ch.chapter_number) : null;
              const isActive = index === currentChapter;
              
              return (
                <button
                  key={ch.chapter_number}
                  onClick={() => selectChapter(index)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-amber-500/10 border border-amber-500/30'
                      : 'hover:bg-gray-800/50 border border-transparent'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-amber-500 text-white' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {isActive && isPlaying ? (
                      <div className="flex items-center gap-0.5">
                        <div className="w-0.5 h-3 bg-white rounded-full animate-pulse" />
                        <div className="w-0.5 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-0.5 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    ) : (
                      <span className="text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${isActive ? 'text-amber-400' : 'text-white'}`}>
                      {ch.chapter_title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">{formatTime(ch.duration)}</span>
                      {progress && (
                        <span className="text-xs text-amber-500/70">
                          • Прослушано {formatTime(progress.current_position)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Audio Player - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800">
        <audio
          key={chapter.audio_url}
          ref={audioRef}
          src={chapter.audio_url}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            handleLoadedMetadata();
            setIsLoading(false);
            setAudioError(false);
          }}
          onWaiting={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onError={() => {
            setAudioError(true);
            setIsLoading(false);
          }}
          onEnded={() => {
            setIsPlaying(false);
            handlePause();
            if (currentChapter < book.chapters.length - 1) {
              changeChapter('next');
            }
          }}
        />
        
        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* Audio Error */}
          {audioError && (
            <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs text-center">
              Не удалось загрузить аудио. Попробуйте другую главу.
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-3">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, #f59e0b ${(currentTime / (duration || 1)) * 100}%, #374151 ${(currentTime / (duration || 1)) * 100}%)`
              }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">{formatTime(currentTime)}</span>
              <span className="text-xs text-gray-500">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            {/* Left - Chapter info */}
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-sm text-white truncate">{chapter.chapter_title}</p>
              <p className="text-xs text-gray-400">Глава {currentChapter + 1} из {book.chapters.length}</p>
            </div>

            {/* Center - Playback controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeChapter('prev')}
                disabled={currentChapter === 0}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={togglePlay}
                disabled={audioError}
                className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 flex items-center justify-center transition-colors shadow-lg shadow-amber-500/20"
              >
                {isLoading && !isPlaying ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>
              <button
                onClick={() => changeChapter('next')}
                disabled={currentChapter === book.chapters.length - 1}
                className="p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Right - Volume & Speed */}
            <div className="flex-1 flex items-center justify-end gap-2 ml-4">
              <button
                onClick={cyclePlaybackRate}
                className="px-2 py-1 text-xs font-medium text-amber-400 bg-amber-500/10 rounded-md hover:bg-amber-500/20 transition-colors"
              >
                {playbackRate}x
              </button>
              <button
                onClick={toggleMute}
                className="p-2 text-gray-400 hover:text-white transition-colors hidden sm:block"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer hidden sm:block [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
