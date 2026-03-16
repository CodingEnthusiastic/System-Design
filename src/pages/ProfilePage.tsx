import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Shield, Star, Trophy, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface UserData {
  _id: string;
  username: string;
  email: string;
  role: string;
  points?: number;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_URL}/api/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          // Fallback to user from auth context
          setUserData({
            _id: user.id || '',
            username: user.username || '',
            email: user.email,
            role: user.role,
            points: 0,
          });
        }
      } catch (error) {
        console.log('Failed to fetch user profile, using context data');
        setUserData({
          _id: user.id || '',
          username: user.username || '',
          email: user.email,
          role: user.role,
          points: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        {loading ? <Loader className="w-8 h-8 animate-spin text-primary" /> : null}
      </div>
    );
  }

  const displayData = userData || {
    _id: user.id || '',
    username: user.username || '',
    email: user.email,
    role: user.role,
    points: 0,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          <span className="text-primary">»</span> PROFILE
        </h1>
        <p className="text-muted-foreground font-mono text-sm">YOUR ACCOUNT DETAILS</p>
      </div>

      <div className="neu-card-blue p-8">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-primary border-4 border-foreground flex items-center justify-center" style={{ boxShadow: '4px 4px 0px #000' }}>
            <span className="text-primary-foreground text-2xl font-bold">
              {(displayData.username || displayData.email || '?')[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{displayData.username}</h2>
            <span className={`inline-block mt-1 px-3 py-1 text-xs font-bold uppercase tracking-wider border-2 ${
              displayData.role === 'admin'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-accent-cyan text-background border-accent-cyan'
            }`} style={{ boxShadow: '2px 2px 0px #000' }}>
              {displayData.role}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { icon: Mail, label: 'Email', value: displayData.email },
            { icon: User, label: 'Username', value: displayData.username },
            { icon: Shield, label: 'Role', value: displayData.role.toUpperCase() },
          ].map((field) => (
            <div key={field.label} className="flex items-center gap-4 p-4 bg-secondary border-3 border-border" style={{ boxShadow: '2px 2px 0px #000' }}>
              <field.icon className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{field.label}</p>
                <p className="font-bold">{field.value}</p>
              </div>
            </div>
          ))}

          {/* Points Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4 p-4 bg-accent-yellow/20 border-3 border-accent-yellow"
            style={{ boxShadow: '2px 2px 0px #FFD60A' }}
          >
            <Trophy className="w-5 h-5 text-accent-yellow shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Points</p>
              <p className="font-bold text-lg text-accent-yellow">{displayData.points || 0}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
