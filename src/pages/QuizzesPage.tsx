import { useState, useEffect } from 'react';
import { quizzes as mockQuizzes, Quiz } from '@/data/mockData';
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Brain, Trophy, Maximize2, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import QuizLeaderboard from '@/components/QuizLeaderboard';
import { quizzesAPI } from '@/lib/api';

export default function QuizzesPage() {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>(mockQuizzes);
  const [loading, setLoading] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch quizzes from API
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/quizzes`);
        if (response.ok) {
          const data = await response.json();
          // Convert MongoDB _id to id for compatibility
          const transformed = data.map((q: any) => ({
            id: q._id,
            title: q.title,
            topic: q.topic,
            questions: q.questions.map((qu: any) => ({
              id: qu.id || qu._id,
              question: qu.question,
              options: qu.options,
              correctAnswer: qu.correctAnswer,
              image: qu.image,
            })),
          }));
          if (transformed.length > 0) {
            setQuizzes(transformed);
          }
        }
      } catch (error) {
        console.log('Using mock data (API not available)');
        // Use mock data as fallback
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  // Track quiz start time
  useEffect(() => {
    if (selectedQuiz && !showResults) {
      setQuizStartTime(Date.now());
    }
  }, [selectedQuiz, showResults]);

  // Prevent tab switching and window changes during quiz
  useEffect(() => {
    if (!selectedQuiz || showResults) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert('⚠️ Tab switching is not allowed during quiz! Continuing from where you left off.');
        document.title = 'Quiz Active - Stay Focused! | System Design';
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent opening developer tools (F12, Ctrl+Shift+I, etc)
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.shiftKey && e.key === 'C')) {
        e.preventDefault();
        alert('Developer tools are disabled during quiz');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', handleKeyDown);
      document.title = 'System Design Platform';
    };
  }, [selectedQuiz, showResults]);

  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  };

  const handleAnswer = (qId: string, optIndex: number) => {
    if (answers[qId] !== undefined) return; // already answered
    setAnswers((prev) => ({ ...prev, [qId]: optIndex }));
  };

  const submitQuizResult = async () => {
    if (!selectedQuiz || !quizStartTime) return;
    
    try {
      setSubmitting(true);
      const correct = selectedQuiz.questions.filter((q) => answers[q.id] === q.correctAnswer).length;
      const total = selectedQuiz.questions.length;
      const points = Math.round((correct / total) * 100);
      const timeSpent = Math.floor((Date.now() - quizStartTime) / 1000);
      
      await quizzesAPI.submitAnswer(selectedQuiz.id, points, timeSpent);
      setShowLeaderboard(true);
    } catch (error) {
      console.log('Failed to submit quiz result:', error);
      setShowLeaderboard(true); // Show leaderboard anyway
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQ(0);
    setAnswers({});
    setShowResults(false);
    setShowLeaderboard(false);
    setIsFullscreen(false);
    setQuizStartTime(null);
  };

  if (selectedQuiz && showResults) {
    const correct = selectedQuiz.questions.filter((q) => answers[q.id] === q.correctAnswer).length;
    const total = selectedQuiz.questions.length;
    const pct = Math.round((correct / total) * 100);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => { setSelectedQuiz(null); resetQuiz(); }}
          className="neu-btn px-4 py-2 bg-secondary text-foreground inline-flex items-center gap-2 text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quizzes
        </button>

        {showLeaderboard ? (
          // Show leaderboard
          <>
            <div className="neu-card-blue p-8 text-center space-y-4 mb-6">
              <Trophy className="w-16 h-16 mx-auto text-accent-yellow" />
              <h2 className="text-3xl font-bold">Quiz Complete!</h2>
              <div className="text-6xl font-bold text-primary">{pct}%</div>
              <p className="text-xl font-mono">{correct}/{total} correct answers</p>
              <div className="w-full h-6 bg-secondary border-3 border-foreground" style={{ boxShadow: '3px 3px 0px #000' }}>
                <div
                  className={`h-full transition-all ${pct >= 70 ? 'bg-accent-lime' : pct >= 40 ? 'bg-accent-yellow' : 'bg-destructive'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-sm text-accent-lime font-bold">✓ Your score has been recorded on the leaderboard!</p>
            </div>

            {/* Leaderboard */}
            <QuizLeaderboard quizId={selectedQuiz.id} quizTitle={selectedQuiz.title} />

            {/* Review answers */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold uppercase tracking-wider">Review Your Answers</h3>
              {selectedQuiz.questions.map((q, i) => {
                const isCorrect = answers[q.id] === q.correctAnswer;
                return (
                  <div key={q.id} className={`neu-card p-5 ${isCorrect ? 'border-accent-lime' : 'border-destructive'}`} style={{ borderWidth: '3px' }}>
                    <p className="font-bold mb-2">Q{i + 1}. {q.question}</p>
                    <p className="text-sm">
                      Your answer: <span className={isCorrect ? 'text-accent-lime' : 'text-destructive'}>{q.options[answers[q.id]]}</span>
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-accent-lime">Correct: {q.options[q.correctAnswer]}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 justify-center mb-6">
              <button onClick={resetQuiz} className="neu-btn-blue px-6 py-3 inline-flex items-center gap-2 cursor-pointer">
                <RotateCcw className="w-4 h-4" /> Retry Quiz
              </button>
              <button
                onClick={() => { setSelectedQuiz(null); resetQuiz(); }}
                className="neu-btn px-6 py-3 bg-secondary text-foreground cursor-pointer"
              >
                All Quizzes
              </button>
            </div>
          </>
        ) : (
          // Show submission loading state
          <div className="neu-card-blue p-8 text-center space-y-6">
            <Trophy className="w-16 h-16 mx-auto text-accent-yellow" />
            <h2 className="text-3xl font-bold">Quiz Complete!</h2>
            <div className="text-6xl font-bold text-primary">{pct}%</div>
            <p className="text-xl font-mono">{correct}/{total} correct answers</p>
            <div className="w-full h-6 bg-secondary border-3 border-foreground" style={{ boxShadow: '3px 3px 0px #000' }}>
              <div
                className={`h-full transition-all ${pct >= 70 ? 'bg-accent-lime' : pct >= 40 ? 'bg-accent-yellow' : 'bg-destructive'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <button
              onClick={submitQuizResult}
              disabled={submitting}
              className={`neo-btn-blue px-8 py-3 inline-flex items-center gap-2 ${submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {submitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4" /> View Leaderboard
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  if (selectedQuiz) {
    const question = selectedQuiz.questions[currentQ];
    const answered = answers[question.id] !== undefined;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => { setSelectedQuiz(null); resetQuiz(); }}
          className="neu-btn px-4 py-2 bg-secondary text-foreground inline-flex items-center gap-2 text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quizzes
        </button>

        {/* Progress */}
        <div className="flex items-center justify-between text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <span>Question {currentQ + 1}/{selectedQuiz.questions.length}</span>
          <span>{selectedQuiz.title}</span>
          <button
            onClick={enterFullscreen}
            className="neu-btn px-3 py-1.5 bg-primary text-primary-foreground text-xs inline-flex items-center gap-1 cursor-pointer"
            style={{ boxShadow: '2px 2px 0px #1e3a5f' }}
          >
            <Maximize2 className="w-3 h-3" /> Fullscreen
          </button>
        </div>
        <div className="w-full h-3 bg-secondary border-2 border-foreground" style={{ boxShadow: '2px 2px 0px #000' }}>
          <div className="h-full bg-primary transition-all" style={{ width: `${((currentQ + 1) / selectedQuiz.questions.length) * 100}%` }} />
        </div>

        <div className="neu-card-blue p-8 space-y-6">
          <h2 className="text-xl font-bold">{question.question}</h2>

          {question.image && (
            <div className="aspect-video overflow-hidden border-3 border-foreground" style={{ boxShadow: '3px 3px 0px #000' }}>
              <img src={question.image} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="space-y-3">
            {question.options.map((opt, i) => {
              let style = 'bg-secondary text-foreground border-foreground hover:bg-primary/20';
              if (answered) {
                if (i === question.correctAnswer) style = 'bg-accent-lime/20 text-accent-lime border-accent-lime';
                else if (i === answers[question.id]) style = 'bg-destructive/20 text-destructive border-destructive';
                else style = 'bg-secondary/50 text-muted-foreground border-border';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(question.id, i)}
                  disabled={answered}
                  className={`w-full text-left p-4 border-3 font-bold flex items-center gap-3 transition-all ${style} ${!answered ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{ boxShadow: '2px 2px 0px #000' }}
                >
                  <span className="w-8 h-8 border-2 border-current flex items-center justify-center text-sm font-bold shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{opt}</span>
                  {answered && i === question.correctAnswer && <CheckCircle className="w-5 h-5 ml-auto shrink-0" />}
                  {answered && i === answers[question.id] && i !== question.correctAnswer && <XCircle className="w-5 h-5 ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="flex justify-end">
              {currentQ < selectedQuiz.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ((p) => p + 1)}
                  className="neu-btn-blue px-6 py-3 cursor-pointer"
                >
                  Next Question →
                </button>
              ) : (
                <button
                  onClick={() => setShowResults(true)}
                  className="neu-btn-blue px-6 py-3 cursor-pointer"
                >
                  View Results →
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Quiz list
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-primary">»</span> QUIZZES
        </h1>
        <p className="text-muted-foreground font-mono text-sm">TEST YOUR SYSTEM DESIGN KNOWLEDGE</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz, i) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <button
              onClick={() => { setSelectedQuiz(quiz); resetQuiz(); }}
              className="w-full text-left group cursor-pointer"
            >
              <div className="neu-card-blue p-6 h-full">
                <div className="w-12 h-12 bg-accent-indigo border-3 border-foreground flex items-center justify-center mb-4" style={{ boxShadow: '3px 3px 0px #000' }}>
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{quiz.title}</h3>
                <div className="flex items-center justify-between text-sm text-muted-foreground font-mono">
                  <span>{quiz.questions.length} questions</span>
                  <span className="neu-badge px-3 py-1 bg-secondary text-foreground">{quiz.topic}</span>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
