import { useState, useEffect } from 'react';
import { Trophy, Trophy as TrophyIcon, Medal, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { quizzesAPI } from '@/lib/api';

export interface LeaderboardEntry {
  _id: string;
  userId: string;
  username: string;
  points: number;
  timeSpent: number;
  completedAt: string;
  rank?: number;
}

interface QuizLeaderboardProps {
  quizId: string;
  quizTitle: string;
}

export default function QuizLeaderboard({ quizId, quizTitle }: QuizLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await quizzesAPI.getLeaderboard(quizId);
        const data = response.data;
        // Add ranks
        const withRanks = data.map((entry: LeaderboardEntry, index: number) => ({
          ...entry,
          rank: index + 1,
        }));
        setLeaderboard(withRanks);
      } catch (err) {
        console.log('Could not fetch leaderboard');
        setError('Could not load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [quizId]);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="neu-card p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-muted-foreground">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="neu-card p-6 bg-destructive/10 border-2 border-destructive">
        <p className="text-destructive font-semibold">{error}</p>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="neu-card p-6">
        <p className="text-center text-muted-foreground py-8">No quiz submissions yet.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="w-6 h-6 text-accent-yellow" />
        <div>
          <h3 className="font-bold text-lg">{quizTitle}</h3>
          <p className="text-xs text-muted-foreground font-mono">LEADERBOARD</p>
        </div>
      </div>

      <div className="space-y-2">
        {leaderboard.map((entry, index) => {
          const medal = getMedalIcon(entry.rank || index + 1);
          return (
            <motion.div
              key={entry._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`neu-card p-4 flex items-center gap-4 ${
                entry.rank && entry.rank <= 3 ? 'border-2 border-accent-yellow' : ''
              }`}
              style={
                entry.rank && entry.rank <= 3 ? { boxShadow: '3px 3px 0px #FFD60A' } : undefined
              }
            >
              {/* Rank */}
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-secondary border-2 border-foreground font-bold">
                {medal ? (
                  <span className="text-2xl">{medal}</span>
                ) : (
                  <span className="text-sm">#{entry.rank || index + 1}</span>
                )}
              </div>

              {/* User Info */}
              <div className="flex-grow min-w-0">
                <p className="font-bold truncate">{entry.username}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {new Date(entry.completedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Points */}
              <div className="flex items-center gap-2 px-3 py-2 bg-accent-lime/20 border-2 border-accent-lime rounded-lg">
                <span className="font-bold text-accent-lime">{entry.points}</span>
                <span className="text-xs text-muted-foreground font-mono">pts</span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/20 border-2 border-primary rounded-lg">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary font-mono">
                  {formatTime(entry.timeSpent)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="neu-card p-4 bg-secondary/50 text-center text-sm text-muted-foreground font-mono">
        Total Submissions: {leaderboard.length}
      </div>
    </motion.div>
  );
}
