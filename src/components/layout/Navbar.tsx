import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Menu, X, LogOut, Settings, User } from 'lucide-react';

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/learn', label: 'Learn' },
    { to: '/articles', label: 'Articles' },
    { to: '/quizzes', label: 'Quizzes' },
    { to: '/profile', label: 'Profile' },
    ...(isAdmin ? [{ to: '/admin', label: 'Manage' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-background border-b-4 border-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary border-3 border-foreground flex items-center justify-center" style={{ boxShadow: '3px 3px 0px #000' }}>
              <span className="text-primary-foreground font-bold text-lg">SD</span>
            </div>
            <span className="font-bold text-xl hidden sm:block tracking-tight">
              SYS<span className="text-primary">DESIGN</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 font-bold text-sm uppercase tracking-wider transition-all ${
                  isActive(link.to)
                    ? 'bg-primary text-primary-foreground border-3 border-foreground'
                    : 'hover:bg-secondary text-foreground border-3 border-transparent'
                }`}
                style={isActive(link.to) ? { boxShadow: '2px 2px 0px #000' } : {}}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User + Logout */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-secondary border-2 border-foreground" style={{ boxShadow: '2px 2px 0px #000' }}>
              <User className="w-4 h-4" />
              <span className="text-sm font-bold">{user?.name}</span>
              {isAdmin && (
                <span className="neu-badge-blue px-2 py-0.5 text-[10px]">ADMIN</span>
              )}
            </div>
            <button
              onClick={logout}
              className="p-2 hover:bg-destructive hover:text-destructive-foreground border-2 border-foreground transition-all"
              style={{ boxShadow: '2px 2px 0px #000' }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 border-3 border-foreground bg-secondary"
            style={{ boxShadow: '2px 2px 0px #000' }}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t-3 border-foreground bg-background">
          <div className="px-4 py-3 space-y-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 font-bold text-sm uppercase tracking-wider border-3 ${
                  isActive(link.to)
                    ? 'bg-primary text-primary-foreground border-foreground'
                    : 'bg-secondary text-foreground border-transparent hover:border-foreground'
                }`}
                style={isActive(link.to) ? { boxShadow: '3px 3px 0px #000' } : {}}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              className="w-full px-4 py-3 font-bold text-sm uppercase tracking-wider bg-destructive text-destructive-foreground border-3 border-foreground text-left"
              style={{ boxShadow: '3px 3px 0px #000' }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
