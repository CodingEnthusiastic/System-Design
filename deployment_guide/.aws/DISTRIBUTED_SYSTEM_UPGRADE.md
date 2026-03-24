# Distributed System Upgrade Plan - Minimal Cost Strategy

## Executive Summary
Transform your monolithic application into a production-grade distributed system handling **1000+ concurrent users** with **99.99% uptime** and **<200ms latency** using minimal cloud costs (~$150-300/month).

---

## PHASE 1: Foundation (Week 1-2) - Cost: $50/month

### 1.1 Containerization with Docker

**Why**: Enable consistent deployment across environments, easy scaling, and CI/CD

**Implementation**:

```dockerfile
# server/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"
CMD ["node", "index.js"]
```

```dockerfile
# Dockerfile (frontend)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
worker_processes auto;

events {
  worker_connections 5000;
  use epoll;
}

http {
  upstream backend {
    least_conn;
    server backend-1:5000 max_fails=2 fail_timeout=10s;
    server backend-2:5000 max_fails=2 fail_timeout=10s;
    server backend-3:5000 max_fails=2 fail_timeout=10s;
    keepalive 32;
  }

  # Rate limiting: 100 requests per second per IP
  limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
  
  # Cache settings
  proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=1h;

  server {
    listen 80;
    client_max_body_size 50M;

    # API endpoints - cache GET requests
    location /api/ {
      limit_req zone=api_limit burst=200 nodelay;
      
      proxy_pass http://backend;
      proxy_http_version 1.1;
      proxy_set_header Connection "";
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      
      # Cache GET requests for 5 minutes
      proxy_cache api_cache;
      proxy_cache_methods GET HEAD;
      proxy_cache_valid 200 5m;
      proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
      add_header X-Cache-Status $upstream_cache_status;
      
      # Timeouts
      proxy_connect_timeout 5s;
      proxy_send_timeout 10s;
      proxy_read_timeout 10s;
    }

    # Frontend
    location / {
      root /usr/share/nginx/html;
      try_files $uri /index.html;
      expires 1h;
      add_header Cache-Control "public, max-age=3600";
    }

    # Health check endpoint
    location /health {
      proxy_pass http://backend;
      access_log off;
    }
  }
}
```

**Cost**: $0 (open-source)

---

### 1.2 Docker Compose for Local Development

```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0-alpine
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    networks:
      - app-network

  backend:
    build: 
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      MONGODB_URI: mongodb://root:password@mongodb:27017/system_design_db?authSource=admin
      JWT_SECRET: dev-secret-key
      VITE_API_URL: http://localhost:5000
    depends_on:
      - mongodb
    volumes:
      - ./server:/app
      - /app/node_modules
    networks:
      - app-network
    command: npm run dev

  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "80:80"
    environment:
      VITE_API_URL: http://localhost:5000
    depends_on:
      - backend
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-network

volumes:
  mongodb_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

**Action Items**:
- [ ] Create `server/Dockerfile`
- [ ] Create `Dockerfile` (root, for frontend)
- [ ] Create `docker-compose.yml`
- [ ] Update `.dockerignore` and `.gitignore`
- [ ] Test locally: `docker-compose up`

**Cost**: $0

---

## PHASE 2: Database Scaling (Week 2-3) - Cost: $30-50/month

### 2.1 MongoDB Atlas Cluster Upgrade

**Current**: Single instance on Atlas (M0 free tier - limited)
**Target**: M3 Shared ($30-50/month for 25GB+)

**Action Plan**:

1. **Upgrade MongoDB Atlas Cluster**:
   ```bash
   # In MongoDB Atlas Console:
   # 1. Go to Cluster0 → Modify
   # 2. Change tier from M0 → M3 (Shared Cluster)
   # 3. Enable backup (automatic daily)
   # 4. Enable Point-in-Time Recovery (PITR)
   # 5. Add connection string to environment
   ```

2. **Enable Auto-Scaling**:
   ```
   Dashboard → Cluster → Autoscaling
   - Enable auto-scaling for storage
   - Set max storage: 256GB (or higher based on budget)
   - Throughput scaling: OFF (use connection pooling instead)
   ```

3. **Add Replica Set** (for high availability):
   ```
   M3 Shared tier automatically includes 3-node replica set
   - Primary: Read/Write
   - Secondary-1: Read-only
   - Secondary-2: Backup
   
   ACID guarantees across all nodes with multi-document transactions
   ```

4. **Connection Pooling in Backend**:

   ```javascript
   // server/db-pool.js
   const { MongoClient } = require('mongodb');
   
   const client = new MongoClient(process.env.MONGODB_URI, {
     maxPoolSize: 50,        // Max connections in pool
     minPoolSize: 10,        // Min idle connections
     maxIdleTimeMS: 60000,   // Close idle after 1 minute
     waitQueueTimeoutMS: 10000, // Timeout for queue
     retryWrites: true,      // Automatic retry on transient errors
     retryReads: true,
     w: 'majority',          // Wait for replica set majority
     journal: true,          // Journal writes for durability
     serverSelectionTimeoutMS: 5000,
     socketTimeoutMS: 45000,
   });
   
   module.exports = client;
   ```

5. **Add Composite Indexes for Common Queries**:

   ```javascript
   // server/create-indexes.js
   async function createIndexes(db) {
     // Leaderboard queries
     await db.collection('leaderboard').createIndex({ 
       quizId: 1, points: -1, timeSpent: 1 
     });
     
     // User quiz attempts
     await db.collection('leaderboard').createIndex({ 
       userId: 1, completedAt: -1 
     });
     
     // Article interactions batch
     await db.collection('articleInteractions').createIndex({ 
       userId: 1, articleId: 1 
     }, { unique: true });
     
     // Course progress queries
     await db.collection('courseTracking').createIndex({ 
       userId: 1, updatedAt: -1 
     });
     
     // Auth verification
     await db.collection('verifications').createIndex({ 
       email: 1, expiresAt: 1 
     }, { expireAfterSeconds: 0 }); // TTL index
     
     console.log('✅ All indexes created');
   }
   
   module.exports = createIndexes;
   ```

**ACID Compliance**:
```javascript
// server/transaction.js
const session = client.startSession();

try {
  await session.withTransaction(async () => {
    // All operations atomic - all succeed or all rollback
    await quizzesCollection.insertOne(
      { quizId, userId, points, answers },
      { session }
    );
    
    await authCollection.updateOne(
      { _id: userId },
      { $inc: { points: score } },
      { session }
    );
    
    // Leaderboard ranking consistency
    const ranking = await leaderboardCollection
      .find({ quizId })
      .sort({ points: -1 })
      .session(session)
      .toArray();
  });
} finally {
  await session.endSession();
}
```

**Cost**: $30-50/month (M3 Shared Cluster)

---

## PHASE 3: Containerized Deployment (Week 3-4) - Cost: $60-100/month

### 3.1 AWS ECS or Azure Container Instances

**Option A: AWS (Recommended for Minimal Cost)**

**Architecture**:
```
Application Load Balancer (ALB)
    ↓
  Auto Scaling Group (3+ instances)
    ├── Backend Container (Node.js)
    ├── Backend Container
    └── Backend Container (task definition: 0.5 CPU, 512 MB RAM)
    
  RDS PostgreSQL OR MongoDB Atlas (external)
  
  ElastiCache Redis (caching layer)
  
  S3 (file uploads)
  CloudFront (CDN)
```

**Implementation**:

```bash
# 1. Create ECR Repository
aws ecr create-repository --repository-name system-design-backend
aws ecr create-repository --repository-name system-design-frontend

# 2. Push Docker images
docker build -t system-design-backend ./server
docker tag system-design-backend:latest <ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com/system-design-backend:latest
aws ecr get-login-password | docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com
docker push <ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com/system-design-backend:latest
```

**ECS Task Definition** (Fargate):
```json
{
  "family": "system-design-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/system-design-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "hostPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "MONGODB_URI",
          "value": "mongodb+srv://user:pass@cluster.mongodb.net/db"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/system-design-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

**ECS Service Configuration**:
```bash
# Create ALB target group
aws elbv2 create-target-group \
  --name system-design-backend-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxxxx \
  --health-check-enabled \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5

# Create ALB
aws elbv2 create-load-balancer \
  --name system-design-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx

# Create ECS Service with auto-scaling
aws ecs create-service \
  --cluster production \
  --service-name backend-service \
  --task-definition system-design-backend \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=5000

# Auto-scaling: Target CPU 70%
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/production/backend-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 3 \
  --max-capacity 10

aws application-autoscaling put-scaling-policy \
  --policy-name backend-cpu-scaling \
  --service-namespace ecs \
  --resource-id service/production/backend-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration "TargetValue=70.0,PredefinedMetricSpecification={PredefinedMetricType=ECSServiceAverageCPUUtilization},ScaleOutCooldown=60,ScaleInCooldown=300"
```

**Cost Breakdown** (AWS Fargate, minimal):
- ECS Fargate: 3 tasks × 256 CPU (0.25) × 512MB × $0.04635/hour = ~$30/month
- ALB: ~$20/month + $0.006/LCU
- ElastiCache Redis t3.micro: ~$15/month (optional, for caching)
- Data transfer: ~$10-20/month
- **Total**: ~$60-100/month

---

### 3.2 Frontend Deployment (CloudFront + S3)

```bash
# Create S3 bucket for frontend
aws s3 mb s3://system-design-frontend-prod --region us-east-1

# Enable versioning and static hosting
aws s3api put-bucket-versioning \
  --bucket system-design-frontend-prod \
  --versioning-configuration Status=Enabled

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name system-design-frontend-prod.s3.us-east-1.amazonaws.com \
  --default-root-object index.html \
  --default-cache-behavior ViewerProtocolPolicy=redirect-to-https

# Build and upload
npm run build
aws s3 sync dist/ s3://system-design-frontend-prod --delete --cache-control "max-age=3600"
```

**Cost**: ~$15-25/month (CDN + S3)

---

## PHASE 4: Caching Layer (Week 4) - Cost: $15-30/month

### 4.1 Redis for Session & Query Caching

```javascript
// server/redis-client.js
import Redis from 'redis';

const redis = Redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
});

redis.on('error', (err) => console.error('Redis error:', err));
redis.on('connect', () => console.log('✅ Redis connected'));

export default redis;
```

**Caching Strategy**:

```javascript
// Cache frequently accessed data
const CACHE_TIMES = {
  leaderboard: 5 * 60,        // 5 minutes
  userProfile: 15 * 60,       // 15 minutes
  articles: 30 * 60,          // 30 minutes
  courses: 1 * 60 * 60,       // 1 hour
  quizzes: 2 * 60 * 60,       // 2 hours (change rarely)
};

// Leaderboard endpoint with cache
app.get('/api/quizzes/:quizId/leaderboard', async (req, res) => {
  const cacheKey = `leaderboard:${req.params.quizId}`;
  
  try {
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log('Cache hit:', cacheKey);
      return res.json(JSON.parse(cached));
    }
  } catch (err) {
    console.warn('Redis read failed, falling back to DB:', err.message);
  }

  // Fetch from DB
  const leaderboard = await leaderboardCollection
    .find({ quizId: req.params.quizId })
    .sort({ points: -1, timeSpent: 1 })
    .limit(100)
    .toArray();

  // Cache result
  try {
    await redis.setEx(
      cacheKey,
      CACHE_TIMES.leaderboard,
      JSON.stringify(leaderboard)
    );
  } catch (err) {
    console.warn('Redis write failed:', err.message);
  }

  res.json(leaderboard);
});

// Invalidate cache on write
app.post('/api/quizzes/:quizId/submit', middleware.auth, async (req, res) => {
  // ... submit logic ...
  
  // Invalidate leaderboard cache
  await redis.del(`leaderboard:${req.params.quizId}`);
  
  // Invalidate user profile cache
  await redis.del(`profile:${req.user._id}`);
  
  res.json({ success: true });
});
```

**Cost**: ~$15-30/month (ElastiCache Redis t3.micro or managed Redis)

---

## PHASE 5: S3 File Storage (Week 4-5) - Cost: $5-15/month

### 5.1 Replace Local Uploads with S3

```javascript
// server/s3-client.js
import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const uploadS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    acl: 'public-read',
    key: (req, file, cb) => {
      const key = `uploads/${Date.now()}-${file.originalname}`;
      cb(null, key);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

export default uploadS3;
```

```javascript
// server/index.js - Replace upload handler
app.post('/api/upload', middleware.auth, uploadS3.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Image stored in S3, return URL
  const fileUrl = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${req.file.key}`;
  
  res.json({
    url: fileUrl,
    filename: req.file.originalname,
    size: req.file.size,
  });
});
```

**Cost**: ~$5-15/month (S3 storage + transfer)

---

## PHASE 6: Monitoring & Logging (Week 5) - Cost: $20-50/month

### 6.1 CloudWatch + Application Performance Monitoring

```javascript
// server/monitoring.js
import AWSXRay from 'aws-xray-sdk-core';
import AWSSDKClient from 'aws-sdk';

// Wrap AWS SDK
AWSXRay.captureAWSClient(AWSSDKClient);

// Custom metrics
const cloudwatch = new AWSSDKClient.CloudWatch();

export async function recordMetric(metricName, value, unit = 'None') {
  await cloudwatch.putMetricData({
    Namespace: 'SystemDesignApp',
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
      },
    ],
  }).promise();
}

// Track important events
app.post('/api/quizzes/:quizId/submit', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // ... submit logic ...
    
    await recordMetric('QuizSubmitted', 1, 'Count');
    await recordMetric('SubmissionLatency', Date.now() - startTime, 'Milliseconds');
    
    res.json({ success: true });
  } catch (error) {
    await recordMetric('SubmissionError', 1, 'Count');
    throw error;
  }
});
```

**CloudWatch Alarms**:
```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name backend-errors \
  --alarm-description "Alert if 5xx errors exceed 5%" \
  --metric-name HTTPCodeTarget5XXCount \
  --namespace AWS/ApplicationELB \
  --threshold 100 \
  --alarm-actions arn:aws:sns:region:account:ops-team

# High latency alarm
aws cloudwatch put-metric-alarm \
  --alarm-name high-latency \
  --alarm-description "Alert if p99 latency > 1000ms" \
  --metric-name TargetResponseTime \
  --namespace AWS/ApplicationELB \
  --threshold 1.0 \
  --statistic Maximum
```

**Cost**: ~$20-50/month (CloudWatch logs + alarms)

---

## PHASE 7: Network & Security (Week 5-6) - Cost: $30+/month

### 7.1 VPC, Security Groups, WAF

```terraform
# terraform/vpc.tf
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "system-design-vpc" }
}

resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
}

resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.10.0/24"
  availability_zone = "us-east-1a"
}

# NAT Gateway for private subnet
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_1.id
}

# Security group for ALB (allow public traffic)
resource "aws_security_group" "alb" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Security group for ECS (allow only from ALB)
resource "aws_security_group" "ecs" {
  vpc_id = aws_vpc.main.id

  ingress {
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
}

# WAF for DDoS protection
resource "aws_wafv2_web_acl" "main" {
  name  = "system-design-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000  # Requests per 5 minutes per IP
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }
}
```

**Cost**: ~$30+/month (VPC, NAT Gateway, WAF)

---

## PHASE 8: SSL/TLS & CDN (Week 6) - Cost: $10-20/month

### 8.1 ACM Certificates & CloudFront

```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name systempoint.com \
  --subject-alternative-names www.systempoint.com \
  --validation-method DNS \
  --region us-east-1

# Create CloudFront distribution with SSL
aws cloudfront create-distribution \
  --origin-domain-name alb-xxxxx.us-east-1.elb.amazonaws.com \
  --viewer-protocol-policy redirect-to-https \
  --acm-certificate-arn arn:aws:acm:us-east-1:account:certificate/xxxxx

# Enable HTTP/2 and HTTP/3
# Cache static assets
# Compress responses
```

**Cost**: ~$10-20/month (CloudFront)

---

## COST SUMMARY TABLE

| Component | Tier | Monthly Cost | Purpose |
|-----------|------|-------------|---------|
| **Phase 1: Containerization** | Docker, Nginx | $0 | Infrastructure as code |
| **Phase 2: Database** | MongoDB Atlas M3 | $35 | 25GB storage, 3-node replica set, ACID |
| **Phase 3: Compute** | AWS Fargate (3×0.5 CPU) | $60 | 3 backend instances, auto-scaling |
| | ALB + load balancing | $20 | High availability |
| **Phase 4: Caching** | ElastiCache Redis | $20 | Session + query caching |
| **Phase 5: Storage** | S3 + CloudFront | $20 | File uploads + CDN |
| **Phase 6: Monitoring** | CloudWatch | $25 | Logs, metrics, alarms |
| **Phase 7: Network** | VPC, NAT, WAF | $35 | Security + DDoS protection |
| **Phase 8: SSL/CDN** | ACM + CloudFront | $15 | HTTPS + edge caching |
| **Total** | **Production Grade** | **$210-250/month** | 1000+ concurrent users |

---

## ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USERS (1000+)                               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                        ┌──────▼──────┐
                        │ CloudFront  │ (CDN, Edge caching)
                        │   + WAF     │ (DDoS protection)
                        └──────┬──────┘
                               │
                   ┌───────────┴───────────┐
                   │                       │
            ┌──────▼──────┐        ┌──────▼──────┐
            │   S3 (CSS)  │        │   ALB       │ (Reverse proxy)
            │  (Frontend) │        │ (Routing)   │
            └─────────────┘        └──────┬──────┘
                                          │
                        ┌─────────────────┼─────────────────┐
                        │                 │                 │
                  ┌─────▼────┐    ┌─────▼────┐    ┌─────▼────┐
                  │ Fargate   │    │ Fargate   │    │ Fargate   │
                  │ Container │    │ Container │    │ Container │
                  │  (Node.js)│    │  (Node.js)│    │  (Node.js)│
                  │ 0.5 CPU   │    │ 0.5 CPU   │    │ 0.5 CPU   │
                  └─────┬────┘    └─────┬────┘    └─────┬────┘
                        │                 │                 │
                        └─────────────────┼─────────────────┘
                                          │
                        ┌─────────────────┼─────────────────┐
                        │                 │                 │
                  ┌─────▼────────────────▼────┐     ┌─────▼──────┐
                  │  MongoDB Atlas (M3)        │     │   Redis    │
                  │  - 3-node replica set      │     │ (Session   │
                  │  - Sharded (if >1TB)       │     │  + Cache)  │
                  │  - Point-in-time recovery  │     └────────────┘
                  │  - Automatic backups       │
                  └────────────────────────────┘
                                 │
                  ┌──────────────────────────┐
                  │     S3 Bucket            │
                  │   (File uploads)         │
                  └──────────────────────────┘
```

---

## ACID Compliance Strategy

### Multi-Document ACID Transactions

```javascript
// Example: Quiz submission with consistent user points
const session = client.startSession();

try {
  await session.withTransaction(async () => {
    // Step 1: Check if user already attempted
    const existing = await leaderboardCollection.findOne(
      { quizId, userId },
      { session }
    );
    
    if (existing) {
      throw new Error('Already attempted');
    }

    // Step 2: Insert leaderboard entry
    await leaderboardCollection.insertOne(
      {
        quizId,
        userId,
        points: score,
        completedAt: new Date(),
        answers,
      },
      { session }
    );

    // Step 3: Update user points (cumulative)
    await authCollection.updateOne(
      { _id: userId },
      { $inc: { points: score } },
      { session }
    );

    // If any step fails, all roll back automatically
    // If connection drops, MongoDB retries automatically
  }, {
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority' },
    readPreference: 'primary',
    maxCommitTimeMS: 10000,
  });
} catch (error) {
  console.error('Transaction failed:', error.message);
  throw error;
} finally {
  await session.endSession();
}
```

### Consistency Levels

| Level | Latency | Consistency | Use Case |
|-------|---------|-------------|----------|
| **Local** | Fastest | Node level | Non-critical reads (leaderboard) |
| **Majority** | Medium | Cluster level | Financial (points, scoring) |
| **All** | Slowest | All nodes | Mission-critical (user auth) |

```javascript
// Read consistency examples
const leaderboard = await leaderboardCollection
  .find({ quizId })
  .readConcern('local')  // Fast, eventual consistency
  .toArray();

const userPoints = await authCollection
  .findOne({ _id: userId })
  .readConcern('majority'); // Strong consistency for scoring
```

---

## Implementation Roadmap

### Week 1-2: Containerization
- [ ] Create Dockerfiles
- [ ] Create docker-compose.yml
- [ ] Test locally
- [ ] Set up CI/CD pipeline (GitHub Actions → ECR)

### Week 2-3: Database Scaling
- [ ] Upgrade MongoDB Atlas to M3
- [ ] Add replica set
- [ ] Create indexes
- [ ] Implement connection pooling
- [ ] Add transaction support

### Week 3-4: ECS Deployment
- [ ] Create AWS VPC
- [ ] Set up ALB
- [ ] Create ECS cluster
- [ ] Deploy to Fargate
- [ ] Configure auto-scaling

### Week 4: Caching & Storage
- [ ] Set up ElastiCache Redis
- [ ] Implement cache layer
- [ ] Set up S3 bucket
- [ ] Configure CDN

### Week 5: Monitoring
- [ ] Set up CloudWatch
- [ ] Create dashboards
- [ ] Configure alarms
- [ ] Set up log aggregation

### Week 5-6: Security
- [ ] Create VPC security groups
- [ ] Deploy WAF
- [ ] Set up SSL certificates
- [ ] Configure DDoS protection

---

## Environment Variables (Production)

```bash
# server/.env.production
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/system_design_db
MONGODB_MAX_POOL_SIZE=50

# Redis
REDIS_HOST=elasticache-endpoint
REDIS_PORT=6379
REDIS_PASSWORD=xxxxx

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
S3_BUCKET=system-design-uploads-prod

# JWT
JWT_SECRET=<long-random-string>
JWT_EXPIRY=7d

# Email (if using SendGrid)
SENDGRID_API_KEY=xxxxx

# Frontend URLs
FRONTEND_URLS=https://systempoint.com,https://www.systempoint.com
```

---

## Scaling to 10,000+ Users

### Horizontal Scaling
```
1000 users  → 3 Fargate tasks
2500 users  → 6 Fargate tasks (auto-scale at 70% CPU)
5000 users  → 12 Fargate tasks
10000 users → 20+ Fargate tasks + DB sharding + Redis cluster
```

### Database Sharding (When >1TB)
```
MongoDB Sharded Cluster
├── Shard 1: Customer A-M (quiz IDs, user IDs)
├── Shard 2: Customer N-Z
└── Config Server: Metadata
```

### Redis Cluster (When >25GB cache)
```
Redis Cluster (6 nodes)
├── 3 master nodes
├── 3 replica nodes
└── Auto-failover + persistence
```

---

## Next Steps

1. **Start Phase 1** (This Week):
   - Create Dockerfiles
   - Test docker-compose locally
   - Set up GitHub Actions CI/CD

2. **Prepare AWS Account**:
   - Set up Cost Explorer alarms
   - Create IAM roles for ECS
   - Reserve capacity/savings plans for 20% discount

3. **Database Prep**:
   - Upgrade MongoDB Atlas tier
   - Create indexes
   - Test transaction support

Would you like me to create:
1. **Terraform IaC** (Infrastructure as Code) for one-click deployment?
2. **GitHub Actions CI/CD** workflow?
3. **Kubernetes migration** instead of ECS (costs similar)?
4. **Cost optimization checklist**?
