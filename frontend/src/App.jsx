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
          
          // Get current path to avoid unnecessary redirects
          const currentPath = location.pathname;
          
          // Infer role from path if role is missing
          let role = urlUser.role || getUserRole();
          if (!role) {
            // Infer role from current path
            if (currentPath.startsWith('/company')) {
              role = 'company';
            } else if (currentPath.startsWith('/approvals')) {
              role = 'decision_maker';
            } else {
              role = 'learner';
            }
          }
          
          // Only navigate if user is NOT already on the correct page
          if (role === 'company' && currentPath !== '/company') {
            navigate('/company', { replace: true });
          } else if (role === 'decision_maker' && currentPath !== '/approvals' && !currentPath.startsWith('/approvals/')) {
            navigate('/approvals', { replace: true });
          } else if (role === 'learner' && currentPath !== '/') {
            navigate('/', { replace: true });
          }
          // If already on correct page, don't navigate
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
  }, [navigate, location.pathname]);

  // Get user and token for chatbot initialization
  // Fallback to mock data for local development/testing (same as UserView)
  const getChatbotUser = () => {
    // First, try from auth state or localStorage
    const authUser = user || getCurrentUser();
    if (authUser && authUser.id) {
      return authUser;
    }
    
    // Fallback to mock user for local development (Sara Neer)
    return {
      id: 'b2c3d4e5-f6a7-8901-2345-678901234567',
      tenantId: 'c1d2e3f4-5678-9012-3456-789012345678', // TechCorp Inc.
      company_id: 'c1d2e3f4-5678-9012-3456-789012345678'
    };
  };

  const getChatbotToken = () => {
    // First, try from auth state or localStorage
    const authToken = token || getAuthToken();
    if (authToken) {
      return authToken;
    }
    
    // Fallback to mock token for local development
    // This allows chatbot to initialize for testing
    return 'mock-token-for-local-development';
  };

  const currentUser = getChatbotUser();
  const currentToken = getChatbotToken();

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

