import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useChatbot } from '../hooks/useChatbot';

/**
 * ChatbotContainer Component
 * Wraps the chatbot widget and handles initialization based on current page/user
 * 
 * This component:
 * - Renders the chatbot container div
 * - Initializes the chatbot based on the current route
 * - Uses userId from UserView or CompanyDashboard
 */
export function ChatbotContainer() {
  const location = useLocation();
  const [userId, setUserId] = useState(null);

  // Extract userId based on current route
  useEffect(() => {
    // For UserView: Use Sara Neer's ID (hardcoded in UserView)
    if (location.pathname === '/') {
      setUserId('b2c3d4e5-f6a7-8901-2345-678901234567'); // Sara Neer
    }
    // For CompanyDashboard: We could get from selected user, but for now use a default
    else if (location.pathname === '/company') {
      // Use a default company user ID or get from context
      // For now, we'll use the same user ID
      setUserId('b2c3d4e5-f6a7-8901-2345-678901234567');
    }
    // For other pages, still show chatbot but with default user
    else {
      setUserId('b2c3d4e5-f6a7-8901-2345-678901234567');
    }
  }, [location.pathname]);

  // Initialize chatbot with userId
  // Note: RAG backend may need to support "LEARNERAI" microservice
  // If not supported, you may need to:
  // 1. Add LEARNERAI support to RAG backend, OR
  // 2. Temporarily use "ASSESSMENT" or "DEVLAB" (may not work correctly)
  const { botInitialized, scriptLoaded } = useChatbot({
    userId: userId,
    token: userId, // Using userId as token until proper auth is implemented
    tenantId: 'default',
    microservice: 'LEARNERAI', // ⚠️ May need to be "ASSESSMENT" or "DEVLAB" if RAG doesn't support LEARNERAI yet
    container: '#edu-bot-container',
    ragBackendUrl: import.meta.env.VITE_RAG_BACKEND_URL || 'https://rag-production-3a4c.up.railway.app'
  });

  return (
    <div id="edu-bot-container" className="fixed bottom-0 right-0 z-50">
      {/* Container for chatbot widget - widget will render here */}
    </div>
  );
}

