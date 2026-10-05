import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getCurrentUser } from './services/storage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import BookPage from './pages/BookPage';

export default function App() {
  const user = getCurrentUser();
  
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={user ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/book/:id"
          element={user ? <BookPage /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
      </Routes>
    </HashRouter>
  );
}
