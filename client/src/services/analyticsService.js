/**
 * Simple analytics service to track user actions
 */
const trackEvent = (eventName, eventParams = {}) => {
  try {
    // Only track if gtag is available
    if (window.gtag) {
      window.gtag('event', eventName, eventParams);
      console.log('Event tracked:', eventName, eventParams);
    }
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

// Pre-defined event tracking functions
const analytics = {
  // Track page views
  trackPageView: (pageName) => {
    trackEvent('page_view', { page_title: pageName });
  },

  // Track image uploads
  trackImageUpload: (status, fileSize) => {
    trackEvent('image_upload', { 
      status, 
      file_size: fileSize 
    });
  },

  // Track conversions
  trackConversion: (status, timing) => {
    trackEvent('image_conversion', { 
      status, 
      processing_time: timing 
    });
  },

  // Track payment events
  trackPayment: (plan, status) => {
    trackEvent('payment', { 
      plan, 
      status 
    });
  },

  // Track errors
  trackError: (errorType, errorMessage) => {
    trackEvent('app_error', { 
      error_type: errorType, 
      error_message: errorMessage 
    });
  }
};

export default analytics; 