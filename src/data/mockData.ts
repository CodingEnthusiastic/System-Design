// ============ COURSES (Learn) ============
export interface Lesson {
  id: string;
  title: string;
  youtubeId: string;
  duration: string;
  description: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: 'HLD' | 'LLD' | 'Fundamentals';
  thumbnail: string;
  lessons: Lesson[];
  totalDuration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export const courses: Course[] = [
  {
    id: '1',
    title: 'System Design Fundamentals',
    description: 'Learn the core concepts of system design including scalability, availability, and consistency.',
    category: 'Fundamentals',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=225&fit=crop',
    difficulty: 'Beginner',
    totalDuration: '4h 30m',
    lessons: [
      { id: '1-1', title: 'What is System Design?', youtubeId: 'FSR1s2b-l4I', duration: '15:30', description: 'Introduction to system design concepts and why they matter.' },
      { id: '1-2', title: 'Scalability Basics', youtubeId: 'xpDnVSmNFX0', duration: '22:15', description: 'Understanding horizontal vs vertical scaling.' },
      { id: '1-3', title: 'Load Balancing', youtubeId: 'K0Ta65OqQkY', duration: '18:45', description: 'How load balancers distribute traffic.' },
      { id: '1-4', title: 'Caching Strategies', youtubeId: 'U3RkDLtS7uY', duration: '20:10', description: 'Cache patterns and eviction policies.' },
    ],
  },
  {
    id: '2',
    title: 'HLD: Design URL Shortener',
    description: 'High-level design of a URL shortening service like bit.ly with millions of users.',
    category: 'HLD',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=225&fit=crop',
    difficulty: 'Intermediate',
    totalDuration: '3h 15m',
    lessons: [
      { id: '2-1', title: 'Requirements & Estimation', youtubeId: 'fMZMm_0ZhK4', duration: '25:00', description: 'Gathering functional and non-functional requirements.' },
      { id: '2-2', title: 'API Design', youtubeId: 'josjRSBqEBI', duration: '18:30', description: 'Designing the REST API endpoints.' },
      { id: '2-3', title: 'Database Schema', youtubeId: 'rnZmdmlR-2M', duration: '20:00', description: 'Choosing the right database and schema design.' },
    ],
  },
  {
    id: '3',
    title: 'HLD: Design WhatsApp',
    description: 'Design a real-time messaging system handling billions of messages daily.',
    category: 'HLD',
    thumbnail: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=225&fit=crop',
    difficulty: 'Advanced',
    totalDuration: '5h 00m',
    lessons: [
      { id: '3-1', title: 'Chat System Overview', youtubeId: 'vvhC64hQZMk', duration: '30:00', description: 'Architecture overview of messaging systems.' },
      { id: '3-2', title: 'WebSocket vs Polling', youtubeId: '2Nt-ZrNP22A', duration: '22:00', description: 'Real-time communication protocols.' },
      { id: '3-3', title: 'Message Storage', youtubeId: 'RjQjbJ2UJDg', duration: '25:00', description: 'Storing and retrieving messages efficiently.' },
    ],
  },
  {
    id: '4',
    title: 'LLD: Design Parking Lot',
    description: 'Low-level design with OOP principles for a parking lot management system.',
    category: 'LLD',
    thumbnail: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&h=225&fit=crop',
    difficulty: 'Intermediate',
    totalDuration: '2h 45m',
    lessons: [
      { id: '4-1', title: 'Requirements & Use Cases', youtubeId: 'DSGsa0PoUfI', duration: '15:00', description: 'Identifying actors and use cases.' },
      { id: '4-2', title: 'Class Diagram', youtubeId: 'tVRyb4HaHgw', duration: '20:00', description: 'Designing the class hierarchy.' },
      { id: '4-3', title: 'Implementation', youtubeId: 'NtMvNh0WFVM', duration: '30:00', description: 'Coding the solution with design patterns.' },
    ],
  },
  {
    id: '5',
    title: 'LLD: Design Elevator System',
    description: 'Object-oriented design of an elevator system using state machines and strategy pattern.',
    category: 'LLD',
    thumbnail: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=400&h=225&fit=crop',
    difficulty: 'Advanced',
    totalDuration: '3h 00m',
    lessons: [
      { id: '5-1', title: 'State Machine Design', youtubeId: 'siqiJAJWUVg', duration: '25:00', description: 'Modeling elevator states and transitions.' },
      { id: '5-2', title: 'Scheduling Algorithms', youtubeId: '8I14pVcZKsM', duration: '20:00', description: 'LOOK, SCAN, and FCFS algorithms.' },
    ],
  },
];

// ============ ARTICLES ============
export interface Article {
  id: string;
  title: string;
  content: string; // HTML content from rich text editor
  images: string[];
  author: string;
  createdAt: string;
  tags: string[];
}

export const articles: Article[] = [
  {
    id: '1',
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
    author: 'Admin User',
    createdAt: '2024-12-15',
    tags: ['Distributed Systems', 'CAP Theorem', 'Fundamentals'],
  },
  {
    id: '2',
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
    author: 'Admin User',
    createdAt: '2024-12-20',
    tags: ['Database', 'Sharding', 'Scalability'],
  },
  {
    id: '3',
    title: 'Microservices vs Monolith Architecture',
    content: `<h2>The Great Debate</h2>
<p>Choosing between <strong>microservices</strong> and <strong>monolithic</strong> architecture is one of the most important decisions in system design.</p>
<h3>Monolithic Architecture</h3>
<p>A monolith is a single deployable unit. All features share the same codebase, database, and deployment pipeline.</p>
<h3>Microservices Architecture</h3>
<p>Microservices break the application into <em>small, independent services</em> that communicate via APIs. Each service has its own database and can be deployed independently.</p>
<h3>When to Use What?</h3>
<p><strong>Start with a monolith</strong> when you're building an MVP or have a small team. <strong>Move to microservices</strong> when you need independent scaling, different tech stacks, or have a large engineering organization.</p>`,
    images: [
      'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800&h=400&fit=crop',
      'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&h=400&fit=crop',
    ],
    author: 'Admin User',
    createdAt: '2025-01-05',
    tags: ['Architecture', 'Microservices', 'Monolith'],
  },
];

// ============ QUIZZES ============
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index
  image?: string;
}

export interface Quiz {
  id: string;
  title: string;
  topic: string;
  questions: QuizQuestion[];
}

export const quizzes: Quiz[] = [
  {
    id: '1',
    title: 'System Design Basics',
    topic: 'Fundamentals',
    questions: [
      {
        id: '1-1',
        question: 'Which of the following is NOT a component of the CAP theorem?',
        options: ['Consistency', 'Availability', 'Partition Tolerance', 'Durability'],
        correctAnswer: 3,
      },
      {
        id: '1-2',
        question: 'What is the primary purpose of a load balancer?',
        options: ['Store data', 'Distribute traffic across servers', 'Encrypt data', 'Compress files'],
        correctAnswer: 1,
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop',
      },
      {
        id: '1-3',
        question: 'Which caching strategy writes data to both cache and database simultaneously?',
        options: ['Write-behind', 'Write-through', 'Cache-aside', 'Read-through'],
        correctAnswer: 1,
      },
      {
        id: '1-4',
        question: 'What does CDN stand for?',
        options: ['Central Data Network', 'Content Delivery Network', 'Cloud Distribution Node', 'Cached Data Network'],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: '2',
    title: 'Database Concepts',
    topic: 'Database',
    questions: [
      {
        id: '2-1',
        question: 'Which type of database is best suited for storing graph relationships?',
        options: ['Relational (SQL)', 'Document (MongoDB)', 'Graph (Neo4j)', 'Key-Value (Redis)'],
        correctAnswer: 2,
      },
      {
        id: '2-2',
        question: 'What is database sharding?',
        options: ['Backing up data', 'Splitting data across multiple databases', 'Encrypting data', 'Indexing data'],
        correctAnswer: 1,
      },
      {
        id: '2-3',
        question: 'ACID properties are primarily associated with:',
        options: ['NoSQL databases', 'Relational databases', 'File systems', 'Cache systems'],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: '3',
    title: 'Scalability Patterns',
    topic: 'Scalability',
    questions: [
      {
        id: '3-1',
        question: 'Horizontal scaling means:',
        options: ['Adding more RAM', 'Adding more servers', 'Adding more CPU cores', 'Adding more storage'],
        correctAnswer: 1,
      },
      {
        id: '3-2',
        question: 'Which pattern decouples components using an intermediary?',
        options: ['Proxy pattern', 'Message Queue', 'Load Balancer', 'API Gateway'],
        correctAnswer: 1,
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=200&fit=crop',
      },
      {
        id: '3-3',
        question: 'Rate limiting is used to:',
        options: ['Speed up requests', 'Prevent abuse by limiting request frequency', 'Compress data', 'Encrypt traffic'],
        correctAnswer: 1,
      },
    ],
  },
];
