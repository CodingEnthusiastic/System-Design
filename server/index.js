import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import nodemailer from 'nodemailer';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use persistent disk path on Render, local path in development
const uploadsDir = process.env.NODE_ENV === 'production' 
  ? '/opt/render/project/repo/server/uploads'
  : path.join(__dirname, 'uploads');

console.log(`📁 Using uploads directory: ${uploadsDir}`);

// Determine allowed origin based on environment
const getAllowedOrigin = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, allow multiple domains
    return [
      process.env.FRONTEND_URL,
      'https://systempoint.netlify.app',
      'https://system-design-frontend.netlify.app',
    ].filter(Boolean);
  }
  // In development, allow localhost
  return process.env.FRONTEND_URL || 'http://localhost:8080';
};

// Middleware
app.use(express.json());
app.use(cors({
  origin: getAllowedOrigin(),
  credentials: true
}));

// Static files for uploads with proper headers
app.use('/uploads', (req, res, next) => {
  // Allow all origins for images (public assets)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cache-Control', 'public, max-age=86400'); // 24 hours
  res.header('ETag', 'false');
  
  // Log image requests in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📸 Image request: ${req.method} ${req.url}`);
  }
  
  next();
}, express.static(uploadsDir, {
  maxAge: '24h',
  etag: false,
  lastModified: false,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
  }
}));

// 404 handler for missing images
app.use('/uploads', (req, res) => {
  console.error(`❌ Image not found: ${req.url}`);
  res.status(404).json({ 
    error: 'Image not found',
    path: req.url,
    availableAt: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : 'http://localhost:5000'
  });
});

// Google Drive Image Proxy - Fetches images from Google Drive and serves them
// This bypasses CORS issues when loading Google Drive images in <img> tags
app.get('/api/proxy/gdrive/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Validate file ID format (basic check)
    if (!fileId || !/^[a-zA-Z0-9-_]+$/.test(fileId)) {
      return res.status(400).json({ error: 'Invalid file ID format' });
    }
    
    // Fetch from Google Drive direct access URL
    const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    
    const response = await fetch(driveUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ Google Drive fetch failed for ${fileId}: ${response.status}`);
      return res.status(response.status).json({ error: 'Failed to fetch image from Google Drive' });
    }
    
    // Get content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Set cache headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Get buffer and send it
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
    console.log(`✅ Proxied Google Drive image: ${fileId}`);
  } catch (error) {
    console.error('Google Drive proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
});

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Uploads directory created/verified');
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// MongoDB connection
let db;
let authCollection, articlesCollection, quizzesCollection, usersCollection, verificationsCollection, leaderboardCollection, coursesCollection, courseTrackingCollection;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db('system_design_db');
    
    authCollection = db.collection('users');
    articlesCollection = db.collection('articles');
    quizzesCollection = db.collection('quizzes');
    coursesCollection = db.collection('courses');
    usersCollection = db.collection('userProfiles');
    verificationsCollection = db.collection('verifications');
    leaderboardCollection = db.collection('leaderboard');
    courseTrackingCollection = db.collection('courseTracking');

    // Create indexes
    await authCollection.createIndex({ email: 1 }, { unique: true });
    await verificationsCollection.createIndex({ email: 1 });
    await leaderboardCollection.createIndex({ quizId: 1, userId: 1 }, { unique: true });
    await leaderboardCollection.createIndex({ quizId: 1, points: -1 });
    await courseTrackingCollection.createIndex({ userId: 1, courseId: 1 }, { unique: true });
    await courseTrackingCollection.createIndex({ userId: 1 });
    await courseTrackingCollection.createIndex({ courseId: 1 });
    
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Utility functions
const generateToken = (token, expires = '7d') => {
  return jwt.sign(token, process.env.JWT_SECRET, { expiresIn: expires });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Safe ObjectId conversion - handles both valid ObjectIds and string IDs
const toObjectId = (id) => {
  try {
    return new ObjectId(id);
  } catch (error) {
    return null;
  }
};

const middleware = {
  auth: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });
    
    req.user = decoded;
    next();
  },
  admin: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user = decoded;
    next();
  }
};

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existing = await authCollection.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Store verification request
    await verificationsCollection.updateOne(
      { email },
      {
        $set: {
          email,
          username,
          password: hashedPassword,
          code: verificationCode,
          createdAt: new Date(),
          expires: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        }
      },
      { upsert: true }
    );

    // Send verification email
    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: 'Verify Your Email - System Design Platform',
        html: `<h2>Email Verification</h2><p>Your verification code is: <strong style="font-size: 24px;">${verificationCode}</strong></p><p>This code expires in 15 minutes.</p>`
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Continue anyway - user can try verifying
    }

    res.json({ 
      message: 'Verification code sent to your email',
      email 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Missing email or code' });
    }

    const verification = await verificationsCollection.findOne({ email });
    
    if (!verification) {
      return res.status(400).json({ error: 'No verification request found' });
    }

    if (verification.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > verification.expires) {
      return res.status(400).json({ error: 'Verification code expired' });
    }

    // Create user
    const user = {
      username: verification.username,
      email: verification.email,
      password: verification.password,
      role: 'user',
      createdAt: new Date(),
      bio: '',
      avatar: '',
      points: 0
    };

    await authCollection.insertOne(user);

    // Clean up verification
    await verificationsCollection.deleteOne({ email });

    // Generate JWT
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role
    });

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const user = await authCollection.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcryptjs.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role
    });

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile
app.get('/api/auth/profile', middleware.auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const objectId = toObjectId(userId);
    
    if (!objectId) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await authCollection.findOne({ _id: objectId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role,
      points: user.points || 0
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ARTICLES ROUTES
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await articlesCollection.find({}).toArray();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

app.get('/api/articles/:id', async (req, res) => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ error: 'Invalid article ID' });
    const article = await articlesCollection.findOne({ _id: objectId });
    if (!article) return res.status(404).json({ error: 'Article not found' });
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

app.post('/api/articles', middleware.auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create articles' });
    }

    const { title, content, tags, images } = req.body;
    
    const article = {
      title,
      content,
      tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()),
      images: Array.isArray(images) ? images : [],
      author: req.user.username,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await articlesCollection.insertOne(article);
    res.json({ ...article, _id: result.insertedId });
  } catch (error) {
    console.error('Article creation error:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
});

app.put('/api/articles/:id', middleware.auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update articles' });
    }

    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ error: 'Invalid article ID' });

    const { title, content, tags, images } = req.body;
    
    const result = await articlesCollection.findOneAndUpdate(
      { _id: objectId },
      {
        $set: {
          title,
          content,
          tags: Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()),
          images: Array.isArray(images) ? images : [],
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    res.json(result.value);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update article' });
  }
});

app.delete('/api/articles/:id', middleware.auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete articles' });
    }

    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ error: 'Invalid article ID' });
    
    await articlesCollection.deleteOne({ _id: objectId });
    res.json({ message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// CLEANUP BROKEN IMAGES - Remove all /uploads/ URLs from articles
app.post('/api/articles/cleanup/broken-images', middleware.admin, async (req, res) => {
  try {
    // Get all articles
    const articles = await articlesCollection.find({}).toArray();
    let cleanedCount = 0;

    for (const article of articles) {
      if (article.images && article.images.length > 0) {
        // Filter out /uploads/ URLs
        const cleanedImages = article.images.filter(img => !String(img).startsWith('/uploads/'));
        
        // If images were removed, update the article
        if (cleanedImages.length < article.images.length) {
          await articlesCollection.updateOne(
            { _id: article._id },
            { $set: { images: cleanedImages } }
          );
          cleanedCount++;
          console.log(`✅ Cleaned article: ${article.title}`);
        }
      }
    }

    res.json({ 
      message: `Cleaned ${cleanedCount} article(s)`,
      cleanedCount 
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Failed to cleanup broken images' });
  }
});

// IMAGE UPLOAD
app.post('/api/upload', middleware.auth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

// COURSES ROUTES
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await db.collection('courses').find({}).toArray();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ error: 'Invalid course ID' });
    const course = await db.collection('courses').findOne({ _id: objectId });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

app.post('/api/courses', middleware.auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create courses' });
    }

    const { title, description, category, difficulty, thumbnail, lessons } = req.body;
    
    const course = {
      title,
      description,
      category,
      difficulty,
      thumbnail,
      lessons,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('courses').insertOne(course);
    res.json({ ...course, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create course' });
  }
});

app.put('/api/courses/:id', middleware.auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update courses' });
    }

    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ error: 'Invalid course ID' });
    
    const { title, description, category, difficulty, thumbnail, lessons } = req.body;
    
    const result = await db.collection('courses').updateOne(
      { _id: objectId },
      {
        $set: {
          title,
          description,
          category,
          difficulty,
          thumbnail,
          lessons,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update course' });
  }
});

app.delete('/api/courses/:id', middleware.auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete courses' });
    }

    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ error: 'Invalid course ID' });
    
    await db.collection('courses').deleteOne({ _id: objectId });
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// QUIZZES ROUTES
app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzes = await quizzesCollection.find({}).toArray();
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

app.get('/api/quizzes/:id', async (req, res) => {
  try {
    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ error: 'Invalid quiz ID' });
    const quiz = await quizzesCollection.findOne({ _id: objectId });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

app.post('/api/quizzes', middleware.auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create quizzes' });
    }

    const { title, topic, questions } = req.body;
    
    // Ensure all questions have unique IDs
    const questionsWithIds = questions.map((q, index) => ({
      ...q,
      id: q.id || `q-${Date.now()}-${index}`
    }));
    
    const quiz = {
      title,
      topic,
      questions: questionsWithIds,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await quizzesCollection.insertOne(quiz);
    res.json({ ...quiz, _id: result.insertedId });
  } catch (error) {
    console.error('Quiz creation error:', error);
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

app.put('/api/quizzes/:id', middleware.auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update quizzes' });
    }

    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ error: 'Invalid quiz ID' });
    
    const { title, topic, questions } = req.body;
    
    // Ensure all questions have unique IDs
    const questionsWithIds = questions.map((q, index) => ({
      ...q,
      id: q.id || `q-${Date.now()}-${index}`
    }));
    
    const result = await quizzesCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          title,
          topic,
          questions: questionsWithIds,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({ message: 'Quiz updated' });
  } catch (error) {
    console.error('Quiz update error:', error);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

app.delete('/api/quizzes/:id', middleware.auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete quizzes' });
    }

    const objectId = toObjectId(req.params.id);
    if (!objectId) return res.status(400).json({ error: 'Invalid quiz ID' });
    
    await quizzesCollection.deleteOne({ _id: objectId });
    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// QUIZ LEADERBOARD ROUTES
// Submit quiz result (one-time attempt only)
app.post('/api/quizzes/:quizId/submit', middleware.auth, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { score, timeSpent, answers } = req.body;
    const userIdFromToken = req.user._id || req.user.id;
    const userObjectId = toObjectId(userIdFromToken);

    if (!userObjectId) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user has already attempted this quiz
    const existingAttempt = await leaderboardCollection.findOne({
      quizId,
      userId: userObjectId
    });

    if (existingAttempt) {
      return res.status(400).json({ error: 'You have already attempted this quiz. You can review your previous attempt.' });
    }

    // Create leaderboard entry with answers for review
    const leaderboardEntry = {
      quizId,
      userId: userObjectId,
      username: req.user.username || 'Anonymous',
      email: req.user.email,
      points: score,
      timeSpent,
      answers: answers || {}, // Store user's answers for review
      completedAt: new Date(),
    };
    
    console.log('Leaderboard entry being stored:', {
      quizId,
      userId: userObjectId.toString(),
      username: leaderboardEntry.username,
      email: leaderboardEntry.email,
      points: score
    });

    console.log('Storing quiz attempt with answers:', {
      quizId,
      userId: userObjectId.toString(),
      points: score,
      answersCount: Object.keys(answers || {}).length,
      answers: answers
    });

    // Insert new entry (no upsert)
    await leaderboardCollection.insertOne(leaderboardEntry);

    // Update user points - sum all quiz points for this user
    // Handle both ObjectId and string formats for backward compatibility
    const userIdStr = userObjectId.toString();
    const totalPoints = await leaderboardCollection.aggregate([
      { 
        $match: { 
          $or: [
            { userId: userObjectId },
            { userId: userIdStr }
          ]
        } 
      },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]).toArray();

    const userPoints = totalPoints.length > 0 ? totalPoints[0].total : 0;
    
    console.log('Updating user points:', {
      userId: userObjectId.toString(),
      totalPoints: userPoints
    });

    await authCollection.updateOne(
      { _id: userObjectId },
      { $set: { points: userPoints } }
    );

    res.json({ message: 'Quiz result submitted', points: score });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Failed to submit quiz result' });
  }
});

// Get leaderboard for a quiz
app.get('/api/quizzes/:quizId/leaderboard', async (req, res) => {
  try {
    const { quizId } = req.params;

    const leaderboard = await leaderboardCollection
      .find({ quizId })
      .sort({ points: -1, timeSpent: 1 })
      .limit(100)
      .toArray();

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Check if user has attempted a quiz
app.get('/api/quizzes/:quizId/check-attempt', middleware.auth, async (req, res) => {
  try {
    const { quizId } = req.params;
    const userIdFromToken = req.user._id || req.user.id;
    const userObjectId = toObjectId(userIdFromToken);
    const userIdStr = userObjectId.toString();

    if (!userObjectId) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Handle both ObjectId and string formats for backward compatibility
    const attempt = await leaderboardCollection.findOne({
      quizId,
      $or: [
        { userId: userObjectId },
        { userId: userIdStr }
      ]
    });

    res.json({ 
      hasAttempted: !!attempt,
      attempt: attempt ? {
        points: attempt.points,
        timeSpent: attempt.timeSpent,
        completedAt: attempt.completedAt,
        answers: attempt.answers || {}
      } : null
    });
  } catch (error) {
    console.error('Check attempt error:', error);
    res.status(500).json({ error: 'Failed to check attempt status' });
  }
});

// Get user's attempt details for review
app.get('/api/quizzes/:quizId/attempt', middleware.auth, async (req, res) => {
  try {
    const { quizId } = req.params;
    const userIdFromToken = req.user._id || req.user.id;
    const userObjectId = toObjectId(userIdFromToken);
    const userIdStr = userObjectId.toString();

    if (!userObjectId) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Handle both ObjectId and string formats for backward compatibility
    const attempt = await leaderboardCollection.findOne({
      quizId,
      $or: [
        { userId: userObjectId },
        { userId: userIdStr }
      ]
    });

    if (!attempt) {
      return res.status(404).json({ error: 'No attempt found for this quiz' });
    }

    console.log('Fetching quiz attempt:', {
      quizId,
      userId: userIdStr,
      points: attempt.points,
      answersCount: Object.keys(attempt.answers || {}).length,
      answers: attempt.answers
    });

    res.json({
      points: attempt.points,
      timeSpent: attempt.timeSpent,
      completedAt: attempt.completedAt,
      answers: attempt.answers || {}
    });
  } catch (error) {
    console.error('Attempt details fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch attempt details' });
  }
});

// COURSE TRACKING ROUTES
// Track course progress
app.post('/api/courses/:courseId/track', middleware.auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessonId, isCompleted, timeSpent } = req.body;
    const userId = req.user._id || req.user.id;

    // Build update object with proper property names
    const incObj = {};
    incObj[`lessons.${lessonId}.timeSpent`] = timeSpent || 0;
    
    const setObj = {};
    setObj[`lessons.${lessonId}.completed`] = isCompleted || false;
    setObj[`lessons.${lessonId}.lastAccessed`] = new Date();
    if (isCompleted) {
      setObj[`lessons.${lessonId}.completedAt`] = new Date();
    }

    // Upsert course tracking
    const result = await courseTrackingCollection.findOneAndUpdate(
      { userId: userId.toString(), courseId },
      {
        $set: {
          ...setObj,
          updatedAt: new Date()
        },
        $inc: incObj,
        $setOnInsert: {
          userId: userId.toString(),
          courseId,
          startedAt: new Date()
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.json({ message: 'Course progress tracked', tracking: result.value });
  } catch (error) {
    console.error('Course tracking error:', error);
    res.status(500).json({ error: 'Failed to track course progress' });
  }
});

// Get user course progress
app.get('/api/courses/:courseId/progress', middleware.auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id || req.user.id;

    const progress = await courseTrackingCollection.findOne({
      userId: userId.toString(),
      courseId
    });

    if (!progress) {
      return res.json({
        userId: userId.toString(),
        courseId,
        lessons: {},
        startedAt: null,
        completionPercentage: 0
      });
    }

    res.json(progress);
  } catch (error) {
    console.error('Course progress fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch course progress' });
  }
});

// Get user's all course progress
app.get('/api/user/courses/progress', middleware.auth, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const allProgress = await courseTrackingCollection
      .find({ userId: userId.toString() })
      .toArray();

    res.json(allProgress);
  } catch (error) {
    console.error('User courses progress fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user course progress' });
  }
});

// ========== USERS MANAGEMENT ==========
// Get all users (admin only)
app.get('/api/users', middleware.admin, async (req, res) => {
  try {
    const users = await authCollection.find({}).toArray();
    res.json(users.map(u => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      role: u.role || 'user',
      createdAt: u.createdAt
    })));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', middleware.admin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const result = await authCollection.deleteOne({ _id: new ObjectId(userId) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// DEBUG: Get all users (for verification)
app.get('/api/debug/users', async (req, res) => {
  try {
    const users = await authCollection.find({}).toArray();
    res.json({
      totalUsers: users.length,
      users: users.map(u => ({
        username: u.username,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ADMIN: Recalculate all user points from leaderboard
app.post('/api/admin/recalculate-points', middleware.admin, async (req, res) => {
  try {
    // Get all users
    const users = await authCollection.find({}).toArray();
    let updatedCount = 0;

    for (const user of users) {
      // Get all leaderboard entries for this user (handle both ObjectId and string formats)
      const userIdStr = user._id.toString();
      const totalPoints = await leaderboardCollection.aggregate([
        { 
          $match: { 
            $or: [
              { userId: user._id },
              { userId: userIdStr }
            ]
          } 
        },
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]).toArray();

      const userPoints = totalPoints.length > 0 ? totalPoints[0].total : 0;
      
      // Update user points
      await authCollection.updateOne(
        { _id: user._id },
        { $set: { points: userPoints } }
      );
      
      updatedCount++;
      console.log(`Updated ${user.username} (${user.email}): ${userPoints} points`);
    }

    res.json({ 
      message: 'Points recalculated successfully',
      updatedUsers: updatedCount
    });
  } catch (error) {
    console.error('Recalculate points error:', error);
    res.status(500).json({ error: 'Failed to recalculate points' });
  }
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
