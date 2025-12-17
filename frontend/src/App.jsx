import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import ChatbotContainer from './components/ChatbotContainer';
import CompanyDashboard from './pages/CompanyDashboard';
import UserView from './pages/UserView';
import ApprovalReview from './pages/ApprovalReview';
import ApprovalsList from './pages/ApprovalsList';
import { getCurrentUser, getAuthToken, initializeAuthFromUrl, getUserRole } from './utils/auth';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Initialize auth from URL parameters (when redirected from Directory)
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to initialize from URL params first
        const urlUser = await initializeAuthFromUrl();
        if (urlUser) {
          setUser(urlUser);
          setToken(getAuthToken());
          
          // Route based on role
          const role = urlUser.role || getUserRole();
          if (role === 'company') {
            navigate('/company', { replace: true });
          } else if (role === 'decision_maker') {
            navigate('/approvals', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } else {
          // No URL params, use existing localStorage auth
          const existingUser = getCurrentUser();
          const existingToken = getAuthToken();
          setUser(existingUser);
          setToken(existingToken);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Fallback to existing auth
        const existingUser = getCurrentUser();
        const existingToken = getAuthToken();
        setUser(existingUser);
        setToken(existingToken);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [navigate]);

  // Get user and token for chatbot initialization
  const currentUser = user || getCurrentUser();
  const currentToken = token || getAuthToken();

  // Show loading spinner while initializing auth
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <AppProvider>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<UserView />} />
          <Route path="/company" element={<CompanyDashboard />} />
          <Route path="/approvals" element={<ApprovalsList />} />
          <Route path="/approvals/:approvalId" element={<ApprovalReview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Chatbot Container - will initialize when user and token are available */}
        <ChatbotContainer 
          userId={currentUser?.id}
          token={currentToken}
          tenantId={currentUser?.tenantId}
        />
      </div>
    </AppProvider>
  );
}

export default App;

