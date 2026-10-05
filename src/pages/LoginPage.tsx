import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/storage';
import { BookOpen, Lock, Info } from 'lucide-react';

export default function LoginPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Введите код доступа');
      return;
    }

    const result = login(code.trim());
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Ошибка авторизации');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-4 shadow-lg shadow-amber-500/20">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Аудиокниги</h1>
          <p className="text-gray-400">Введите код доступа для продолжения</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
          <div className="mb-4">
            <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
              Код доступа
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Введите ваш код..."
                className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all duration-200 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
          >
            Войти
          </button>

          {/* Hint button */}
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>Подсказка по кодам</span>
          </button>

          {showHint && (
            <div className="mt-3 p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
              <p className="text-xs text-gray-400 mb-2">Тестовые коды для демонстрации:</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded font-mono">ADMIN_2024</span>
                  <span className="text-xs text-gray-500">— зарегистрированный пользователь</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded font-mono">GUEST_ACCESS</span>
                  <span className="text-xs text-gray-500">— гостевой доступ</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
