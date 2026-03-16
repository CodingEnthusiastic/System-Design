import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizzes as mockQuizzes, Quiz } from '@/data/mockData';
import { quizzesAPI } from '@/lib/api';
import TabViolationScreen from '@/components/quiz/TabViolationScreen';
import PreQuizScreen from '@/components/quiz/PreQuizScreen';
import QuizActiveScreen from '@/components/quiz/QuizActiveScreen';
import QuizResultsScreen from '@/components/quiz/QuizResultsScreen';
import QuizReviewScreen from '@/components/quiz/QuizReviewScreen';
import QuizzesListScreen from '@/components/quiz/QuizzesListScreen';

export default function QuizzesPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Screen state
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showPreQuizScreen, setShowPreQuizScreen] = useState(false);
  const [quizActive, setQuizActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);

  // Data state
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // User attempt tracking
  const [hasAttempted, setHasAttempted] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [attemptTimeSpent, setAttemptTimeSpent] = useState(0);
  const [attemptCompletedAt, setAttemptCompletedAt] = useState('');

  // Security state
  const [tabViolation, setTabViolation] = useState(false);
  const [quizAborted, setQuizAborted] = useState(false);
  const [violationReason, setViolationReason] = useState<'tab-switch' | 'inspect' | 'copy'>('tab-switch');

  // Handle URL-based quiz selection
  useEffect(() => {
    if (dataLoaded && id) {
      const quiz = quizzes.find(q => q.id === id);
      if (quiz) {
        setSelectedQuiz(quiz);
        setShowPreQuizScreen(true);
      } else {
        setSelectedQuiz(null);
        setShowPreQuizScreen(false);
      }
    }
  }, [id, quizzes, dataLoaded]);

  // Fetch quizzes from API
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/quizzes`);
        if (response.ok) {
          const data = await response.json();
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
          } else {
            setQuizzes(mockQuizzes);
          }
        }
      } catch (error) {
        console.log('Using mock data (API not available)');
        setQuizzes(mockQuizzes);
      } finally {
        setLoading(false);
        setDataLoaded(true);
      }
    };

    fetchQuizzes();
  }, []);

  // Check if user has already attempted this quiz
  useEffect(() => {
    if (!selectedQuiz || !showPreQuizScreen) {
      setHasAttempted(false);
      setUserScore(0);
      setUserAnswers({});
      setAttemptTimeSpent(0);
      setAttemptCompletedAt('');
      return;
    }

    const checkUserAttempt = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('authToken');
        
        if (token) {
          const response = await fetch(`${API_URL}/api/quizzes/${selectedQuiz.id}/attempt`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.ok) {
            const attempt = await response.json();
            setHasAttempted(true);
            setUserScore(attempt.points);
            setUserAnswers(attempt.answers || {});
            setAttemptTimeSpent(attempt.timeSpent || 0);
            setAttemptCompletedAt(attempt.completedAt || '');
          } else {
            setHasAttempted(false);
            setUserScore(0);
            setUserAnswers({});
            setAttemptTimeSpent(0);
            setAttemptCompletedAt('');
          }
        }
      } catch (error) {
        console.error('Error checking quiz attempt:', error);
        setHasAttempted(false);
      }
    };

    checkUserAttempt();
  }, [selectedQuiz, showPreQuizScreen]);

  // Track quiz start time
  useEffect(() => {
    if (quizActive && !showResults) {
      setQuizStartTime(Date.now());
    }
  }, [quizActive, showResults]);

  // SECURITY: TAB DETECTION, COPY BLOCKING, INSPECT DETECTION
  useEffect(() => {
    if (!quizActive || showResults) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolationReason('tab-switch');
        setTabViolation(true);
        setQuizAborted(true);
        setQuizActive(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C (copy)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+Shift+I (inspect)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        setViolationReason('inspect');
        setTabViolation(true);
        setQuizAborted(true);
        setQuizActive(false);
        return false;
      }

      // Block Ctrl+Shift+C (inspect element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setViolationReason('inspect');
        setTabViolation(true);
        setQuizAborted(true);
        setQuizActive(false);
        return false;
      }

      // Block F12 (developer tools)
      if (e.key === 'F12') {
        e.preventDefault();
        setViolationReason('inspect');
        setTabViolation(true);
        setQuizAborted(true);
        setQuizActive(false);
        return false;
      }

      // Block Ctrl+Shift+J (console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        setViolationReason('inspect');
        setTabViolation(true);
        setQuizAborted(true);
        setQuizActive(false);
        return false;
      }
    };

    const handleBlur = () => {
      if (!document.hidden) {
        setViolationReason('tab-switch');
        setTabViolation(true);
        setQuizAborted(true);
        setQuizActive(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
  }, [quizActive, showResults]);

  // Handlers
  const startQuiz = async () => {
    if (hasAttempted) {
      alert('You have already attempted this quiz. Each quiz can only be attempted once.');
      return;
    }

    setShowPreQuizScreen(false);
    setQuizActive(true);
    setTabViolation(false);
    setQuizAborted(false);
  };

  const handleAnswer = (qId: string, optIndex: number) => {
    if (answers[qId] !== undefined) return;
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

      await quizzesAPI.submitAnswer(selectedQuiz.id, points, timeSpent, answers);
      setShowLeaderboard(true);
    } catch (error) {
      console.log('Failed to submit quiz result:', error);
      setShowLeaderboard(true);
    } finally {
      setSubmitting(false);
    }
  };

  const resetQuiz = () => {
    setCurrentQ(0);
    setAnswers({});
    setShowResults(false);
    setShowLeaderboard(false);
    setQuizStartTime(null);
    setQuizActive(false);
    setShowPreQuizScreen(false);
    setTabViolation(false);
    setQuizAborted(false);
    setViolationReason('tab-switch');
    setHasAttempted(false);
    setUserScore(0);
    setUserAnswers({});
    setAttemptTimeSpent(0);
    setAttemptCompletedAt('');
  };

  const handleSelectQuiz = (quiz: Quiz) => {
    setCurrentQ(0);
    setAnswers({});
    setShowResults(false);
    setShowLeaderboard(false);
    setQuizStartTime(null);
    setQuizActive(false);
    setTabViolation(false);
    setQuizAborted(false);
    setViolationReason('tab-switch');
    setHasAttempted(false);
    setUserScore(0);
    setUserAnswers({});
    setAttemptTimeSpent(0);
    setAttemptCompletedAt('');
    navigate(`/quizzes/${quiz.id}`);
  };

  const handleBackToQuizzes = () => {
    navigate('/quizzes');
    resetQuiz();
  };

  // RENDER LOGIC
  if (tabViolation && quizAborted && selectedQuiz) {
    return (
      <TabViolationScreen
        onBack={handleBackToQuizzes}
        reason={violationReason}
      />
    );
  }

  // Show review screen if user has already attempted this quiz
  if (selectedQuiz && showPreQuizScreen && !quizActive && hasAttempted) {
    return (
      <QuizReviewScreen
        quiz={selectedQuiz}
        userAnswers={userAnswers}
        score={userScore}
        timeSpent={attemptTimeSpent}
        completedAt={attemptCompletedAt}
        onBack={handleBackToQuizzes}
      />
    );
  }

  if (selectedQuiz && showPreQuizScreen && !quizActive) {
    return (
      <PreQuizScreen
        quiz={selectedQuiz}
        onStart={startQuiz}
        onBack={handleBackToQuizzes}
        hasAttempted={hasAttempted}
        userScore={userScore}
      />
    );
  }

  if (quizActive && selectedQuiz && showResults) {
    return (
      <QuizResultsScreen
        quiz={selectedQuiz}
        answers={answers}
        showLeaderboard={showLeaderboard}
        submitting={submitting}
        onSubmitResults={submitQuizResult}
        onRetry={() => {
          resetQuiz();
          setQuizActive(true);
        }}
        onBack={handleBackToQuizzes}
      />
    );
  }

  if (quizActive && selectedQuiz && !showResults) {
    return (
      <QuizActiveScreen
        quiz={selectedQuiz}
        currentQuestion={currentQ}
        answers={answers}
        onAnswer={handleAnswer}
        onNext={() => setCurrentQ((p) => p + 1)}
        onViewResults={() => setShowResults(true)}
        onBack={handleBackToQuizzes}
      />
    );
  }

  return (
    <QuizzesListScreen
      quizzes={quizzes}
      onSelectQuiz={handleSelectQuiz}
    />
  );
}
