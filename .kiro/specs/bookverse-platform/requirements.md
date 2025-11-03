# Requirements Document

## Introduction

BookVerse is a full-stack web application designed to facilitate fair, secure, and community-driven book exchanges. Built on the MERN stack (MongoDB, Express.js, React.js, Node.js), the platform addresses critical challenges of trust and inequitable value exchange in peer-to-peer barter systems. The system empowers users to make equitable trading decisions through enhanced book details, wishlist-based matching, transparent ratings, and privacy controls, creating a sustainable and community-first culture among readers.

## Glossary

- **BookVerse_System**: The complete web application including frontend, backend, database, and external API integrations
- **User**: A registered individual who can list books, search for books, create wishlists, and participate in trades
- **Book_Listing**: A digital record of a physical book available for trade, including metadata and condition information
- **Trade**: A proposed or completed exchange of books between two users
- **Wishlist**: A user-maintained list of books they are seeking to acquire
- **Rating**: A post-trade evaluation (1-5 stars with optional comment) that one user provides about another
- **ISBN**: International Standard Book Number, a unique identifier for books
- **External_Book_API**: Third-party service (e.g., Google Books API) that provides book metadata based on ISBN
- **Notification**: An in-app alert informing users of trade requests, messages, or status updates
- **Privacy_Toggle**: A user-controlled setting that determines visibility of their city information
- **Trade_Status**: The current state of a trade (proposed, accepted, declined, completed)

## Requirements

### Requirement 1

**User Story:** As a new reader, I want to register for an account with my email, password, name, and city, so that I can access the platform and participate in book trading.

#### Acceptance Criteria

1. WHEN a user submits valid registration data (email, password, name, city), THE BookVerse_System SHALL create a new user account with hashed password storage
2. WHEN a user submits registration data with an email that already exists, THE BookVerse_System SHALL reject the registration and display an error message
3. THE BookVerse_System SHALL validate that the email follows standard email format before account creation
4. THE BookVerse_System SHALL require passwords to meet minimum security criteria (minimum 8 characters)
5. WHEN account creation succeeds, THE BookVerse_System SHALL redirect the user to the login page with a success confirmation

### Requirement 2

**User Story:** As a registered user, I want to log in securely with my credentials, so that I can access my account and trading features.

#### Acceptance Criteria

1. WHEN a user submits valid login credentials (email and password), THE BookVerse_System SHALL authenticate the user and generate a JSON Web Token
2. WHEN a user submits invalid credentials, THE BookVerse_System SHALL reject the login attempt and display an error message
3. WHEN authentication succeeds, THE BookVerse_System SHALL store the JWT securely and maintain the user session
4. THE BookVerse_System SHALL protect all authenticated routes by validating the JWT on each request
5. WHEN a user logs out, THE BookVerse_System SHALL clear the authentication token and end the session

### Requirement 3

**User Story:** As a user, I want to manage my profile including a privacy toggle for my city, so that I can control what information other users can see.

#### Acceptance Criteria

1. THE BookVerse_System SHALL display the user's name, city, average rating, book listings, and wishlist on their profile page
2. WHEN a user enables the privacy toggle, THE BookVerse_System SHALL hide their city information from other users
3. WHEN a user disables the privacy toggle, THE BookVerse_System SHALL display their city information to other users
4. THE BookVerse_System SHALL allow users to update their profile information (name, city, privacy setting)
5. WHEN profile updates are saved, THE BookVerse_System SHALL persist the changes to the database and display a confirmation message

### Requirement 4

**User Story:** As a book owner, I want to create detailed book listings with title, author, photo, condition, genre, and optional ISBN, so that potential traders have complete information about my books.

#### Acceptance Criteria

1. WHEN a user submits a new book listing with required fields (title, author, condition, genre), THE BookVerse_System SHALL create the listing and store it in the database
2. WHEN a user uploads a photo with the listing, THE BookVerse_System SHALL process and store the image file
3. WHERE a user provides an ISBN, THE BookVerse_System SHALL query the External_Book_API and autofill available metadata (title, author, publication details)
4. THE BookVerse_System SHALL validate that all required fields are present before creating a listing
5. WHEN listing creation succeeds, THE BookVerse_System SHALL display the new listing on the user's profile and in search results

### Requirement 5

**User Story:** As a book owner, I want to edit or delete my existing book listings, so that I can keep my inventory accurate and remove books that are no longer available.

#### Acceptance Criteria

1. WHEN a user requests to edit their own book listing, THE BookVerse_System SHALL display the current listing data in an editable form
2. WHEN a user saves changes to a listing, THE BookVerse_System SHALL update the database and display a confirmation message
3. WHEN a user requests to delete their own book listing, THE BookVerse_System SHALL remove the listing from the database
4. THE BookVerse_System SHALL prevent users from editing or deleting book listings that do not belong to them
5. WHEN a listing involved in an active trade is deleted, THE BookVerse_System SHALL update the trade status appropriately

### Requirement 6

**User Story:** As a book seeker, I want to search for books using filters for city, genre, and author, so that I can quickly find books I'm interested in from nearby users.

#### Acceptance Criteria

1. THE BookVerse_System SHALL display all available book listings on the browse page by default
2. WHEN a user applies a city filter, THE BookVerse_System SHALL return only listings from users in the specified city
3. WHEN a user applies a genre filter, THE BookVerse_System SHALL return only listings matching the specified genre
4. WHEN a user applies an author filter, THE BookVerse_System SHALL return only listings matching the specified author name
5. WHEN multiple filters are applied simultaneously, THE BookVerse_System SHALL return listings that match all specified criteria

### Requirement 7

**User Story:** As a book seeker, I want to create and maintain a wishlist of books I'm looking for, so that other users can see what I want and propose relevant trades.

#### Acceptance Criteria

1. WHEN a user adds a book to their wishlist, THE BookVerse_System SHALL store the wishlist item and associate it with the user account
2. THE BookVerse_System SHALL display the user's wishlist on their public profile page
3. WHEN a user removes a book from their wishlist, THE BookVerse_System SHALL delete the wishlist item from the database
4. THE BookVerse_System SHALL allow users to add multiple books to their wishlist
5. WHEN viewing another user's profile, THE BookVerse_System SHALL display their wishlist to help identify potential trade matches

### Requirement 8

**User Story:** As a user, I want to propose trades to other users for their books, so that I can initiate a book exchange.

#### Acceptance Criteria

1. WHEN a user selects a book listing and proposes a trade, THE BookVerse_System SHALL create a new trade record with status "proposed"
2. THE BookVerse_System SHALL require the proposing user to select one of their own books to offer in exchange
3. WHEN a trade is proposed, THE BookVerse_System SHALL create a notification for the receiving user
4. THE BookVerse_System SHALL prevent users from proposing trades for their own book listings
5. THE BookVerse_System SHALL store both the offered book and requested book references in the trade record

### Requirement 9

**User Story:** As a user who receives a trade proposal, I want to accept or decline the trade, so that I can control which exchanges I participate in.

#### Acceptance Criteria

1. WHEN a user accepts a trade proposal, THE BookVerse_System SHALL update the trade status to "accepted"
2. WHEN a user declines a trade proposal, THE BookVerse_System SHALL update the trade status to "declined"
3. WHEN a trade status changes, THE BookVerse_System SHALL create a notification for the proposing user
4. THE BookVerse_System SHALL prevent users from accepting or declining trades that were not proposed to them
5. WHEN a trade is accepted, THE BookVerse_System SHALL enable the trade-specific chat feature for both users

### Requirement 10

**User Story:** As a user in an accepted trade, I want to communicate with my trading partner through a trade-specific chat, so that we can coordinate the exchange details.

#### Acceptance Criteria

1. WHILE a trade has status "accepted", THE BookVerse_System SHALL allow both trading partners to send and receive messages
2. WHEN a user sends a message, THE BookVerse_System SHALL store the message with timestamp and sender information
3. WHEN a new message is received, THE BookVerse_System SHALL create a notification for the recipient
4. THE BookVerse_System SHALL display all messages in chronological order within the trade chat interface
5. THE BookVerse_System SHALL prevent users from accessing chat for trades they are not part of

### Requirement 11

**User Story:** As a user who has completed a physical book exchange, I want to mark the trade as complete, so that the system knows the exchange was successful.

#### Acceptance Criteria

1. WHEN a user marks a trade as complete, THE BookVerse_System SHALL update the trade status to "completed"
2. WHEN a trade is marked complete, THE BookVerse_System SHALL enable the rating feature for both trading partners
3. THE BookVerse_System SHALL allow either trading partner to mark the trade as complete
4. WHEN a trade is completed, THE BookVerse_System SHALL create a notification for the other trading partner
5. THE BookVerse_System SHALL prevent users from marking trades as complete if the trade status is not "accepted"

### Requirement 12

**User Story:** As a user who completed a trade, I want to rate my trading partner with stars and an optional comment, so that I can contribute to their reputation and help future traders.

#### Acceptance Criteria

1. WHEN a trade status is "completed", THE BookVerse_System SHALL allow both users to submit a rating (1-5 stars)
2. WHEN a user submits a rating of 3 stars or lower, THE BookVerse_System SHALL require a text comment explaining the rating
3. WHEN a rating is submitted, THE BookVerse_System SHALL store the rating and associate it with the rated user
4. THE BookVerse_System SHALL calculate and display the average rating on the user's profile
5. THE BookVerse_System SHALL prevent users from rating the same trade partner multiple times for the same trade

### Requirement 13

**User Story:** As a user, I want to receive in-app notifications for trade requests, messages, and status updates, so that I stay informed about my trading activity.

#### Acceptance Criteria

1. WHEN a user receives a new trade proposal, THE BookVerse_System SHALL create a notification with type "trade_request"
2. WHEN a user receives a new message in a trade chat, THE BookVerse_System SHALL create a notification with type "new_message"
3. WHEN a trade status changes (accepted, declined, completed), THE BookVerse_System SHALL create a notification for the relevant user
4. THE BookVerse_System SHALL display an unread notification count badge in the user interface
5. WHEN a user views their notifications, THE BookVerse_System SHALL mark them as read and update the notification count

### Requirement 14

**User Story:** As a user concerned about safety, I want to access community guidelines and safety tips, so that I can trade books securely and responsibly.

#### Acceptance Criteria

1. THE BookVerse_System SHALL provide a static Safety Guidelines page accessible to all users
2. THE BookVerse_System SHALL display safety recommendations for in-person exchanges
3. THE BookVerse_System SHALL include community guidelines that discourage commercial exploitation
4. THE BookVerse_System SHALL make the Safety Guidelines page accessible from the main navigation
5. THE BookVerse_System SHALL display the guidelines in a clear, readable format

### Requirement 15

**User Story:** As a platform administrator, I want the system to securely store user passwords and protect against common security vulnerabilities, so that user data remains safe.

#### Acceptance Criteria

1. THE BookVerse_System SHALL hash all user passwords using a secure algorithm (bcrypt) before storing them
2. THE BookVerse_System SHALL validate and sanitize all user inputs to prevent injection attacks
3. THE BookVerse_System SHALL implement rate limiting on authentication endpoints to prevent brute force attacks
4. THE BookVerse_System SHALL use HTTPS for all data transmission in production
5. THE BookVerse_System SHALL validate JWT tokens on all protected API endpoints before processing requests
