import { useState } from 'react';
import Header from './components/Header';
import CompanyDashboard from './pages/CompanyDashboard';
import UserView from './pages/UserView';

function App() {
  const [currentView, setCurrentView] = useState('user'); // 'user' or 'company'

  return (
    <div className="App">
      {currentView === 'company' ? (
        <CompanyDashboard />
      ) : (
        <UserView />
      )}
      
      {/* View Toggle (for development) */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setCurrentView(currentView === 'user' ? 'company' : 'user')}
          className="px-4 py-2 bg-primary-700 dark:bg-primary-600 text-white rounded-button text-sm hover:bg-primary-800 dark:hover:bg-primary-700 transition-all duration-fast"
        >
          Switch to {currentView === 'user' ? 'Company' : 'User'} View
        </button>
      </div>
    </div>
  );
}

export default App;

