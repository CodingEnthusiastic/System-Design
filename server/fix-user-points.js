import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/system_design';
const client = new MongoClient(uri);

async function fixUserPoints() {
  try {
    const db = client.db('system_design_db');
    const authCollection = db.collection('users');
    const leaderboardCollection = db.collection('leaderboard');

    console.log('🔄 Starting points recalculation...\n');

    // Get all users
    const users = await authCollection.find({}).toArray();
    let updatedCount = 0;
    let totalPointsFixed = 0;

    for (const user of users) {
      const userIdStr = user._id.toString();
      
      // Get all leaderboard entries for this user (handle both ObjectId and string formats)
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
      totalPointsFixed += userPoints;
      console.log(`✓ ${user.username} (${user.email}): ${userPoints} points`);
    }

    console.log(`\n✅ Fixed ${updatedCount} users`);
    console.log(`📊 Total points distributed: ${totalPointsFixed}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUserPoints();
