# FounderX - Founder & Startup Social Media Platform

FounderX is a platform for founders to share their journey, find investors, and monetize their products.

## Features

### Core Features
- **Startups**: Create and manage startup profiles.
- **Posts**: Share updates, ideas, and products (Text, Image, Video).
- **Feed**: Personalized feed of startup updates.
- **Video System**: TikTok/Reels style video feed (`/watch`).
- **Messaging**: Real-time messaging between users.

### User Roles
- **Founders**: Create startups, post updates, sell products.
- **Investors**: Discover startups, follow updates, contact founders.

### Monetization
- **Products**: Startups can list products/services.
- **Orders**: (Foundation laid) Users can purchase products.

## Tech Stack
- **Frontend**: Next.js (App Router), Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT

## Getting Started

### Prerequisites
- Node.js installed
- MongoDB installed and running locally

### Installation

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Create .env file
   echo "PORT=5000" > .env
   echo "MONGO_URI=mongodb://localhost:27017/founderx" >> .env
   echo "JWT_SECRET=your_jwt_secret" >> .env
   
   # Start Server
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Start Client
   npm run dev
   ```

3. **Access the App**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Documentation

- **Auth**: `/api/auth/register`, `/api/auth/login`
- **Posts**: `/api/posts` (GET, POST), `/api/posts?type=video`
- **Startups**: `/api/startups`
- **Products**: `/api/products`
- **Messages**: `/api/messages`

## Testing

Test scripts are provided in the root directory:
- `node test_monetization.js`: Test product creation flow.
- `node test_video.js`: Test video post creation.
- `node test_messages.js`: Test messaging flow.
