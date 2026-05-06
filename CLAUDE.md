# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sophena is a private mobile-first web application for storing and organizing book lists. Users create personal book lists, search/add books, reorder items, and move books between lists. Admin users can create accounts and monitor activity.

The main target audience is users with low technological familiarity. The interface, flows, validation messages, and interactions must always prioritize clarity, accessibility, and predictability over novelty.

**Stack:** Vue 3 + TypeScript + Ionic + Pinia (frontend) · Express + TypeScript + Prisma + PostgreSQL (backend) · Cloudflare R2 (image storage)

---

## Fixed Product Decisions

These decisions are mandatory and must not be changed.

- The project name is **Sophena**.
- The system is private.
- Users cannot self-register — new users can only be created by an administrator.
- Authentication is required to use the application.
- Books are global across the entire system; lists belong to specific users.
- A user cannot have two lists with the same name.
- The same book cannot appear twice in the same list.
- The order of books inside a list must be persisted in the database.
- Administrative access is modeled through a separate `Admin` entity, not a boolean field on `User`.
- Authorization and ownership validation must always happen in the back-end.
- The front-end must never be treated as a trusted layer for access control.

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

## Architecture Principles

- Strong typing across the codebase
- Clear modular separation of concerns
- Readable and maintainable code
- Predictable API contracts
- Explicit validation and explicit authorization
- Descriptive error handling
- Minimal and necessary API responses only
- No hidden business rules
- No duplicated domain logic across unrelated layers

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

- Access token: short-lived JWT (30 min), sent in `Authorization: Bearer` header, stored in browser memory
- Refresh token: long-lived (15 days), stored as `HttpOnly; SameSite=Strict; Secure` cookie, rotated on every use (old token marked `revoked_at`)
- `requireAuthenticatedUser` middleware guards protected routes
- Never expose refresh token to JavaScript; never trust the front-end to decide token validity

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

## Language and Localization Rules

The application must use Brazilian Portuguese (pt-BR) as the primary language.

- All user-facing text must be in pt-BR: buttons, labels, menus, form fields, validation messages, error messages, confirmation dialogs, notifications
- Language must be simple and clear — avoid technical jargon, use accessible and friendly wording
- Do not mix English and Portuguese in the UI

**Exceptions** — the following may remain in English: code, variable names, API responses, database schema, internal logs.

**Forbidden:** generating UI text in English, mixing languages in user-facing content, using overly technical language for users.

---

## Database Schema — Domain Model

### Canonical Entity Names

- `User`, `Admin`, `Book`, `Book_List`, `Book_List_Item`, `Log`

### Schemas

**User** — normal authenticated user
- `id`, `user_name` (unique), `password_hash`, `created_at`, `updated_at`

**Admin** — administrative permission via dedicated entity
- `id`, `user_id` (FK → User, unique), `created_at`, `updated_at`

**Book** — global shared book
- `id`, `title`, `author`, `cover_url` (nullable), `created_at`, `updated_at`
- Constraint: `unique(title, author)`

**Book_List** — user-owned list
- `id`, `name`, `user_id` (FK → User), `created_at`, `updated_at`
- Constraint: `unique(user_id, name)`

**Book_List_Item** — association with persisted ordering
- `id`, `list_id` (FK → Book_List), `book_id` (FK → Book), `position` (int), `created_at`, `updated_at`
- Constraints: `unique(list_id, book_id)`, `unique(list_id, position)`
- `position` is an explicit integer, not relational ordering; gaps must be normalized after deletes

**Log** — API monitoring and auditing
- `id`, `level` (INFO | WARN | ERROR), `status_code`, `message` (nullable), `route` (nullable), `method` (nullable, GET | POST | PUT | PATCH | DELETE), `user_id` (FK → User, nullable), `created_at`

**RefreshToken** — tracks `revoked_at` for token rotation

**Admin** — separate table (one-to-one with User) rather than a role field on User

### Relationship Rules

- One `User` → many `Book_List`; zero or one `Admin`
- One `Book_List` → many `Book_List_Item`; belongs to exactly one `User`
- One `Book` → many `Book_List_Item`
- One `Log` may optionally reference a `User`

### Deletion Rules

- **User deletion:** cascade-delete `Admin`, `Book_List`, `Book_List_Item`; keep `Log` records, set `Log.user_id` to null
- **Admin deletion:** remove only administrative permission; do not delete the `User`
- **Book_List deletion:** cascade-delete all `Book_List_Item` records
- **Book deletion:** admin-only; remove book cover from external storage if managed; re-normalize positions of affected lists
- **Log deletion:** logs must be preserved for audit purposes; logs must not be automatically deleted due to normal user deletion

---

## Business Invariants

- `user_name` must be unique across the system
- One user cannot have more than one `Admin` record
- Books are global and must not be logically duplicated — uniqueness defined by `title + author`
- Before creating a book, check for existing `(title, author)` match and reuse if found
- A user cannot have two lists with the same name
- A non-admin user cannot read, update, or delete another user's lists
- The same book cannot appear twice in the same list
- `position` must be unique inside a list; ordering must be persisted and consumed from the database
- `level` can only be `INFO`, `WARN`, or `ERROR`
- `method` can only be `GET`, `POST`, `PUT`, `PATCH`, or `DELETE`

---

## Authorization Rules

**Normal users may:**
- Read, create, rename, delete their own lists
- Add, remove, reorder books in their own lists
- Move books between their own lists

**Normal users may not:**
- Access administrative routes
- Access or modify another user's lists or items

**Administrators may:**
- Create users, read system logs, access monitoring features, access admin-only routes

Admin rights must be validated by checking whether the authenticated user has a corresponding `Admin` record in the back-end.

---

## Book Creation and Reuse Rules

1. Normalize input minimally (trim)
2. Search for an existing `Book` with the same `title` and `author`
3. If found: reuse the existing `Book`, create only the `Book_List_Item`
4. If not found: create the `Book`, then create the `Book_List_Item`
5. Prevent duplicate `book_id` in the same `list_id` — return a clear validation error if violated

---

## Ordering Rules

- If no target position is provided on insert, default to `max(position) + 1`
- When moving an item within the same list: update position, shift impacted items, maintain unique positions
- When removing an item: re-normalize remaining positions to keep ordering valid and deterministic
- When moving a book between lists: remove from source, insert in destination, update positions in both lists consistently

---

## Logging Rules

Logs must cover at minimum: authentication events, refresh attempts, authorization failures, validation failures, administrative actions, unexpected internal errors.

- `INFO`: successful relevant operations
- `WARN`: suspicious or denied operations without internal failure
- `ERROR`: failed operations caused by server-side or infrastructure issues

Logs must not expose password hashes, raw refresh tokens, or sensitive private data.

---

## Front-end Rules

- UI must be simple and friendly for low-technical users
- Dangerous actions (deleting a list, removing a book from a list) must require a confirmation dialog that clearly explains the action, clearly states the consequence, and minimizes accidental destructive actions
- Error feedback must be understandable — avoid technical jargon
- Use simple list-based or section-based visualization (not kanban as the authoritative structure)
- Book ordering must be read from the persisted `position` in the database

### Optimistic Updates

For create, update, delete, move, and reorder operations:
- Update the UI optimistically; fire the API request in parallel
- If the request fails: rollback the visual change and show clear feedback to the user

---

## API Design Rules

- Responses must be minimal and relevant — no unnecessary fields
- Validation errors must be explicit with field-level detail
- Authorization errors must use correct HTTP status codes
- Internal failures must be logged
- Never expose password hashes, refresh tokens, or private data from other users
- Validate all required fields, ownership, list existence, and book creation rules in the back-end

---

## Mandatory Testing & Development Flow

This flow is mandatory and must not be skipped or reordered.

1. Understand the requirement
2. Define test cases
3. Write tests
4. Validate test completeness
5. Only after that, implement the feature
6. Ensure all tests pass

### Test-First Rule

Before writing any implementation code:

- All expected behaviors must be covered by tests
- Tests must define the correct behavior of the system
- Implementation must satisfy the tests, not define them

Tests are the source of truth for behavior.

The agent must never:
- implement functionality before writing tests
- skip test definition
- write implementation and tests at the same time
- write superficial or incomplete tests

---

### Required Test Coverage

Every feature must include:

- **Functional:** happy path, edge cases, boundary conditions
- **Validation:** invalid inputs, missing required fields, malformed data
- **Authorization:** access without authentication, access with insufficient permissions, admin vs non-admin
- **Ownership:** accessing own resources (allowed), accessing another user's resources (must fail)
- **Business rules:** duplicate list names, duplicate book in list, book reuse logic, position consistency
- **API endpoints:** success response, validation errors, authorization errors, edge cases, business rule violations
- **Database:** uniqueness constraints, foreign key constraints, cascade deletion, ordering consistency, transaction safety

All endpoints must have integration-level tests.

### Reordering Logic Tests

Special attention is required for list ordering. Tests must verify:

- inserting at end
- inserting at a specific position
- moving item up
- moving item down
- removing item and reordering
- moving item between lists
- no duplicate positions
- consistent sequence after operations

### Logging Tests

Tests should verify:

- logs are created for important events
- errors generate `ERROR` logs
- invalid access generates `WARN` logs
- successful operations generate `INFO` logs

### Implementation Constraints

Implementation must:

- satisfy all tests
- not bypass tests
- not hardcode values just to pass tests
- not ignore failing tests

### Test Quality Rules

- Tests must be deterministic and not depend on execution order
- Tests must not rely on shared mutable state
- Use clear and descriptive naming

### Forbidden Testing Behaviors

- Writing tests after implementation
- Skipping edge case, authorization, or ownership tests
- Writing trivial tests that do not validate real behavior
- Mocking critical domain logic incorrectly
- Removing tests to make code pass

### Enforcement Note

This testing workflow is mandatory. If there is a conflict between speed and correctness, correctness and test coverage must always be prioritized. The agent must not skip this process under any circumstance.

---

## Commit Workflow

When finishing any task:

- Create a Git commit before handing the task back to the user
- Use the Conventional Commits style established in the project history
- Always include a scope in parentheses specifying which part of the monorepo was changed:
  - `feat(back-end): ...` for backend-only changes
  - `feat(front-end): ...` for frontend-only changes
  - `fix(front-end/tests): ...` for frontend test changes
  - `fix(back-end/tests): ...` for backend test changes
  - Use nested scopes (e.g. `front-end/tests`) when the change is scoped to a sub-area
- Keep each commit focused on the completed task
- Do not include unrelated changes in the commit
- If the task requires multiple distinct phases, commit each completed phase separately

---

## Forbidden Behaviors

### Domain violations
- Do not replace `Admin` with `is_admin` or `role` in `User`
- Do not remove `position` from `Book_List_Item`
- Do not make ordering authoritative only in the front-end
- Do not allow duplicated books in the same list or duplicated list names per user
- Do not create duplicate books with the same `title + author`

### Security violations
- Do not validate admin access or ownership only in the front-end
- Do not expose password hashes, refresh tokens, or another user's data
- Do not return more data than necessary

### Architecture violations
- Do not hide core business rules only in UI logic
- Do not invent undocumented columns without justification
- Do not silently change naming conventions
- Do not bypass application-level validation because the database has constraints
- Do not write logic that depends on the client behaving correctly

---

## Allowed Extensions

Acceptable additions that do not change domain decisions:
- Indexes for performance
- DTOs and validators
- Transaction handling for reorder operations
- Normalization helpers for `title` and `author`
- Pagination for logs
- Rate limiting for authentication endpoints
- Caching for lightweight book search if justified

---

## Canonical Naming Rules

Do not rename these unless explicitly instructed.

**Entities:** `User`, `Admin`, `Book`, `Book_List`, `Book_List_Item`, `Log`

**Fields:** `id`, `user_name`, `password_hash`, `created_at`, `updated_at`, `user_id`, `title`, `author`, `cover_url`, `name`, `list_id`, `book_id`, `position`, `level`, `status_code`, `message`, `route`, `method`

---

## Final Priority Order

When trade-offs appear, prioritize in this order:

1. Security
2. Correctness of domain rules
3. Data consistency
4. Clear API behavior
5. Accessibility and clarity of UX
6. Performance optimizations
7. Visual polish

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
