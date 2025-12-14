import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import ViewSwitcher from './components/ViewSwitcher';
import ChatbotContainer from './components/ChatbotContainer';
import CompanyDashboard from './pages/CompanyDashboard';
import UserView from './pages/UserView';
import ApprovalReview from './pages/ApprovalReview';
import ApprovalsList from './pages/ApprovalsList';
import { getCurrentUser, getAuthToken } from './utils/auth';

function App() {
  // Get user and token for chatbot initialization
  const user = getCurrentUser();
  const token = getAuthToken();

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
        <ViewSwitcher />
        
        {/* Chatbot Container - will initialize when user and token are available */}
        <ChatbotContainer 
          userId={user?.id}
          token={token}
          tenantId={user?.tenantId}
        />
      </div>
    </AppProvider>
  );
}

export default App;

