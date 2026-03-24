// server/db-pool.js - MongoDB Connection Pool Configuration

import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/system_design_db';

const client = new MongoClient(mongoUri, {
  // Connection pool settings
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '20'),
  minPoolSize: 5,
  maxIdleTimeMS: 60000,
  
  // Retry logic
  retryWrites: true,
  retryReads: true,
  
  // Write concern - wait for replica set majority
  w: 'majority',
  journal: true,
  wTimeoutMS: 10000,
  
  // Read preference
  readPreference: 'primary',
  
  // Timeouts
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  
  // Server monitoring
  heartbeatFrequencyMS: 10000,
  
  // Compression
  compressors: ['snappy', 'zlib'],
});

// Connection event handlers
client.on('connectionPoolCreated', () => console.log('✅ MongoDB connection pool created'));
client.on('connectionPoolClosed', () => console.log('⚠️ MongoDB connection pool closed'));
client.on('error', (err) => console.error('❌ MongoDB client error:', err));

export default client;
