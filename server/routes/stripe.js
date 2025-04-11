// routes/stripe.js
const express = require('express');
const router = express.Router();
const { createError } = require('../utils/errors');
const logger = require('../utils/logger');
const stripeConfig = require('../config/stripe');

// Get Stripe instance and plans from config
const { stripe, plans, isProduction, getMetadata } = stripeConfig;

/**
 * POST /api/stripe/create-checkout-session
 * Creates a Stripe checkout session
 */
router.post('/create-checkout-session', async (req, res) => {
  const startTime = Date.now();
  const { plan } = req.body; // e.g., "starter", "value", "family"

  // Validate plan
  if (!plan || !plans[plan]) {
    logger.warn('Invalid plan requested', { plan });
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid plan. Available plans: starter, value, family' 
    });
  }

  try {
    logger.info('Creating Stripe checkout session', { 
      plan,
      isProduction,
      environment: process.env.NODE_ENV
    });
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Pack`,
              description: `Access to convert ${plans[plan].quantity} photos to Minecraft style`,
            },
            unit_amount: plans[plan].price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}`,
      metadata: getMetadata('{CHECKOUT_SESSION_ID}', plan),
    });

    // Log success and processing time
    logger.trackPayment(session.id, plan, 'created');
    logger.info('Checkout session created', { 
      sessionId: session.id, 
      processingTime: Date.now() - startTime,
      environment: isProduction ? 'production' : 'development'
    });

    // Return the session URL for redirection
    res.json({ 
      success: true, 
      url: session.url,
      plan
    });
  } catch (error) {
    logger.error('Error creating Stripe Checkout Session', {
      plan,
      error: error.message,
      processingTime: Date.now() - startTime,
      environment: isProduction ? 'production' : 'development'
    });
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create checkout session: ' + error.message 
    });
  }
});

/**
 * GET /api/stripe/session/:sessionId
 * Verifies a payment session
 */
router.get('/session/:sessionId', async (req, res) => {
  const startTime = Date.now();
  const { sessionId } = req.params;

  // Validate sessionId
  if (!sessionId || sessionId === '{CHECKOUT_SESSION_ID}') {
    logger.warn('Invalid session ID provided', { sessionId });
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid session ID' 
    });
  }

  try {
    logger.info('Retrieving session', { 
      sessionId,
      isProduction,
      environment: process.env.NODE_ENV 
    });
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      logger.warn('Session not found', { sessionId });
      return res.status(404).json({ 
        success: false, 
        error: 'Session not found' 
      });
    }

    if (session.payment_status !== 'paid') {
      logger.warn('Session not paid', { 
        sessionId, 
        status: session.payment_status 
      });
      return res.status(400).json({ 
        success: false, 
        error: 'Payment not completed' 
      });
    }

    // Get the plan information from metadata or line items
    const plan = session.metadata?.plan || '';
    const quantity = plans[plan]?.quantity || 0;

    logger.trackPayment(session.id, plan, 'verified');
    logger.info('Payment verification successful', { 
      sessionId, 
      plan,
      processingTime: Date.now() - startTime 
    });
    
    // Return credits information
    res.json({ 
      success: true, 
      quantity, 
      plan 
    });
  } catch (error) {
    logger.error('Error retrieving Stripe Session', {
      sessionId,
      error: error.message,
      processingTime: Date.now() - startTime
    });
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify payment: ' + error.message 
    });
  }
});

module.exports = router;