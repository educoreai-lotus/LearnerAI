import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/Header';
import ViewSwitcher from './components/ViewSwitcher';
import CompanyDashboard from './pages/CompanyDashboard';
import UserView from './pages/UserView';
import ApprovalReview from './pages/ApprovalReview';
import ApprovalsList from './pages/ApprovalsList';
import { ChatbotContainer } from './components/ChatbotContainer';

function App() {
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
        {/* Chatbot Container - Available on all pages */}
        <ChatbotContainer />
      </div>
    </AppProvider>
  );
}

export default App;

