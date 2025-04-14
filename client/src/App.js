// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './minecraft.css';
import ImageUpload from './components/ImageUpload';
import ErrorMessage from './components/ErrorMessage';
import analytics from './services/analyticsService';

const API_URL = process.env.REACT_APP_API_URL;

function AppContent() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [pendingImage, setPendingImage] = useState(null); // Store the image waiting for conversion
  const [isConverting, setIsConverting] = useState(false);
  const [convertedImage, setConvertedImage] = useState(null);
  const [error, setError] = useState('');
  const [userCredits, setUserCredits] = useState(0); // Track user's photo conversion credits
  const [hasUsedFreeConversion, setHasUsedFreeConversion] = useState(
    localStorage.getItem('hasUsedFreeConversion') === 'true'
  ); // Track if the user has used their free conversion
  const location = useLocation();
  const navigate = useNavigate();

  // Check for successful payment on redirect
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const sessionId = query.get('session_id');
    
    // Only proceed if we have a valid session ID that's not the placeholder
    if (sessionId && sessionId !== '{CHECKOUT_SESSION_ID}' && sessionId.length > 10) {
      console.log('Verifying payment with session ID:', sessionId);
      
      fetch(`${API_URL}/api/stripe/session/${sessionId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Server returned ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          if (data.success) {
            setUserCredits(prev => prev + parseInt(data.quantity || 0));
            setError('');
            // If there's a pending image, convert it now that credits are available
            if (pendingImage) {
              handleImageConversion(pendingImage);
            }
            navigate('/success');
          } else {
            setError('Payment verification failed. Please try again.');
            navigate('/cancel');
          }
        })
        .catch(err => {
          console.error('Payment verification error:', err);
          setError('Error verifying payment: ' + err.message);
          navigate('/cancel');
        });
    }
  }, [location, navigate, pendingImage]);

  useEffect(() => {
    analytics.trackPageView('home');
  }, []);

  useEffect(() => {
    console.log('Current location:', location.pathname, location.search);
  }, [location]);

  const handleError = (errorType, errorMessage) => {
    analytics.trackError(errorType, errorMessage);
    setError(errorMessage);
  };

  const handleImageSelect = async (file, errorMessage) => {
    if (errorMessage) {
      handleError('upload', errorMessage);
      setIsConverting(false);
      return;
    }

    if (!(file instanceof File)) {
      setError('Invalid file. Please upload a valid image.');
      setIsConverting(false);
      return;
    }

    analytics.trackImageUpload('success', file.size);
    setUploadedImage(file);
    setError('');
    setConvertedImage(null);

    // Check if the user has used their free conversion and has credits
    if (!hasUsedFreeConversion || userCredits > 0) {
      // Proceed with conversion
      handleImageConversion(file);
    } else {
      // Show preview screen and prompt for payment
      setPendingImage(file);
      // Removed error message as per request
    }
  };

  const handleImageConversion = async (file) => {
    setIsConverting(true);
    setPendingImage(null); // Clear pending image since we're converting it

    const startTime = Date.now();

    try {
      const reader = new FileReader();
      const base64Image = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
      });

      const response = await fetch(`${API_URL}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          prompt: 'Provide a concise description of the main subject in this image as a Minecraft character with blocky, pixelated features, cubic limbs, and a simplified color palette. Include specific details about their appearance, clothing, accessories, and any objects they are holding or interacting with. Focus on the subject and their immediate surroundings. Do not provide instructions, steps, or general advice.',
          size: '1024x1024'
        }),
      });

      const data = await response.json();
      console.log('Client received:', JSON.stringify(data, null, 2));

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to convert image');
      }

      setConvertedImage(data.url);
      if (!hasUsedFreeConversion) {
        setHasUsedFreeConversion(true);
        localStorage.setItem('hasUsedFreeConversion', 'true');
      } else {
        setUserCredits(prev => prev - 1); // Deduct 1 credit per conversion
      }

      analytics.trackConversion('success', Date.now() - startTime);
    } catch (err) {
      console.error('Conversion error:', err);
      setError('Failed to convert image. Please try again.');
      analytics.trackConversion('error', Date.now() - startTime);
    } finally {
      setIsConverting(false);
    }
  };

  const handlePurchase = async (plan) => {
    console.log('handlePurchase called with plan:', plan);
    try {
      analytics.trackPayment(plan, 'initiated');
      console.log('Initiating payment for plan:', plan);
      
      // Before redirecting to Stripe, set the previousPage to the current location
      sessionStorage.setItem('previousPage', location.pathname);
      console.log('Session storage set to:', sessionStorage.getItem('previousPage'));
      
      const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();
      console.log('Received response from server:', data);
      if (data.success && data.url) {
        console.log('Redirecting to Stripe Checkout URL:', data.url);
        // Use window.location.href for external Stripe redirect
        window.location.href = data.url;
        analytics.trackPayment(data.plan, 'completed');
      } else {
        console.error('Failed to initiate payment:', data.error);
        setError('Failed to initiate payment. Please try again.');
      }
    } catch (err) {
      console.error('Error initiating payment:', err.message);
      setError('Error initiating payment: ' + err.message);
    }
  };

  // In the useEffect for back navigation, add console logs to track the previousPage
  useEffect(() => {
    console.log('Navigation effect triggered:', {
      currentPath: window.location.pathname,
      previousPage: sessionStorage.getItem('previousPage'),
      historyLength: window.history.length,
      search: window.location.search
    });
    
    const previousPage = sessionStorage.getItem('previousPage');
    if (previousPage) {
      console.log('Navigating back to:', previousPage);
      navigate(previousPage);
      sessionStorage.removeItem('previousPage');
    }
  }, [navigate]);

  // General route change listener
  useEffect(() => {
    console.log('Route changed:', {
      path: location.pathname,
      previousPage: sessionStorage.getItem('previousPage'),
      historyLength: window.history.length
    });
  }, [location]);

  const handleGoBackToHome = () => {
    console.log('handleGoBackToHome called');
    setUploadedImage(null);
    setConvertedImage(null);
    setPendingImage(null);
    setError('');
  };

  const handleRetryWithAnotherPicture = () => {
    console.log('handleRetryWithAnotherPicture called');
    setUploadedImage(null);
    setConvertedImage(null);
    setPendingImage(null);
    setError('');
  };

  const handleGoBack = () => {
    console.log('Navigating back');
    navigate(-1);
  };

  const examplePairs = [
    { before: '/examples/input1.png', after: '/examples/output1.png' },
    { before: '/examples/input2.png', after: '/examples/output2.png' },
    { before: '/examples/input3.png', after: '/examples/output3.png' }
  ];

  return (
    <div className="stone-bg" style={{ minHeight: '100vh', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
      <Routes>
        <Route path="/success" element={
          <div className="grass-top" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <h1 className="minecraft-text" style={{ fontSize: '48px', marginBottom: '30px', color: '#FFFFFF' }}>
              Payment Successful!
            </h1>
            <p style={{ fontSize: '20px', marginBottom: '30px', color: '#FFFFFF' }}>
              Your credits have been added. You now have {userCredits} credits to convert photos!
            </p>
            <button
              className="minecraft-btn minecraft-text"
              onClick={() => {
                console.log('Convert a Photo button clicked (success page)');
                navigate('/');
              }}
              style={{ backgroundColor: '#4CAF50', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
            >
              Convert a Photo
            </button>
          </div>
        } />
        <Route path="/cancel" element={
          <div className="grass-top" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <h1 className="minecraft-text" style={{ fontSize: '48px', marginBottom: '30px', color: '#FFFFFF' }}>
              Payment Cancelled
            </h1>
            <p style={{ fontSize: '20px', marginBottom: '30px', color: '#FFFFFF' }}>
              Your payment was cancelled. Please try again or contact support if you need assistance.
            </p>
            <button
              className="minecraft-btn minecraft-text"
              onClick={() => {
                console.log('Try Again button clicked (cancel page)');
                navigate('/');
              }}
              style={{ backgroundColor: '#4CAF50', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
            >
              Try Again
            </button>
          </div>
        } />
        
        <Route path="/" element={
          <>
            {/* *** TEMPORARILY REPLACE ALL CONTENT WITH THIS *** */}
            <div style={{padding: "50px", textAlign: "center"}}>
                <h1 className="minecraft-text">TEST PAGE</h1>
                <p>If you see this, React rendered.</p>
            </div>
            {/* *** END TEMPORARY REPLACEMENT *** */}
          </>
        } />
      </Routes>

    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;