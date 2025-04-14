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

  // <<< LOGGING >>>: Log component render/re-render
  console.log('[AppContent] Component rendering or re-rendering. Location:', location.pathname + location.search);

  // Check for successful payment on redirect
  useEffect(() => {
    // <<< LOGGING >>>: Log effect start and current URL
    console.log('[Payment Verification useEffect] Running. Current URL:', window.location.href);
    const query = new URLSearchParams(location.search);
    const sessionId = query.get('session_id');

    // <<< LOGGING >>>: Log query params check and extracted session_id
    console.log('[Payment Verification useEffect] Checking for session_id in query:', location.search);
    console.log('[Payment Verification useEffect] Found session_id:', sessionId);

    // Only proceed if we have a valid session ID that's not the placeholder
    if (sessionId && sessionId !== '{CHECKOUT_SESSION_ID}' && sessionId.length > 10) {
      // <<< LOGGING >>>: Log verification initiation
      console.log('[Payment Verification useEffect] Valid session_id found. Proceeding with verification for:', sessionId);

      fetch(`${API_URL}/api/stripe/session/${sessionId}`)
        .then(res => {
          // <<< LOGGING >>>: Log fetch status
          console.log('[Payment Verification useEffect] Fetch response status:', res.status);
          if (!res.ok) {
            // <<< LOGGING >>>: Log error before throwing
            console.error(`[Payment Verification useEffect] Server error status: ${res.status} ${res.statusText}`);
            throw new Error(`Server returned ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          // <<< LOGGING >>>: Log API response data
          console.log('[Payment Verification useEffect] Verification API response data:', data);
          if (data.success) {
            // <<< LOGGING >>>: Log success path
            console.log('[Payment Verification useEffect] Payment success. Updating credits and potentially converting.');
            setUserCredits(prev => prev + parseInt(data.quantity || 0));
            setError('');
            // If there's a pending image, convert it now that credits are available
            if (pendingImage) {
              // <<< LOGGING >>>: Log pending image conversion start
              console.log('[Payment Verification useEffect] Pending image found, initiating conversion.');
              handleImageConversion(pendingImage); // Ensure handleImageConversion also has logs
            }
            // <<< LOGGING >>>: Log navigation on success
            console.log('[Payment Verification useEffect] Navigating to /success.');
            navigate('/success');
          } else {
            // <<< LOGGING >>>: Log verification failure via API
            console.error('[Payment Verification useEffect] Payment verification failed via API:', data.error);
            setError('Payment verification failed. Please try again.');
            // <<< LOGGING >>>: Log navigation on failure
            console.log('[Payment Verification useEffect] Navigating to /cancel due to verification failure.');
            navigate('/cancel');
          }
        })
        .catch(err => {
          // <<< LOGGING >>>: Log any fetch/processing error
          console.error('[Payment Verification useEffect] Payment verification fetch/processing error:', err);
          setError('Error verifying payment: ' + err.message);
          // <<< LOGGING >>>: Log navigation on error
          console.log('[Payment Verification useEffect] Navigating to /cancel due to error.');
          navigate('/cancel');
        });
    } else {
        // <<< LOGGING >>>: Log if no valid session_id is found
        console.log('[Payment Verification useEffect] No valid session_id found or session_id is placeholder.');
    }
  }, [location, navigate, pendingImage]); // Keep original dependencies

  // Track initial page view
  useEffect(() => {
    // <<< LOGGING >>>: Log page view tracking
    console.log('[PageView useEffect] Tracking page view for home.');
    analytics.trackPageView('home');
  }, []);

  // Original log for location change
  useEffect(() => {
    // <<< LOGGING >>>: Enhanced log for location change from React Router perspective
    console.log('[Location Change useEffect - React Router] Route changed:', {
        path: location.pathname,
        search: location.search,
        state: location.state, // Log any state passed during navigation
        previousPageInSessionStorage: sessionStorage.getItem('previousPage'), // Check session storage value at this point
        historyLength: window.history.length // Log browser history length
      });
  }, [location]); // Keep original dependency

  // <<< ADDED FOR DEBUGGING >>>: Listen for browser back/forward navigation events
  useEffect(() => {
    const handlePopState = (event) => {
      console.log('[PopState Event Listener] Detected browser navigation (back/forward).');
      console.log('[PopState Event Listener] New location (window.location):', window.location.href);
      // Log the state associated with the history entry, if any was pushed
      console.log('[PopState Event Listener] History state object (event.state):', event.state);
      // Log sessionStorage again at the moment the event fires
      console.log('[PopState Event Listener] sessionStorage previousPage at event time:', sessionStorage.getItem('previousPage'));
    };

    console.log('[AppContent Mount Effect] Adding popstate listener for debugging.');
    window.addEventListener('popstate', handlePopState);

    // Cleanup function to remove the listener when the component unmounts
    return () => {
      console.log('[AppContent Unmount Effect] Removing popstate listener.');
      window.removeEventListener('popstate', handlePopState);
    };
  }, []); // Empty dependency array: runs only on mount and cleans up on unmount


  const handleError = (errorType, errorMessage) => {
    // <<< LOGGING >>>: Log when handleError is called
    console.log('[handleError] Called with:', { errorType, errorMessage });
    analytics.trackError(errorType, errorMessage);
    setError(errorMessage);
  };

  const handleImageSelect = async (file, errorMessage) => {
    // <<< LOGGING >>>: Log function start
    console.log('[handleImageSelect] Called.');
    if (errorMessage) {
      // <<< LOGGING >>>: Log if error message provided directly
      console.error('[handleImageSelect] Error message provided:', errorMessage);
      handleError('upload', errorMessage);
      setIsConverting(false);
      return;
    }

    if (!(file instanceof File)) {
      // <<< LOGGING >>>: Log invalid file type
      console.error('[handleImageSelect] Invalid file type provided:', file);
      setError('Invalid file. Please upload a valid image.');
      setIsConverting(false);
      return;
    }

    // <<< LOGGING >>>: Log valid file selection details
    console.log('[handleImageSelect] Valid file selected:', { name: file.name, size: file.size, type: file.type });
    analytics.trackImageUpload('success', file.size);
    setUploadedImage(file);
    setError('');
    setConvertedImage(null);

    // <<< LOGGING >>>: Log check for conversion eligibility
    console.log('[handleImageSelect] Checking conversion eligibility:', { hasUsedFreeConversion, userCredits });
    // Check if the user has used their free conversion and has credits
    if (!hasUsedFreeConversion || userCredits > 0) {
      // <<< LOGGING >>>: Log decision to proceed with conversion
      console.log('[handleImageSelect] Eligible for conversion, calling handleImageConversion.');
      handleImageConversion(file);
    } else {
      // <<< LOGGING >>>: Log decision to set pending image
      console.log('[handleImageSelect] Not eligible for free conversion and no credits. Setting pending image.');
      setPendingImage(file);
      // Removed error message display as per original code
    }
  };

  const handleImageConversion = async (file) => {
    // <<< LOGGING >>>: Log conversion start and file name
    console.log('[handleImageConversion] Initiated for file:', file ? file.name : 'undefined');
    if (!file) {
        // <<< LOGGING >>>: Log error if no file provided
        console.error("[handleImageConversion] No file provided.");
        setError("Cannot convert, no image file available.");
        return;
    }
    setIsConverting(true);
    setPendingImage(null); // Clear pending image since we're converting it

    const startTime = Date.now();
    // <<< LOGGING >>>: Log start time
    console.log('[handleImageConversion] Start time:', startTime);

    try {
      const reader = new FileReader();
      // <<< LOGGING >>>: Log file reading start
      console.log('[handleImageConversion] Reading file as Data URL...');
      const base64Image = await new Promise((resolve, reject) => {
        reader.onloadend = () => {
            // <<< LOGGING >>>: Log file reading completion
            console.log('[handleImageConversion] File read complete.');
            resolve(reader.result.split(',')[1]);
        }
        reader.onerror = (error) => {
            // <<< LOGGING >>>: Log file reading error
            console.error('[handleImageConversion] FileReader error:', error);
            reject(new Error("Error reading file"));
        };
        reader.readAsDataURL(file);
      });

      // <<< LOGGING >>>: Log API request sending
      console.log('[handleImageConversion] Sending request to API:', API_URL + '/api/convert');
      const response = await fetch(`${API_URL}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image, // Be mindful if logging large base64 strings is needed/desired
          prompt: 'Provide a concise description of the main subject in this image as a Minecraft character with blocky, pixelated features, cubic limbs, and a simplified color palette. Include specific details about their appearance, clothing, accessories, and any objects they are holding or interacting with. Focus on the subject and their immediate surroundings. Do not provide instructions, steps, or general advice.',
          size: '1024x1024'
        }),
      });

      // <<< LOGGING >>>: Log API response status
      console.log('[handleImageConversion] API Response Status:', response.status);
      const data = await response.json();
      // Original console.log kept:
      console.log('Client received:', JSON.stringify(data, null, 2)); // Your original detailed log

      if (!response.ok || !data.success) {
         // <<< LOGGING >>>: Log specific error before throwing
         console.error('[handleImageConversion] API Error or Non-Success:', data.error || `Status: ${response.status}`);
        throw new Error(data.error || 'Failed to convert image');
      }

      // <<< LOGGING >>>: Log successful conversion and URL
      console.log('[handleImageConversion] Conversion successful. Received URL:', data.url);
      setConvertedImage(data.url);
      // Update usage stats
      if (!hasUsedFreeConversion) {
        // <<< LOGGING >>>: Log marking free conversion used
        console.log('[handleImageConversion] Marking free conversion as used.');
        setHasUsedFreeConversion(true);
        localStorage.setItem('hasUsedFreeConversion', 'true');
      } else {
        // <<< LOGGING >>>: Log deducting credit
        console.log('[handleImageConversion] Deducting 1 user credit.');
        setUserCredits(prev => Math.max(0, prev - 1)); // Ensure credits don't go below 0
      }

      const duration = Date.now() - startTime;
      // <<< LOGGING >>>: Log conversion duration
      console.log('[handleImageConversion] Conversion took:', duration, 'ms');
      analytics.trackConversion('success', duration);

    } catch (err) {
      // Original error logging kept:
      console.error('Conversion error:', err);
      setError('Failed to convert image. Please try again.');
      const duration = Date.now() - startTime;
      analytics.trackConversion('error', duration);
    } finally {
      // <<< LOGGING >>>: Log setting isConverting false
      console.log('[handleImageConversion] Setting isConverting to false.');
      setIsConverting(false);
    }
  };

  const handlePurchase = async (plan) => {
    // Original logs kept and enhanced:
    console.log('[handlePurchase] Initiated. Plan:', plan); // Enhanced log
    try {
      analytics.trackPayment(plan, 'initiated');
      console.log('[handlePurchase] Tracked payment initiation for plan:', plan); // Enhanced log

      const currentPagePath = location.pathname;
      // <<< LOGGING >>>: Log current path before setting session storage
      console.log('[handlePurchase] Current location.pathname:', currentPagePath);
      // Before redirecting to Stripe, set the previousPage to the current location
      sessionStorage.setItem('previousPage', currentPagePath);
      // Original log kept and enhanced:
      const storedValue = sessionStorage.getItem('previousPage');
      console.log('[handlePurchase] sessionStorage previousPage set to:', storedValue); // Enhanced log

      // <<< LOGGING >>>: Log API endpoint being called
      console.log('[handlePurchase] Sending request to create checkout session:', `${API_URL}/api/stripe/create-checkout-session`);
      const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      // <<< LOGGING >>>: Log server response status
      console.log('[handlePurchase] Server response status:', response.status);
      const data = await response.json();
      // Original log kept:
      console.log('[handlePurchase] Received response from server:', data);

      if (data.success && data.url) {
        // Original log kept:
        console.log('[handlePurchase] Redirecting to Stripe Checkout URL:', data.url);
        // Use window.location.href for external Stripe redirect
        // <<< LOGGING >>>: Explicitly log the redirect method being used
        console.log('[handlePurchase] --- Redirecting NOW using window.location.href ---');
        window.location.href = data.url;
        // Original analytics call kept: (Consider if 'completed' is the right term here vs. 'redirected')
        analytics.trackPayment(data.plan || plan, 'completed'); // Original used plan from data if available
      } else {
        // Original error log kept and enhanced:
        console.error('[handlePurchase] Failed to initiate payment (API error or no URL):', data.error || 'No error message provided.');
        setError('Failed to initiate payment. Please try again.');
      }
    } catch (err) {
      // Original error log kept and enhanced:
      console.error('[handlePurchase] Error during fetch or processing:', err);
      setError('Error initiating payment: ' + err.message);
    }
  };

  // Original useEffect for back navigation (potentially problematic, runs once on mount)
  useEffect(() => {
    // Original log kept:
    console.log('[Single Run useEffect - Potential Back Nav] Navigation effect triggered:', {
      currentPath: window.location.pathname,
      previousPage: sessionStorage.getItem('previousPage'),
      historyLength: window.history.length,
      search: window.location.search
    });

    const previousPage = sessionStorage.getItem('previousPage');
    // <<< LOGGING >>>: Add check to see if previousPage matches current path before potentially navigating
    console.log('[Single Run useEffect - Potential Back Nav] Checking previousPage:', previousPage, 'against current path:', window.location.pathname);
    if (previousPage && previousPage !== window.location.pathname) { // Added check to prevent navigating to self
      // Original log kept:
      console.log('[Single Run useEffect - Potential Back Nav] Found previousPage in sessionStorage:', previousPage, '- Navigating now.');
      // navigate(previousPage); // Original navigation logic - KEEP COMMENTED OUT FOR NOW based on previous analysis
      // sessionStorage.removeItem('previousPage'); // Original removal logic
    } else if (previousPage && previousPage === window.location.pathname) {
        // <<< LOGGING >>>: Log if navigation is skipped because paths match
        console.log('[Single Run useEffect - Potential Back Nav] previousPage matches current path. Navigation skipped by this effect.');
        // sessionStorage.removeItem('previousPage'); // Decide if you should still remove it here
    } else {
        // <<< LOGGING >>>: Log if no previousPage found
        console.log('[Single Run useEffect - Potential Back Nav] No previousPage found in sessionStorage. No navigation triggered by this effect.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]); // Keep original dependency


  // Original General route change listener (now redundant with enhanced log above, but kept for consistency with original)
  useEffect(() => {
    console.log('[General Route Change Listener - Redundant Log] Route changed:', { // Marked as potentially redundant
      path: location.pathname,
      previousPage: sessionStorage.getItem('previousPage'),
      historyLength: window.history.length
    });
  }, [location]); // Keep original dependency

  const handleGoBackToHome = () => {
    // Original log kept:
    console.log('[handleGoBackToHome] called - Resetting state.'); // Enhanced log
    setUploadedImage(null);
    setConvertedImage(null);
    setPendingImage(null);
    setError('');
    // <<< LOGGING >>>: Log if navigation occurs
    if (location.pathname !== '/') {
        console.log('[handleGoBackToHome] Navigating to /');
        navigate('/');
    }
  };

  const handleRetryWithAnotherPicture = () => {
    // Original log kept:
    console.log('[handleRetryWithAnotherPicture] called - Resetting state.'); // Enhanced log
    setUploadedImage(null);
    setConvertedImage(null);
    setPendingImage(null);
    setError('');
    // <<< LOGGING >>>: Log if navigation occurs
    if (location.pathname !== '/') {
        console.log('[handleRetryWithAnotherPicture] Navigating to /');
        navigate('/');
    }
  };

  // This function was in your original code but seems unused in the provided JSX. Kept for completeness.
  const handleGoBack = () => {
    // Original log kept:
    console.log('[handleGoBack] Navigating back using navigate(-1)'); // Enhanced log
    navigate(-1);
  };

  // Original examplePairs array
  const examplePairs = [
    { before: '/examples/input1.png', after: '/examples/output1.png' },
    { before: '/examples/input2.png', after: '/examples/output2.png' },
    { before: '/examples/input3.png', after: '/examples/output3.png' }
  ];

  // Original JSX Structure
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
                // Original log kept:
                console.log('[Button Click] Convert a Photo button clicked (success page)');
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
                // Original log kept:
                console.log('[Button Click] Try Again button clicked (cancel page)');
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
            {/* Hero Section */}
            <div className="grass-top" style={{ padding: '60px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <h1 className="minecraft-text" style={{ fontSize: '48px', marginBottom: '30px', color: '#FFFFFF', lineHeight: '1.4', cursor: 'pointer' }} onClick={() => navigate('/')}>
                Turn Your Photos Into Minecraft Art!
              </h1>
              <p style={{ fontSize: '20px', marginBottom: '10px', color: '#FFFFFF', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                First conversion free! Additional conversions start at $5 for 10 photos.
              </p>
              <button
                className="minecraft-btn minecraft-text"
                onClick={() => {
                  // Original log kept:
                  console.log('[Button Click] View Pricing button clicked (header)');
                  handlePurchase('starter'); // Directly initiate purchase
                }}
                style={{ backgroundColor: '#ff8c1a', padding: '8px 16px', fontSize: '14px', marginBottom: '20px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
              >
                View Pricing
              </button>
              <p style={{ fontSize: '20px', marginBottom: '30px', color: '#FFFFFF', maxWidth: '600px', margin: '0 auto 30px', lineHeight: '1.6', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                You have {userCredits} credits remaining.
              </p>

              {convertedImage ? (
                <div style={{ marginBottom: '40px' }}>
                  <h2 className="minecraft-text" style={{ fontSize: '24px', marginBottom: '20px', color: '#FFFFFF' }}>
                    Your Minecraft Style Photo is Ready!
                  </h2>
                  {/* ... Original converted image display ... */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', maxWidth: '1200px', margin: '0 auto' }}>
                     {/* ... img tags ... */}
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px', zIndex: 1000 }}>
                    <button
                      className="minecraft-btn minecraft-text"
                      onClick={handleGoBackToHome} // Uses logged function
                      style={{ backgroundColor: '#4CAF50', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
                    >
                      Go Back to Home
                    </button>
                    <button
                      className="minecraft-btn minecraft-text"
                      onClick={handleRetryWithAnotherPicture} // Uses logged function
                      style={{ backgroundColor: '#ff8c1a', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
                    >
                      Retry with Another Picture
                    </button>
                  </div>
                  <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '4px', display: 'inline-block' }}>
                    <p style={{ fontSize: '16px', lineHeight: '1.6', textShadow: '1px 1px 0px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      Loved your Minecraft-style photo? Get more conversions with our pricing plans!
                      <button
                        className="minecraft-btn minecraft-text"
                        onClick={() => {
                          // Original log kept:
                          console.log('[Button Click] View Plans button clicked (result screen)');
                          handlePurchase('starter'); // Directly initiate purchase
                        }}
                        style={{ backgroundColor: '#ff8c1a', padding: '8px 16px', fontSize: '14px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
                      >
                        View Plans
                      </button>
                    </p>
                  </div>
                </div>
              ) : pendingImage ? (
                <div style={{ marginBottom: '40px' }}>
                  <h2 className="minecraft-text" style={{ fontSize: '24px', marginBottom: '20px', color: '#FFFFFF' }}>
                    Unlock Your Minecraft Style Photo!
                  </h2>
                  {/* ... Original pending image display ... */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', maxWidth: '1200px', margin: '0 auto' }}>
                    {/* ... img tags ... */}
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <p style={{ fontSize: '16px', marginBottom: '10px', color: '#FFFFFF', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                      Unlock this Minecraft-style image by purchasing credits!
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button
                      className="minecraft-btn minecraft-text"
                      onClick={() => {
                        // Original log kept:
                        console.log('[Button Click] Purchase Credits button clicked (preview screen)');
                        handlePurchase('starter'); // Directly initiate purchase
                      }}
                      style={{ backgroundColor: '#ff8c1a', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
                    >
                      Purchase Credits
                    </button>
                    <button
                      className="minecraft-btn minecraft-text"
                      onClick={() => {
                        // Original log kept:
                        console.log('[Button Click] Go Back button clicked (preview screen) - Resetting pending/uploaded.');
                        setPendingImage(null);
                        setUploadedImage(null);
                        setError('');
                      }}
                      style={{ backgroundColor: '#4CAF50', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
                    >
                      Go Back
                    </button>
                  </div>
                  {/* Removed error message display as per original code */}
                </div>
              ) : (
                <>
                  <ImageUpload onImageSelect={handleImageSelect} />
                  {isConverting && (
                    <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                        <div className="minecraft-text breaking">Converting your photo...</div>
                    </div>
                  )}
                  <ErrorMessage
                    message={error}
                    onClose={() => { console.log('[Error Message Close]'); setError('');} } // Added log
                  />
                </>
              )}
            </div> {/* End Hero Section div */}

            {/* Only show examples if no image is being processed */}
            {!uploadedImage && !pendingImage && !isConverting && (
              <>
                {/* How It Works */}
                <div className="dirt-bg" style={{ padding: '60px 20px', color: '#FFFFFF', textAlign: 'center' }}>
                   {/* ... Original How It Works content ... */}
                </div>

                {/* Examples Section */}
                <div className="stone-bg" style={{ padding: '60px 20px', color: '#FFFFFF', textAlign: 'center' }}>
                  {/* ... Original Examples content ... */}
                </div>

                {/* Pricing Section */}
                <div id="pricing-section" className="grass-top" style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <h2 className="minecraft-text" style={{ fontSize: '36px', marginBottom: '40px', color: '#FFFFFF', lineHeight: '1.4' }}>
                    Simple Pricing
                  </h2>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', maxWidth: '1200px', margin: '0 auto' }}>
                     {/* Starter Pack */}
                     <div className="minecraft-box stone-bg" style={{ flex: '1', minWidth: '250px', maxWidth: '300px', padding: '30px' }}>
                         {/* ... content ... */}
                        <button
                          className="minecraft-btn minecraft-text"
                          onClick={() => { console.log('[Button Click] Pricing: Starter Pack Get Started'); handlePurchase('starter'); }} // Added log
                          style={{ backgroundColor: '#ff4d4d', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
                        >
                          Get Started
                        </button>
                     </div>
                     {/* Value Pack */}
                     <div className="minecraft-box stone-bg" style={{ flex: '1', minWidth: '250px', maxWidth: '300px', padding: '30px', position: 'relative', transform: 'scale(1.05)' }}>
                         {/* ... content ... */}
                        <button
                          className="minecraft-btn minecraft-text"
                          onClick={() => { console.log('[Button Click] Pricing: Value Pack Best Value!'); handlePurchase('value'); }} // Added log
                          style={{ backgroundColor: '#ff8c1a', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
                        >
                          Best Value!
                        </button>
                     </div>
                     {/* Family Pack */}
                     <div className="minecraft-box stone-bg" style={{ flex: '1', minWidth: '250px', maxWidth: '300px', padding: '30px' }}>
                          {/* ... content ... */}
                         <button
                           className="minecraft-btn minecraft-text"
                           onClick={() => { console.log('[Button Click] Pricing: Family Pack Get Started'); handlePurchase('family'); }} // Added log
                           style={{ backgroundColor: '#4CAF50', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
                         >
                           Get Started
                         </button>
                     </div>
                  </div>
                  {/* ... Gift message ... */}
                </div>
              </>
            )}

            {/* Footer */}
            <div className="stone-bg" style={{ padding: '20px', textAlign: 'center', borderTop: '4px solid #000' }}>
              <p style={{ color: '#FFFFFF', fontSize: '14px', lineHeight: '1.6', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                Made with ❤️ for Minecraft fans everywhere
              </p>
            </div>
          </>
        } />
      </Routes>
    </div>
  );
}

// Original App wrapper component
function App() {
  // <<< LOGGING >>>: Log when the main App wrapper renders
  console.log('[App Wrapper] Rendering Router.');
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;