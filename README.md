# WanderLog

A minimalist UGC platform where users can anonymously share posts with text and images. Built with React + MongoDB.

## Features

- Anonymous posting (no login system)
- Posts include title, text content, and up to 6 images
- UUID-based post identification
- Immutable posts (no editing or deletion)
- Simple UI with khaki, black, and white color theme
- Image upload to server storage

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: MongoDB
- **File Storage**: Local server storage

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Set up environment variables:
   Create a `.env` file in the backend directory:
   ```
   MONGODB_URI=mongodb://localhost:27017/wanderlog
   PORT=5000
   ```

### Running the Application

1. Start MongoDB (if running locally)

2. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

3. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## API Endpoints

- `POST /api/posts` - Create a new post (with optional image uploads)
- `GET /api/posts` - Get all posts (sorted by creation date, newest first)
- `GET /api/posts/:id` - Get a specific post by UUID

## Project Structure

```
wanderlog/
├── backend/
│   ├── models/
│   │   └── Post.js
│   ├── uploads/          # Image storage directory
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CreatePost.tsx
│   │   │   ├── PostCard.tsx
│   │   │   └── PostDetail.tsx
│   │   ├── types.ts
│   │   ├── App.tsx
│   │   └── App.css
│   └── package.json
└── README.md
```