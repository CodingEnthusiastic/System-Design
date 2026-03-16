import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Check, Loader } from 'lucide-react';

export default function RegisterPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [verifyData, setVerifyData] = useState({
    code: '',
  });

  if (user) return <Navigate to="/" replace />;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      setSuccess('Verification code sent to your email!');
      setStep('verify');
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!verifyData.code) {
      setError('Verification code is required');
      return;
    }

    if (verifyData.code.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: verifyData.code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Verification failed');
        return;
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      setSuccess('✓ Registration successful!');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      setError('Verification failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
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
          <p className="text-muted-foreground font-mono text-sm">CREATE YOUR ACCOUNT</p>
        </div>

        {/* Register Card */}
        <div className="neu-card-blue p-8">
          {step === 'register' ? (
            <>
              <h2 className="text-2xl font-bold mb-6 uppercase tracking-wider">Sign Up</h2>

              {error && (
                <div className="flex items-start gap-2 p-4 mb-6 bg-destructive/20 border-3 border-destructive text-sm" style={{ boxShadow: '3px 3px 0px rgba(239,68,68,0.5)' }}>
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-2 p-4 mb-6 bg-green-500/20 border-3 border-green-500 text-sm" style={{ boxShadow: '3px 3px 0px rgba(34,197,94,0.5)' }}>
                  <Check className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="rishabh10"
                    className="neu-input w-full px-4 py-3 text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="neu-input w-full px-4 py-3 text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••"
                    className="neu-input w-full px-4 py-3 text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                      <Loader className="w-4 h-4 animate-spin" /> Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t-2 border-foreground/20">
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <a href="/login" className="text-primary font-bold hover:underline">
                    Sign In
                  </a>
                </p>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6 uppercase tracking-wider">Verify Email</h2>
              <p className="text-muted-foreground text-sm mb-6">
                We sent a 6-digit verification code to <strong>{formData.email}</strong>
              </p>

              {error && (
                <div className="flex items-start gap-2 p-4 mb-6 bg-destructive/20 border-3 border-destructive text-sm" style={{ boxShadow: '3px 3px 0px rgba(239,68,68,0.5)' }}>
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-start gap-2 p-4 mb-6 bg-green-500/20 border-3 border-green-500 text-sm" style={{ boxShadow: '3px 3px 0px rgba(34,197,94,0.5)' }}>
                  <Check className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider mb-2">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verifyData.code}
                    onChange={(e) => setVerifyData({ code: e.target.value.replace(/[^0-9]/g, '') })}
                    placeholder="000000"
                    className="neu-input w-full px-4 py-3 text-foreground text-center text-2xl tracking-widest font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="neu-btn-blue w-full px-6 py-3 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    'Verify & Register'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('register');
                    setError('');
                    setSuccess('');
                  }}
                  className="neu-btn w-full px-6 py-3 bg-secondary text-foreground cursor-pointer"
                >
                  Back to Register
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
