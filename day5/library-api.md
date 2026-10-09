# Library API Design

Resource: `books` (plural noun, as REST recommends)

## Endpoints

### 1. List all books
- **Method:** GET
- **Path:** `/books`
- **Description:** Returns a list of all books.
- **Success status:** 200 OK

### 2. Get one book
- **Method:** GET
- **Path:** `/books/{id}`
- **Description:** Returns the book with the given id.
- **Success status:** 200 OK

### 3. Create a book
- **Method:** POST
- **Path:** `/books`
- **Description:** Adds a new book to the library.
- **Example request body:**
```json
  {
    "title": "Weep Not, Child",
    "author": "Ngugi wa Thiong'o",
    "year": 1964,
    "isbn": "9780435908300"
  }
```
- **Success status:** 201 Created

### 4. Replace a book
- **Method:** PUT
- **Path:** `/books/{id}`
- **Description:** Replaces the whole book record with a new version.
- **Example request body:**
```json
  {
    "title": "Weep Not, Child",
    "author": "Ngugi wa Thiong'o",
    "year": 1964,
    "isbn": "9780435908300"
  }
```
- **Success status:** 200 OK

### 5. Update part of a book
- **Method:** PATCH
- **Path:** `/books/{id}`
- **Description:** Changes only the fields sent, for example the year.
- **Example request body:**
```json
  { "year": 1965 }
```
- **Success status:** 200 OK

### 6. Delete a book
- **Method:** DELETE
- **Path:** `/books/{id}`
- **Description:** Removes the book from the library.
- **Success status:** 204 No Content

### 7. List books by an author
- **Method:** GET
- **Path:** `/books?author=Chinua%20Achebe`
- **Description:** Returns only books by the given author, using a query parameter.
- **Success status:** 200 OK

## Error codes

- **400 Bad Request**
  - The request is invalid.
  - Example: `POST /books` with an empty title, or a `year` that is text instead of a number.
- **404 Not Found**
  - The item or URL does not exist.
  - Example: `GET /books/9999` when no book has id 9999.