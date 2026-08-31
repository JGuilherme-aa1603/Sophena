# Sophena

[![CI](https://github.com/JGuilherme-aa1603/Sophena/actions/workflows/ci.yml/badge.svg)](https://github.com/JGuilherme-aa1603/Sophena/actions/workflows/ci.yml)

Aplicação web mobile-first privada para organização e gerenciamento de listas de livros. Usuários criam listas pessoais, pesquisam e adicionam livros, reordenam itens e movem livros entre listas. Usuários administradores podem criar contas e monitorar a atividade do sistema.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Stack de Tecnologias](#stack-de-tecnologias)
- [Arquitetura](#arquitetura)
- [Modelo de Dados](#modelo-de-dados)
- [Autenticação e Segurança](#autenticação-e-segurança)
- [Regras de Negócio](#regras-de-negócio)
- [Executando o Projeto](#executando-o-projeto)
- [Testes](#testes)
- [Variáveis de Ambiente](#variáveis-de-ambiente)

---

## Visão Geral

- **Acesso privado:** Novos usuários só podem ser criados por um administrador — sem auto-registro.
- **Público-alvo:** Usuários com baixa familiaridade tecnológica; a interface prioriza clareza, acessibilidade e previsibilidade.
- **Idioma:** Português Brasileiro (pt-BR) em toda a interface.
- **Livros são globais:** Um mesmo livro é compartilhado entre todos os usuários; as listas pertencem a usuários individuais.

---

## Stack de Tecnologias

### Frontend

| Tecnologia | Versão | Função |
|---|---|---|
| **Vue 3** | `^3.5` | Framework reativo com Composition API e `<script setup>` SFCs |
| **TypeScript** | `~6.0` | Tipagem estática em todo o projeto |
| **Ionic Framework** | `^8.8` | Componentes UI mobile-first (IonList, IonModal, IonFab, etc.) |
| **Pinia** | `^3.0` | Gerenciamento de estado global; uma store por domínio |
| **Vue Router** | `^5.0` | Roteamento SPA com guards de autenticação |
| **Vite** | `^8.0` | Bundler e dev server com proxy `/api → localhost:3000` |

#### Qualidade e Testes (Frontend)

| Tecnologia | Versão | Função |
|---|---|---|
| **Vitest** | `^4.1` | Testes unitários de componentes e stores |
| **Playwright** | `^1.59` | Testes end-to-end |
| **Vue Test Utils** | `^2.4` | Utilitários para montar e testar componentes Vue |
| **oxlint** | `~1.60` | Linter rápido (Rust) com correção automática |
| **oxfmt** | `^0.45` | Formatter para código-fonte |
| **ESLint** | `^10.2` | Linting complementar com plugins Vue e TypeScript |
| **vue-tsc** | `^3.2` | Type-check de SFCs Vue via TypeScript |

---

### Backend

| Tecnologia | Versão | Função |
|---|---|---|
| **Node.js** | `>=20.19` | Runtime JavaScript server-side |
| **Express** | `^5.2` | Framework HTTP minimalista para a API REST |
| **TypeScript** | `^6.0` | Tipagem estática em toda a camada de servidor |
| **Prisma** | `^7.8` | ORM type-safe com migrations e cliente gerado |
| **PostgreSQL** | — | Banco de dados relacional principal |
| **pg** | `^8.20` | Driver PostgreSQL nativo para Node.js |
| **jsonwebtoken** | `^9.0` | Geração e validação de JWTs (access + refresh tokens) |
| **tsx** | `^4.21` | Execução e watch de TypeScript sem compilação prévia |

#### Armazenamento e Upload

| Tecnologia | Versão | Função |
|---|---|---|
| **Cloudflare R2** | — | Object storage para capas de livros e avatares |
| **AWS SDK S3** | `^3.1038` | Cliente compatível com a API S3 do R2 |
| **Multer** | `^2.1` | Middleware de upload multipart/form-data |
| **Sharp** | `^0.34` | Processamento e otimização de imagens server-side |

#### Segurança e Infraestrutura

| Tecnologia | Versão | Função |
|---|---|---|
| **Helmet** | `^8.1` | Cabeçalhos HTTP de segurança |
| **CORS** | `^2.8` | Configuração de Cross-Origin Resource Sharing |
| **express-rate-limit** | `^8.4` | Rate limiting nos endpoints de autenticação |
| **dotenv** | `^17.4` | Carregamento de variáveis de ambiente |

---

## Arquitetura

### Frontend — Camadas

```
src/
├── lib/api/        # Funções de requisição tipadas (uma por módulo)
├── stores/         # Pinia stores (uma por área de domínio)
├── views/          # Componentes de página
├── components/     # Componentes reutilizáveis (agrupados por feature)
└── router/         # Configuração do Vue Router com guards de auth
```

**Fluxo de dados:** View → Store → API layer (`requestJson()`) → Backend

**Atualizações otimistas:** operações de create/update/delete/reorder atualizam a UI imediatamente e fazem rollback com feedback em caso de erro na API.

---

### Backend — Módulos

```
src/modules/
├── auth/
├── admin/
├── books/
├── lists/
├── list-items/
├── logs/
└── uploads/
```

Cada módulo segue uma estrutura de **quatro camadas**:

```
modules/<modulo>/
├── domain/             # Tipos e entidades (sem dependências externas)
├── application/        # Service class, error types, interface do repositório
├── infrastructure/     # Implementação Prisma do repositório
├── presentation/http/  # Express Router
└── composition/        # Factory de injeção de dependências
```

**Serviços** retornam dados ou lançam erros tipados — nunca `{ success, data }`.

**Autorização e ownership** são sempre validados no backend via `getOwnedListOrFail()`. Recursos não encontrados e não autorizados retornam 404 para prevenir enumeração.

---

## Modelo de Dados

```
User
├── id, user_name (unique), password_hash, user_picture_url
├── → Admin (0..1)
├── → BookList (0..N)
└── → Log (0..N)

Admin
└── user_id (FK → User, unique)

Book (global)
├── id, title, author, cover_url
└── Constraint: unique(title, author)

BookList
├── id, name, icon, tint_index, user_id (FK → User)
└── Constraint: unique(user_id, name)

BookListItem
├── id, list_id (FK → BookList), book_id (FK → Book), position (int)
└── Constraints: unique(list_id, book_id), unique(list_id, position)

Log
└── id, level (INFO|WARN|ERROR), status_code, message, route, method, user_id (nullable)

RefreshToken
└── revoked_at (rotação a cada uso)
```

**Regras de deleção:**
- Usuário deletado → cascade em Admin, BookList, BookListItem; Log preservado (user_id → null)
- BookList deletada → cascade em BookListItem
- Livro deletado → remove capa do R2, renormaliza posições

---

## Autenticação e Segurança

- **Access token:** JWT de curta duração (30 min), enviado via `Authorization: Bearer`, armazenado em memória no browser.
- **Refresh token:** JWT de longa duração (15 dias), armazenado em cookie `HttpOnly; SameSite=Strict; Secure`, rotacionado a cada uso.
- Acesso administrativo validado via entidade `Admin` separada — nunca por campo booleano em `User`.
- O frontend nunca é tratado como camada de confiança para controle de acesso.

---

## Regras de Negócio

- Um usuário não pode ter duas listas com o mesmo nome.
- O mesmo livro não pode aparecer duas vezes na mesma lista.
- Livros são globais: antes de criar, verifica `(title, author)` existente e reusa se encontrado.
- A ordem dos livros em uma lista é persistida no banco via campo `position`.
- Ao remover um item, as posições restantes são renormalizadas.
- Administradores só podem ser criados via entidade `Admin` — não há campo `is_admin` ou `role` em `User`.

---

## Executando o Projeto

### Backend

```bash
cd back-end
npm install
npm run dev          # Servidor com auto-reload
npm run build        # Gera Prisma client + type check
npm run typecheck    # Apenas type check
```

### Frontend

```bash
cd front-end/Sophena
npm install
npm run dev          # Dev server (proxia /api → localhost:3000)
npm run build        # Type check + build de produção
npm run lint         # oxlint + eslint com auto-fix
npm run format       # oxfmt no diretório src/
```

---

## Testes

### Backend

```bash
cd back-end
npm run test              # Todos os testes (unit + integration), concurrency=1
npm run test:auth         # Apenas testes de autenticação

# Arquivo individual
npx tsx --test tests/integration/books/books.test.ts
```

Testes de integração usam um banco PostgreSQL real (`DATABASE_URL_TEST`). Cada arquivo chama `resetDatabase()` antes dos testes e sobe seu próprio servidor HTTP.

### Frontend

```bash
cd front-end/Sophena
npm run test:unit:run     # Vitest (modo CI, sem watch)
npm run test:e2e          # Playwright end-to-end

# Arquivo individual
npx vitest run src/__tests__/specific.spec.ts
```

---

## Variáveis de Ambiente

### Backend (`back-end/.env`)

```env
DATABASE_URL=postgresql://...
DATABASE_URL_TEST=postgresql://...
PORT=3000
CORS_ORIGIN=https://yourdomain.com
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...

# Cloudflare R2 (opcional)
R2_ENDPOINT=https://...
R2_BUCKET_NAME=sophena
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_PUBLIC_BASE_URL=https://...
```

### Frontend (`front-end/Sophena/.env`)

```env
VITE_API_BASE_URL=       # Vazio em dev (usa proxy Vite)
                         # Em produção: https://api.yourdomain.com
```
