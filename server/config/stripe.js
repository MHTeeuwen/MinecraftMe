/**
 * Stripe configuration with test/live mode handling
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' // Set API version in options
});

// Define payment plans with test and live mode pricing
const plans = {
  starter: {
    quantity: 10,
    price: 500, // $5.00 (rounded from $4.99 to match display)
  },
  value: {
    quantity: 30,
    price: 1000, // $10.00
  },
  family: {
    quantity: 50,
    price: 1500, // $15.00
  },
};

/**
 * Get Stripe configuration based on environment
 */
function getStripeConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    stripe,
    plans,
    isProduction,
    publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    // In production, add additional metadata for tracking
    getMetadata: (sessionId, plan) => {
      const metadata = {
        sessionId,
        plan,
        environment: isProduction ? 'production' : 'development',
      };
      
      if (isProduction) {
        metadata.timestamp = new Date().toISOString();
      }
      
      return metadata;
    }
  };
}

module.exports = getStripeConfig(); 