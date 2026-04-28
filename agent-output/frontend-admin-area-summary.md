# Front-end Admin Area Summary

## O que foi implementado

- Criei uma tela central de administração em `/app/admin`.
- Mudei a tela principal para mostrar apenas um atalho `Área administrativa` para usuários admin.
- Mantive a navegação administrativa protegida por autenticação e permissão de admin.
- Ajustei as telas `Criar usuário` e `Ver registros` para voltarem para a nova área administrativa.

## Arquivos alterados

- `front-end/Sophena/src/router/index.ts`
- `front-end/Sophena/src/views/ListsView.vue`
- `front-end/Sophena/src/views/AdminUsersView.vue`
- `front-end/Sophena/src/views/AdminLogsView.vue`
- `front-end/Sophena/src/views/AdminHomeView.vue`
- `front-end/Sophena/src/router/__tests__/auth-guards.spec.ts`
- `front-end/Sophena/src/views/__tests__/ListsView.spec.ts`
- `front-end/Sophena/src/views/__tests__/AdminUsersView.spec.ts`
- `front-end/Sophena/src/views/__tests__/AdminLogsView.spec.ts`
- `front-end/Sophena/src/views/__tests__/AdminHomeView.spec.ts`

## Validação

- `yarn test:unit --run`
- `yarn type-check`
