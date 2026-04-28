# Admin Book Deletion Summary

## O que foi implementado

- Atualizei o `AGENTS.md` para permitir exclusão administrativa de livros com remoção dos vínculos em listas.
- Implementei `DELETE /books/:bookId` no back-end.
- A exclusão exige autenticação e permissão de admin.
- Quando o livro ainda está em listas:
  - a API responde `409`
  - informa que a exclusão precisa de confirmação
  - informa quantas listas serão afetadas
- Quando a exclusão é confirmada com `force=true`:
  - o livro é apagado
  - os `Book_List_Item` ligados a ele são removidos
  - as posições restantes das listas são normalizadas
  - a capa gerenciada no R2 é apagada
- URLs de capa externas continuam seguras e não forçam remoção no R2.

## Front-end

- Criei a tela admin de livros em `/app/admin/books`.
- Adicionei o atalho `Gerenciar livros` na área administrativa.
- A tela permite:
  - buscar livros por título ou autor
  - apagar um livro
  - confirmar a exclusão quando o livro ainda está em listas
- Todo o texto visível ficou em pt-BR.

## Arquivos principais

- `AGENTS.md`
- `back-end/src/app.ts`
- `back-end/src/modules/books/application/book-errors.ts`
- `back-end/src/modules/books/application/book-service.ts`
- `back-end/src/modules/books/composition/book-module.ts`
- `back-end/src/modules/books/infrastructure/persistence/prisma-book-repository.ts`
- `back-end/src/modules/books/presentation/http/book-router.ts`
- `back-end/src/modules/uploads/composition/upload-module.ts`
- `back-end/src/modules/uploads/infrastructure/storage/r2-object-storage.ts`
- `back-end/tests/integration/books/books.test.ts`
- `back-end/tests/integration/support/db-test-helpers.ts`
- `front-end/Sophena/src/lib/api/books.ts`
- `front-end/Sophena/src/router/index.ts`
- `front-end/Sophena/src/router/__tests__/auth-guards.spec.ts`
- `front-end/Sophena/src/stores/admin-books.ts`
- `front-end/Sophena/src/stores/__tests__/admin-books.spec.ts`
- `front-end/Sophena/src/views/AdminHomeView.vue`
- `front-end/Sophena/src/views/AdminBooksView.vue`
- `front-end/Sophena/src/views/__tests__/AdminHomeView.spec.ts`
- `front-end/Sophena/src/views/__tests__/AdminBooksView.spec.ts`

## Validação

- `back-end: yarn test`
- `back-end: yarn typecheck`
- `back-end: ./node_modules/.bin/tsx --test --test-concurrency=1 tests/integration/**/*.test.ts tests/unit/**/*.test.ts`
- `front-end: yarn test:unit --run`
- `front-end: yarn type-check`
