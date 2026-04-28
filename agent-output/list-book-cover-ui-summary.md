# List Book Cover UI Summary

## O que foi implementado

- A tela de detalhe da lista agora mostra a capa do livro quando `cover_url` está disponível.
- Quando o livro não tem capa, a interface mostra um fallback visual com o texto `Sem capa`.
- O layout foi ajustado para manter a leitura simples em mobile e desktop.

## Arquivos alterados

- `front-end/Sophena/src/views/ListDetailView.vue`
- `front-end/Sophena/src/views/__tests__/ListDetailView.spec.ts`

## Validação

- `yarn test:unit --run src/views/__tests__/ListDetailView.spec.ts`
- `yarn test:unit --run`
- `yarn type-check`
