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
            const visibilityInfo = {
              display: styles.display,
              visibility: styles.visibility,
              opacity: styles.opacity,
              position: styles.position,
              zIndex: styles.zIndex,
              bottom: styles.bottom,
              right: styles.right,
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left,
              isVisible: rect.width > 0 && rect.height > 0 && styles.display !== 'none' && styles.visibility !== 'hidden' && parseFloat(styles.opacity) > 0,
              isInViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth
            };
            console.log("   Widget visibility:", visibilityInfo);
            
            // If widget exists but not visible, log warning
            if (!visibilityInfo.isVisible) {
              console.warn("⚠️ RAG Bot: Widget exists but is NOT visible!", visibilityInfo);
            }
            
            // Check for floating button specifically
            const button = widget.querySelector('button, [role="button"], [class*="float"], [class*="button"], [class*="chat-button"]');
            if (button) {
              const buttonStyles = window.getComputedStyle(button);
              const buttonRect = button.getBoundingClientRect();
              const buttonInfo = {
                element: button,
                display: buttonStyles.display,
                visibility: buttonStyles.visibility,
                opacity: buttonStyles.opacity,
                position: buttonStyles.position,
                bottom: buttonStyles.bottom,
                right: buttonStyles.right,
                zIndex: buttonStyles.zIndex,
                width: buttonRect.width,
                height: buttonRect.height,
                top: buttonRect.top,
                left: buttonRect.left,
                isVisible: buttonRect.width > 0 && buttonRect.height > 0 && buttonStyles.display !== 'none' && buttonStyles.visibility !== 'hidden' && parseFloat(buttonStyles.opacity) > 0,
                // For fixed elements, check if they're visible (more lenient check)
                isInViewport: buttonStyles.position === 'fixed' 
                  ? (buttonRect.top < window.innerHeight && buttonRect.left < window.innerWidth && buttonRect.bottom > 0 && buttonRect.right > 0)
                  : (buttonRect.top >= 0 && buttonRect.left >= 0 && buttonRect.bottom <= window.innerHeight && buttonRect.right <= window.innerWidth)
              };
              console.log("✅ RAG Bot: Floating button found:", buttonInfo);
              
              // If button exists but not visible, log warning
              if (!buttonInfo.isVisible) {
                console.warn("⚠️ RAG Bot: Button exists but is NOT visible!", buttonInfo);
              } else if (!buttonInfo.isInViewport) {
                console.warn("⚠️ RAG Bot: Button is visible but OUTSIDE viewport!", buttonInfo);
                console.warn("   Button position details:", {
                  top: buttonRect.top,
                  left: buttonRect.left,
                  bottom: buttonRect.bottom,
                  right: buttonRect.right,
                  width: buttonRect.width,
                  height: buttonRect.height,
                  viewportHeight: window.innerHeight,
                  viewportWidth: window.innerWidth,
                  scrollY: window.scrollY,
                  scrollX: window.scrollX,
                  distanceFromRight: window.innerWidth - buttonRect.right,
                  distanceFromBottom: window.innerHeight - buttonRect.bottom
                });
                
                // Check if button is actually visible despite viewport check
                const isActuallyVisible = (
                  buttonRect.top < window.innerHeight &&
                  buttonRect.left < window.innerWidth &&
                  buttonRect.bottom > 0 &&
                  buttonRect.right > 0
                );
                
                if (isActuallyVisible) {
                  console.log("✅ RAG Bot: Button IS actually visible (viewport check may be too strict)");
                  console.log(`   You should see the button at: right=${window.innerWidth - buttonRect.right}px, bottom=${window.innerHeight - buttonRect.bottom}px`);
                } else {
                  console.warn("   Button is truly outside viewport. Check for CSS issues or parent transforms.");
                }
              } else {
                console.log("✅ RAG Bot: Button is visible and in viewport - you should see it!");
                console.log(`   Location: bottom-right corner (${buttonRect.right}px from right, ${window.innerHeight - buttonRect.bottom}px from bottom)`);
              }
            } else {
              console.warn("⚠️ RAG Bot: Floating button not found in widget");
              console.log("   Widget children:", Array.from(widget.children).map(c => ({
                tag: c.tagName,
                id: c.id,
                classes: c.className,
                display: window.getComputedStyle(c).display
              })));
            }
            
            // Check for chat panel (might be auto-opened)
            const panel = widget.querySelector('[class*="panel"], [class*="chat-panel"], [class*="dialog"], [role="dialog"]');
            if (panel) {
              const panelStyles = window.getComputedStyle(panel);
              const panelRect = panel.getBoundingClientRect();
              console.log("📋 RAG Bot: Chat panel found:", {
                display: panelStyles.display,
                visibility: panelStyles.visibility,
                position: panelStyles.position,
                width: panelRect.width,
                height: panelRect.height,
                bottom: panelStyles.bottom,
                right: panelStyles.right,
                zIndex: panelStyles.zIndex,
                isVisible: panelRect.width > 0 && panelRect.height > 0
              });
            } else {
              console.log("ℹ️ RAG Bot: Chat panel not found (button-only mode)");
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
    
    // Add global debug helper function
    window.debugRAGBot = function() {
      const container = document.querySelector("#edu-bot-container");
      if (!container) {
        console.log("❌ Container not found");
        return;
      }
      
      const widget = container.querySelector('[id*="edu-bot"]');
      if (!widget) {
        console.log("❌ Widget not found in container");
        console.log("Container HTML:", container.innerHTML);
        return;
      }
      
      const styles = window.getComputedStyle(widget);
      const rect = widget.getBoundingClientRect();
      
      console.log("🔍 RAG Bot Debug Info:");
      console.log("  Container:", container);
      console.log("  Widget:", widget);
      console.log("  Widget ID:", widget.id);
      console.log("  Widget classes:", widget.className);
      console.log("  Position:", styles.position);
      console.log("  Display:", styles.display);
      console.log("  Visibility:", styles.visibility);
      console.log("  Opacity:", styles.opacity);
      console.log("  Z-index:", styles.zIndex);
      console.log("  Bottom:", styles.bottom);
      console.log("  Right:", styles.right);
      console.log("  Size:", `${rect.width}x${rect.height}`);
      console.log("  Location:", `(${rect.left}, ${rect.top})`);
      console.log("  Viewport:", `${window.innerWidth}x${window.innerHeight}`);
      console.log("  Is visible:", rect.width > 0 && rect.height > 0);
      console.log("  Is in viewport:", rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth);
      
      // Find all interactive elements
      const buttons = widget.querySelectorAll('button, [role="button"]');
      const panels = widget.querySelectorAll('[class*="panel"], [role="dialog"]');
      
      console.log(`  Buttons found: ${buttons.length}`);
      buttons.forEach((btn, i) => {
        const btnRect = btn.getBoundingClientRect();
        const btnStyles = window.getComputedStyle(btn);
        console.log(`    Button ${i + 1}:`, {
          tag: btn.tagName,
          classes: btn.className,
          display: btnStyles.display,
          position: btnStyles.position,
          size: `${btnRect.width}x${btnRect.height}`,
          location: `(${btnRect.left}, ${btnRect.top})`,
          visible: btnRect.width > 0 && btnRect.height > 0
        });
      });
      
      console.log(`  Panels found: ${panels.length}`);
      panels.forEach((panel, i) => {
        const panelRect = panel.getBoundingClientRect();
        const panelStyles = window.getComputedStyle(panel);
        console.log(`    Panel ${i + 1}:`, {
          tag: panel.tagName,
          classes: panel.className,
          display: panelStyles.display,
          position: panelStyles.position,
          size: `${panelRect.width}x${panelRect.height}`,
          location: `(${panelRect.left}, ${panelRect.top})`,
          visible: panelRect.width > 0 && panelRect.height > 0
        });
      });
    };
  }, []); // Run once on mount

  // Side-effect only component - no UI
  return null;
}

