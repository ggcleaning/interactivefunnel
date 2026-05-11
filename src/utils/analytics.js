/**
 * Centralized analytics utility for G&G Cleaning Services.
 * Handles event tracking for Microsoft Clarity and other future platforms.
 */

/**
 * Sends a custom event to Microsoft Clarity.
 * @param {string} eventName - The name of the event (e.g., 'quote_started')
 * @param {Object} properties - Optional key-value pairs for additional event data
 */
export const clarityEvent = (eventName, properties = {}) => {
  if (window.clarity) {
    try {
      // Clarity custom events use window.clarity("event", "eventName")
      window.clarity("event", eventName);
      
      if (Object.keys(properties).length > 0) {
        // Set custom properties if supported
        Object.entries(properties).forEach(([key, value]) => {
          window.clarity("set", key, String(value));
        });
      }
    } catch (error) {
      console.warn('Error sending Clarity event:', error);
    }
  } else {
    // Fail silently in production, log in development
    if (import.meta.env.DEV) {
      console.log(`[Clarity Mock] Event: ${eventName}`, properties);
    }
  }
};

/**
 * Alias for clarityEvent to support legacy tracking calls
 */
export const trackEvent = clarityEvent;

/**
 * Helper for tracking funnel progress
 * @param {string} stepName 
 * @param {Object} data 
 */
export const trackFunnelStep = (stepName, data = {}) => {
  clarityEvent(`funnel_${stepName}`, data);
};
