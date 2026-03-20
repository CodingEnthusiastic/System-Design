import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from './Navbar';
import { Footer } from '../Footer';

export function AppLayout() {
  const { user, loading } = useAuth();

  // Wait for auth to load before making any decisions
  if (loading) {
    return null;
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
