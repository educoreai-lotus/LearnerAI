import { useChatbot } from '../hooks/useChatbot';

/**
 * ChatbotContainer Component
 * 
 * Renders the chatbot widget container and initializes it when user is authenticated.
 * 
 * @param {Object} props
 * @param {string} props.userId - User ID (required when user is authenticated)
 * @param {string} props.token - Authentication token (required when user is authenticated)
 * @param {string} props.tenantId - Tenant ID (optional)
 * @param {string} props.containerId - Container ID (optional, defaults to "edu-bot-container")
 * 
 * @example
 * <ChatbotContainer 
 *   userId={user?.id} 
 *   token={token}
 *   tenantId={user?.tenantId}
 * />
 */
export default function ChatbotContainer({ 
  userId, 
  token, 
  tenantId,
  containerId = "edu-bot-container" 
}) {
  // Initialize chatbot when user and token are available
  useChatbot({
    userId: userId,
    token: token,
    tenantId: tenantId,
    container: `#${containerId}`,
    enabled: !!userId && !!token
  });

  return <div id={containerId}></div>;
}

