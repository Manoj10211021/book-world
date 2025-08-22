# Tutorial: book-world

The `book-world` project is an interactive online platform designed for **book enthusiasts**.
It allows users to _manage their personal reading experience_ by discovering new books,
adding their own, and leaving **reviews** and comments. The system securely handles
**user authentication** and permissions to create a vibrant community around books.

## Visual Overview

```mermaid
flowchart TD
    A0["User Management & Authentication
"]
    A1["Book Data Model & API
"]
    A2["Review & Comment System
"]
    A3["Frontend Global State (Recoil)
"]
    A4["Frontend Form Handling & Validation
"]
    A5["API Communication (Axios)
"]
    A6["Centralized Error Handling
"]
    A0 -- "Updates UI state in" --> A3
    A0 -- "Manages user favorites in" --> A1
    A0 -- "Authorizes and interacts with" --> A2
    A1 -- "Hosts content for" --> A2
    A3 -- "Manages frontend display of" --> A1
    A4 -- "Validates input for" --> A0
    A4 -- "Validates input for" --> A1
    A4 -- "Validates input for" --> A2
    A5 -- "Sends requests to" --> A0
    A5 -- "Sends requests to" --> A1
    A5 -- "Sends requests to" --> A2
    A5 -- "Reports errors to" --> A6
    A6 -- "Influences loading states in" --> A3
```

## Chapters

1. [Book Data Model & API
   ](01_book_data_model___api_.md)
2. [User Management & Authentication
   ](02_user_management___authentication_.md)
3. [Review & Comment System
   ](03_review___comment_system_.md)
4. [Frontend Form Handling & Validation
   ](04_frontend_form_handling___validation_.md)
5. [API Communication (Axios)
   ](05_api_communication__axios__.md)
6. [Frontend Global State (Recoil)
   ](06_frontend_global_state__recoil__.md)
7. [Centralized Error Handling
   ](07_centralized_error_handling_.md)

---
