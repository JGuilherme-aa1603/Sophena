# PRD.md

## Project Name

**Sophena**

---

## Product Summary

Sophena is a private application that helps users organize their reading through personal book lists.

The product is designed primarily for mobile usage, but it must also work well on desktop. The main audience is people with low technological familiarity, so the product must be simple, clear, and predictable.

The core experience is centered around creating lists, adding books, organizing their order, and moving books between lists in an easy way.

---

## Problem Statement

Many users want a simple way to organize what they have read, what they are currently reading, and what they want to read, but existing tools are often too complex, too visually noisy, or not adapted for users with limited technical familiarity.

Sophena solves this by offering a private, focused, and accessible system for book list management.

---

## Product Goals

- Allow users to create and manage personal book lists
- Allow users to add books easily, whether already existing or manually created
- Preserve the order of books inside lists
- Provide a clear and simple experience for low-tech users
- Ensure secure access through authentication and back-end authorization
- Provide administrators with user creation and monitoring tools

---

## Non-Goals

- Public social network features
- Public user registration
- Community reviews or ratings
- Public sharing of private lists
- Complex gamification systems
- Marketplace or book purchasing features

---

## Target Audience

Primary audience:
- users with low technological familiarity
- users who want simple reading organization
- users who use mobile devices frequently

Secondary audience:
- administrators responsible for creating users and monitoring system activity

---

## Core Features

### Authentication
- Login with `user_name` and password
- Access token with short lifetime
- Refresh token rotation
- Secure session handling

### Book Lists
- Create list
- Rename list
- Delete list
- Prevent duplicate list names per user

### Books
- Search existing books
- Add existing books to a list
- Create manual books when needed
- Reuse equivalent books instead of duplicating them

### List Items
- Add books to a list
- Remove books from a list
- Move books between lists
- Reorder books inside a list
- Persist ordering in the database using `position`

### Admin Area
- Create users
- Optionally create admin users
- Read logs
- Access monitoring features

### Logging and Monitoring
- Log authentication attempts
- Log authorization failures
- Log validation failures
- Log internal errors
- Support real-time monitoring for administrators

---

## User Experience Principles

- Prioritize clarity over novelty
- Avoid visually noisy or complex interactions
- Prefer simple list-based layouts over kanban-style interactions
- Destructive actions must require confirmation
- Every important action must provide feedback
- Error messages must be understandable to non-technical users

---

## Key Product Decisions

- The system is private
- Users cannot self-register
- Books are global
- Lists are user-owned
- The same book cannot appear twice in the same list
- The same user cannot have two lists with the same name
- Order is persisted in the database, not only in the front-end
- Admin permissions are modeled through a separate `Admin` entity

---

## Functional Requirements

### FR-01 Authentication
The system must authenticate users with `user_name` and password.

### FR-02 Secure Session
The system must use a short-lived access token and a rotating refresh token.

### FR-03 User-Owned Lists
The system must allow authenticated users to create and manage their own lists.

### FR-04 Global Books
The system must treat books as global entities shared across the system.

### FR-05 Duplicate Prevention
The system must prevent duplicate books inside the same list.

### FR-06 Persisted Ordering
The system must store authoritative ordering using `Book_List_Item.position`.

### FR-07 Admin User Creation
The system must allow administrators to create users.

### FR-08 Admin Monitoring
The system must allow administrators to access logs and monitoring features.

### FR-09 Ownership Validation
The back-end must validate ownership of lists and items.

### FR-10 Descriptive Errors
The system must return clear and descriptive error messages.

---

## Non-Functional Requirements

### NFR-01 Accessibility
The interface must remain understandable and usable for low-tech users.

### NFR-02 Security
Authorization and access validation must always happen in the back-end.

### NFR-03 Maintainability
The codebase must be modular, typed, and maintainable.

### NFR-04 Consistency
List ordering and duplicate rules must remain consistent under normal operations.

### NFR-05 Observability
The API must support logs for auditing and monitoring.

---

## Main Flows

### Flow 1: User login
1. User enters `user_name` and password
2. System validates credentials
3. System returns access token
4. System sets refresh token cookie
5. User enters the authenticated area

### Flow 2: Create list
1. User opens list area
2. User enters a name
3. System validates uniqueness for that user
4. System creates list
5. List appears in the interface

### Flow 3: Add existing book to list
1. User selects a list
2. User searches a book
3. User selects one result
4. System validates duplication rule
5. System inserts the book into the list
6. Book appears in the correct order

### Flow 4: Add manual book to list
1. User selects a list
2. User enters title, author, and optional cover URL
3. System checks whether equivalent book already exists
4. If found, system reuses it
5. If not found, system creates it
6. System inserts the book into the list

### Flow 5: Reorder books
1. User changes the position of a book
2. System updates ordering in the database
3. System returns the updated state
4. Interface reflects the new order

### Flow 6: Admin creates user
1. Admin logs in
2. Admin accesses the user creation area
3. Admin submits new user data
4. System creates `User`
5. If requested, system also creates `Admin`

### Flow 7: Admin reads logs
1. Admin logs in
2. Admin opens logs page
3. System validates admin permission
4. System returns filtered logs

---

## Risks and Constraints

### Risk: Complexity of ordering
Persisted ordering introduces extra logic for insert, remove, move, and reorder operations.

Mitigation:
- use transactions
- validate positions
- normalize ordering after structural changes when needed

### Risk: Duplicate book creation
Manual book creation can cause accidental duplication.

Mitigation:
- enforce `unique(title, author)`
- reuse equivalent books whenever possible

### Risk: Low-tech user confusion
Too many options or visually dense interactions can reduce usability.

Mitigation:
- keep the UI simple
- avoid kanban as the main interaction model
- use confirmations and clear feedback

---

## Success Criteria

A first version of Sophena is successful if:
- users can authenticate securely
- users can create and manage lists without confusion
- users can add, move, remove, and reorder books reliably
- duplicate rules are enforced consistently
- administrators can create users
- administrators can inspect logs and monitoring information

---

## Delivery Priorities

### Priority 1
- authentication
- user-owned lists
- add existing/manual books
- duplicate prevention
- persisted ordering

### Priority 2
- moving books between lists
- improved log filters
- real-time monitoring

### Priority 3
- UI refinements
- search improvements
- performance optimizations

---

## Summary

Sophena is a private, mobile-first book list manager designed for simplicity, security, and clarity. It must help low-tech users organize reading through user-owned lists, shared global books, persisted ordering, and a secure admin-controlled environment.
