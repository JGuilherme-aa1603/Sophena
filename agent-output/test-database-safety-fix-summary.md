# Test Database Safety Fix Summary

## Causa encontrada

- Alguns testes de integração importavam `createApp()` antes de qualquer import que ativasse o modo de teste.
- O Prisma era inicializado no momento do import do módulo, então podia capturar `DATABASE_URL` antes de `SOPHENA_RUNTIME_MODE=test`.
- O script oficial de testes também não fazia preload explícito do `test-env`.

## Correções aplicadas

- Tornei a criação do Prisma lazy em `back-end/src/infrastructure/prisma/prisma-client.ts`.
- Mantive a resolução entre `DATABASE_URL` e `DATABASE_URL_TEST` no momento real de uso do client.
- Ajustei `back-end/tests/integration/support/test-env.ts` para carregar `dotenv/config` antes das validações.
- Corrigi os scripts de teste do back-end em `back-end/package.json` para:
  - preloadar `tests/integration/support/test-env.ts`
  - executar a suíte unitária e de integração completa

## Resultado

- O fluxo oficial `yarn test` do back-end agora exige `DATABASE_URL_TEST`.
- O fluxo oficial falha se `DATABASE_URL_TEST` não existir.
- O fluxo oficial falha se `DATABASE_URL_TEST` for igual a `DATABASE_URL`.
- A suíte completa passou usando o banco de testes.

## Validação

- `back-end: yarn test`
- `back-end: yarn typecheck`
