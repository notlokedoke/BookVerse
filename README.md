# BookVerse

A full-stack MERN application for peer-to-peer book trading with a focus on fairness, trust, and community.

## Project Structure

```
BookVerse/
├── client/          # React frontend (Vite)
├── server/          # Express.js backend
└── README.md
```

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Getting Started

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

4. Update the `.env` file with your configuration values

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

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The client will run on `http://localhost:3000`

## Features

- User registration and authentication
- Book listing management with image upload
- Advanced search and filtering
- Wishlist system
- Trade proposal and management
- Real-time messaging for trades
- User rating system
- In-app notifications
- Privacy controls

## Tech Stack

**Frontend:**
- React.js
- React Router
- Axios
- Vite

**Backend:**
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Cloudinary (image storage)
- Google Books API

## License

MIT
