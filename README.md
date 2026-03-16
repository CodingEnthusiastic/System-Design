# System Design Platform

A comprehensive platform for learning and mastering system design concepts with courses, articles, and interactive quizzes.

## Project Setup

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- MongoDB (Backend)
- Node.js/Express (Backend)
- JWT Authentication
- SMTP Email Verification

## Getting Started

### Prerequisites
- Node.js & npm
- MongoDB Atlas account

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Step 2: Install frontend dependencies
npm install

# Step 3: Install backend dependencies
cd server && npm install && cd ..

# Step 4: Set up environment variables
# Update .env files in root and server directories with your MongoDB and SMTP credentials

# Step 5: Start the backend server
cd server && npm run dev

# Step 6: Start the frontend (in another terminal)
npm run dev
```

The frontend will be available at `http://localhost:8080` and the backend at `http://localhost:5000`.

## Features

- **Learn Section**: Video courses categorized by difficulty and topic
- **Articles**: Rich content articles with images and formatting
- **Quizzes**: Interactive quizzes with full-screen mode
- **Admin Panel**: Create and manage articles and quizzes
- **User Authentication**: Register with email verification, login with JWT
- **Profile Management**: User profiles with roles (admin/user)

## Authentication

### Register
1. Provide username, email, and password
2. Receive 6-digit verification code via email
3. Enter verification code to complete registration

### Login
- Login with email and password
- JWT token issued for authenticated requests

## Environment Variables

### Frontend (.env in root)
```
VITE_API_URL=http://localhost:5000
```

### Backend (server/.env)
```
MONGODB_URI=
PORT=5000
JWT_SECRET=your_secret_key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FRONTEND_URL=http://localhost:8080
```

## Development

```bash
npm run dev          # Start frontend dev server
npm run build        # Build for production
npm run lint         # Run linter
```

## Deployment

Build the frontend:
```bash
npm run build
```

Then deploy the `dist` folder to your hosting provider. Deploy the backend separately to your server or cloud platform.

