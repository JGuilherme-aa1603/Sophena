export type BookList = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type BookListView = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export function toBookListView(list: BookList): BookListView {
  return {
    id: list.id,
    name: list.name,
    created_at: list.created_at,
    updated_at: list.updated_at,
  };
}
