import { v4 as uuidv4 } from 'uuid';

// Auth codes
const AUTH_CODES = {
  registered: "ADMIN_2024",
  guest: "GUEST_ACCESS"
};

export interface User {
  id: string;
  user_code: string;
  user_type: 'registered' | 'guest';
  cookie_token: string;
  last_activity: string;
  created_at: string;
}

export interface ListeningHistoryEntry {
  id: string;
  user_id: string;
  book_id: string;
  chapter_number: number;
  current_position: number;
  last_listened: string;
}

// Storage keys
const USERS_KEY = 'audiobook_users';
const HISTORY_KEY = 'audiobook_history';
const SESSION_KEY = 'audiobook_session';

// Helper functions
function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getHistory(): ListeningHistoryEntry[] {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

function saveHistory(history: ListeningHistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// Auth functions
export function login(code: string): { success: boolean; user_type?: string; error?: string } {
  let userType: 'registered' | 'guest';
  
  if (code === AUTH_CODES.registered) {
    userType = 'registered';
  } else if (code === AUTH_CODES.guest) {
    userType = 'guest';
  } else {
    return { success: false, error: 'Неверный код доступа' };
  }

  const token = uuidv4();
  const user: User = {
    id: uuidv4(),
    user_code: code,
    user_type: userType,
    cookie_token: token,
    last_activity: new Date().toISOString(),
    created_at: new Date().toISOString()
  };

  const users = getUsers();
  users.push(user);
  saveUsers(users);

  // Set session
  localStorage.setItem(SESSION_KEY, token);

  console.log(`[AUTH] User logged in: type=${userType}, token=${token}`);
  
  return { success: true, user_type: userType };
}

export function verifySession(): User | null {
  const token = localStorage.getItem(SESSION_KEY);
  if (!token) return null;

  const users = getUsers();
  const user = users.find(u => u.cookie_token === token);
  
  if (user) {
    // Update last activity
    user.last_activity = new Date().toISOString();
    saveUsers(users);
    return user;
  }
  
  return null;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): User | null {
  return verifySession();
}

// History functions
export function getListeningHistory(userId: string, limit: number = 5): ListeningHistoryEntry[] {
  const history = getHistory();
  return history
    .filter(h => h.user_id === userId)
    .sort((a, b) => new Date(b.last_listened).getTime() - new Date(a.last_listened).getTime())
    .slice(0, limit);
}

export function saveProgress(
  userId: string,
  bookId: string,
  chapterNumber: number,
  currentPosition: number
): void {
  const history = getHistory();
  const existingIndex = history.findIndex(
    h => h.user_id === userId && h.book_id === bookId && h.chapter_number === chapterNumber
  );

  if (existingIndex >= 0) {
    history[existingIndex].current_position = currentPosition;
    history[existingIndex].last_listened = new Date().toISOString();
  } else {
    history.push({
      id: uuidv4(),
      user_id: userId,
      book_id: bookId,
      chapter_number: chapterNumber,
      current_position: currentPosition,
      last_listened: new Date().toISOString()
    });
  }

  saveHistory(history);
}

export function getProgress(
  userId: string,
  bookId: string,
  chapterNumber: number
): ListeningHistoryEntry | null {
  const history = getHistory();
  return history.find(
    h => h.user_id === userId && h.book_id === bookId && h.chapter_number === chapterNumber
  ) || null;
}

// Search function
export function searchBooks(query: string, allBooks: any[]): { id: string; author: string; title: string; series: string; book_number: number }[] {
  const q = query.toLowerCase();
  return allBooks
    .filter((b) => b.author.toLowerCase().includes(q) || b.title.toLowerCase().includes(q))
    .slice(0, 50)
    .map((b) => ({
      id: b.id,
      author: b.author,
      title: b.title,
      series: b.series.name,
      book_number: b.series.book_number
    }));
}

// Get auth codes for display
export function getAuthCodes() {
  return AUTH_CODES;
}
