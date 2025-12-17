import { useEffect, useRef } from 'react';

/**
 * Hook for initializing the Educore Chatbot widget
 * 
 * @param {Object} config - Chatbot configuration
 * @param {string} config.userId - User ID (required when user is authenticated)
 * @param {string} config.token - Authentication token (required when user is authenticated)
 * @param {string} config.tenantId - Tenant ID (optional, defaults to "default")
 * @param {string} config.container - Container selector (optional, defaults to "#edu-bot-container")
 * @param {boolean} config.enabled - Whether to initialize the chatbot (optional, defaults to true)
 * 
 * @example
 * const { user, token } = useAuth();
 * useChatbot({
 *   userId: user?.id,
 *   token: token,
 *   tenantId: user?.tenantId,
 *   enabled: !!user && !!token
 * });
 */
export function useChatbot({ 
  userId, 
  token, 
  tenantId = "default", 
  container = "#edu-bot-container",
  enabled = true 
}) {
  const initializedRef = useRef(false);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Don't initialize if disabled or missing required params
    if (!enabled || !userId || !token) {
      return;
    }

    // Don't initialize twice
    if (initializedRef.current) {
      return;
    }

    const initChatbot = () => {
      // Check if container exists
      const containerElement = document.querySelector(container);
      if (!containerElement) {
        console.warn(`Chatbot container not found: ${container}`);
        return;
      }

      // Check if script is loaded
      if (window.initializeEducoreBot) {
        try {
          window.initializeEducoreBot({
            microservice: "LEARNER_AI", // LearnerAI microservice name
            userId: userId,
            token: token,
            tenantId: tenantId,
            container: container
          });
          initializedRef.current = true;
          console.log('✅ Chatbot initialized successfully');
        } catch (error) {
          console.error('❌ Failed to initialize chatbot:', error);
        }
      } else {
        // Script not loaded yet, try again
        if (!scriptLoadedRef.current) {
          loadScript();
        } else {
          // Script loaded but function not available, retry after delay
          setTimeout(initChatbot, 100);
        }
      }
    };

    const loadScript = () => {
      // Check if script already loaded (using EDUCORE_BOT_LOADED flag from guide)
      if (window.EDUCORE_BOT_LOADED || document.querySelector('script[src*="bot.js"]')) {
        scriptLoadedRef.current = true;
        // Script exists, wait for it to load
        setTimeout(initChatbot, 100);
        return;
      }

      // Load the script
      const script = document.createElement('script');
      script.src = 'https://rag-production-3a4c.up.railway.app/embed/bot.js';
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        window.EDUCORE_BOT_LOADED = true; // Set flag as per guide
        console.log('✅ Chatbot script loaded');
        initChatbot();
      };
      script.onerror = () => {
        console.error('❌ Failed to load chatbot script');
      };
      document.head.appendChild(script);
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadScript);
    } else {
      loadScript();
    }

    // Cleanup function
    return () => {
      // Note: We don't remove the script or widget on cleanup
      // as it might be used by other components
    };
  }, [userId, token, tenantId, container, enabled]);
}

export default useChatbot;

