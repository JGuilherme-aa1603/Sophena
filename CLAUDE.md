# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sophena is a mobile-first book list management app where users organize their reading. Users create personal book lists, search/add books, reorder items, and move books between lists. Admin users can create accounts and monitor activity.

**Stack:** Vue 3 + TypeScript + Ionic + Pinia (frontend) · Express + TypeScript + Prisma + PostgreSQL (backend) · Cloudflare R2 (image storage)

---

## Commands

### Backend (`back-end/`)

```bash
npm run dev          # Dev server with auto-reload (tsx watch)
npm run build        # Generate Prisma client + type check
npm run typecheck    # Type check only
npm run test         # Run all tests (unit + integration), concurrency=1
npm run test:auth    # Run only auth integration tests
```

**Run a single test file:**
```bash
npx tsx --test tests/integration/books/books.test.ts
```

### Frontend (`front-end/Sophena/`)

```bash
npm run dev           # Vite dev server (proxies /api → localhost:3000)
npm run build         # Type check + production build
npm run type-check    # Vue type check only (vue-tsc)
npm run test:unit:run # Run Vitest once (non-watch, for CI)
npm run test:e2e      # Playwright e2e tests
npm run lint          # oxlint + eslint with auto-fix
npm run format        # oxfmt formatter on src/
```

**Run a single unit test:**
```bash
npx vitest run src/__tests__/specific.spec.ts
```

---

## Backend Architecture

Each feature lives in `src/modules/<module>/` and follows a strict four-layer structure:

```
modules/<module>/
├── domain/           # Types and entities (no dependencies)
├── application/      # Service class + error types + repository interface
├── infrastructure/   # Prisma repository implementation
├── presentation/http/ # Express router
└── composition/      # Factory function wiring all layers (DI)
```

**Modules:** `auth`, `admin`, `books`, `lists`, `list-items`, `logs`, `uploads`

### Key Patterns

**Services** return data or throw typed errors — never a `{success, data}` wrapper:
```typescript
async readLists(user: AuthenticatedUserView): Promise<BookListView[]>
// Throws ResourceNotFoundError, ValidationError, etc.
```

**Routers** use `createXxxRouter()` factory that receives dependencies and returns an Express Router. Error handling maps typed errors to HTTP status codes within each router.

**Ownership validation** always fetches first, then checks ownership via `getOwnedListOrFail()` — both not-found and unauthorized return 404 to prevent enumeration.

**Response mapping** uses `to*View()` functions to strip internal fields (user_id, password_hash) before sending to client.

**Transactions (Prisma)** are used for: book reordering, moving books between lists, list deletion with items, token rotation.

### Authentication

- Access token: short-lived JWT, sent in `Authorization: Bearer` header
- Refresh token: long-lived, stored as HttpOnly cookie, rotated on every refresh (old token marked `revoked_at`)
- `requireAuthenticatedUser` middleware guards protected routes

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 201 | Created |
| 400 | Validation failure (with field-level errors array) |
| 401 | Missing/invalid authentication |
| 404 | Not found or not owned by user |
| 409 | Conflict (duplicate list name, book already in list) |

### Testing (Backend)

Tests use Node.js native test runner with a real PostgreSQL test database (`DATABASE_URL_TEST` env var). Each test file:
1. Calls `resetDatabase()` before tests to clear state
2. Starts its own HTTP server via `startHttpServer(createApp())`
3. Uses `assert/strict` for assertions

---

## Frontend Architecture

### Directory Layout

```
src/
├── lib/api/        # API request functions (one file per module)
├── stores/         # Pinia stores (one per feature area)
├── views/          # Page-level components
├── components/     # Reusable components (grouped by feature)
└── router/         # Vue Router config with auth guards
```

### Key Patterns

**API layer** — each module exports typed async functions using `requestJson()`:
```typescript
export async function fetchListsRequest(accessToken: string): Promise<{items: UserList[]}> {
  return requestJson('/lists', { headers: { Authorization: `Bearer ${accessToken}` } })
}
```
All requests include `credentials: 'include'` for the refresh cookie. `ApiError` is thrown on non-2xx responses.

**Pinia stores** separate state, actions, and error mapping. Stores translate `ApiError` status codes into user-facing Portuguese error strings. Loading states use dedicated flags (`isLoading`, `isCreating`, `isUpdating`, `isDeleting`).

**Components** use `<script setup>` + SFC. Props are typed with `defineProps<T>()` and `withDefaults()`.

**API URL** is controlled by `VITE_API_BASE_URL`. The dev Vite server proxies `/api` to `http://localhost:3000`.

---

## Database Schema — Important Constraints

- **Book**: unique on `(title, author)` — books are a global shared resource, immutable once created
- **BookList**: unique on `(user_id, name)`
- **BookListItem**: unique on `(list_id, book_id)` and `(list_id, position)` — position is an explicit integer, not relational ordering; gaps must be normalized after deletes
- **RefreshToken**: tracks `revoked_at` for token rotation
- **Admin**: separate table (one-to-one with User) rather than a role field on User

---

## Environment Variables (Backend)

Required in `back-end/.env`:
```
DATABASE_URL=postgresql://...
DATABASE_URL_TEST=postgresql://...
PORT=3000
CORS_ORIGIN=https://yourdomain.com
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
```

Optional (Cloudflare R2):
```
R2_ENDPOINT=https://...
R2_BUCKET_NAME=sophena
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_PUBLIC_BASE_URL=https://...
```
