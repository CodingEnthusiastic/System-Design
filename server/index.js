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

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// MongoDB connection
let db;
let authCollection, articlesCollection, quizzesCollection, usersCollection, verificationsCollection, leaderboardCollection, coursesCollection;

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

    // Create indexes
    await authCollection.createIndex({ email: 1 }, { unique: true });
    await verificationsCollection.createIndex({ email: 1 });
    await leaderboardCollection.createIndex({ quizId: 1, userId: 1 }, { unique: true });
    await leaderboardCollection.createIndex({ quizId: 1, points: -1 });
    
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
      avatar: ''
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
    
    const quiz = {
      title,
      topic,
      questions,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await quizzesCollection.insertOne(quiz);
    res.json({ ...quiz, _id: result.insertedId });
  } catch (error) {
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
    
    const result = await quizzesCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          title,
          topic,
          questions,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({ message: 'Quiz updated' });
  } catch (error) {
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
// Submit quiz result
app.post('/api/quizzes/:quizId/submit', middleware.auth, async (req, res) => {
  try {
    const { quizId } = req.params;
    const { score, timeSpent } = req.body;
    const userId = req.user._id || req.user.id;

    // Create leaderboard entry
    const leaderboardEntry = {
      quizId,
      userId: userId.toString(),
      username: req.user.username || req.user.email,
      points: score,
      timeSpent,
      completedAt: new Date(),
    };

    // Upsert (update if exists, insert if not)
    const result = await leaderboardCollection.updateOne(
      { quizId, userId: userId.toString() },
      { $set: leaderboardEntry },
      { upsert: true }
    );

    // Update user points
    const totalPoints = await leaderboardCollection.aggregate([
      { $match: { userId: userId.toString() } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]).toArray();

    const userPoints = totalPoints.length > 0 ? totalPoints[0].total : 0;
    
    await authCollection.updateOne(
      { _id: new ObjectId(userId) },
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

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
