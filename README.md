# BookVerse 📚

A modern, full-stack MERN application for peer-to-peer book trading with a focus on fairness, trust, and community building.

## 🌟 Overview

BookVerse is a book trading platform that connects book lovers, enabling them to trade books they've read for books they want to read. Built with modern web technologies, it features personalized recommendations, distance-based search, real-time messaging, and a comprehensive trust system.

## 📁 Project Structure

```
BookVerse/
├── client/                 # React frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page-level components
│   │   ├── context/       # React Context (Auth, Toast)
│   │   ├── styles/        # Global styles and theme
│   │   └── data/          # Static data (cities, genres)
│   └── public/            # Static assets
├── server/                # Express.js backend
│   ├── routes/            # API route handlers
│   ├── models/            # Mongoose schemas
│   ├── middleware/        # Express middleware
│   ├── utils/             # Utility functions
│   └── config/            # Configuration modules
└── README.md
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn**
- **Cloudinary Account** (for image uploads - free tier available)
- **Google Books API Key** (optional but recommended - free)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BookVerse
   ```

2. **Install root dependencies** (for Tailwind CSS)
   ```bash
   npm install
   ```

### Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file with the following:
   ```env
   # Server
   NODE_ENV=development
   PORT=5000
   
   # Database
   MONGODB_URI=mongodb://127.0.0.1:27017/bookverse
   
   # JWT
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=24h
   
   # Cloudinary (required for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Google Books API (optional but recommended)
   GOOGLE_BOOKS_API_KEY=your_google_books_api_key
   
   # Email (optional - for notifications)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:5000`

### Client Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (optional - defaults work for local development):
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The client will run on `http://localhost:3000`

### Verify Installation

1. Open `http://localhost:3000` in your browser
2. You should see the BookVerse homepage
3. Try registering a new account
4. Create a book listing to test image upload

## ✨ Key Features

### Core Trading Features
- 📖 **Book Listing Management** - Create, edit, and manage book listings with image upload
- 🔍 **Advanced Search & Filtering** - Search by title, author, genre, condition, and location
- ❤️ **Wishlist System** - Track books you want and get notified when they're available
- 🤝 **Trade Proposals** - Propose, negotiate, and manage book trades
- 💬 **Real-time Messaging** - Chat with other traders to coordinate exchanges
- ⭐ **Rating & Review System** - Build trust through user ratings and reviews

### Smart Features
- 🎯 **Personalized Recommendations** - Hybrid recommendation system based on your wishlist and trade history
- 📍 **Distance-Based Search** - Find books near you to reduce shipping costs
- 🔔 **Smart Notifications** - Get notified about trade updates, messages, and wishlist matches
- 🔒 **Privacy Controls** - Control what information you share (city, email visibility)

### Book Data
- 📚 **Hybrid ISBN Lookup** - Automatically fetches book data from Google Books + Open Library
- 🖼️ **Smart Cover Images** - Intelligent fallback system for high-quality book covers
- ✅ **Data Validation** - Ensures accurate book information

### User Experience
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- 🌙 **Theme Support** - Custom color system with CSS variables
- 📱 **Mobile Responsive** - Works seamlessly on all devices
- ⚡ **Fast Performance** - Optimized queries and caching

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18.2 with React Router 6.16
- **Build Tool**: Vite 4.4
- **Styling**: Tailwind CSS 4.1 with custom theme
- **HTTP Client**: Axios 1.5
- **Icons**: Lucide React
- **Testing**: Vitest 0.34 with @testing-library/react

### Backend
- **Runtime**: Node.js (v16+)
- **Framework**: Express.js 4.18
- **Database**: MongoDB with Mongoose 7.8
- **Authentication**: JWT (jsonwebtoken 9.0) with bcryptjs 2.4
- **File Upload**: Multer 1.4 with Cloudinary 1.41
- **Security**: Helmet 8.1, express-rate-limit 6.11, express-mongo-sanitize 2.2
- **Validation**: express-validator 7.0, DOMPurify 3.3
- **Testing**: Jest 29.6 with Supertest 6.3

### External Services
- **Image Storage**: Cloudinary
- **Book Data**: Google Books API + Open Library API (hybrid approach)
- **Geocoding**: OpenStreetMap Nominatim (free, no API key needed)
- **Email**: SMTP (configurable)

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Key Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

#### Books
- `GET /books` - Get all books (with filters)
- `GET /books/:id` - Get book by ID
- `POST /books` - Create book listing
- `PUT /books/:id` - Update book
- `DELETE /books/:id` - Delete book

#### Trades
- `GET /trades` - Get user's trades
- `POST /trades` - Create trade proposal
- `PUT /trades/:id` - Update trade status
- `GET /trades/:id` - Get trade details

#### Wishlist
- `GET /wishlist` - Get user's wishlist
- `POST /wishlist` - Add to wishlist
- `DELETE /wishlist/:id` - Remove from wishlist

#### Recommendations
- `GET /recommendations` - Get personalized recommendations
- `GET /recommendations/profile` - Get user preference profile

#### Nearby
- `GET /nearby/books` - Search books by distance
- `GET /nearby/users` - Search users by distance
- `GET /nearby/same-city` - Get same-city books

#### Messages
- `GET /messages/:tradeId` - Get trade messages
- `POST /messages` - Send message

#### Notifications
- `GET /notifications` - Get user notifications
- `PUT /notifications/:id/read` - Mark as read

### Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 🧪 Testing

### Run Server Tests
```bash
cd server
npm test
```

### Run Client Tests
```bash
cd client
npm test
```

### Test Coverage
- Authentication flows
- CRUD operations
- Privacy settings
- Trade workflows
- Recommendation system

## 🎯 Key Features Explained

### Hybrid Recommendation System

BookVerse uses a sophisticated hybrid recommendation algorithm:

**Signal Weighting**:
- Wishlist items: 5x weight (strongest signal - they want these books)
- Received trades: 3x weight (they traded for these)
- Proposed trades: 3x weight (they tried to get these)
- Owned books: 1x weight (weak signal - they're trading away)

**Scoring Factors**:
- Wishlist match: 100 points
- Genre match: up to 50 points
- Author match: up to 40 points
- Location proximity: up to 30 points
- Recency: up to 15 points
- Owner reputation: up to 10 points

**Hybrid Distribution**:
- 80% Content-based (wishlist + preferences)
- 15% Trending (recently listed)
- 5% Random discovery (serendipity)

### Distance-Based Search

Find books near you to reduce shipping costs:
- Uses OpenStreetMap Nominatim (free, no API key needed)
- Search radius: 5-200 km
- Haversine formula for accurate distance calculation
- Privacy-aware (respects user location settings)

### Book Data Lookup

Hybrid approach for maximum coverage:
- **Primary**: Google Books API (better for popular/recent books)
- **Fallback**: Open Library API (better for older/academic books)
- Automatic fallback when primary source fails
- Image verification before use
- Maximizes success rate for finding book covers

### Privacy Controls

Users have full control over their data:
- Show/hide city location
- Show/hide email address
- Control profile visibility
- All queries respect privacy settings

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcryptjs with salt rounds
- **Rate Limiting** - Prevents brute force attacks
- **Input Sanitization** - Prevents XSS and injection attacks
- **MongoDB Sanitization** - Prevents NoSQL injection
- **Helmet** - Sets security HTTP headers
- **CORS** - Configured for frontend origin
- **Token Blacklist** - Invalidates logged-out tokens

## 📊 Database Schema

### Key Models

**User**
- Authentication (email, password)
- Profile (name, city, bio)
- Privacy settings
- Coordinates (for distance search)
- Ratings and reputation

**Book**
- Book details (title, author, ISBN, genre)
- Condition and availability
- Owner reference
- Image URL (Cloudinary)
- Timestamps

**Trade**
- Proposer and receiver
- Offered and requested books
- Status (proposed, accepted, rejected, completed)
- Messages
- Timestamps

**Wishlist**
- User reference
- Book details (title, author, ISBN)
- Timestamps

**Message**
- Trade reference
- Sender and content
- Read status
- Timestamps

**Notification**
- Recipient reference
- Type and content
- Read status
- Related entities (trade, book, user)

## 🚀 Deployment

### Production Build

**Client**:
```bash
cd client
npm run build
```
Output: `client/dist/`

**Server**:
```bash
cd server
npm start
```

### Environment Variables

Ensure all production environment variables are set:
- Use strong JWT_SECRET
- Set NODE_ENV=production
- Use MongoDB Atlas for database
- Configure production CORS settings
- Set up production email service

### Recommended Hosting

- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Backend**: Heroku, Railway, Render, or AWS EC2
- **Database**: MongoDB Atlas
- **Images**: Cloudinary

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

MIT

## 🙏 Acknowledgments

- Google Books API for book data
- Open Library for additional book coverage
- OpenStreetMap for geocoding services
- Cloudinary for image hosting
- All contributors and users of BookVerse

---

**Built with ❤️ for book lovers everywhere**
