export type PreviewBook = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
};

export type BookList = {
  id: string;
  name: string;
  icon: string;
  tint_index: number;
  preview_items: PreviewBook[];
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type BookListView = {
  id: string;
  name: string;
  icon: string;
  tint_index: number;
  preview_items: PreviewBook[];
  created_at: string;
  updated_at: string;
};

export function toBookListView(list: BookList): BookListView {
  return {
    id: list.id,
    name: list.name,
    icon: list.icon,
    tint_index: list.tint_index,
    preview_items: list.preview_items,
    created_at: list.created_at,
    updated_at: list.updated_at,
  };
}
