import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/**
 * View Switcher Component
 * Fixed button at the bottom of the page to switch between views
 */
export default function ViewSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useApp();
  const isDayMode = theme === 'day-mode';

  // Determine current view
  const getCurrentView = () => {
    // Check if we're on a detail page (e.g., /approvals/:id)
    const isDetailPage = /\/approvals\/[^/]+/.test(location.pathname);
    if (isDetailPage) {
      return null; // Don't show switcher on detail pages
    }
    
    if (location.pathname.startsWith('/approvals')) {
      return 'approvals';
    }
    if (location.pathname.startsWith('/company')) {
      return 'company';
    }
    return 'learner';
  };

  const currentView = getCurrentView();

  // Don't render on detail pages
  if (currentView === null) {
    return null;
  }

  // Get next view to switch to
  const getNextView = () => {
    switch (currentView) {
      case 'learner':
        return { path: '/company', label: 'Company Dashboard' };
      case 'company':
        return { path: '/approvals', label: 'Approvals' };
      case 'approvals':
        return { path: '/', label: 'Learner View' };
      default:
        return { path: '/', label: 'Learner View' };
    }
  };

  const nextView = getNextView();

  const handleSwitch = () => {
    navigate(nextView.path);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleSwitch}
        className={`px-6 py-3 rounded-lg font-medium shadow-lg transition-all duration-300 ease-in-out flex items-center gap-2 ${
          isDayMode
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-emerald-700 text-white hover:bg-emerald-600'
        }`}
        title={`Switch to ${nextView.label}`}
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
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
        <span className="hidden sm:inline">Switch to {nextView.label}</span>
        <span className="sm:hidden">Switch</span>
      </button>
    </div>
  );
}

