# Front-end Test Script Summary

## O que foi alterado

- Adicionei `test` em `front-end/Sophena/package.json`.
- Agora `yarn test` no front-end executa:
  - `test:unit:run`
  - `test:e2e`
- Também adicionei `test:unit:run` para rodar o Vitest em modo não interativo.

## Ajustes auxiliares

- Atualizei o `playwright.config.ts` para usar `yarn` no `webServer`.
- Ajustei o teste E2E existente para a tela real de login em português.
- Ajustei o `dev` script para usar `127.0.0.1`, alinhando melhor com execução automatizada local.

## Validação

- `yarn test:unit --run` passou
- `yarn test:e2e` não pôde ser validado neste sandbox porque o ambiente bloqueia abrir porta local (`listen EPERM`)

## Arquivos

- `front-end/Sophena/package.json`
- `front-end/Sophena/playwright.config.ts`
- `front-end/Sophena/e2e/vue.spec.ts`
