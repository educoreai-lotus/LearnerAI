import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/**
 * Header Component
 * Production-ready header with navigation, theme toggle, and action buttons
 * Implements strict design system color rules
 */
export default function Header() {
  const { theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoError, setLogoError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get API base URL
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Determine logo theme based on day-mode/night-mode
  const logoTheme = theme === 'day-mode' ? 'light' : 'dark';

  useEffect(() => {
    const loadLogo = () => {
      const logoPath = `${API_BASE_URL}/api/logo/${logoTheme}`;
      const img = new Image();
      
      img.onload = () => {
        setLogoUrl(logoPath);
        setLogoError(false);
      };
      
      img.onerror = () => {
        setLogoError(true);
        setLogoUrl(null);
      };
      
      img.src = logoPath;
    };

    loadLogo();
  }, [theme, API_BASE_URL, logoTheme]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Theme-based classes
  const isDayMode = theme === 'day-mode';

  // Navigation items - Only Home
  const navItems = [
    { path: '/home', label: 'Home', icon: true },
  ];

  // Check if a route is active
  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Navigation button classes - Home button follows design system rules
  const getNavButtonClasses = (isActive) => {
    if (isActive) {
      return isDayMode
        ? 'bg-emerald-100 text-emerald-600'
        : 'bg-emerald-900/20 text-emerald-400';
    }
    return isDayMode
      ? 'bg-transparent text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
      : 'bg-transparent text-gray-300 hover:bg-emerald-900/20 hover:text-emerald-400';
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-20 flex items-center justify-center ${
          isDayMode
            ? 'bg-white/95 border-b border-gray-200'
            : 'bg-slate-900/95 border-b border-gray-600'
        } shadow-lg backdrop-blur-md transition-all duration-300 ease-in-out`}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Logo and Home Button - Left */}
          <div className="flex items-center gap-4">
            {logoUrl && !logoError ? (
              <img
                src={logoUrl}
                alt="EDUCORE AI Logo"
                className="h-auto max-h-14 transition-all duration-300 ease-in-out cursor-pointer"
                onClick={() => navigate('/home')}
                onError={() => setLogoError(true)}
              />
            ) : (
              <div
                className={`text-lg font-semibold cursor-pointer transition-all duration-300 ease-in-out ${
                  isDayMode ? 'text-gray-600' : 'text-gray-300'
                }`}
                onClick={() => navigate('/home')}
              >
                EDUCORE AI
              </div>
            )}
            
            {/* Home Button - Next to Logo */}
            <nav className="flex items-center ml-10">
              {navItems.map((item) => {
                const isActive = isActiveRoute(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ease-in-out flex items-center gap-2 ${getNavButtonClasses(
                      isActive
                    )}`}
                  >
                    {/* Home Icon */}
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Side - Notifications, User, Theme Toggle */}
          <div className="flex items-center gap-6">
            {/* Notification Button */}
            <button
              onClick={() => navigate('/notifications')}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out ${
                isDayMode
                  ? 'bg-transparent text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
                  : 'bg-transparent text-gray-300 hover:bg-emerald-900/20 hover:text-emerald-400'
              }`}
              aria-label="Notifications"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {/* Notification Badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>

            {/* User Avatar */}
            <button
              onClick={() => navigate('/profile')}
              className="relative w-10 h-10 rounded-full overflow-hidden transition-all duration-300 ease-in-out hover:ring-2 hover:ring-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="User profile"
            >
              {/* Default Avatar - User Icon */}
              <div
                className={`w-full h-full flex items-center justify-center ${
                  isDayMode
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-emerald-900/20 text-emerald-400'
                }`}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              {/* If user has an image, it would be displayed here */}
              {/* <img src={userAvatar} alt="User" className="w-full h-full object-cover" /> */}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ease-in-out ${
                isDayMode
                  ? 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-emerald-100'
                  : 'bg-gray-800 border-gray-700 text-white hover:bg-emerald-900/20'
              }`}
              aria-label="Toggle theme"
            >
              {isDayMode ? (
                // Moon icon for day-mode
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              ) : (
                // Sun icon for night-mode
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              )}
            </button>

            {/* Hamburger Menu Button (Mobile) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out ${
                isDayMode
                  ? 'bg-transparent text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
                  : 'bg-transparent text-gray-300 hover:bg-emerald-900/20 hover:text-emerald-400'
              }`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                // Close icon (X)
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                // Hamburger icon
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Slide Down Animation */}
      <div
        className={`fixed top-20 left-0 right-0 z-40 md:hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        } ${
          isDayMode
            ? 'bg-white/95 border-b border-gray-200'
            : 'bg-slate-900/95 border-b border-gray-600'
        } shadow-lg backdrop-blur-md`}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = isActiveRoute(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-3 rounded-lg font-medium text-left transition-all duration-300 ease-in-out flex items-center gap-2 ${getNavButtonClasses(
                    isActive
                  )}`}
                >
                  {/* Home Icon */}
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-20" />
    </>
  );
}
