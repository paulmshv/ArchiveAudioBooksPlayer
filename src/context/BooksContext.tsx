import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Book, loadBooks } from '../data/books';

interface BooksContextType {
  books: Book[];
  isLoading: boolean;
  error: string | null;
}

const BooksContext = createContext<BooksContextType>({
  books: [],
  isLoading: true,
  error: null,
});

export function BooksProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBooks()
      .then((data) => {
        setBooks(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  return (
    <BooksContext.Provider value={{ books, isLoading, error }}>
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  return useContext(BooksContext);
}
