import { ArrowLeft, Trophy, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import QuizLeaderboard from '@/components/QuizLeaderboard';
import { Quiz } from '@/data/mockData';

interface PreQuizScreenProps {
  quiz: Quiz;
  onStart: () => void;
  onBack: () => void;
  hasAttempted?: boolean;
  userScore?: number;
}

export default function PreQuizScreen({ quiz, onStart, onBack, hasAttempted = false, userScore = 0 }: PreQuizScreenProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="neu-btn px-4 py-2 bg-secondary text-foreground inline-flex items-center gap-2 text-sm cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Quizzes
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Quiz Header */}
        <div className="neu-card-blue p-8 space-y-3 border-4 border-primary">
          <h1 className="text-4xl font-bold">{quiz.title}</h1>
          <p className="text-xl text-muted-foreground font-mono">
            {quiz.questions.length} QUESTIONS • TOPIC: {quiz.topic}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Description & Rules */}
          <div className="space-y-6">
            {/* Description */}
            <div className="neu-card p-6 space-y-3">
              <h3 className="text-lg font-bold uppercase tracking-wider">📋 Description</h3>
              <p className="text-foreground leading-relaxed">
                Test your understanding of {quiz.topic}. Answer all questions carefully and select the best option for each question.
              </p>
              <div className="flex gap-2 text-sm text-muted-foreground font-mono">
                <span className="bg-secondary px-3 py-1 border-2 border-foreground">Total Questions: {quiz.questions.length}</span>
                <span className="bg-secondary px-3 py-1 border-2 border-foreground">Time: No Limit</span>
              </div>
            </div>

            {/* Rules & Regulations */}
            <div className="neu-card p-6 space-y-4 bg-accent-yellow/5 border-2 border-accent-yellow">
              <h3 className="text-lg font-bold uppercase tracking-wider">⚖️ Rules & Regulations</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="font-bold text-accent-yellow">✓</span>
                  <span>This quiz can only be attempted ONCE. Choose carefully!</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-accent-yellow">✓</span>
                  <span>Tab switching or window changes will immediately terminate the quiz</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-accent-yellow">✓</span>
                  <span>Attempting to open developer tools/inspect will disqualify you (no warnings)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-accent-yellow">✓</span>
                  <span>Copy/paste operations are disabled during the quiz</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-accent-yellow">✓</span>
                  <span>Switching to another window = disqualification (no warnings)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-accent-yellow">✓</span>
                  <span>Each question can only be answered once</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-accent-yellow">✓</span>
                  <span>Your score and time will be recorded on the leaderboard</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-accent-yellow">✓</span>
                  <span>Be honest and complete the assessment independently</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="neu-card p-6 space-y-4">
            <h3 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent-yellow" /> Top Performers
            </h3>
            <QuizLeaderboard quizId={quiz.id} quizTitle={quiz.title} />
          </div>
        </div>

        {/* Start Button */}
        <div className="flex gap-4 justify-center pt-6">
          {hasAttempted ? (
            <div className="neu-card p-6 bg-accent-yellow/5 border-2 border-accent-yellow space-y-3 text-center w-full">
              <AlertCircle className="w-8 h-8 mx-auto text-accent-yellow" />
              <p className="text-lg font-bold text-foreground">Quiz Already Attempted</p>
              <p className="text-sm text-muted-foreground font-mono">You have already completed this quiz once.</p>
              <p className="text-lg font-bold text-accent-yellow">{userScore}%</p>
              <p className="text-xs text-muted-foreground">Scroll down to review your answers and see the correct solutions!</p>
            </div>
          ) : (
            <button
              onClick={onStart}
              disabled={hasAttempted}
              className={`neu-btn-blue px-8 py-4 text-lg font-bold border-4 transition-transform ${
                hasAttempted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'
              }`}
              style={{ boxShadow: hasAttempted ? 'none' : '4px 4px 0px #1e3a5f' }}
            >
              Start Quiz →
            </button>
          )}
        </div>

        {/* Disclaimer */}
        <div className="neu-card p-4 bg-destructive/5 border-2 border-destructive text-sm">
          <p className="text-destructive font-bold">⚠️ IMPORTANT:</p>
          <p className="text-foreground mt-2">
            By starting this quiz, you agree to follow all rules. Any violation will result in immediate disqualification with no option to retake.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
