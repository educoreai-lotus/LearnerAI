import { useEffect, useState } from 'react';

/**
 * useChatbot Hook
 * Initializes the EDUCORE chatbot widget
 * 
 * @param {Object} config - Configuration object
 * @param {string} config.userId - User ID (required)
 * @param {string} config.token - Authentication token (optional, defaults to userId if not provided)
 * @param {string} config.tenantId - Tenant ID (optional, defaults to "default")
 * @param {string} config.microservice - Microservice name (defaults to "LEARNERAI")
 * @param {string} config.container - Container selector (defaults to "#edu-bot-container")
 * @param {string} config.ragBackendUrl - RAG backend URL (defaults to Railway production)
 */
export function useChatbot({
  userId,
  token = null,
  tenantId = 'default',
  microservice = 'LEARNERAI',
  container = '#edu-bot-container',
  ragBackendUrl = 'https://rag-production-3a4c.up.railway.app'
} = {}) {
  const [botInitialized, setBotInitialized] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Don't initialize if no userId
    if (!userId) {
      console.log('useChatbot: No userId provided, skipping initialization');
      return;
    }

    // Use userId as token if token not provided (temporary solution until auth is implemented)
    const authToken = token || userId;

    // Check if script is already loaded globally
    if (window.EDUCORE_BOT_LOADED) {
      setScriptLoaded(true);
      // Script already loaded, just initialize
      if (window.initializeEducoreBot && !botInitialized) {
        try {
          window.initializeEducoreBot({
            microservice: microservice.toUpperCase(),
            userId: userId,
            token: authToken,
            tenantId: tenantId,
            container: container
          });
          setBotInitialized(true);
          console.log('✅ EDUCORE Bot initialized');
        } catch (error) {
          console.error('❌ Failed to initialize EDUCORE Bot:', error);
        }
      }
    } else {
      // Load script first
      const script = document.createElement('script');
      script.src = `${ragBackendUrl}/embed/bot.js`;
      script.async = true;
      script.onload = () => {
        setScriptLoaded(true);
        // Wait a bit for the script to set up window.initializeEducoreBot
        setTimeout(() => {
          if (window.initializeEducoreBot && !botInitialized) {
            try {
              window.initializeEducoreBot({
                microservice: microservice.toUpperCase(),
                userId: userId,
                token: authToken,
                tenantId: tenantId,
                container: container
              });
              setBotInitialized(true);
              console.log('✅ EDUCORE Bot initialized');
            } catch (error) {
              console.error('❌ Failed to initialize EDUCORE Bot:', error);
            }
          }
        }, 100);
      };
      script.onerror = () => {
        console.error('❌ Failed to load chatbot script from:', script.src);
      };
      document.head.appendChild(script);

      // Cleanup function
      return () => {
        // Remove script if component unmounts (optional)
        // Note: We don't remove it if it's already loaded globally
        if (!window.EDUCORE_BOT_LOADED && script.parentNode) {
          script.parentNode.removeChild(script);
        }
        // Destroy bot if function exists
        if (window.destroyEducoreBot) {
          window.destroyEducoreBot();
        }
      };
    }
  }, [userId, token, tenantId, microservice, container, ragBackendUrl, botInitialized, scriptLoaded]);

  return {
    botInitialized,
    scriptLoaded
  };
}

