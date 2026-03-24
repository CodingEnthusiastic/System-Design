// server/create-indexes.js - Create optimal MongoDB indexes for distributed system

export async function createIndexes(db) {
  console.log('📊 Creating MongoDB indexes...');

  try {
    // ===== USER COLLECTION =====
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('users').createIndex({ createdAt: -1 });
    
    // ===== LEADERBOARD COLLECTION (Most critical for queries) =====
    
    // Primary: Get top 100 users for a quiz
    await db.collection('leaderboard').createIndex(
      { quizId: 1, points: -1, timeSpent: 1 },
      { name: 'quizId_points_timeSpent' }
    );
    
    // Secondary: Get single user's quiz attempt
    await db.collection('leaderboard').createIndex(
      { quizId: 1, userId: 1 },
      { unique: true, name: 'quizId_userId' }
    );
    
    // Tertiary: Get all user's attempts (for profile)
    await db.collection('leaderboard').createIndex(
      { userId: 1, completedAt: -1 },
      { name: 'userId_completedAt' }
    );
    
    // Quaternary: Recent attempts globally
    await db.collection('leaderboard').createIndex(
      { completedAt: -1 },
      { name: 'completedAt' }
    );

    // ===== ARTICLE INTERACTIONS COLLECTION =====
    
    // Get user's article interactions
    await db.collection('articleInteractions').createIndex(
      { userId: 1, articleId: 1 },
      { unique: true, name: 'userId_articleId' }
    );
    
    // Get articles read/liked by user
    await db.collection('articleInteractions').createIndex(
      { userId: 1, isRead: 1 },
      { name: 'userId_isRead' }
    );
    
    await db.collection('articleInteractions').createIndex(
      { userId: 1, isLiked: 1 },
      { name: 'userId_isLiked' }
    );

    // ===== COURSE TRACKING COLLECTION =====
    
    // Get user's course progress
    await db.collection('courseTracking').createIndex(
      { userId: 1, courseId: 1 },
      { unique: true, name: 'userId_courseId' }
    );
    
    // Get all user's courses
    await db.collection('courseTracking').createIndex(
      { userId: 1, updatedAt: -1 },
      { name: 'userId_updatedAt' }
    );

    // ===== VERIFICATION COLLECTION =====
    
    // Find verification by email
    await db.collection('verifications').createIndex(
      { email: 1 },
      { name: 'email' }
    );
    
    // TTL index: Auto-delete after 15 minutes
    await db.collection('verifications').createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 900, name: 'createdAt_ttl' }
    );

    // ===== ARTICLES COLLECTION =====
    
    await db.collection('articles').createIndex({ createdAt: -1 });
    await db.collection('articles').createIndex({ authorId: 1 });
    await db.collection('articles').createIndex({ title: 'text', content: 'text' });

    // ===== QUIZZES COLLECTION =====
    
    await db.collection('quizzes').createIndex({ createdAt: -1 });
    await db.collection('quizzes').createIndex({ authorId: 1 });

    // ===== COURSES COLLECTION =====
    
    await db.collection('courses').createIndex({ createdAt: -1 });
    await db.collection('courses').createIndex({ authorId: 1 });

    console.log('✅ All indexes created successfully');
    console.log('📈 Indexes optimize:');
    console.log('   - Leaderboard ranking queries (points sort)');
    console.log('   - User attempt lookup (unique constraint)');
    console.log('   - Batch read/like operations');
    console.log('   - Course progress tracking');
    console.log('   - Auto-cleanup of old verifications');

  } catch (error) {
    if (error.code === 48) {
      // Index already exists - this is fine
      console.log('ℹ️ Indexes already exist, skipping creation');
    } else {
      console.error('❌ Error creating indexes:', error);
      throw error;
    }
  }
}

export default createIndexes;
