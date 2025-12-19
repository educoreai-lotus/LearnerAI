import { useEffect } from "react";
import { getCurrentUser, getAuthToken, getUrlParams } from "../utils/auth";

/**
 * RAGChatbotInitializer
 * 
 * Side-effect only component that initializes the Educore RAG Chatbot.
 * 
 * The bot script is loaded in index.html, this component only handles initialization.
 * 
 * Rules:
 * - Only initializes after user authentication (userId + token exist)
 * - Uses exact container ID: edu-bot-container
 * - Uses exact microservice name: LEARNER_AI
 * - Retries until user is authenticated and script is loaded
 * - No UI, no state, side-effect only
 */
export default function RAGChatbotInitializer() {
  useEffect(() => {
    /**
     * Get current authenticated user
     * Checks localStorage first, then URL params as fallback
     */
    function getCurrentUserData() {
      // Try localStorage first
      const userProfile = getCurrentUser();
      const token = getAuthToken();
      
      if (userProfile?.id && token) {
        console.log("🔍 RAG Bot: Found user in localStorage:", {
          userId: userProfile.id,
          hasToken: !!token,
          tenantId: userProfile.tenantId || userProfile.company_id
        });
        return {
          userId: userProfile.id,
          token: token,
          tenantId: userProfile.tenantId || userProfile.company_id || "default"
        };
      }
      
      // Fallback: Check URL params (for local dev when user_id is in URL)
      const urlParams = getUrlParams();
      if (urlParams.user_id) {
        console.log("🔍 RAG Bot: Found user_id in URL params:", urlParams.user_id);
        // Use mock token for local development if no token in URL
        const mockToken = urlParams.token || "mock-token-for-local-development";
        return {
          userId: urlParams.user_id,
          token: mockToken,
          tenantId: urlParams.company_id || "default"
        };
      }
      
      console.log("⚠️ RAG Bot: No user found - checking localStorage and URL params");
      return null;
    }

    /**
     * Initialize chatbot
     */
    function initChatbot() {
      // Check if container exists
      const container = document.querySelector("#edu-bot-container");
      if (!container) {
        console.warn("⚠️ RAG Bot: Container #edu-bot-container not found in DOM");
        setTimeout(initChatbot, 200); // Retry after 200ms
        return;
      }
      
      const user = getCurrentUserData();
      
      // Wait for user authentication
      if (!user || !user.userId || !user.token) {
        console.log("⏳ RAG Bot: Waiting for user authentication...", {
          hasUser: !!user,
          hasUserId: !!(user?.userId),
          hasToken: !!(user?.token)
        });
        setTimeout(initChatbot, 500); // Retry after 500ms
        return;
      }
      
      // Wait for script to load
      if (!window.initializeEducoreBot) {
        console.log("⏳ RAG Bot: Waiting for script to load...", {
          scriptLoaded: !!window.EDUCORE_BOT_LOADED,
          initFunctionExists: typeof window.initializeEducoreBot === "function"
        });
        setTimeout(initChatbot, 100); // Retry after 100ms
        return;
      }
      
      // Prevent double initialization
      if (window.EDUCORE_BOT_INITIALIZED) {
        console.log("ℹ️ RAG Bot: Already initialized, skipping");
        return;
      }
      
      console.log("✅ RAG Bot: Initializing with:", {
        microservice: "LEARNER_AI",
        userId: user.userId,
        hasToken: !!user.token,
        tenantId: user.tenantId,
        containerExists: !!container
      });
      
      try {
        window.initializeEducoreBot({
          microservice: "LEARNER_AI",
          userId: user.userId,
          token: user.token,
          tenantId: user.tenantId,
          container: "#edu-bot-container"
        });
        
        window.EDUCORE_BOT_INITIALIZED = true;
        console.log("✅ RAG Bot: Initialized successfully!");
        
        // Verify widget was created and is visible after a delay
        setTimeout(() => {
          const widget = container.querySelector('[class*="chat"], [class*="bot"], [id*="chat"], [id*="bot"], iframe, button, [id*="edu-bot"]');
          if (widget) {
            const styles = window.getComputedStyle(widget);
            const rect = widget.getBoundingClientRect();
            console.log("✅ RAG Bot: Widget found in DOM:", widget);
            console.log("   Widget visibility:", {
              display: styles.display,
              visibility: styles.visibility,
              opacity: styles.opacity,
              position: styles.position,
              zIndex: styles.zIndex,
              bottom: styles.bottom,
              right: styles.right,
              width: rect.width,
              height: rect.height,
              isVisible: rect.width > 0 && rect.height > 0 && styles.display !== 'none' && styles.visibility !== 'hidden' && parseFloat(styles.opacity) > 0
            });
            
            // Check for floating button specifically
            const button = widget.querySelector('button, [role="button"], [class*="float"], [class*="button"], [class*="chat-button"]');
            if (button) {
              const buttonStyles = window.getComputedStyle(button);
              const buttonRect = button.getBoundingClientRect();
              console.log("✅ RAG Bot: Floating button found:", {
                element: button,
                display: buttonStyles.display,
                visibility: buttonStyles.visibility,
                position: buttonStyles.position,
                bottom: buttonStyles.bottom,
                right: buttonStyles.right,
                zIndex: buttonStyles.zIndex,
                width: buttonRect.width,
                height: buttonRect.height,
                isVisible: buttonRect.width > 0 && buttonRect.height > 0
              });
            } else {
              console.warn("⚠️ RAG Bot: Floating button not found in widget");
              console.log("   Widget children:", Array.from(widget.children).map(c => ({
                tag: c.tagName,
                id: c.id,
                classes: c.className,
                display: window.getComputedStyle(c).display
              })));
            }
          } else {
            console.warn("⚠️ RAG Bot: Widget not found in container after initialization");
            console.log("   Container HTML:", container.innerHTML);
            console.log("   Container children:", Array.from(container.children));
          }
        }, 3000); // Increased delay to 3 seconds
      } catch (error) {
        console.error("❌ RAG Bot: Initialization failed:", error);
        console.error("   Error details:", error.message, error.stack);
      }
    }

    // Debug: Check initial state
    const scriptTag = document.querySelector('script[src*="bot.js"]');
    console.log("🔍 RAG Bot: Initializer mounted", {
      containerExists: !!document.querySelector("#edu-bot-container"),
      scriptTagExists: !!scriptTag,
      scriptLoaded: !!window.EDUCORE_BOT_LOADED,
      initFunctionExists: typeof window.initializeEducoreBot === "function",
      documentReady: document.readyState,
      scriptSrc: scriptTag?.src
    });
    
    // If script tag doesn't exist, it means index.html didn't load it
    // This shouldn't happen, but let's log it
    if (!scriptTag) {
      console.error("❌ RAG Bot: Script tag not found! Check index.html");
    }

    // Start initialization
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initChatbot);
    } else {
      // Small delay to ensure container is rendered
      setTimeout(initChatbot, 100);
    }
  }, []); // Run once on mount

  // Side-effect only component - no UI
  return null;
}

