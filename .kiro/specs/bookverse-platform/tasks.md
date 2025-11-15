# Implementation Plan

This implementation plan breaks down the BookVerse platform development into discrete, actionable coding tasks. **Each task addresses a single requirement** to ensure focused implementation and clear traceability. Tasks build incrementally on previous work, with all code integrated into the application.

## Phase 1: Project Foundation

- [x] 1. Initialize MERN project structure
  - Create root directory with client and server subdirectories
  - Initialize Node.js project in server directory with package.json
  - Initialize React project in client directory using Create React App or Vite
  - Set up .gitignore files for node_modules and environment variables
  - Create .env.example files with required environment variable templates
  - _Requirements: Foundational setup_

- [ ] 2. Configure MongoDB connection with Mongoose
  - Install mongoose package
  - Create database configuration file with connection logic
  - Implement connection error handling and retry logic
  - Add MongoDB URI to environment variables
  - Test database connection
  - _Requirements: Foundational setup_

## Phase 2: User Registration (Requirement 1)

- [ ] 3. Create User schema for registration (Req 1.1)
  - Define User schema with name, email, password, city fields
  - Add email validation and unique constraint
  - Create indexes on email field
  - _Requirements: 1.1_

- [ ] 4. Implement password hashing in User model (Req 1.4)
  - Implement password hashing pre-save hook using bcrypt
  - Ensure passwords are never stored in plain text
  - _Requirements: 1.4_

- [ ] 5. Build user registration API endpoint - create account (Req 1.1)
  - Build POST /api/auth/register route handler
  - Create new user document with hashed password
  - Return success response without password field
  - _Requirements: 1.1_

- [ ] 6. Add email validation to registration endpoint (Req 1.2)
  - Implement input validation for email format
  - Check for existing email and return 409 error
  - _Requirements: 1.2_

- [ ] 7. Add password validation to registration endpoint (Req 1.3)
  - Validate password meets minimum 8 character requirement
  - Return appropriate error for weak passwords
  - _Requirements: 1.3_


- [ ] 8. Create registration form frontend (Req 1.2)
  - Build RegisterForm component with email, password, name, city inputs
  - Implement client-side validation for all fields
  - Connect to registration API endpoint
  - Display error messages for validation failures and duplicate email
  - _Requirements: 1.2_

- [ ] 9. Add registration success redirect (Req 1.5)
  - Handle success response from registration API
  - Redirect user to login page after successful registration
  - Display success confirmation message
  - _Requirements: 1.5_

## Phase 3: User Authentication (Requirement 2)

- [ ] 10. Create JWT generation utility (Req 2.1)
  - Install jsonwebtoken package
  - Create utility function to generate JWT with user ID payload
  - Set JWT expiration to 24 hours
  - Store JWT secret in environment variables
  - _Requirements: 2.1_

- [ ] 11. Build user login API endpoint (Req 2.1)
  - Build POST /api/auth/login route handler
  - Validate email and password inputs
  - Find user by email and compare password hash
  - Generate JWT token on successful authentication
  - Return token and user data (excluding password)
  - _Requirements: 2.1_

- [ ] 12. Add invalid credentials error handling (Req 2.2)
  - Return 401 error for invalid credentials
  - Provide appropriate error message
  - _Requirements: 2.2_

- [ ] 13. Set up React Router and authentication context (Req 2.3)
  - Install react-router-dom and configure routes
  - Create AuthContext with login, logout, and user state
  - Implement token storage in localStorage
  - Create ProtectedRoute component for authenticated routes
  - _Requirements: 2.3_

- [ ] 14. Create login form frontend (Req 2.1)
  - Build LoginForm component with email and password inputs
  - Implement client-side validation
  - Connect to login API endpoint
  - Store JWT token in AuthContext and localStorage on success
  - Redirect to home page on successful login
  - _Requirements: 2.1_

- [ ] 15. Display login error messages (Req 2.2)
  - Display error messages for invalid credentials
  - Handle network errors gracefully
  - _Requirements: 2.2_

- [ ] 16. Create JWT authentication middleware (Req 2.4)
  - Build middleware to extract JWT from Authorization header
  - Verify token signature and expiration
  - Attach decoded user ID to request object
  - Return 401 error for missing or invalid tokens
  - _Requirements: 2.4_

- [ ] 17. Implement logout functionality (Req 2.5)
  - Build Navbar component with conditional rendering based on auth state
  - Implement logout function to clear token from localStorage
  - Reset AuthContext state on logout
  - Add navigation links to register, login, and protected pages
  - _Requirements: 2.5_

## Phase 4: User Profile Management (Requirement 3)

- [ ] 18. Add rating fields to User model (Req 3.1)
  - Add averageRating field with default 0
  - Add ratingCount field with default 0
  - Add city index for search filtering
  - _Requirements: 3.1_

- [ ] 19. Build get current user profile endpoint (Req 3.1)
  - Build GET /api/auth/me route with authentication middleware
  - Fetch current user by ID from JWT
  - Return user data excluding password
  - _Requirements: 3.1_

- [ ] 20. Create user profile page frontend (Req 3.1)
  - Build UserProfile component to display user information
  - Fetch and display user name, city, average rating
  - Show placeholder sections for listings, wishlist, and ratings
  - Handle loading and error states
  - _Requirements: 3.1_

- [ ] 21. Add privacy settings to User model (Req 3.2)
  - Add privacySettings field with showCity boolean (default true)
  - _Requirements: 3.2_

- [ ] 22. Build update user profile endpoint (Req 3.2)
  - Build PUT /api/auth/profile route with authentication middleware
  - Validate input for name and city updates
  - Update user document in database
  - Return updated user data
  - _Requirements: 3.2_

- [ ] 23. Create profile settings page frontend (Req 3.2)
  - Build ProfileSettings component with form for name and city
  - Connect to profile update API endpoint
  - Show success confirmation message after update
  - Display validation errors
  - _Requirements: 3.2_

- [ ] 24. Implement privacy toggle for city visibility (Req 3.3)
  - Create PrivacyToggle component for city visibility control
  - Allow updating privacySettings.showCity boolean
  - _Requirements: 3.3_

- [ ] 25. Apply privacy settings to profile display (Req 3.4)
  - Apply privacy settings to city visibility in profile endpoint
  - Hide city when showCity is false
  - _Requirements: 3.4_

- [ ] 26. Apply privacy settings to book owner display (Req 3.5)
  - Apply privacy settings when displaying book owner information
  - Respect showCity setting in all book-related queries
  - _Requirements: 3.5_


## Phase 5: Book Listing Creation (Requirement 4)

- [ ] 27. Create Book schema and model (Req 4.1)
  - Define Book schema with owner, title, author, condition, genre fields
  - Add reference to User model for owner field
  - Add optional isbn, description, publicationYear, publisher fields
  - Add isAvailable boolean (default true)
  - Create indexes on owner, genre, author, and title fields
  - _Requirements: 4.1_

- [ ] 28. Set up image upload with Multer and Cloudinary (Req 4.2)
  - Install multer and cloudinary packages
  - Configure Cloudinary with API credentials from environment
  - Create multer middleware for single image upload
  - Validate file type (images only) and size (5MB max)
  - Generate unique filenames for uploads
  - _Requirements: 4.2_

- [ ] 29. Build create book listing API endpoint (Req 4.1)
  - Build POST /api/books route with authentication middleware
  - Accept multipart/form-data with book fields and image
  - Validate all required fields (title, author, condition, genre)
  - Upload image to Cloudinary and get URL
  - Create book document with owner set to authenticated user
  - Return created book with success message
  - _Requirements: 4.1_

- [ ] 30. Integrate Google Books API for ISBN lookup (Req 4.3)
  - Install axios for API requests
  - Build POST /api/books/isbn/:isbn route
  - Query Google Books API with provided ISBN
  - Parse response and extract title, author, publisher, publicationYear
  - Handle API errors and missing data gracefully
  - Return formatted book data for autofill
  - _Requirements: 4.3_

- [ ] 31. Create book listing form frontend (Req 4.1)
  - Build BookListingForm component with all book fields
  - Implement client-side validation for required fields
  - Connect to book creation API endpoint
  - Show success message after creation
  - _Requirements: 4.1_

- [ ] 32. Add image upload to book listing form (Req 4.2)
  - Add image upload input with preview functionality
  - Handle image file selection and validation
  - _Requirements: 4.2_

- [ ] 33. Add ISBN lookup to book listing form (Req 4.3)
  - Add ISBN input field with "Lookup" button
  - Connect ISBN lookup to API and populate form fields with results
  - _Requirements: 4.3_

- [ ] 34. Add listing success confirmation (Req 4.4)
  - Display success message after book creation
  - Redirect to appropriate page after creation
  - _Requirements: 4.4_

- [ ] 35. Build get single book API endpoint (Req 4.5)
  - Build GET /api/books/:id route (public access)
  - Fetch book by ID and populate owner information
  - Apply privacy settings to owner's city visibility
  - Return 404 if book not found
  - Return book data with owner details
  - _Requirements: 4.5_

- [ ] 36. Create book display components (Req 4.5)
  - Build BookCard component for grid/list display with image, title, author
  - Build BookDetailView component for full book information
  - Display all book fields including condition, genre, description
  - Show owner information with link to their profile
  - _Requirements: 4.5_

## Phase 6: Book Listing Management (Requirement 5)

- [ ] 37. Build get user's books endpoint (Req 5.1)
  - Build GET /api/books/user/:userId route
  - Fetch all books owned by specified user
  - Return books in appropriate format
  - _Requirements: 5.1_

- [ ] 38. Create My Books management page (Req 5.1)
  - Build MyBooksPage component to display user's listings
  - Fetch user's books from API on component mount
  - Display books in responsive grid layout using BookCard
  - Add "Create New Listing" button linking to form
  - _Requirements: 5.1_

- [ ] 39. Build update book listing API endpoint (Req 5.2)
  - Build PUT /api/books/:id route with authentication middleware
  - Verify that authenticated user is the book owner
  - Return 403 error if user doesn't own the book
  - Accept updated book fields and optional new image
  - Update book document in database
  - Return updated book data
  - _Requirements: 5.2_

- [ ] 40. Implement edit functionality in My Books page (Req 5.2)
  - Add edit button to each book card
  - Open pre-populated form for editing
  - Connect to update API endpoint
  - _Requirements: 5.2_

- [ ] 41. Build delete book listing API endpoint (Req 5.3)
  - Build DELETE /api/books/:id route with authentication middleware
  - Verify that authenticated user is the book owner
  - Return 403 error if user doesn't own the book
  - Delete book document from database
  - Return success confirmation
  - _Requirements: 5.3_

- [ ] 42. Implement delete functionality in My Books page (Req 5.3)
  - Add delete button to each book card
  - Show confirmation dialog before deletion
  - Connect to delete API endpoint
  - _Requirements: 5.3_

- [ ] 43. Add ownership verification to update endpoint (Req 5.4)
  - Verify user owns the book before allowing update
  - Return 403 error for unauthorized attempts
  - _Requirements: 5.4_

- [ ] 44. Add ownership verification to delete endpoint (Req 5.4)
  - Verify user owns the book before allowing deletion
  - Return 403 error for unauthorized attempts
  - _Requirements: 5.4_

- [ ] 45. Check for active trades before deletion (Req 5.5)
  - Check if book is involved in active trades before deletion
  - Prevent deletion or handle appropriately if trades exist
  - _Requirements: 5.5_


## Phase 7: Book Search and Discovery (Requirement 6)

- [ ] 46. Build get all books API endpoint (Req 6.1)
  - Build GET /api/books route (public access)
  - Fetch all available books from database
  - Populate owner information for each book
  - Apply privacy settings to owner city visibility
  - Sort by creation date descending
  - _Requirements: 6.1_

- [ ] 47. Add pagination to book queries (Req 6.1)
  - Accept page and limit query parameters
  - Implement skip and limit in MongoDB query
  - Default to 20 books per page
  - Return total count and current page in response
  - _Requirements: 6.1_

- [ ] 48. Create browse page with book grid (Req 6.1)
  - Build BrowsePage component as main search interface
  - Build BookGrid component to display search results
  - Implement responsive grid layout
  - Add pagination controls (previous, next, page numbers)
  - Handle empty results state with helpful message
  - _Requirements: 6.1_

- [ ] 49. Add city filter to book search backend (Req 6.2)
  - Accept city query parameter in GET /api/books
  - Filter books by owner's city when parameter provided
  - Respect privacy settings (only show books from users with showCity enabled)
  - Return filtered results
  - _Requirements: 6.2_

- [ ] 50. Add city filter to search interface (Req 6.2)
  - Create SearchFilters component with city input
  - Implement filter state management
  - Fetch books with city filter applied
  - _Requirements: 6.2_

- [ ] 51. Add genre filter to book search backend (Req 6.3)
  - Accept genre query parameter in GET /api/books
  - Filter books by exact genre match when parameter provided
  - Return filtered results
  - _Requirements: 6.3_

- [ ] 52. Add genre filter to search interface (Req 6.3)
  - Add genre input to SearchFilters component
  - Fetch books with genre filter applied
  - _Requirements: 6.3_

- [ ] 53. Add author filter to book search backend (Req 6.4)
  - Accept author query parameter in GET /api/books
  - Filter books by author name (case-insensitive partial match)
  - Return filtered results
  - _Requirements: 6.4_

- [ ] 54. Add author filter to search interface (Req 6.4)
  - Add author input to SearchFilters component
  - Fetch books with author filter applied
  - _Requirements: 6.4_

- [ ] 55. Implement combined filter logic (Req 6.5)
  - Support multiple simultaneous filters (city, genre, author)
  - Build MongoDB query that matches all specified criteria
  - Return books matching all active filters
  - Update URL query parameters with current filters
  - _Requirements: 6.5_

## Phase 8: Wishlist System (Requirement 7)

- [ ] 56. Create Wishlist schema and model (Req 7.1)
  - Define Wishlist schema with user, title, author, isbn, notes fields
  - Add reference to User model
  - Create compound unique index on user and isbn
  - Create index on user field for queries
  - _Requirements: 7.1_

- [ ] 57. Build add to wishlist API endpoint (Req 7.1)
  - Build POST /api/wishlist route with authentication middleware
  - Validate required fields (title at minimum)
  - Check for duplicate entries (same user and ISBN)
  - Create wishlist document linked to authenticated user
  - Return created wishlist item
  - _Requirements: 7.1_

- [ ] 58. Create wishlist form frontend (Req 7.1)
  - Build WishlistForm component to add books with title, author, isbn fields
  - Implement add to wishlist functionality
  - Connect to add wishlist API endpoint
  - _Requirements: 7.1_

- [ ] 59. Build get user wishlist API endpoint (Req 7.2)
  - Build GET /api/wishlist/user/:userId route (public access)
  - Fetch all wishlist items for specified user
  - Sort by creation date descending
  - Return wishlist items
  - _Requirements: 7.2_

- [ ] 60. Display wishlist on user profile (Req 7.2)
  - Add WishlistSection to UserProfile component
  - Fetch user's wishlist when profile loads
  - Display wishlist items in organized list
  - Handle empty wishlist state
  - _Requirements: 7.2_

- [ ] 61. Build remove from wishlist API endpoint (Req 7.3)
  - Build DELETE /api/wishlist/:id route with authentication middleware
  - Verify that authenticated user owns the wishlist item
  - Delete wishlist document from database
  - Return success confirmation
  - _Requirements: 7.3_

- [ ] 62. Implement remove from wishlist frontend (Req 7.3)
  - Create WishlistItem component to display entry with remove button
  - Implement remove from wishlist with confirmation
  - Connect to delete wishlist API endpoint
  - _Requirements: 7.3_

- [ ] 63. Add wishlist to profile display (Req 7.4)
  - Ensure wishlist is visible on user profile page
  - Format wishlist items appropriately
  - _Requirements: 7.4_

- [ ] 64. Make wishlist publicly visible (Req 7.5)
  - Ensure wishlist endpoint is publicly accessible
  - Display wishlist when viewing other users' profiles
  - _Requirements: 7.5_


## Phase 9: Trade Proposal (Requirement 8)

- [ ] 65. Create Trade schema and model (Req 8.1)
  - Define Trade schema with proposer, receiver, requestedBook, offeredBook fields
  - Add references to User and Book models
  - Add status field (enum: proposed, accepted, declined, completed)
  - Add timestamp fields: proposedAt, respondedAt, completedAt
  - Create indexes on proposer, receiver, status
  - Create compound indexes for efficient querying
  - _Requirements: 8.1_

- [ ] 66. Build propose trade API endpoint (Req 8.1)
  - Build POST /api/trades route with authentication middleware
  - Accept requestedBook and offeredBook IDs in request body
  - Create trade document with status "proposed"
  - Return created trade with populated book and user data
  - _Requirements: 8.1_

- [ ] 67. Create trade proposal interface frontend (Req 8.1)
  - Add "Propose Trade" button on BookDetailView
  - Build TradeProposalModal component
  - Fetch and display authenticated user's available books
  - Allow user to select one of their books to offer
  - Submit trade proposal to API
  - Show success message and close modal
  - _Requirements: 8.1_

- [ ] 68. Build get user trades API endpoint (Req 8.1)
  - Build GET /api/trades route with authentication middleware
  - Filter trades where user is either proposer or receiver
  - Support optional status query parameter for filtering
  - Populate book and user references
  - Sort by creation date descending
  - _Requirements: 8.1_

- [ ] 69. Create trade list page frontend (Req 8.1)
  - Build TradeList component to display user's trades
  - Create separate sections for incoming and outgoing trades
  - Build TradeCard component to display trade summary
  - Show trade status, books involved, and other user
  - Link to trade detail view for more information
  - _Requirements: 8.1_

- [ ] 70. Validate offered book ownership (Req 8.2)
  - Validate that authenticated user owns the offeredBook
  - Return appropriate error if validation fails
  - _Requirements: 8.2_

- [ ] 71. Create notification for trade proposal (Req 8.3)
  - Integrate notification creation into trade proposal endpoint
  - Create notification document for the receiver
  - Set notification type to "trade_request"
  - Include trade and proposer references
  - Generate appropriate message text
  - _Requirements: 8.3_

- [ ] 72. Validate requested book ownership (Req 8.4)
  - Validate that authenticated user doesn't own requestedBook
  - Validate that both books exist in database
  - Return appropriate error if validation fails
  - _Requirements: 8.4_

- [ ] 73. Display validation errors in trade proposal (Req 8.5)
  - Display error messages for validation failures
  - Handle all error cases in TradeProposalModal
  - _Requirements: 8.5_

## Phase 10: Trade Response (Requirement 9)

- [ ] 74. Build accept trade API endpoint (Req 9.1)
  - Build PUT /api/trades/:id/accept route with authentication middleware
  - Validate that authenticated user is the trade receiver
  - Return 403 error if user is not the receiver
  - Validate that trade status is "proposed"
  - Update trade status to "accepted" and set respondedAt timestamp
  - Return updated trade data
  - _Requirements: 9.1_

- [ ] 75. Add accept button to trade detail view (Req 9.1)
  - Build TradeDetailView component for full trade information
  - Display both books with details and images
  - Add accept button for receiver on proposed trades
  - Handle button click and update trade status
  - Show success message
  - _Requirements: 9.1_

- [ ] 76. Build decline trade API endpoint (Req 9.2)
  - Build PUT /api/trades/:id/decline route with authentication middleware
  - Validate that authenticated user is the trade receiver
  - Return 403 error if user is not the receiver
  - Validate that trade status is "proposed"
  - Update trade status to "declined" and set respondedAt timestamp
  - Return updated trade data
  - _Requirements: 9.2_

- [ ] 77. Add decline button to trade detail view (Req 9.2)
  - Add decline button for receiver on proposed trades
  - Handle button click and update trade status
  - Show success message
  - _Requirements: 9.2_

- [ ] 78. Create notifications for trade responses (Req 9.3)
  - Integrate notification creation into accept/decline endpoints
  - Create notification document for the proposer
  - Set notification type to "trade_accepted" or "trade_declined"
  - Include trade reference
  - Generate appropriate message text
  - _Requirements: 9.3_

- [ ] 79. Add authorization checks to trade response endpoints (Req 9.4)
  - Verify user is the receiver before allowing accept/decline
  - Return 403 error for unauthorized attempts
  - _Requirements: 9.4_

- [ ] 80. Enable chat for accepted trades (Req 9.5)
  - Update accept trade endpoint to enable chat functionality
  - Set flag or status that allows messaging
  - Return updated trade with chat enabled indicator
  - _Requirements: 9.5_


## Phase 11: Trade Communication (Requirement 10)

- [ ] 81. Create Message schema and model (Req 10.1)
  - Define Message schema with trade, sender, content, createdAt fields
  - Add references to Trade and User models
  - Add content length validation (max 1000 characters)
  - Create index on trade field
  - Create compound index on trade and createdAt for sorting
  - _Requirements: 10.1_

- [ ] 82. Build send message API endpoint (Req 10.1)
  - Build POST /api/messages route with authentication middleware
  - Accept trade ID and message content in request body
  - Create message document with sender as authenticated user
  - Return created message
  - _Requirements: 10.1_

- [ ] 83. Create chat interface components (Req 10.1)
  - Build ChatBox component for trade-specific messaging
  - Create MessageBubble component for individual messages
  - Create MessageInput component with text input and send button
  - Display messages in chronological order
  - Differentiate sent vs received messages visually
  - Auto-scroll to bottom on new messages
  - _Requirements: 10.1_

- [ ] 84. Validate user is part of trade for messaging (Req 10.2)
  - Validate that authenticated user is part of the trade (proposer or receiver)
  - Validate that trade status is "accepted"
  - Return appropriate error if validation fails
  - _Requirements: 10.2_

- [ ] 85. Integrate chat into trade detail view (Req 10.2)
  - Add ChatBox component to TradeDetailView
  - Only show chat for accepted trades
  - Implement send message functionality
  - Show loading state while fetching messages
  - _Requirements: 10.2_

- [ ] 86. Create notification for new messages (Req 10.3)
  - Integrate notification creation into send message endpoint
  - Determine recipient (other party in trade)
  - Create notification document for recipient
  - Set notification type to "new_message"
  - Include trade and sender references
  - Generate appropriate message text
  - _Requirements: 10.3_

- [ ] 87. Build get trade messages API endpoint (Req 10.4)
  - Build GET /api/messages/trade/:tradeId route with authentication middleware
  - Validate that authenticated user is part of the trade
  - Fetch all messages for the trade
  - Populate sender information
  - Sort messages by createdAt ascending (chronological order)
  - Return messages array
  - _Requirements: 10.4_

- [ ] 88. Display messages in chronological order (Req 10.5)
  - Fetch messages when trade detail loads
  - Display messages in chronological order in chat interface
  - Display error messages for send failures
  - _Requirements: 10.5_

## Phase 12: Trade Completion (Requirement 11)

- [ ] 89. Build complete trade API endpoint (Req 11.1)
  - Build PUT /api/trades/:id/complete route with authentication middleware
  - Validate that authenticated user is either proposer or receiver
  - Return 403 error if user is not part of the trade
  - Validate that trade status is "accepted"
  - Update trade status to "completed" and set completedAt timestamp
  - Return updated trade data
  - _Requirements: 11.1_

- [ ] 90. Add complete button to trade detail view (Req 11.1)
  - Add "Mark as Complete" button to TradeDetailView for accepted trades
  - Show button to both proposer and receiver
  - Handle button click and call complete trade API
  - Update UI to show completed status
  - Show success message after completion
  - _Requirements: 11.1_

- [ ] 91. Enable rating after trade completion (Req 11.2)
  - Update complete trade endpoint to enable rating functionality
  - Set flag or status that allows rating submission
  - Return updated trade with rating enabled indicator
  - _Requirements: 11.2_

- [ ] 92. Add authorization check to complete endpoint (Req 11.3)
  - Verify user is either proposer or receiver before allowing completion
  - Return 403 error for unauthorized attempts
  - _Requirements: 11.3_

- [ ] 93. Create notification for trade completion (Req 11.4)
  - Integrate notification creation into complete trade endpoint
  - Determine recipient (other party in trade)
  - Create notification document for recipient
  - Set notification type to "trade_completed"
  - Include trade reference
  - Generate appropriate message text
  - _Requirements: 11.4_

- [ ] 94. Validate trade status before completion (Req 11.5)
  - Validate that trade status is "accepted" before allowing completion
  - Return appropriate error if trade is not in accepted state
  - _Requirements: 11.5_


## Phase 13: Rating System (Requirement 12)

- [ ] 95. Create Rating schema and model (Req 12.1)
  - Define Rating schema with trade, rater, ratedUser, stars, comment fields
  - Add references to Trade and User models
  - Add validation for stars (1-5 range)
  - Add createdAt timestamp
  - Create compound unique index on trade and rater
  - Create index on ratedUser for average calculation
  - _Requirements: 12.1_

- [ ] 96. Build submit rating API endpoint (Req 12.1)
  - Build POST /api/ratings route with authentication middleware
  - Accept trade ID, stars, and optional comment in request body
  - Validate that trade status is "completed"
  - Validate that authenticated user is part of the trade
  - Validate that user hasn't already rated this trade
  - Determine ratedUser (other party in trade)
  - Create rating document
  - Return created rating
  - _Requirements: 12.1_

- [ ] 97. Create rating form component (Req 12.1)
  - Build RatingForm component with star selector (1-5)
  - Implement client-side validation
  - Connect to rating submission API
  - Show success message after submission
  - _Requirements: 12.1_

- [ ] 98. Add rating prompt to completed trades (Req 12.1)
  - Show rating prompt on TradeDetailView for completed trades
  - Check if authenticated user has already rated this trade
  - Display RatingForm if not yet rated
  - Show submitted rating if already rated
  - Prevent duplicate rating submissions
  - _Requirements: 12.1_

- [ ] 99. Require comment for low ratings (Req 12.2)
  - Add conditional comment textarea to RatingForm
  - Show comment as required when stars <= 3
  - Validate comment requirement on backend
  - Return appropriate error if comment missing for low rating
  - _Requirements: 12.2_

- [ ] 100. Validate rating submission (Req 12.3)
  - Validate all rating requirements on backend
  - Ensure comment is provided for stars <= 3
  - Return detailed validation errors
  - _Requirements: 12.3_

- [ ] 101. Display validation errors in rating form (Req 12.3)
  - Display error messages for validation failures in RatingForm
  - Handle all error cases appropriately
  - _Requirements: 12.3_

- [ ] 102. Calculate and update user average rating (Req 12.4)
  - Integrate rating calculation into submit rating endpoint
  - Fetch all ratings for the ratedUser
  - Calculate new average rating
  - Update ratedUser's averageRating field
  - Update ratedUser's ratingCount field
  - Handle edge cases (first rating)
  - _Requirements: 12.4_

- [ ] 103. Build get user ratings API endpoint (Req 12.4)
  - Build GET /api/ratings/user/:userId route (public access)
  - Fetch all ratings for specified user
  - Populate rater information
  - Populate trade information for context
  - Sort by creation date descending
  - Return ratings array
  - _Requirements: 12.4_

- [ ] 104. Create rating display components (Req 12.4)
  - Build RatingDisplay component for average rating with star visualization
  - Create RatingCard component for individual ratings
  - Display stars, comment, date, and rater name
  - Handle no ratings state
  - _Requirements: 12.4_

- [ ] 105. Integrate ratings into user profile (Req 12.4)
  - Add RatingDisplay to user profile header showing average
  - Add section to display all received ratings using RatingCard
  - Fetch ratings when profile loads
  - Show "No ratings yet" message if empty
  - _Requirements: 12.4_

- [ ] 106. Prevent duplicate ratings (Req 12.5)
  - Validate that user hasn't already rated this trade
  - Use compound unique index to enforce at database level
  - Return appropriate error for duplicate rating attempts
  - _Requirements: 12.5_

## Phase 14: Notification System (Requirement 13)

- [ ] 107. Create Notification schema and model (Req 13.1)
  - Define Notification schema with recipient, type, relatedTrade, relatedUser, message, isRead fields
  - Add references to User and Trade models
  - Add type enum (trade_request, trade_accepted, trade_declined, trade_completed, new_message)
  - Add isRead boolean with default false
  - Create index on recipient field
  - Create compound index on recipient and isRead
  - _Requirements: 13.1_

- [ ] 108. Create notification for trade requests (Req 13.1)
  - Implement notification creation for trade requests
  - Set appropriate notification type and message
  - _Requirements: 13.1_

- [ ] 109. Create notification for trade status changes (Req 13.2)
  - Implement notification creation for trade accepted/declined
  - Set appropriate notification type and message
  - _Requirements: 13.2_

- [ ] 110. Create notification for new messages (Req 13.3)
  - Implement notification creation for new messages
  - Set appropriate notification type and message
  - _Requirements: 13.3_

- [ ] 111. Add TTL index to notifications (Req 13.3)
  - Add TTL index to expire notifications after 30 days
  - Configure automatic cleanup
  - _Requirements: 13.3_

- [ ] 112. Build get user notifications API endpoint (Req 13.4)
  - Build GET /api/notifications route with authentication middleware
  - Fetch all notifications for authenticated user
  - Populate related user and trade references
  - Sort by creation date descending
  - Return notifications array with unread count
  - _Requirements: 13.4_

- [ ] 113. Create notification bell component (Req 13.4)
  - Build NotificationBell component with icon and badge
  - Display unread notification count in badge
  - Show badge only when count > 0
  - Handle click to open notification dropdown
  - _Requirements: 13.4_

- [ ] 114. Create notification dropdown component (Req 13.4)
  - Build NotificationDropdown component for notification list
  - Create NotificationItem component for individual notifications
  - Format notification message based on type
  - Show timestamp for each notification
  - Highlight unread notifications visually
  - Handle empty notifications state
  - _Requirements: 13.4_

- [ ] 115. Integrate notifications into navigation (Req 13.4)
  - Add NotificationBell to Navbar
  - Fetch notifications on app load
  - Set up periodic polling to refresh notifications (every 30 seconds)
  - Update unread count in real-time
  - Link notifications to relevant pages (trade detail, etc.)
  - _Requirements: 13.4_

- [ ] 116. Build mark notification as read API endpoint (Req 13.5)
  - Build PUT /api/notifications/:id/read route with authentication middleware
  - Validate that notification belongs to authenticated user
  - Update isRead field to true
  - Return updated notification
  - _Requirements: 13.5_

- [ ] 117. Build mark all notifications as read API endpoint (Req 13.5)
  - Build PUT /api/notifications/read-all route with authentication middleware
  - Update all unread notifications for authenticated user
  - Set isRead to true for all
  - Return success confirmation with count updated
  - _Requirements: 13.5_

- [ ] 118. Implement mark as read on notification click (Req 13.5)
  - Implement mark as read on notification click in dropdown
  - Update UI to reflect read status
  - _Requirements: 13.5_


## Phase 15: Safety Guidelines (Requirement 14)

- [ ] 119. Create safety guidelines content (Req 14.1)
  - Build SafetyGuidelines component as static page
  - Write content for safe in-person exchange recommendations
  - Include tips: meet in public places, bring a friend
  - Format content with headings and bullet points for readability
  - _Requirements: 14.1_

- [ ] 120. Add community guidelines to safety page (Req 14.2)
  - Add community guidelines discouraging commercial exploitation
  - Include clear expectations for platform use
  - _Requirements: 14.2_

- [ ] 121. Add book condition verification tips (Req 14.3)
  - Include tips for verifying book condition before completing trade
  - Provide guidance on what to check
  - _Requirements: 14.3_

- [ ] 122. Add safety guidelines to navigation (Req 14.4)
  - Add "Safety Guidelines" link to Navbar
  - Make page accessible to all users (not protected)
  - Add link in Footer as well
  - Ensure page is easily discoverable
  - _Requirements: 14.4_

- [ ] 123. Ensure safety guidelines are comprehensive (Req 14.5)
  - Review all safety content for completeness
  - Ensure all important safety topics are covered
  - _Requirements: 14.5_

## Phase 16: Security Implementation (Requirement 15)

- [ ] 124. Implement password hashing with bcrypt (Req 15.1)
  - Confirm bcrypt is used for password hashing
  - Verify passwords are hashed before storage
  - Ensure passwords are never returned in API responses
  - Test password comparison on login
  - _Requirements: 15.1_

- [ ] 125. Add input validation for registration (Req 15.2)
  - Install express-validator package
  - Create validation middleware for registration endpoint
  - Validate email format, password strength, field lengths
  - Return detailed validation errors with 400 status
  - _Requirements: 15.2_

- [ ] 126. Add input validation for login (Req 15.2)
  - Create validation middleware for login endpoint
  - Validate email and password format
  - Return detailed validation errors
  - _Requirements: 15.2_

- [ ] 127. Add input validation for book creation (Req 15.2)
  - Create validation middleware for book creation endpoint
  - Validate all required fields
  - Sanitize string inputs to prevent XSS attacks
  - _Requirements: 15.2_

- [ ] 128. Add input validation for all other endpoints (Req 15.2)
  - Create validation middleware for remaining input endpoints
  - Sanitize all string inputs
  - Validate field lengths and formats
  - _Requirements: 15.2_

- [ ] 129. Validate file uploads securely (Req 15.2)
  - Validate uploaded file types (images only)
  - Limit file size to 5MB maximum
  - Generate unique filenames to prevent overwrites
  - Sanitize filenames
  - _Requirements: 15.2_

- [ ] 130. Implement rate limiting for auth endpoints (Req 15.3)
  - Install express-rate-limit package
  - Configure strict rate limiting for auth endpoints (5 requests per 15 min)
  - Return 429 status with appropriate error message when limit exceeded
  - _Requirements: 15.3_

- [ ] 131. Implement rate limiting for general API (Req 15.3)
  - Configure general rate limiting for all API routes (100 requests per 15 min)
  - Apply to all non-auth endpoints
  - _Requirements: 15.3_

- [ ] 132. Configure CORS (Req 15.4)
  - Install helmet package for security headers
  - Configure CORS to whitelist frontend domain only
  - Restrict allowed methods
  - _Requirements: 15.4_

- [ ] 133. Configure security headers (Req 15.4)
  - Set secure cookie options for production
  - Add Content Security Policy headers
  - Enable HTTPS enforcement in production
  - _Requirements: 15.4_

- [ ] 134. Validate JWT on all protected routes (Req 15.5)
  - Ensure authentication middleware is applied to all protected endpoints
  - Verify JWT signature and expiration on each request
  - Return 401 for missing or invalid tokens
  - Test protected route access without authentication
  - _Requirements: 15.5_

## Phase 17: Testing

- [ ] 135. Set up backend testing infrastructure
  - Install jest and supertest packages
  - Configure test database connection (separate from development)
  - Create test data seeding utilities
  - Set up test environment variables
  - Configure test scripts in package.json

- [ ] 136. Write user registration tests
  - Test user registration with valid data
  - Test registration with duplicate email (expect 409)
  - Test registration with invalid email format
  - Test registration with weak password

- [ ] 137. Write user login tests
  - Test login with correct credentials
  - Test login with incorrect credentials (expect 401)
  - Test JWT generation and validation

- [ ] 138. Write protected route tests
  - Test protected route access with valid token
  - Test protected route access without token (expect 401)
  - Test protected route access with invalid token (expect 401)

- [ ] 139. Write book creation tests
  - Test book creation with all required fields
  - Test book creation with ISBN lookup
  - Test book creation with image upload

- [ ] 140. Write book update tests
  - Test book update by owner
  - Test book update by non-owner (expect 403)

- [ ] 141. Write book deletion tests
  - Test book deletion by owner
  - Test book deletion by non-owner (expect 403)

- [ ] 142. Write book search tests
  - Test book filtering by city
  - Test book filtering by genre
  - Test book filtering by author
  - Test combined filters

- [ ] 143. Write trade proposal tests
  - Test trade proposal creation with valid data
  - Test trade proposal validation (ownership checks)

- [ ] 144. Write trade response tests
  - Test trade acceptance by receiver
  - Test trade acceptance by non-receiver (expect 403)
  - Test trade decline by receiver

- [ ] 145. Write trade completion tests
  - Test trade completion by proposer
  - Test trade completion by receiver
  - Test trade completion by non-participant (expect 403)

- [ ] 146. Write rating submission tests
  - Test rating submission with valid data
  - Test rating submission for non-completed trade (expect error)
  - Test rating validation (comment requirement for <= 3 stars)
  - Test duplicate rating prevention

- [ ] 147. Write rating calculation tests
  - Test average rating calculation
  - Test rating count update
  - Test edge cases (first rating, multiple ratings)

- [ ] 148. Set up frontend testing infrastructure
  - Install @testing-library/react and jest-dom
  - Configure test environment
  - Create mock API utilities
  - Set up mock authentication context

- [ ] 149. Write authentication form tests
  - Test RegisterForm rendering and validation
  - Test LoginForm rendering and validation
  - Test form submission and error handling

- [ ] 150. Write book listing form tests
  - Test BookListingForm rendering
  - Test ISBN lookup functionality
  - Test image upload preview
  - Test form validation

- [ ] 151. Write trade proposal tests
  - Test TradeProposalModal rendering
  - Test book selection
  - Test proposal submission

- [ ] 152. Write rating form tests
  - Test RatingForm with conditional comment
  - Test star selection
  - Test validation

- [ ] 153. Write notification tests
  - Test NotificationBell badge display
  - Test notification dropdown
  - Test mark as read functionality

- [ ] 154. Write integration tests for registration flow
  - Test complete user registration and login flow
  - Test error handling throughout flow

- [ ] 155. Write integration tests for book management
  - Test book creation and editing flow
  - Test book deletion flow

- [ ] 156. Write integration tests for trading
  - Test trade proposal and acceptance flow
  - Test messaging in accepted trade
  - Test trade completion

- [ ] 157. Write integration tests for rating
  - Test rating submission after completion
  - Test rating display on profile

- [ ] 158. Perform end-to-end testing for user journey
  - Test new user registration → create listing → logout flow
  - Test search → view book → propose trade flow

- [ ] 159. Perform end-to-end testing for complete trade flow
  - Test propose trade → communicate → complete → rate flow
  - Test notification interaction throughout

- [ ] 160. Perform end-to-end testing for wishlist
  - Test wishlist creation and viewing on profile
  - Test wishlist visibility to other users

- [ ] 161. Test error scenarios
  - Test network failure handling
  - Test invalid input handling
  - Test unauthorized access attempts
  - Test edge cases (empty states, missing data)


## Phase 18: Deployment

- [ ] 162. Set up production database
  - Create MongoDB Atlas cluster
  - Configure database user with appropriate permissions
  - Set up IP whitelist or allow all IPs for cloud deployment
  - Configure automated backups
  - Get connection string for production environment
  - Test connection from local environment

- [ ] 163. Configure cloud storage for images
  - Set up Cloudinary account (or chosen cloud storage)
  - Get API credentials (cloud name, API key, API secret)
  - Configure upload presets and folder structure
  - Test image upload and retrieval
  - Set up CDN delivery

- [ ] 164. Set up environment variables for production
  - Create production .env file with all required variables
  - Generate strong JWT secret (minimum 32 characters)
  - Configure production MongoDB URI
  - Add Cloudinary credentials
  - Set frontend URL for CORS configuration
  - Set NODE_ENV to "production"

- [ ] 165. Configure backend build scripts
  - Configure build and start scripts in package.json
  - Test build process locally
  - Ensure all dependencies are in correct sections

- [ ] 166. Deploy backend to hosting platform
  - Choose hosting platform (Heroku, Railway, DigitalOcean, AWS)
  - Set environment variables in hosting platform
  - Deploy backend application
  - Verify API endpoints are accessible via public URL
  - Check logs for any deployment errors

- [ ] 167. Configure frontend build settings
  - Configure build settings (build command, output directory)
  - Set REACT_APP_API_URL environment variable to backend URL
  - Test build process locally

- [ ] 168. Deploy frontend to hosting platform
  - Choose hosting platform (Vercel, Netlify, AWS Amplify)
  - Deploy frontend application
  - Configure custom domain if available
  - Test frontend loads correctly

- [ ] 169. Verify production deployment - authentication
  - Test user registration in production
  - Test user login in production
  - Verify JWT authentication works

- [ ] 170. Verify production deployment - book management
  - Test book creation with image upload
  - Test book editing and deletion
  - Test search and filtering functionality

- [ ] 171. Verify production deployment - trading
  - Test complete trade flow from proposal to rating
  - Test messaging functionality
  - Test notifications

- [ ] 172. Verify production deployment - security
  - Verify HTTPS is working correctly
  - Test rate limiting
  - Check security headers

- [ ] 173. Monitor production deployment
  - Check that all API endpoints are accessible
  - Monitor error logs for any issues
  - Test on multiple devices and browsers

## Phase 19: Documentation

- [ ] 174. Document authentication endpoints
  - Document registration and login endpoints
  - Include request/response examples
  - Document authentication requirements

- [ ] 175. Document book management endpoints
  - Document all book CRUD endpoints
  - Include query parameters and filters
  - Document ISBN lookup endpoint

- [ ] 176. Document wishlist endpoints
  - Document wishlist CRUD endpoints
  - Include request/response examples

- [ ] 177. Document trade endpoints
  - Document trade proposal, response, and completion endpoints
  - Include all status transitions

- [ ] 178. Document messaging endpoints
  - Document message sending and retrieval endpoints
  - Include authentication requirements

- [ ] 179. Document rating endpoints
  - Document rating submission and retrieval endpoints
  - Include validation requirements

- [ ] 180. Document notification endpoints
  - Document notification retrieval and update endpoints
  - Include notification types

- [ ] 181. Document error responses
  - Document all error response formats
  - Include status codes and error messages
  - Provide troubleshooting guidance

- [ ] 182. Create Postman collection or OpenAPI spec
  - Create comprehensive API documentation
  - Include example curl commands
  - Organize by feature area

- [ ] 183. Write database setup guide
  - Document MongoDB Atlas setup
  - Include connection string configuration
  - Document database user creation

- [ ] 184. Write cloud storage setup guide
  - Document Cloudinary setup
  - Include API credential configuration
  - Document upload configuration

- [ ] 185. Write backend deployment guide
  - Document all environment variable requirements
  - Provide step-by-step deployment instructions for backend
  - Include troubleshooting section for common issues

- [ ] 186. Write frontend deployment guide
  - Provide step-by-step deployment instructions for frontend
  - Document environment variable configuration
  - Include build configuration

- [ ] 187. Write maintenance procedures
  - Document backup procedures
  - Document monitoring and logging
  - Include common maintenance tasks

- [ ] 188. Write user registration guide
  - Create guide for new users: registration and profile setup
  - Include screenshots and step-by-step instructions

- [ ] 189. Write book listing guide
  - Document how to create book listings
  - Explain ISBN lookup feature and its benefits
  - Include tips for good listings

- [ ] 190. Write search and discovery guide
  - Document search and filtering capabilities
  - Explain how to find books effectively

- [ ] 191. Write wishlist guide
  - Explain wishlist feature and how to use it
  - Document how wishlist helps with trading

- [ ] 192. Write trading guide
  - Document complete trading process from proposal to completion
  - Include communication best practices
  - Explain trade statuses

- [ ] 193. Write rating guide
  - Explain rating system and its importance
  - Document when and how to rate
  - Include rating guidelines

- [ ] 194. Write safety guide for users
  - Include safety guidelines and best practices
  - Document safe meeting practices
  - Include community guidelines

- [ ] 195. Create FAQ section
  - Add FAQ section for common questions
  - Include troubleshooting tips
  - Provide contact information for support
