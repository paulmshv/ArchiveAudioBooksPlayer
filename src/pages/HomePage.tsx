import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { books } from '../data/books';
import { getCurrentUser, getListeningHistory, logout } from '../services/storage';
import { Search, BookOpen, LogOut, Clock, Play, Headphones, User } from 'lucide-react';
import type { ListeningHistoryEntry } from '../services/storage';

interface HistoryBook {
  entry: ListeningHistoryEntry;
  book: typeof books[0];
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<HistoryBook[]>([]);
  const [userType, setUserType] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setUserType(user.user_type);

    // Load history
    const historyEntries = getListeningHistory(user.id, 5);
    const historyBooks: HistoryBook[] = historyEntries.map(entry => {
      const book = books.find(b => b.id === entry.book_id);
      return { entry, book: book! };
    }).filter(h => h.book);
    setHistory(historyBooks);
  }, [navigate]);

  const filteredBooks = books.filter(book => {
    const q = searchQuery.toLowerCase();
    return book.author.toLowerCase().includes(q) || book.title.toLowerCase().includes(q);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}ч ${m}м`;
    return `${m}м`;
  };

  const getProgressPercent = (bookId: string): number => {
    const book = books.find(b => b.id === bookId);
    if (!book) return 0;
    const bookHistory = history.filter(h => h.book.id === bookId);
    if (bookHistory.length === 0) return 0;
    
    const totalChapters = book.chapters.length;
    const completedChapters = bookHistory.filter(h => {
      const chapter = book.chapters.find(c => c.chapter_number === h.entry.chapter_number);
      return chapter && h.entry.current_position >= chapter.duration * 0.95;
    }).length;
    
    return Math.round((completedChapters / totalChapters) * 100);
  };

  const getLastPosition = (bookId: string): string => {
    const book = books.find(b => b.id === bookId);
    if (!book) return '';
    const bookHistory = history.find(h => h.book.id === bookId);
    if (!bookHistory) return '';
    
    const chapter = book.chapters.find(c => c.chapter_number === bookHistory.entry.chapter_number);
    if (!chapter) return '';
    
    return `Глава ${bookHistory.entry.chapter_number}: ${formatDuration(bookHistory.entry.current_position)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Аудиокниги</h1>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <User className="w-3 h-3" />
                {userType === 'registered' ? 'Зарегистрированный' : 'Гость'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по автору или названию..."
            className="w-full pl-12 pr-4 py-3.5 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              ✕
            </button>
          )}
        </div>

        {/* History Section */}
        {history.length > 0 && !searchQuery && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-white">Недавно прослушанные</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map(({ entry, book }) => (
                <div
                  key={entry.id}
                  onClick={() => navigate(`/book/${book.id}`)}
                  className="group bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-amber-500/50 hover:bg-gray-800 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${book.cover_color} flex items-center justify-center flex-shrink-0`}>
                      <Headphones className="w-5 h-5 text-white/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">{book.title}</h3>
                      <p className="text-xs text-gray-400 truncate">{book.author}</p>
                      <p className="text-xs text-gray-500 mt-1">{getLastPosition(book.id)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all"
                            style={{ width: `${getProgressPercent(book.id)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{getProgressPercent(book.id)}%</span>
                      </div>
                    </div>
                  </div>
                  <button className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-amber-500/10 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/20 transition-colors">
                    <Play className="w-3.5 h-3.5" />
                    Продолжить
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Books Grid */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            {searchQuery ? `Результаты поиска (${filteredBooks.length})` : 'Все книги'}
          </h2>
          {filteredBooks.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Книги не найдены</p>
              <p className="text-sm text-gray-500">Попробуйте изменить запрос</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredBooks.map(book => {
                const bookHistory = history.find(h => h.book.id === book.id);
                const progress = bookHistory ? getProgressPercent(book.id) : 0;
                
                return (
                  <div
                    key={book.id}
                    onClick={() => navigate(`/book/${book.id}`)}
                    className="group bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 transition-all cursor-pointer"
                  >
                    {/* Cover */}
                    <div className={`h-36 bg-gradient-to-br ${book.cover_color} relative flex items-center justify-center overflow-hidden`}>
                      <Headphones className="w-14 h-14 text-white/20" />
                      {bookHistory && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900/50">
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/0 group-hover:bg-white/20 flex items-center justify-center transition-all scale-0 group-hover:scale-100">
                          <Play className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-4">
                      <h3 className="font-medium text-white text-sm truncate group-hover:text-amber-400 transition-colors">
                        {book.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1 truncate">{book.author}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {book.chapters.length} глав
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(book.chapters.reduce((sum, c) => sum + c.duration, 0))}
                        </span>
                      </div>
                      {book.series.name && (
                        <p className="text-xs text-gray-600 mt-2 truncate">{book.series.name}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
