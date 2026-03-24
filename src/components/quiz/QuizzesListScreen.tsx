import { Brain, Search, Trophy, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Quiz } from '@/data/mockData';
import { useState, useEffect } from 'react';

interface QuizzesListScreenProps {
  quizzes: Quiz[];
  onSelectQuiz: (quiz: Quiz) => void;
}

interface QuizAttemptStatus {
  [quizId: string]: boolean;
}

export default function QuizzesListScreen({ quizzes, onSelectQuiz }: QuizzesListScreenProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [attemptedQuizzes, setAttemptedQuizzes] = useState<QuizAttemptStatus>({});
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  // Check which quizzes have been attempted
  useEffect(() => {
    const checkAttemptedQuizzes = async () => {
      try {
        setLoadingAttempts(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setAttemptedQuizzes({});
          return;
        }

        const attempts: QuizAttemptStatus = {};
        
        // Check each quiz in parallel
        const checks = quizzes.map(async (quiz) => {
          try {
            const response = await fetch(`${API_URL}/api/quizzes/${quiz.id}/attempt`, {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const attempt = await response.json();
              attempts[quiz.id] = attempt && attempt.points !== undefined;
            }
          } catch (_error) {
            // Silently ignore errors
          }
        });

        await Promise.all(checks);
        setAttemptedQuizzes(attempts);
      } catch (error) {
        console.error('Failed to check attempted quizzes:', error);
      } finally {
        setLoadingAttempts(false);
      }
    };

    if (quizzes.length > 0) {
      checkAttemptedQuizzes();
    }
  }, [quizzes]);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-primary">»</span> QUIZZES
        </h1>
        <p className="text-muted-foreground font-mono text-sm">TEST YOUR SYSTEM DESIGN KNOWLEDGE</p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="neu-input w-full px-4 py-3 text-foreground border-2 border-foreground flex items-center gap-2" style={{ boxShadow: '2px 2px 0px #000' }}>
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search quizzes by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none font-mono text-sm"
          />
        </div>

        {/* Topic Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTopic(null)}
            className={`px-4 py-2 text-sm font-bold tracking-wider border-2 cursor-pointer transition-all ${
              selectedTopic === null 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-secondary text-foreground border-foreground hover:bg-primary/20'
            }`}
            style={{ boxShadow: '2px 2px 0px #000' }}
          >
            All Topics
          </button>
          {Array.from(new Set(quizzes.map(q => q.topic))).map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-4 py-2 text-sm font-bold tracking-wider border-2 cursor-pointer transition-all ${
                selectedTopic === topic 
                  ? 'bg-accent-indigo text-white border-accent-indigo' 
                  : 'bg-secondary text-foreground border-foreground hover:bg-accent-indigo/20'
              }`}
              style={{ boxShadow: '2px 2px 0px #000' }}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground font-mono">
          Showing {quizzes.filter(q => 
            (searchQuery === '' || q.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (selectedTopic === null || q.topic === selectedTopic)
          ).length} quizzes
        </p>
      </div>

      {/* Quizzes Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes
          .filter(q => 
            (searchQuery === '' || q.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (selectedTopic === null || q.topic === selectedTopic)
          )
          .map((quiz, i) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="flex flex-col h-full"
          >
            <div className="neu-card-blue p-6 h-full flex flex-col">
              <div className="w-12 h-12 bg-accent-indigo border-3 border-foreground flex items-center justify-center mb-4 shrink-0" style={{ boxShadow: '3px 3px 0px #000' }}>
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2 line-clamp-2">{quiz.title}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {quiz.questions.length} questions • {quiz.topic}
              </p>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground font-mono mt-auto mb-4 pb-4 border-b border-foreground/30">
                <span className="bg-secondary px-2 py-1">{quiz.questions.length} Q's</span>
                <span className="neu-badge px-3 py-1 bg-secondary text-foreground">{quiz.topic}</span>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelectQuiz(quiz)}
                  className={`w-full py-2 text-sm font-bold border-2 cursor-pointer text-center ${
                    attemptedQuizzes[quiz.id] 
                      ? 'neu-btn bg-accent-lime/20 border-accent-lime text-accent-lime' 
                      : 'neu-btn-blue'
                  }`}
                  style={{ boxShadow: attemptedQuizzes[quiz.id] ? '2px 2px 0px #00FF00' : '2px 2px 0px #1e3a5f' }}
                >
                  {attemptedQuizzes[quiz.id] ? (
                    <>
                      <CheckCircle className="w-4 h-4 inline mr-1" /> View Result →
                    </>
                  ) : (
                    <>Start Quiz →</>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/leaderboard/${quiz.id}`);
                  }}
                  className="w-full px-4 py-2 text-sm font-bold border-2 border-accent-yellow bg-accent-yellow/10 text-foreground cursor-pointer text-center transition-all hover:bg-accent-yellow/20 flex items-center justify-center gap-2"
                  style={{ boxShadow: '2px 2px 0px #B8860B' }}
                >
                  <Trophy className="w-4 h-4" /> Leaderboard
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
