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
      // Check if container exists - retry if not found
      const containerElement = document.querySelector(container);
      if (!containerElement) {
        console.warn(`Chatbot container not found: ${container}, retrying...`);
        // Retry after a short delay to allow React to render the container
        setTimeout(initChatbot, 200);
        return;
      }

      // Check if script is loaded
      if (window.initializeEducoreBot) {
        try {
          // Check if widget already exists in container (prevent double initialization)
          const existingWidget = containerElement.querySelector('[class*="chat"], [class*="bot"], [id*="chat"], [id*="bot"]');
          if (existingWidget && initializedRef.current) {
            console.log('✅ Chatbot already initialized');
            return;
          }

          window.initializeEducoreBot({
            microservice: "LEARNER_AI", // LearnerAI microservice name
            userId: userId,
            token: token,
            tenantId: tenantId || userId, // Use userId as tenantId if tenantId not provided
            container: container
          });
          initializedRef.current = true;
          console.log('✅ Chatbot initialized successfully', { userId, tenantId, container });
        } catch (error) {
          console.error('❌ Failed to initialize chatbot:', error);
          initializedRef.current = false; // Allow retry on error
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

    // Wait a bit for React to render the container, then initialize
    // Use requestAnimationFrame to ensure DOM is ready
    const initializeWhenReady = () => {
      requestAnimationFrame(() => {
        // Small delay to ensure container is rendered
        setTimeout(() => {
          loadScript();
        }, 100);
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeWhenReady);
    } else {
      initializeWhenReady();
    }

    // Cleanup function
    return () => {
      // Note: We don't remove the script or widget on cleanup
      // as it might be used by other components
    };
  }, [userId, token, tenantId, container, enabled]);
}

export default useChatbot;

