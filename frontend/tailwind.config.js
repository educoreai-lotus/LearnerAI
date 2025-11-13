/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Emerald Brand Colors
        'emeraldbrand': {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Gold Brand Colors
        'goldbrand': {
          400: '#d97706',
          500: '#f59e0b',
        },
        // Primary Colors
        'primary': {
          blue: '#065f46',
          purple: '#047857',
          cyan: '#0f766e',
        },
        // Accent Colors
        'accent': {
          gold: '#d97706',
          green: '#047857',
          orange: '#f59e0b',
        },
        // Background Colors (theme-aware)
        'bg': {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          card: 'var(--bg-card)',
        },
        // Text Colors (theme-aware)
        'text': {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          accent: 'var(--text-accent)',
        },
        // Gamification Colors
        'xp': '#f59e0b',
        'level': '#047857',
        'badge': '#10b981',
        'streak': '#ef4444',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #065f46, #047857)',
        'gradient-secondary': 'linear-gradient(135deg, #0f766e, #047857)',
        'gradient-accent': 'linear-gradient(135deg, #d97706, #f59e0b)',
        'gradient-card-light': 'linear-gradient(145deg, #ffffff, #f0fdfa)',
        'gradient-card-dark': 'linear-gradient(145deg, #1e293b, #334155)',
      },
      boxShadow: {
        'glow-light': '0 0 30px rgba(6, 95, 70, 0.3)',
        'glow-dark': '0 0 30px rgba(13, 148, 136, 0.4)',
        'card-light': '0 10px 40px rgba(0, 0, 0, 0.1)',
        'card-dark': '0 10px 40px rgba(0, 0, 0, 0.6)',
        'hover-light': '0 20px 60px rgba(6, 95, 70, 0.2)',
        'hover-dark': '0 20px 60px rgba(13, 148, 136, 0.3)',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
      },
      spacing: {
        'xs': '0.5rem',   // 8px
        'sm': '1rem',     // 16px
        'md': '1.5rem',   // 24px
        'lg': '2rem',     // 32px
        'xl': '3rem',     // 48px
        '2xl': '4rem',    // 64px
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

