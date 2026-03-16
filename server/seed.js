import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';

dotenv.config();

// Sample data
const courses = [
  {
    title: 'System Design Fundamentals',
    description: 'Learn the core concepts of system design including scalability, availability, and consistency.',
    category: 'Fundamentals',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=225&fit=crop',
    difficulty: 'Beginner',
    lessons: [
      { title: 'What is System Design?', youtubeId: 'FSR1s2b-l4I', duration: '15:30', description: 'Introduction to system design concepts.' },
      { title: 'Scalability Basics', youtubeId: 'xpDnVSmNFX0', duration: '22:15', description: 'Horizontal vs vertical scaling.' },
      { title: 'Load Balancing', youtubeId: 'K0Ta65OqQkY', duration: '18:45', description: 'How load balancers work.' },
    ],
  },
  {
    title: 'HLD: Design URL Shortener',
    description: 'High-level design of a URL shortening service.',
    category: 'HLD',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop',
    difficulty: 'Intermediate',
    lessons: [
      { title: 'Requirements & Estimation', youtubeId: 'fMZMm_0ZhK4', duration: '25:00', description: 'Gathering requirements.' },
      { title: 'API Design', youtubeId: 'josjRSBqEBI', duration: '18:30', description: 'REST endpoints.' },
    ],
  },
  {
    title: 'HLD: Design WhatsApp',
    description: 'Real-time messaging system design.',
    category: 'HLD',
    thumbnail: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=225&fit=crop',
    difficulty: 'Advanced',
    lessons: [
      { title: 'Chat System Overview', youtubeId: 'vvhC64hQZMk', duration: '30:00', description: 'Architecture overview.' },
      { title: 'WebSocket vs Polling', youtubeId: '2Nt-ZrNP22A', duration: '22:00', description: 'Real-time protocols.' },
    ],
  },
  {
    title: 'LLD: Design Parking Lot',
    description: 'Parking lot system with OOP.',
    category: 'LLD',
    thumbnail: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=225&fit=crop',
    difficulty: 'Intermediate',
    lessons: [
      { title: 'Requirements & Use Cases', youtubeId: 'DSGsa0PoUfI', duration: '15:00', description: 'Use cases.' },
      { title: 'Class Diagram', youtubeId: 'tVRyb4HaHgw', duration: '20:00', description: 'Design.' },
    ],
  },
  {
    title: 'LLD: Library Management',
    description: 'Library management system design.',
    category: 'LLD',
    thumbnail: 'https://images.unsplash.com/photo-1507842217343-583f7270bfbb?w=400&h=225&fit=crop',
    difficulty: 'Beginner',
    lessons: [
      { title: 'System Requirements', youtubeId: 'LkHZgTmRmP0', duration: '12:00', description: 'Requirements.' },
      { title: 'Core Classes', youtubeId: 'kx6E7ApJL3U', duration: '18:00', description: 'Classes.' },
    ],
  },
];

const articles = [
  {
    title: 'CAP Theorem Explained Simply',
    content: `<h2>What is CAP Theorem?</h2>
<p>The <strong>CAP theorem</strong>, also known as <em>Brewer's theorem</em>, states that a distributed data store can only provide two of the following three guarantees simultaneously:</p>
<ul>
<li><strong>Consistency</strong> — Every read receives the most recent write or an error</li>
<li><strong>Availability</strong> — Every request receives a non-error response</li>
<li><strong>Partition Tolerance</strong> — The system continues to operate despite network partitions</li>
</ul>
<h3>Real-World Examples</h3>
<p>Most modern distributed systems choose <strong>AP</strong> (Availability + Partition Tolerance) because network partitions are inevitable. Systems like <code>Cassandra</code> and <code>DynamoDB</code> follow this approach.</p>
<p>Banking systems often choose <strong>CP</strong> (Consistency + Partition Tolerance) because data consistency is critical. <code>MongoDB</code> and <code>HBase</code> lean towards CP.</p>
<blockquote>In the presence of a network partition, you must choose between consistency and availability. — Eric Brewer</blockquote>`,
    images: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
    ],
    author: 'Admin',
    createdAt: new Date('2024-12-15'),
    tags: ['Distributed Systems', 'CAP Theorem', 'Fundamentals'],
  },
  {
    title: 'Database Sharding Strategies',
    content: `<h2>Why Shard Your Database?</h2>
<p>When a single database can't handle the load, <strong>sharding</strong> splits data across multiple databases. Each shard holds a subset of the data.</p>
<h3>Sharding Strategies</h3>
<ol>
<li><strong>Hash-based Sharding</strong> — Use a hash function on a key to determine the shard</li>
<li><strong>Range-based Sharding</strong> — Divide data by ranges (e.g., A-M on shard 1, N-Z on shard 2)</li>
<li><strong>Geographic Sharding</strong> — Shard based on user location</li>
</ol>
<p>Each approach has trade-offs in terms of <em>data distribution</em>, <em>query complexity</em>, and <em>rebalancing difficulty</em>.</p>`,
    images: [
      'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=400&fit=crop',
    ],
    author: 'Admin',
    createdAt: new Date('2024-12-20'),
    tags: ['Database', 'Sharding', 'Scalability'],
  },
  {
    title: 'Load Balancing Techniques',
    content: `<h2>What is Load Balancing?</h2>
<p>Load balancing distributes incoming network traffic across multiple servers to ensure no single server is overwhelmed.</p>
<h3>Common Algorithms</h3>
<ul>
<li><strong>Round Robin</strong> — Distribute requests equally</li>
<li><strong>Least Connections</strong> — Route to server with fewest active connections</li>
<li><strong>IP Hash</strong> — Same client always goes to same server</li>
</ul>`,
    images: [
      'https://images.unsplash.com/photo-1558471109-0c1a1e1ac18f?w=800&h=400&fit=crop',
    ],
    author: 'Admin',
    createdAt: new Date('2024-12-25'),
    tags: ['Load Balancing', 'Scalability', 'Infrastructure'],
  },
];

const quizzes = [
  {
    title: 'System Design Basics',
    topic: 'Fundamentals',
    questions: [
      {
        id: 'q-1-1',
        question: 'Which of the following is NOT a component of the CAP theorem?',
        options: ['Consistency', 'Availability', 'Partition Tolerance', 'Durability'],
        correctAnswer: 3,
      },
      {
        id: 'q-1-2',
        question: 'What is the primary purpose of a load balancer?',
        options: ['Store data', 'Distribute traffic across servers', 'Encrypt data', 'Compress files'],
        correctAnswer: 1,
      },
      {
        id: 'q-1-3',
        question: 'Which scaling approach adds more powerful servers?',
        options: ['Horizontal scaling', 'Vertical scaling', 'Circular scaling', 'Linear scaling'],
        correctAnswer: 1,
      },
    ],
  },
  {
    title: 'Database Design',
    topic: 'Intermediate',
    questions: [
      {
        id: 'q-2-1',
        question: 'What is a disadvantage of horizontal scaling?',
        options: ['Limited resources', 'Increased complexity', 'Higher cost', 'Slower response times'],
        correctAnswer: 1,
      },
      {
        id: 'q-2-2',
        question: 'Which database is best for real-time analytics?',
        options: ['MySQL', 'MongoDB', 'Cassandra', 'All are equal'],
        correctAnswer: 2,
      },
    ],
  },
  {
    title: 'Caching Strategies',
    topic: 'Advanced',
    questions: [
      {
        id: 'q-3-1',
        question: 'What does LRU stand for?',
        options: ['Load Response Unit', 'Least Recently Used', 'Latest Read Update', 'Load Reusable Utility'],
        correctAnswer: 1,
      },
      {
        id: 'q-3-2',
        question: 'Which cache strategy removes least recently accessed items?',
        options: ['FIFO', 'LRU', 'LFU', 'LIFO'],
        correctAnswer: 1,
      },
    ],
  },
];

const seedDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('system_design_db');

    console.log('🔄 Clearing existing data...');
    await db.collection('courses').deleteMany({});
    await db.collection('articles').deleteMany({});
    await db.collection('quizzes').deleteMany({});
    await db.collection('users').deleteMany({});
    await db.collection('leaderboard').deleteMany({});

    console.log('👤 Creating admin user...');
    const hashedPassword = await bcryptjs.hash('admin123', 10);
    const admin = {
      username: 'admin',
      email: 'admin@systemdesign.com',
      password: hashedPassword,
      role: 'admin',
      points: 0,
      createdAt: new Date(),
    };

    const adminResult = await db.collection('users').insertOne(admin);

    // Create test users for leaderboard
    const testUsers = [
      { username: 'alice', email: 'alice@example.com', password: await bcryptjs.hash('password123', 10), role: 'user', points: 0, createdAt: new Date() },
      { username: 'bob', email: 'bob@example.com', password: await bcryptjs.hash('password123', 10), role: 'user', points: 0, createdAt: new Date() },
      { username: 'charlie', email: 'charlie@example.com', password: await bcryptjs.hash('password123', 10), role: 'user', points: 0, createdAt: new Date() },
    ];

    const usersResult = await db.collection('users').insertMany(testUsers);
    const userIds = Object.values(usersResult.insertedIds);

    console.log('� Inserting courses...');
    await db.collection('courses').insertMany(courses);

    console.log('�📄 Inserting articles...');
    await db.collection('articles').insertMany(articles);

    console.log('🧠 Inserting quizzes...');
    const quizzesWithIds = quizzes.map((q) => ({
      ...q,
      questions: q.questions.map((qu, i) => ({ id: `${q.title}-q${i}`, ...qu })),
      createdAt: new Date(),
    }));
    const quizzesResult = await db.collection('quizzes').insertMany(quizzesWithIds);
    const quizIds = Object.values(quizzesResult.insertedIds);

    // Create leaderboard entries
    console.log('🏆 Creating leaderboard entries...');
    const leaderboardEntries = [];
    
    // For each quiz, create some sample leaderboard entries
    quizIds.forEach((quizId, quizIndex) => {
      // Sample entries for each quiz
      const entries = [
        { quizId: quizId.toString(), userId: userIds[0].toString(), username: 'alice', points: 95, timeSpent: 180, completedAt: new Date() },
        { quizId: quizId.toString(), userId: userIds[1].toString(), username: 'bob', points: 85, timeSpent: 240, completedAt: new Date() },
        { quizId: quizId.toString(), userId: userIds[2].toString(), username: 'charlie', points: 75, timeSpent: 300, completedAt: new Date() },
        { quizId: quizId.toString(), userId: userIds[0].toString(), username: 'alice', points: 90, timeSpent: 200, completedAt: new Date(Date.now() - 86400000) },
      ];
      leaderboardEntries.push(...entries);
    });

    await db.collection('leaderboard').insertMany(leaderboardEntries);

    // Update user points based on leaderboard
    for (let i = 0; i < userIds.length; i++) {
      const totalPoints = await db.collection('leaderboard').aggregate([
        { $match: { userId: userIds[i].toString() } },
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]).toArray();

      const points = totalPoints.length > 0 ? totalPoints[0].total : 0;
      await db.collection('users').updateOne(
        { _id: userIds[i] },
        { $set: { points } }
      );
    }

    console.log('\n✅ Database seeded successfully!');
    console.log(`   📚 ${courses.length} courses added`);
    console.log(`   📄 ${articles.length} articles added`);
    console.log(`   ❓ ${quizzes.length} quizzes added`);
    console.log(`   👨‍💻 ${testUsers.length + 1} users added (admin + test users)`);
    console.log(`   🏆 ${leaderboardEntries.length} leaderboard entries added`);
    console.log('\n   Test Users:');
    console.log('   - admin@systemdesign.com / admin123');
    testUsers.forEach((user, i) => {
      console.log(`   - ${user.email} / password123`);
    });
    console.log('\n🎉 Ready to go!');

    await client.close();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDB();