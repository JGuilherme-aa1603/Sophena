# API-CONTRACTS.md

## Project Name

**Sophena**

---

## API Conventions

- All authenticated routes require a valid access token
- Refresh token must be provided through secure `HttpOnly` cookie
- Authorization and ownership validation must always happen in the back-end
- Responses must be minimal and relevant
- Errors must be descriptive but safe

Suggested status codes:
- `200` success
- `201` created
- `400` invalid request
- `401` unauthenticated
- `403` unauthorized
- `404` resource not found or not accessible
- `409` uniqueness or business rule conflict
- `500` internal server error

---

## Auth

### POST `/auth/login`

Request:
```json
{
  "user_name": "string",
  "password": "string"
}
```

Response:
```json
{
  "access_token": "string",
  "user": {
    "id": "string",
    "user_name": "string",
    "is_admin": true
  }
}
```

Rules:
- set refresh token in secure `HttpOnly` cookie
- never return refresh token in body
- invalid credentials must return safe message

---

### POST `/auth/refresh`

Request:
- no body

Response:
```json
{
  "access_token": "string"
}
```

Rules:
- rotate refresh token
- invalidate old refresh token
- set new refresh cookie

---

### POST `/auth/logout`

Request:
- no body

Response:
```json
{
  "message": "Logout successful"
}
```

Rules:
- invalidate current refresh token
- clear refresh cookie

---

### GET `/auth/me`

Response:
```json
{
  "id": "string",
  "user_name": "string",
  "is_admin": true
}
```

Rules:
- use access token authentication
- do not expose sensitive fields

---

## Admin

### POST `/admin/users`

Admin-only.

Request:
```json
{
  "user_name": "string",
  "password": "string",
  "is_admin": false
}
```

Response:
```json
{
  "id": "string",
  "user_name": "string",
  "is_admin": false,
  "created_at": "timestamp"
}
```

Rules:
- only admins may call this route
- hash password before persistence
- if `is_admin` is true, create both `User` and `Admin`
- enforce unique `user_name`

---

## Books

### GET `/books`

Query params:
- `search` optional
- `author` optional
- `cover` optional (`with | without`)

Response:
```json
{
  "items": [
    {
      "id": "string",
      "title": "string",
      "author": "string",
      "cover_url": "string"
    }
  ]
}
```

Rules:
- lightweight search by title and author
- `author` filters by partial author match
- `cover=with` returns only books with a cover URL
- `cover=without` returns only books without a cover URL
- do not return unnecessary data

---

### POST `/books`

Request:
```json
{
  "title": "string",
  "author": "string",
  "cover_url": "string"
}
```

Response:
```json
{
  "id": "string",
  "title": "string",
  "author": "string",
  "cover_url": "string"
}
```

Rules:
- before creating, check whether equivalent book already exists using `title + author`
- if equivalent book exists, reuse it instead of duplicating it

---

## Lists

### GET `/lists`

Response:
```json
{
  "items": [
    {
      "id": "string",
      "name": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

Rules:
- normal users only see their own lists

---

### POST `/lists`

Request:
```json
{
  "name": "string"
}
```

Response:
```json
{
  "id": "string",
  "name": "string",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

Rules:
- enforce uniqueness of list name per user

---

### PATCH `/lists/:listId`

Request:
```json
{
  "name": "string"
}
```

Response:
```json
{
  "id": "string",
  "name": "string",
  "updated_at": "timestamp"
}
```

Rules:
- validate ownership
- enforce uniqueness within user scope

---

### DELETE `/lists/:listId`

Response:
```json
{
  "message": "List deleted successfully"
}
```

Rules:
- validate ownership
- cascade delete related list items

---

### GET `/lists/:listId/items`

Response:
```json
{
  "list": {
    "id": "string",
    "name": "string"
  },
  "items": [
    {
      "id": "string",
      "book_list_item_id": "string",
      "position": 1,
      "book": {
        "id": "string",
        "title": "string",
        "author": "string",
        "cover_url": "string"
      }
    }
  ]
}
```

Rules:
- validate ownership
- order by `position ASC`

---

## List Items

### POST `/lists/:listId/items`

Request with existing book:
```json
{
  "book_id": "string"
}
```

Request with manual book creation:
```json
{
  "book": {
    "title": "string",
    "author": "string",
    "cover_url": "string"
  }
}
```

Optional explicit position:
```json
{
  "book_id": "string",
  "position": 3
}
```

Response:
```json
{
  "id": "string",
  "list_id": "string",
  "book_id": "string",
  "position": 3,
  "created_at": "timestamp"
}
```

Rules:
- validate ownership of list
- prevent duplicate book in same list
- if manual book is provided, apply reuse rules
- if no position is provided, insert at end
- update affected positions if inserting in the middle

---

### DELETE `/lists/:listId/items/:itemId`

Response:
```json
{
  "message": "Book removed from list"
}
```

Rules:
- validate ownership
- normalize positions if needed after removal

---

### PATCH `/lists/:listId/items/:itemId/reorder`

Request:
```json
{
  "position": 2
}
```

Response:
```json
{
  "id": "string",
  "list_id": "string",
  "book_id": "string",
  "position": 2,
  "updated_at": "timestamp"
}
```

Rules:
- validate ownership
- shift affected items
- keep positions unique and consistent
- use transaction

---

### PATCH `/lists/:listId/items/:itemId/move`

Request:
```json
{
  "target_list_id": "string",
  "target_position": 1
}
```

Response:
```json
{
  "message": "Book moved successfully"
}
```

Rules:
- validate ownership of source and target lists
- prevent duplicate book in target list
- update ordering in both lists
- use transaction

---

## Logs

### GET `/admin/logs`

Admin-only.

Query params:
- `level`
- `method`
- `status_code`
- `from`
- `to`
- `page`
- `limit`

Response:
```json
{
  "items": [
    {
      "id": "string",
      "level": "INFO",
      "status_code": 200,
      "message": "string",
      "route": "string",
      "method": "GET",
      "user_id": "string",
      "created_at": "timestamp"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

Rules:
- admin-only
- do not expose sensitive data through logs

---

### GET `/admin/logs/summary`

Admin-only.

Response:
```json
{
  "success_count": 100,
  "warn_count": 12,
  "error_count": 4
}
```

Rules:
- may support time filters such as daily, weekly, monthly, all-time

---

### GET `/admin/monitoring/stream`

Optional real-time monitoring endpoint.

Rules:
- admin-only
- may be implemented with WebSocket
- must not expose sensitive user data unnecessarily

---

## Validation Summary

### Login
- `user_name` required
- `password` required

### User creation
- `user_name` required
- `password` required
- unique `user_name`

### Book creation
- `title` required
- `author` required

### List creation
- `name` required
- `name` must be unique within the user scope

### Item creation
- require either `book_id` or `book`
- do not allow both to be missing
- prevent duplicate book in same list

### Reordering
- `position` required
- `position` must be valid for the target list boundaries

---

## Transactions Required

Use transactions for:
- moving a book between lists
- reordering items
- deleting list with dependent records
- rotating refresh tokens

---

## Security Notes

- never expose password hashes
- never expose refresh tokens in JSON responses
- never trust front-end authorization checks
- always validate ownership in the back-end
- always validate admin access in the back-end using the `Admin` entity
