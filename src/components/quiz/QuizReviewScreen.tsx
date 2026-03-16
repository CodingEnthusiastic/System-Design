import { ArrowLeft, CheckCircle, XCircle, Trophy, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Quiz } from '@/data/mockData';
import { getImageUrl } from '@/lib/utils';

interface QuizReviewScreenProps {
  quiz: Quiz;
  userAnswers: Record<string, number>;
  score: number;
  timeSpent: number;
  completedAt: string;
  onBack: () => void;
}

export default function QuizReviewScreen({
  quiz,
  userAnswers,
  score,
  timeSpent,
  completedAt,
  onBack,
}: QuizReviewScreenProps) {
  const correct = quiz.questions.filter((q) => userAnswers[q.id] === q.correctAnswer).length;
  const total = quiz.questions.length;

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="neu-btn px-4 py-2 bg-secondary text-foreground inline-flex items-center gap-2 text-sm cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Quizzes
      </button>

      {/* Score Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="neu-card-blue p-8 text-center space-y-4">
        <Trophy className="w-16 h-16 mx-auto text-accent-yellow" />
        <h1 className="text-3xl font-bold">{quiz.title}</h1>
        <p className="text-muted-foreground font-mono">REVIEW YOUR ATTEMPT</p>

        <div className="grid md:grid-cols-3 gap-4 my-6">
          <div className="neu-card p-4 bg-secondary">
            <p className="text-sm text-muted-foreground font-mono mb-2">YOUR SCORE</p>
            <p className="text-4xl font-bold text-primary">{score}%</p>
            <p className="text-xs text-muted-foreground mt-1">{correct}/{total} correct</p>
          </div>
          <div className="neu-card p-4 bg-secondary">
            <p className="text-sm text-muted-foreground font-mono mb-2">TIME SPENT</p>
            <p className="text-2xl font-bold text-accent-cyan">{formatTime(timeSpent)}</p>
          </div>
          <div className="neu-card p-4 bg-secondary">
            <p className="text-sm text-muted-foreground font-mono mb-2">COMPLETED</p>
            <p className="text-sm font-bold text-accent-lime">{new Date(completedAt).toLocaleDateString()}</p>
            <p className="text-xs text-muted-foreground">{new Date(completedAt).toLocaleTimeString()}</p>
          </div>
        </div>

        <div className="w-full h-4 bg-secondary border-2 border-foreground" style={{ boxShadow: '2px 2px 0px #000' }}>
          <div
            className={`h-full transition-all ${score >= 70 ? 'bg-accent-lime' : score >= 40 ? 'bg-accent-yellow' : 'bg-destructive'}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </motion.div>

      {/* Answer Key */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold uppercase tracking-wider">
          <span className="text-primary">»</span> Answer Key
        </h2>

        {quiz.questions.map((q, i) => {
          const userAnswerIndex = userAnswers[q.id];
          const isCorrect = userAnswerIndex === q.correctAnswer;
          const userAnswer = userAnswerIndex !== undefined ? q.options[userAnswerIndex] : 'Not answered';

          return (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`neu-card p-6 space-y-4 border-3 ${isCorrect ? 'border-accent-lime bg-accent-lime/5' : 'border-destructive bg-destructive/5'}`}
              style={{ boxShadow: isCorrect ? '3px 3px 0px #22c55e' : '3px 3px 0px #ef4444' }}
            >
              {/* Question */}
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-8 h-8 border-2 border-foreground flex items-center justify-center font-bold shrink-0 bg-secondary">
                    {i + 1}
                  </span>
                  <p className="font-bold text-lg flex-1">{q.question}</p>
                </div>
              </div>

              {/* Question Image */}
              {q.image && (
                <div className="border-2 border-foreground overflow-hidden" style={{ boxShadow: '2px 2px 0px #000' }}>
                  <img src={getImageUrl(q.image)} alt="" className="w-full h-48 object-contain bg-background" />
                </div>
              )}

              {/* Answer Details */}
              <div className="space-y-3 bg-background/50 p-4 border-2 border-border">
                {/* Correct Answer */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded border-2 border-accent-lime text-accent-lime shrink-0 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-mono mb-1">CORRECT ANSWER</p>
                    <p className="font-bold text-accent-lime">
                      {String.fromCharCode(65 + q.correctAnswer)}. {q.options[q.correctAnswer]}
                    </p>
                  </div>
                </div>
              </div>

              {/* All Options for Reference */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">All Options:</p>
                <div className="grid grid-cols-1 gap-2">
                  {q.options.map((opt, idx) => {
                    const isSelected = idx === userAnswerIndex;
                    const isCorrected = idx === q.correctAnswer;

                    let style = 'bg-secondary text-foreground border-foreground';
                    if (isCorrected) style = 'bg-accent-lime/20 text-accent-lime border-accent-lime';
                    else if (isSelected && !isCorrect) style = 'bg-destructive/20 text-destructive border-destructive';

                    return (
                      <div key={idx} className={`p-3 border-2 ${style} text-sm font-mono`}>
                        <span className="font-bold">{String.fromCharCode(65 + idx)}.</span> {opt}
                        {isCorrected && <span className="ml-2 text-xs">✓ CORRECT</span>}
                        {isSelected && !isCorrect && <span className="ml-2 text-xs">✗ YOUR ANSWER</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex justify-center gap-4 pt-6 pb-12">
        <button onClick={onBack} className="neu-btn px-8 py-3 bg-secondary text-foreground cursor-pointer font-bold">
          Back to Quizzes
        </button>
      </div>
    </motion.div>
  );
}
