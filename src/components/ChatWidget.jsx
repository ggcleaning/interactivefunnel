import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ChatWidget = () => {
    const location = useLocation();

    useEffect(() => {
        // Only load the widget if we are NOT on the quote pages where calculators/lead intake exist
        const isExcludedPage = location.pathname.includes('/quote') || location.pathname.includes('/commercial-intake');
        
        let scriptTag = null;
        const widgetId = "69e6677405186111edc71707";

        if (!isExcludedPage) {
            // Check if it already exists
            const existingScript = document.querySelector(`script[data-widget-id="${widgetId}"]`);
            if (!existingScript) {
                scriptTag = document.createElement('script');
                scriptTag.src = "https://widgets.leadconnectorhq.com/loader.js";
                scriptTag.setAttribute('data-resources-url', "https://widgets.leadconnectorhq.com/chat-widget/loader.js");
                scriptTag.setAttribute('data-widget-id', widgetId);
                scriptTag.async = true;
                document.head.appendChild(scriptTag);
            } else {
                // If the script exists, we might need to show the chat bubble if it was previously hidden
                const chatWidgetContainer = document.querySelector('chat-widget');
                if (chatWidgetContainer) {
                   chatWidgetContainer.style.display = 'block';
                }
            }
        } else {
            // Hide the widget if we explicitly navigate to a forbidden page
            const chatWidgetContainer = document.querySelector('chat-widget');
            if (chatWidgetContainer) {
                chatWidgetContainer.style.display = 'none';
            }
        }

        return () => {
           // Cleanup is tricky with embedded scripts that inject custom elements, 
           // but we handle visibility toggling above to keep it clean between route changes.
        };
    }, [location.pathname]);

    return null; // This component doesn't render anything visible directly
};

export default ChatWidget;
