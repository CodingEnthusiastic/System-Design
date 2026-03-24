# Quick Start Guide - Docker & Distributed System

## Prerequisites

- Docker & Docker Compose installed
- Node.js 20+ (for development)
- Git
- AWS account (for production deployment)

---

## 1. Local Development with Docker Compose

### Start everything locally:

```bash
cd system_design_app
docker-compose up -d
```

This starts:
- **Frontend**: http://localhost (Nginx + React)
- **Backend**: http://localhost:5000 (Node.js API)
- **MongoDB**: localhost:27017 (Database)
- **Redis**: localhost:6379 (Cache layer)

### View logs:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f mongodb
```

### Stop everything:

```bash
docker-compose down

# Also remove volumes (database data)
docker-compose down -v
```

### Development workflow:

1. Code changes auto-reload (volumes mounted)
2. MongoDB initializes automatically
3. Redis cache available
4. Health checks on all services

---

## 2. Building Production Images

### Build backend image:

```bash
docker build -t system-design-backend:v1.0.0 ./server
```

### Build frontend image:

```bash
docker build -t system-design-frontend:v1.0.0 .
```

### Test images locally:

```bash
docker run -p 5000:5000 \
  -e MONGODB_URI="mongodb://root:password123@host.docker.internal:27017/system_design_db" \
  -e REDIS_HOST="host.docker.internal" \
  system-design-backend:v1.0.0
```

---

## 3. AWS Deployment Setup

### 3.1 Create AWS ECR Repositories

```bash
aws ecr create-repository \
  --repository-name system-design-backend \
  --region us-east-1

aws ecr create-repository \
  --repository-name system-design-frontend \
  --region us-east-1
```

### 3.2 Push images to ECR

```bash
# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag and push backend
docker tag system-design-backend:v1.0.0 \
  $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/system-design-backend:v1.0.0

docker push \
  $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/system-design-backend:v1.0.0

# Tag and push frontend
docker tag system-design-frontend:v1.0.0 \
  $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/system-design-frontend:v1.0.0

docker push \
  $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/system-design-frontend:v1.0.0
```

### 3.3 Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name production \
  --region us-east-1 \
  --tags key=Environment,value=production
```

### 3.4 Configure MongoDB Atlas

1. Go to mongodb.com/cloud
2. Create/upgrade cluster to M3 (Shared)
3. Enable backup + PITR
4. Create connection string
5. Save to AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name mongodb-uri \
  --secret-string "mongodb+srv://user:pass@cluster.mongodb.net/system_design_db"
```

### 3.5 Deploy to ECS

```bash
# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://.aws/ecs-task-definition-backend.json

# Create service
aws ecs create-service \
  --cluster production \
  --service-name backend-service \
  --task-definition system-design-backend \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=5000
```

---

## 4. Environment Variables

### Development (.env)

```bash
MONGODB_URI=mongodb://root:password123@localhost:27017/system_design_db?authSource=admin&replicaSet=rs0
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=password123
JWT_SECRET=dev-secret-key
NODE_ENV=development
```

### Production (.env.production)

```bash
MONGODB_URI=<from AWS Secrets Manager>
REDIS_HOST=elasticache-endpoint
REDIS_PORT=6379
REDIS_PASSWORD=<from AWS Secrets Manager>
JWT_SECRET=<from AWS Secrets Manager>
NODE_ENV=production
S3_BUCKET=system-design-uploads-prod
AWS_REGION=us-east-1
```

---

## 5. Health Checks

### Backend health:

```bash
curl http://localhost:5000/health
# Response: { "status": "ok", "timestamp": "..." }
```

### MongoDB:

```bash
docker-compose exec mongodb mongosh -u root -p password123 --eval "db.adminCommand('ping')"
```

### Redis:

```bash
docker-compose exec redis redis-cli ping
# Response: PONG
```

---

## 6. Database Indexes (One-time Setup)

Indexes are auto-created on first run. To verify:

```javascript
// In Node.js console
const indexes = await db.collection('leaderboard').getIndexes();
console.log(indexes);
```

---

## 7. Cost Monitoring

### Set up AWS Cost Alerts

```bash
aws ce put-anomaly-monitor \
  --anomaly-monitor '{
    "Dimensions": {
      "Key": "SERVICE",
      "Values": ["Amazon Elastic Container Service"]
    },
    "MonitorSpecification": "DIMENSIONAL"
  }'
```

### View current costs

```bash
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-02-01 \
  --granularity MONTHLY \
  --metrics "BlendedCost"
```

---

## 8. Scaling

### Horizontal Scaling (more instances)

```bash
# Increase desired count
aws ecs update-service \
  --cluster production \
  --service backend-service \
  --desired-count 6
```

### Database Scaling (more throughput)

```bash
# MongoDB Atlas: Dashboard → Cluster → Modify → Increase storage
# ElastiCache: Console → Choose cluster → Modify → Increase node type
```

---

## 9. Troubleshooting

### Container won't start

```bash
docker-compose logs backend

# Check environment variables
docker-compose exec backend env | grep MONGO
```

### Database connection timeout

```bash
# Verify MongoDB is running
docker ps | grep mongodb

# Check connection with mongosh
docker-compose exec mongodb mongosh -u root -p password123
```

### High latency

```bash
# Check Redis cache hit rate
docker-compose exec redis redis-cli info stats

# Monitor backend performance
docker stats backend
```

---

## 10. CI/CD with GitHub Actions

1. Create GitHub secrets:

```bash
Settings → Secrets and variables → Actions → New secret

AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_ACCOUNT_ID=xxxxx
SLACK_WEBHOOK=xxxxx (optional)
```

2. Push to main branch → Auto-builds and deploys to ECS

---

## Next Steps

1. [ ] Test locally with `docker-compose up`
2. [ ] Set up MongoDB Atlas M3 cluster
3. [ ] Create AWS resources (ECR, ECS, ALB)
4. [ ] Deploy first version to ECS
5. [ ] Set up monitoring and alerts
6. [ ] Configure auto-scaling policies

For detailed architecture, see: **DISTRIBUTED_SYSTEM_UPGRADE.md**
