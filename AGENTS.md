# AGENTS.md

## Project Name

**Sophena**

---

## Project Overview

Sophena is a private web application for storing and organizing book lists.

The product is focused primarily on mobile devices, but must also provide a good desktop experience.

The main target audience is users with low technological familiarity. Because of that, the interface, flows, validation messages, and interactions must always prioritize clarity, accessibility, and predictability over novelty.

The system allows authenticated users to manage personal book lists and organize books in a persisted order. Books are global entities in the database, while lists belong to individual users.

The system also includes a private administrative area for:
- creating users
- monitoring API activity
- reading logs

---

## Fixed Product Decisions

These decisions are mandatory and must not be changed by the agent.

- The project name is **Sophena**.
- The system is private.
- Users cannot self-register.
- New users can only be created by an administrator.
- Authentication is required to use the application.
- Books are global across the entire system.
- Lists belong to specific users.
- A user cannot have two lists with the same name.
- The same book cannot appear twice in the same list.
- The order of books inside a list must be persisted in the database.
- Administrative access is modeled through a separate `Admin` entity, not through a boolean field inside `User`.
- Authorization and ownership validation must always happen in the back-end.
- The front-end must never be treated as a trusted layer for access control.

---

## Preferred Stack

### Front-end
- Vue.js
- JSX
- Router
- Pinia
- Ionic
- Vitest
- Playwright
- Linter
- Oxfmt
- Yarn

### Back-end
- TypeScript
- Yarn

### Database
- PostgreSQL

---

## Architecture Principles

The implementation must follow these principles:

- Strong typing across the codebase
- Clear modular separation of concerns
- Readable and maintainable code
- Predictable API contracts
- Explicit validation
- Explicit authorization
- Descriptive error handling
- Minimal and necessary API responses only
- No hidden business rules
- No duplicated domain logic across unrelated layers

---



## Language and Localization Rules

The application must use Brazilian Portuguese (pt-BR) as the primary language.

### UI Language
- All user-facing text must be written in Brazilian Portuguese
- This includes:
  - buttons
  - labels
  - menus
  - form fields
  - validation messages
  - error messages
  - confirmation dialogs
  - notifications

### Tone and Style
- The language must be simple and clear
- Avoid technical jargon
- Use accessible and friendly wording
- Prioritize clarity over formal language

### Consistency
- Do not mix English and Portuguese in the UI
- All visible text must be consistent in Portuguese

### Exceptions
The following may remain in English:
- code
- variable names
- API responses
- database schema
- internal logs

### Forbidden Behavior
The agent must never:
- generate UI text in English
- mix languages in user-facing content
- use overly technical or confusing language for users

## Mandatory Testing & Development Flow

The agent must follow a strict test-first development approach.

This flow is mandatory and must not be skipped or reordered.

### Required sequence

The agent must always execute the following steps in order:

1. Understand the requirement
2. Define test cases
3. Write tests
4. Validate test completeness
5. Only after that, implement the feature
6. Ensure all tests pass

The agent must never:
- implement functionality before writing tests
- skip test definition
- write implementation and tests at the same time
- write superficial or incomplete tests

---

## Test-First Rule

Before writing any implementation code:

- all expected behaviors must be covered by tests
- tests must define the correct behavior of the system
- implementation must satisfy the tests, not define them

Tests are the source of truth for behavior.

---

## Required Test Coverage

Every feature must include:

### Functional tests
- happy path (expected correct usage)
- edge cases
- boundary conditions

### Validation tests
- invalid inputs
- missing required fields
- malformed data

### Authorization tests
- access without authentication
- access with insufficient permissions
- admin vs non-admin behavior

### Ownership tests
- accessing own resources (allowed)
- accessing another user's resources (must fail)

### Business rule tests
- duplicate list names for same user (must fail)
- duplicate book in same list (must fail)
- book reuse logic (must reuse existing book)
- position consistency in lists

---

## API Test Requirements

For every endpoint, tests must cover:

- success response
- validation errors
- authorization errors
- edge cases
- business rule violations

All endpoints must have integration-level tests.

---

## Database Behavior Tests

Tests must validate:

- uniqueness constraints
- foreign key constraints
- cascade deletion behavior
- ordering consistency (`position`)
- transaction safety (when applicable)

---

## Reordering Logic Tests

Special attention is required for list ordering.

Tests must verify:

- inserting at end
- inserting at specific position
- moving item up
- moving item down
- removing item and reordering
- moving item between lists
- no duplicate positions
- consistent sequence after operations

---

## Logging Tests

Tests should verify:

- logs are created for important events
- errors generate `ERROR` logs
- invalid access generates `WARN` logs
- successful operations may generate `INFO` logs

---

## Implementation Constraints

Implementation must:

- satisfy all tests
- not bypass tests
- not hardcode values just to pass tests
- not ignore failing tests

---

## Test Quality Rules

Tests must:

- be deterministic
- not depend on execution order
- not rely on shared mutable state
- be isolated when possible
- use clear and descriptive naming

---

## Forbidden Testing Behaviors

The agent must never:

- write tests after implementation
- skip edge case testing
- ignore authorization tests
- ignore ownership validation
- write trivial tests that do not validate real behavior
- mock critical domain logic incorrectly
- remove tests to make code pass

---

## Suggested Workflow for Agent

When implementing a feature:

1. Write tests only
2. Ensure test coverage is complete
3. (Optional) Wait for approval if instructed
4. Implement feature
5. Run tests
6. Fix implementation until all tests pass

---

## Enforcement Note

This testing workflow is mandatory.

If there is a conflict between speed and correctness:
- correctness and test coverage must always be prioritized

The agent must not skip this process under any circumstance.

## Domain Model

### User
Represents a normal authenticated user of the system.

Fields:
- `id: string` (`PK`, `unique`, `not_null`)
- `user_name: string` (`unique`, `not_null`)
- `password_hash: string` (`not_null`)
- `created_at: timestamp` (`not_null`)
- `updated_at: timestamp` (`not_null`)

### Admin
Represents administrative permission through a dedicated entity.

Fields:
- `id: string` (`PK`, `unique`, `not_null`)
- `user_id: string` (`FK -> User.id`, `unique`, `not_null`)
- `created_at: timestamp` (`not_null`)
- `updated_at: timestamp` (`not_null`)

### Book
Represents a global book shared across the system.

Fields:
- `id: string` (`PK`, `unique`, `not_null`)
- `title: string` (`not_null`)
- `author: string` (`not_null`)
- `cover_url: string` (`nullable`)
- `created_at: timestamp` (`not_null`)
- `updated_at: timestamp` (`not_null`)

Constraints:
- `unique(title, author)`

### Book_List
Represents a user-owned list of books.

Fields:
- `id: string` (`PK`, `unique`, `not_null`)
- `name: string` (`not_null`)
- `user_id: string` (`FK -> User.id`, `not_null`)
- `created_at: timestamp` (`not_null`)
- `updated_at: timestamp` (`not_null`)

Constraints:
- `unique(user_id, name)`

### Book_List_Item
Represents the association between a book and a specific user list, including persisted ordering.

Fields:
- `id: string` (`PK`, `unique`, `not_null`)
- `list_id: string` (`FK -> Book_List.id`, `not_null`)
- `book_id: string` (`FK -> Book.id`, `not_null`)
- `position: int` (`not_null`)
- `created_at: timestamp` (`not_null`)
- `updated_at: timestamp` (`not_null`)

Constraints:
- `unique(list_id, book_id)`
- `unique(list_id, position)`

### Log
Represents API logs for monitoring and auditing.

Fields:
- `id: string` (`PK`, `unique`, `not_null`)
- `level: string` (`not_null`, allowed: `INFO | WARN | ERROR`)
- `status_code: int` (`not_null`)
- `message: string` (`nullable`)
- `route: string` (`nullable`)
- `method: string` (`nullable`, allowed: `GET | POST | PUT | PATCH | DELETE`)
- `user_id: string` (`FK -> User.id`, `nullable`)
- `created_at: timestamp` (`not_null`)

---

## Relationship Rules

- One `User` can own many `Book_List`.
- One `User` can have zero or one `Admin` record.
- One `Admin` must belong to exactly one `User`.
- One `Book_List` must belong to exactly one `User`.
- One `Book_List` can contain many `Book_List_Item`.
- One `Book` can appear in many `Book_List_Item`.
- One `Book_List_Item` must belong to exactly one `Book_List`.
- One `Book_List_Item` must point to exactly one `Book`.
- One `Log` may optionally reference a `User`.

---

## Deletion Rules

### User deletion
When deleting a `User`:
- delete the associated `Admin` record in cascade, if it exists
- delete all `Book_List` records owned by the user in cascade
- delete all related `Book_List_Item` records through list cascade
- keep `Log` records for audit purposes
- set `Log.user_id` to `null`

### Admin deletion
When deleting an `Admin`:
- only remove administrative permission
- do not delete the underlying `User`

### Book_List deletion
When deleting a `Book_List`:
- delete all related `Book_List_Item` records in cascade

### Book deletion
When deleting a `Book`:
- block deletion if the book is referenced by any `Book_List_Item`
- the system must not delete a global book that is still being used

### Log deletion
- logs should generally be preserved
- logs must not be automatically deleted due to normal user deletion

---

## Business Invariants

These rules must never be violated.

### User and Admin invariants
- `user_name` must be unique across the system
- one user cannot have more than one `Admin` record
- only users with an existing `Admin` record are administrators
- administrative authorization must be resolved in the back-end

### Book invariants
- books are global
- books must not be duplicated logically
- logical uniqueness is defined by `title + author`
- before creating a book, the back-end must check whether a book with the same `title` and `author` already exists

### Book list invariants
- a user cannot have two lists with the same name
- a list always belongs to exactly one user
- a non-admin user cannot read, update, or delete another user’s lists

### Book list item invariants
- the same book cannot appear twice in the same list
- `position` must be unique inside a list
- every item must reference an existing list
- every item must reference an existing book
- list ordering must be persisted in the database
- the front-end must consume the persisted ordering instead of creating its own authoritative ordering

### Log invariants
- `level` can only be `INFO`, `WARN`, or `ERROR`
- `method` can only be `GET`, `POST`, `PUT`, `PATCH`, or `DELETE`
- important API events should be logged, especially:
  - authentication attempts
  - authorization failures
  - validation failures
  - administrative actions
  - internal server errors

---

## Authentication Rules

The system must use:
- short-lived access token
- refresh token rotation

### Token storage rules
- Access token must be stored in browser memory
- Refresh token must be stored in `HttpOnly` cookie
- Refresh token cookie must be `SameSite=Strict`
- Refresh token cookie must be `Secure`

### Token lifecycle
- Access token lifetime: 30 minutes
- Refresh token lifetime: 15 days
- Every refresh token use must:
  - issue a new refresh token
  - invalidate the previous refresh token

### Security requirements
- never expose refresh token to JavaScript
- never trust the front-end to decide whether a token is valid
- authentication and token validation must happen in the back-end

---

## Authorization Rules

### Normal user permissions
Normal users may:
- read their own lists
- create their own lists
- rename their own lists
- delete their own lists
- add books to their own lists
- remove books from their own lists
- reorder books inside their own lists
- move books between their own lists

Normal users may not:
- access administrative routes
- access another user’s lists
- modify another user’s items
- retrieve sensitive data from other users

### Admin permissions
Administrators may:
- create users
- read system logs
- access monitoring features
- access admin-only routes

Admin rights must be validated by checking whether the authenticated user has a corresponding `Admin` record.

---

## Book Creation and Reuse Rules

### Existing book usage
If the selected book already exists in the database:
- do not create a duplicate `Book`
- only create the `Book_List_Item`

### Manual book creation
When the user manually provides book data:
1. normalize input minimally using trimming
2. search for an existing `Book` with the same `title` and `author`
3. if found:
   - reuse the existing `Book`
   - create only the `Book_List_Item`
4. if not found:
   - create the `Book`
   - create the `Book_List_Item`

### Duplicate insertion prevention
When adding a book to a list:
- prevent duplication of the same `book_id` in the same `list_id`
- return a clear validation error if violated

---

## Ordering Rules

Ordering is authoritative in the database.

### Insertion
When inserting a new `Book_List_Item`:
- if a target position is not provided, insert at the end of the list
- default position must be `max(position) + 1` for that list

### Reordering within the same list
When moving an item inside the same list:
- update the moved item’s `position`
- shift the impacted items accordingly
- maintain unique positions within the list
- do not leave duplicated positions

### Removing an item
When removing an item:
- re-normalize the positions of remaining items when necessary
- the resulting ordering must remain valid and deterministic

### Moving a book between lists
When moving a book from one list to another:
- remove the item from the source list
- create or place the item in the destination list
- update positions in both lists consistently
- never leave inconsistent ordering states

---

## Logging Rules

The API must support logging for monitoring and auditing.

### Required log categories
At minimum, logs should cover:
- authentication events
- refresh attempts
- authorization failures
- validation failures
- administrative actions
- unexpected internal errors

### Suggested level usage
- `INFO`: successful relevant operations
- `WARN`: suspicious or denied operations without internal failure
- `ERROR`: failed operations caused by server-side or infrastructure issues

### Logging safety
- logs must not expose password hashes
- logs must not expose raw refresh tokens
- logs must not leak sensitive private data unnecessarily

---

## Front-end Rules

The front-end must prioritize clarity and accessibility.

### UX rules
- the UI must be simple and friendly for low-technical users
- interactions must be explicit
- dangerous actions must require confirmation
- error feedback must be understandable
- feedback should avoid technical jargon when possible

### Book list visualization
The application should not use kanban as the authoritative structure.

Preferred interaction model:
- simple list-based or section-based visualization
- clear buttons or menu actions for moving books
- readable ordering based on persisted `position`

### Optimistic updates
For create, update, delete, move, and reorder operations:
- the front-end may update the UI optimistically
- the API request should happen in parallel
- if the request fails:
  - rollback the visual change
  - show clear feedback to the user

### Confirmation dialogs
Deleting a list or removing a book from a list must require a confirmation dialog that:
- clearly explains the action
- clearly states the consequence
- minimizes accidental destructive actions

---

## API Design Rules

These rules guide the implementation of the API.

### General API behavior
- responses must be minimal and relevant
- validation errors must be explicit
- authorization errors must use correct HTTP status codes
- internal failures must be logged
- no endpoint should leak unnecessary fields

### Response style
- return clear success responses
- return descriptive error messages
- do not expose sensitive internal details
- do not expose password hashes
- do not expose refresh tokens
- do not expose private data from other users

### Validation style
- validate all required fields
- validate ownership in the back-end
- validate list existence in the back-end
- validate book existence or creation rules in the back-end
- validate duplicate constraints before attempting writes when possible

---

## Forbidden Behaviors

The agent must never do any of the following.

### Domain violations
- do not replace `Admin` with `is_admin` or `role` in `User`
- do not remove `position` from `Book_List_Item`
- do not make ordering authoritative only in the front-end
- do not allow duplicated books in the same list
- do not allow duplicated list names for the same user
- do not create duplicate books with the same `title + author`

### Security violations
- do not validate admin access only in the front-end
- do not validate ownership only in the front-end
- do not expose password hashes
- do not expose refresh tokens to JavaScript
- do not expose another user’s data
- do not return more data than necessary

### Architecture violations
- do not hide core business rules only in UI logic
- do not invent undocumented columns unless necessary and justified
- do not silently change naming conventions
- do not bypass validation because the database already has constraints
- do not write ambiguous logic that depends on the client behaving correctly

---

## Allowed Extensions

The agent may add implementation details only if they do not change domain decisions.

Examples of acceptable additions:
- indexes for performance
- repository/service/controller separation
- DTOs and validators
- transaction handling for reorder operations
- normalization helpers for `title` and `author`
- pagination for logs
- rate limiting for authentication endpoints
- caching for lightweight book search if justified

These additions must preserve all fixed rules from this document.

---

## Canonical Naming Rules

The agent must use the following canonical database entity names:

- `User`
- `Admin`
- `Book`
- `Book_List`
- `Book_List_Item`
- `Log`

Canonical field names:
- `id`
- `user_name`
- `password_hash`
- `created_at`
- `updated_at`
- `user_id`
- `title`
- `author`
- `cover_url`
- `name`
- `list_id`
- `book_id`
- `position`
- `level`
- `status_code`
- `message`
- `route`
- `method`

Do not rename these unless explicitly instructed.

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

## Final Summary for the Agent

Implement **Sophena** as a private authenticated book list system with:

- global books
- per-user book lists
- no duplicate list names per user
- no duplicate books inside the same list
- persisted ordering via `Book_List_Item.position`
- admin modeled as a separate entity
- short-lived access token
- rotating refresh token
- strict back-end authorization
- descriptive error handling
- admin-only monitoring and logging support

Do not reinterpret these decisions.
