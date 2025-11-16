import { useState, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import logoService from '../services/logoService';

/**
 * Header Component
 * Fixed header with logo, navigation, and theme toggle
 */
export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        // First try local public assets (simplest approach)
        const localLogo = `/assets/logo-${theme}.svg`;
        const img = new Image();
        img.onload = () => {
          setLogoUrl(localLogo);
          setLogoError(false);
        };
        img.onerror = async () => {
          // If local fails, try API
          try {
            const apiLogo = await logoService.getLogoUrl(theme);
            if (apiLogo) {
              setLogoUrl(apiLogo);
              setLogoError(false);
            } else {
              setLogoError(true);
            }
          } catch (error) {
            console.warn('Failed to load logo from API:', error);
            setLogoError(true);
          }
        };
        img.src = localLogo;
      } catch (error) {
        console.warn('Failed to load logo:', error);
        setLogoError(true);
      }
    };

    loadLogo();
  }, [theme]);

  return (
    <header className="fixed top-0 left-0 right-0 z-fixed h-16 bg-white dark:bg-slate-900 border-b border-neutral-200 dark:border-neutral-700 shadow-sm dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3),0_1px_2px_0_rgba(0,0,0,0.2)]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            {logoUrl && !logoError ? (
              <img 
                src={logoUrl} 
                alt="LearnerAI Logo" 
                className="h-8 w-auto"
                onError={() => setLogoError(true)}
              />
            ) : (
              <h1 className="text-2xl font-space-grotesk font-bold bg-gradient-to-r from-emeraldbrand-600 to-emeraldbrand-400 bg-clip-text text-transparent">
                LearnerAI
              </h1>
            )}
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#dashboard"
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-400 transition-colors duration-fast"
            >
              Dashboard
            </a>
            <a
              href="#courses"
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-400 transition-colors duration-fast"
            >
              My Courses
            </a>
            <a
              href="#paths"
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-400 transition-colors duration-fast"
            >
              Learning Paths
            </a>
            <a
              href="#settings"
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-400 transition-colors duration-fast"
            >
              Settings
            </a>
          </nav>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-fast flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-neutral-700 dark:text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-neutral-700 dark:text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

