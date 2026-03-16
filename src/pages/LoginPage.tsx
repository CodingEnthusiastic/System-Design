import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Loader } from 'lucide-react';

export default function LoginPage() {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (!success) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 neu-dots">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-primary border-4 border-foreground flex items-center justify-center" style={{ boxShadow: '5px 5px 0px #000' }}>
              <span className="text-primary-foreground font-bold text-2xl">SD</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            SYS<span className="text-primary">DESIGN</span>
          </h1>
          <p className="text-muted-foreground font-mono text-sm">MASTER THE ART OF SYSTEM DESIGN</p>
        </div>

        {/* Login Card */}
        <div className="neu-card-blue p-8">
          <h2 className="text-2xl font-bold mb-6 uppercase tracking-wider">Sign In</h2>

          {error && (
            <div className="flex items-start gap-2 p-4 mb-6 bg-destructive/20 border-3 border-destructive text-sm" style={{ boxShadow: '3px 3px 0px rgba(239,68,68,0.5)' }}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="neu-input w-full px-4 py-3 text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="neu-input w-full px-4 py-3 text-foreground"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neu-btn-blue w-full px-6 py-3 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" /> Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t-2 border-foreground/20">
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <a href="/register" className="text-primary font-bold hover:underline">
                Create one here
              </a>
            </p>
          </div>
        </div>

        {/* Test Credentials */}
        <div className="mt-8 p-4 neu-card-blue bg-secondary/50">
          <p className="text-xs font-mono text-muted-foreground text-center">
            Test credentials available after registration<br />
            Use email verification for signup
          </p>
        </div>
      </div>
    </div>
  );
}
