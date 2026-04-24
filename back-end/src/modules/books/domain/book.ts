export type Book = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
};

export function toBookView(book: Book) {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    cover_url: book.cover_url,
  };
}
