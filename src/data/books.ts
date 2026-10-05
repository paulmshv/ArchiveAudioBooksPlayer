// Типы данных для books.json
export interface Chapter {
  chapter_number: number;
  chapter_title: string;
  book_position: number;
  audio_url: string;
  duration: number;
}

export interface Series {
  name: string;
  book_number: number;
}

export interface Book {
  id: string;
  author: string;
  series: Series;
  title: string;
  cover_color: string;
  chapters: Chapter[];
}

export interface BooksData {
  books: Book[];
}

// Путь к JSON-файлу с данными о книгах
// Файл должен лежать в public/books.json
const BOOKS_JSON_PATH = '/books.json';

// Загрузка книг из JSON-файла
export async function loadBooks(): Promise<Book[]> {
  const response = await fetch(BOOKS_JSON_PATH);
  if (!response.ok) {
    throw new Error(`Не удалось загрузить books.json: ${response.status}`);
  }
  const data: BooksData = await response.json();
  return data.books;
}
