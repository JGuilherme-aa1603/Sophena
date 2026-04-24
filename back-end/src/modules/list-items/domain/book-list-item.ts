import { toBookView, type Book } from "../../books/domain/book.ts";

export type BookListItem = {
  id: string;
  list_id: string;
  book_id: string;
  position: number;
  created_at: string;
  updated_at: string;
};

export type BookListItemWithBook = BookListItem & {
  book: Book;
};

export function toBookListItemView(item: BookListItem) {
  return {
    id: item.id,
    list_id: item.list_id,
    book_id: item.book_id,
    position: item.position,
    created_at: item.created_at,
  };
}

export function toBookListItemReorderView(item: BookListItem) {
  return {
    id: item.id,
    list_id: item.list_id,
    book_id: item.book_id,
    position: item.position,
    updated_at: item.updated_at,
  };
}

export function toBookListItemReadView(item: BookListItemWithBook) {
  return {
    id: item.book.id,
    book_list_item_id: item.id,
    position: item.position,
    book: toBookView(item.book),
  };
}

export type BookListItemReadView = ReturnType<typeof toBookListItemReadView>;
