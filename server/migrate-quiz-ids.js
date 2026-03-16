import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const migrateQuizIds = async () => {
  let client;
  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('system_design_db');
    const quizzesCollection = db.collection('quizzes');

    console.log('🔄 Starting migration to add IDs to quiz questions...');

    // Fetch all quizzes
    const quizzes = await quizzesCollection.find({}).toArray();
    console.log(`📊 Found ${quizzes.length} quizzes to process`);

    let updated = 0;
    let skipped = 0;

    for (const quiz of quizzes) {
      let questionsUpdated = false;
      const updatedQuestions = quiz.questions.map((q, index) => {
        // If question already has an ID, keep it
        if (q.id) {
          return q;
        }
        // Generate a new ID if missing
        questionsUpdated = true;
        return {
          ...q,
          id: `${quiz._id}-q${index + 1}`
        };
      });

      if (questionsUpdated) {
        // Update the quiz with questions that now have IDs
        await quizzesCollection.updateOne(
          { _id: quiz._id },
          { $set: { questions: updatedQuestions } }
        );
        updated++;
        console.log(`✅ Updated quiz: ${quiz.title} (${updatedQuestions.length} questions)`);
      } else {
        skipped++;
      }
    }

    console.log('\n✨ Migration complete!');
    console.log(`   ✅ ${updated} quizzes updated with question IDs`);
    console.log(`   ⏭️  ${skipped} quizzes already had question IDs`);
    console.log('\n🎯 All existing quiz records are preserved and enhanced!');

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
};

migrateQuizIds();
