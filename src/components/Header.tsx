import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Auth } from './Auth'; // Assuming Auth is exported from index.ts or directly
import './Header.css';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <header className="header">
        <div className="header-content">
          <h1 className="header-title">{title}</h1>
          <div className="header-actions">
            <button 
              className="theme-toggle" 
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            {user ? (
              <div className="user-info">
                <span className="user-email">{user.email}</span>
                <button className="auth-btn" onClick={() => signOut()}>Logout</button>
              </div>
            ) : (
              <button className="auth-btn" onClick={() => setShowAuthModal(true)}>Login</button>
            )}
          </div>
        </div>
        <p className="header-subtitle">AI-powered task planning</p>
      </header>
      {showAuthModal && <Auth onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
