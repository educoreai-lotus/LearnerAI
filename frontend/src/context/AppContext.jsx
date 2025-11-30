import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

/**
 * AppContext Provider
 * Provides theme management with day-mode/night-mode values
 */
export function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      return 'night-mode';
    }
    if (savedTheme === 'light') {
      return 'day-mode';
    }
    // Default based on system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'night-mode' 
      : 'day-mode';
  });

  useEffect(() => {
    const root = document.documentElement;
    // Map day-mode/night-mode to dark class
    if (theme === 'night-mode') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Store as light/dark for compatibility
    localStorage.setItem('theme', theme === 'night-mode' ? 'dark' : 'light');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'day-mode' ? 'night-mode' : 'day-mode');
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Hook to use AppContext
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

