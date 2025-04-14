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

  console.log('[AppContent] Component rendering or re-rendering. Location:', location.pathname + location.search); // Log initial render/re-render

  // Check for successful payment on redirect
  useEffect(() => {
    console.log('[Payment Verification useEffect] Running. Current URL:', window.location.href); // Log effect start
    const query = new URLSearchParams(location.search);
    const sessionId = query.get('session_id');

    console.log('[Payment Verification useEffect] Checking for session_id in query:', location.search); // Log query params
    console.log('[Payment Verification useEffect] Found session_id:', sessionId); // Log extracted session_id

    // Only proceed if we have a valid session ID that's not the placeholder
    if (sessionId && sessionId !== '{CHECKOUT_SESSION_ID}' && sessionId.length > 10) {
      console.log('[Payment Verification useEffect] Valid session_id found. Proceeding with verification for:', sessionId);

      fetch(`${API_URL}/api/stripe/session/${sessionId}`)
        .then(res => {
          console.log('[Payment Verification useEffect] Fetch response status:', res.status); // Log fetch status
          if (!res.ok) {
            throw new Error(`Server returned ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('[Payment Verification useEffect] Verification API response data:', data); // Log API response
          if (data.success) {
            console.log('[Payment Verification useEffect] Payment success. Updating credits and potentially converting.');
            setUserCredits(prev => prev + parseInt(data.quantity || 0));
            setError('');
            // If there's a pending image, convert it now that credits are available
            if (pendingImage) {
              console.log('[Payment Verification useEffect] Pending image found, initiating conversion.');
              handleImageConversion(pendingImage);
            }
            console.log('[Payment Verification useEffect] Navigating to /success.');
            navigate('/success');
          } else {
            console.error('[Payment Verification useEffect] Payment verification failed via API:', data.error);
            setError('Payment verification failed. Please try again.');
            console.log('[Payment Verification useEffect] Navigating to /cancel due to verification failure.');
            navigate('/cancel');
          }
        })
        .catch(err => {
          console.error('[Payment Verification useEffect] Payment verification fetch/processing error:', err);
          setError('Error verifying payment: ' + err.message);
          console.log('[Payment Verification useEffect] Navigating to /cancel due to error.');
          navigate('/cancel');
        });
    } else {
        console.log('[Payment Verification useEffect] No valid session_id found or session_id is placeholder.');
    }
    // Make sure dependencies cover all necessary variables used inside
  }, [location, navigate, pendingImage, API_URL]); // Added API_URL dependency

  // Track initial page view
  useEffect(() => {
    console.log('[PageView useEffect] Tracking page view for home.');
    analytics.trackPageView('home');
  }, []);

  // Log any location change (useful for seeing React Router's perspective)
  useEffect(() => {
    console.log('[Location Change useEffect] Route changed (React Router):', {
        path: location.pathname,
        search: location.search,
        state: location.state, // Log any state passed during navigation
        previousPageInSessionStorage: sessionStorage.getItem('previousPage'),
        historyLength: window.history.length
      });
  }, [location]);

  // *** NEW: Listen for browser back/forward navigation events ***
  useEffect(() => {
    const handlePopState = (event) => {
      console.log('[PopState Event] Detected browser navigation (back/forward).');
      console.log('[PopState Event] New location (window.location):', window.location.href);
      // We can also log the state associated with the history entry, if any
      console.log('[PopState Event] History state object (event.state):', event.state);
      // Log sessionStorage again at the moment the event fires
      console.log('[PopState Event] sessionStorage previousPage at event time:', sessionStorage.getItem('previousPage'));
    };

    console.log('[AppContent Mount Effect] Adding popstate listener.');
    window.addEventListener('popstate', handlePopState);

    // Cleanup function to remove the listener when the component unmounts
    return () => {
      console.log('[AppContent Unmount Effect] Removing popstate listener.');
      window.removeEventListener('popstate', handlePopState);
    };
  }, []); // Empty dependency array: runs only on mount and cleans up on unmount


  // *** This useEffect is likely NOT doing what you intend for back navigation FROM Stripe ***
  // It runs only once on mount because `navigate` function reference is stable.
  // It might cause issues if it runs when the app loads initially at '/'.
  // Consider removing or heavily revising this based on its actual intended purpose.
  useEffect(() => {
    console.log('[Single Run useEffect - Potential Back Nav] Running ONCE on mount.');
    console.log('[Single Run useEffect - Potential Back Nav] Checking sessionStorage:', {
      currentPath: window.location.pathname, // Use window.location here as location from useLocation might not be updated yet on initial load
      previousPage: sessionStorage.getItem('previousPage'),
      historyLength: window.history.length,
      search: window.location.search
    });

    const previousPage = sessionStorage.getItem('previousPage');
    // *** CAUTION: This check might be problematic ***
    // If the user lands on '/' initially, and 'previousPage' happens to be '/',
    // this could cause an unnecessary navigation loop or unexpected behavior.
    // It definitely won't trigger when returning from Stripe via browser back button.
    if (previousPage && previousPage !== window.location.pathname) { // Added check to prevent navigating to the same page
      console.warn('[Single Run useEffect - Potential Back Nav] Found previousPage in sessionStorage:', previousPage, '- Navigating now.');
      // navigate(previousPage); // <-- Keep this commented out unless you are SURE it's needed and won't cause loops.
      // sessionStorage.removeItem('previousPage'); // Clear it if used
    } else {
        console.log('[Single Run useEffect - Potential Back Nav] No previousPage found in sessionStorage, or it matches current path. No navigation triggered by this effect.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependency array only includes navigate, which is stable. Consider removing navigate if it causes lint warnings and you understand it runs once.

  const handleError = (errorType, errorMessage) => {
    console.log('[handleError] Called with:', { errorType, errorMessage });
    analytics.trackError(errorType, errorMessage);
    setError(errorMessage);
  };

  const handleImageSelect = async (file, errorMessage) => {
    console.log('[handleImageSelect] Called.');
    if (errorMessage) {
      console.error('[handleImageSelect] Error message provided:', errorMessage);
      handleError('upload', errorMessage);
      setIsConverting(false);
      return;
    }

    if (!(file instanceof File)) {
      console.error('[handleImageSelect] Invalid file type provided:', file);
      setError('Invalid file. Please upload a valid image.');
      setIsConverting(false);
      return;
    }

    console.log('[handleImageSelect] Valid file selected:', { name: file.name, size: file.size, type: file.type });
    analytics.trackImageUpload('success', file.size);
    setUploadedImage(file);
    setError('');
    setConvertedImage(null);

    // Check credits / free conversion status
    console.log('[handleImageSelect] Checking conversion eligibility:', { hasUsedFreeConversion, userCredits });
    if (!hasUsedFreeConversion || userCredits > 0) {
      console.log('[handleImageSelect] Eligible for conversion, calling handleImageConversion.');
      handleImageConversion(file);
    } else {
      console.log('[handleImageSelect] Not eligible for free conversion and no credits. Setting pending image.');
      setPendingImage(file);
      // Removed error message as per request
    }
  };

  const handleImageConversion = async (file) => {
    console.log('[handleImageConversion] Initiated for file:', file ? file.name : 'undefined');
    if (!file) {
        console.error("[handleImageConversion] No file provided.");
        setError("Cannot convert, no image file available.");
        return;
    }

    setIsConverting(true);
    setPendingImage(null); // Clear pending image since we're converting it

    const startTime = Date.now();
    console.log('[handleImageConversion] Start time:', startTime);

    try {
      const reader = new FileReader();
      console.log('[handleImageConversion] Reading file as Data URL...');
      const base64Image = await new Promise((resolve, reject) => {
        reader.onloadend = () => {
            console.log('[handleImageConversion] File read complete.');
            resolve(reader.result.split(',')[1]);
        }
        reader.onerror = (error) => {
            console.error('[handleImageConversion] FileReader error:', error);
            reject(new Error("Error reading file"));
        };
        reader.readAsDataURL(file);
      });

      console.log('[handleImageConversion] Sending request to API:', API_URL + '/api/convert');
      const response = await fetch(`${API_URL}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          prompt: 'Provide a concise description of the main subject in this image as a Minecraft character with blocky, pixelated features, cubic limbs, and a simplified color palette. Include specific details about their appearance, clothing, accessories, and any objects they are holding or interacting with. Focus on the subject and their immediate surroundings. Do not provide instructions, steps, or general advice.',
          size: '1024x1024'
        }),
      });

      console.log('[handleImageConversion] API Response Status:', response.status);
      const data = await response.json();
      // Avoid logging the full base64 potentially returned in error messages
      console.log('[handleImageConversion] API Response Data (Success Check):', { success: data.success, url: data.url, error: data.error ? 'Error present' : 'No error field' });


      if (!response.ok || !data.success) {
        throw new Error(data.error || `Failed to convert image. Status: ${response.status}`);
      }

      console.log('[handleImageConversion] Conversion successful. Received URL:', data.url);
      setConvertedImage(data.url);

      // Update usage stats
      if (!hasUsedFreeConversion) {
        console.log('[handleImageConversion] Marking free conversion as used.');
        setHasUsedFreeConversion(true);
        localStorage.setItem('hasUsedFreeConversion', 'true');
      } else {
        console.log('[handleImageConversion] Deducting 1 user credit.');
        setUserCredits(prev => Math.max(0, prev - 1)); // Ensure credits don't go below 0
      }

      const duration = Date.now() - startTime;
      console.log('[handleImageConversion] Conversion took:', duration, 'ms');
      analytics.trackConversion('success', duration);

    } catch (err) {
      console.error('[handleImageConversion] Error during conversion process:', err);
      setError(`Failed to convert image: ${err.message}. Please try again.`);
      const duration = Date.now() - startTime;
      analytics.trackConversion('error', duration);
    } finally {
      console.log('[handleImageConversion] Setting isConverting to false.');
      setIsConverting(false);
    }
  };

  const handlePurchase = async (plan) => {
    console.log('[handlePurchase] Initiated. Plan:', plan);
    try {
      analytics.trackPayment(plan, 'initiated');
      console.log('[handlePurchase] Tracked payment initiation.');

      const currentPagePath = location.pathname;
      console.log('[handlePurchase] Current location.pathname:', currentPagePath);
      console.log('[handlePurchase] Setting sessionStorage previousPage to:', currentPagePath);
      sessionStorage.setItem('previousPage', currentPagePath);
      // Verify it was set
      const storedValue = sessionStorage.getItem('previousPage');
      console.log('[handlePurchase] sessionStorage previousPage confirmed value after set:', storedValue);


      console.log('[handlePurchase] Sending request to create checkout session:', `${API_URL}/api/stripe/create-checkout-session`);
      const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      console.log('[handlePurchase] Server response status:', response.status);
      const data = await response.json();
      console.log('[handlePurchase] Received data from server:', data); // Log the full response

      if (data.success && data.url) {
        console.log('[handlePurchase] Success response. Redirecting to Stripe URL:', data.url);
        // *** CRITICAL: Using window.location.href for redirect ***
        console.log('[handlePurchase] --- Redirecting NOW using window.location.href ---');
        window.location.href = data.url;
        // Note: analytics.trackPayment for 'completed' might be better placed after successful verification, not just before redirect.
        // analytics.trackPayment(data.plan || plan, 'redirected_to_stripe'); // More accurate tracking point
      } else {
        console.error('[handlePurchase] Failed to get Stripe URL from server:', data.error || 'Unknown error');
        setError(`Failed to initiate payment: ${data.error || 'Please try again.'}`);
      }
    } catch (err) {
      console.error('[handlePurchase] Error during fetch or processing:', err);
      setError('Error initiating payment: ' + err.message);
    }
  };


  const handleGoBackToHome = () => {
    console.log('[handleGoBackToHome] Called. Resetting state.');
    setUploadedImage(null);
    setConvertedImage(null);
    setPendingImage(null);
    setError('');
    // Optionally navigate if not already on home
    if (location.pathname !== '/') {
        console.log('[handleGoBackToHome] Navigating to /');
        navigate('/');
    }
  };

  const handleRetryWithAnotherPicture = () => {
    console.log('[handleRetryWithAnotherPicture] Called. Resetting state.');
    setUploadedImage(null);
    setConvertedImage(null);
    setPendingImage(null);
    setError('');
     // Optionally navigate if not already on home
     if (location.pathname !== '/') {
        console.log('[handleRetryWithAnotherPicture] Navigating to /');
        navigate('/');
    }
  };

  // Example pairs remain the same
  const examplePairs = [
    { before: '/examples/input1.png', after: '/examples/output1.png' },
    { before: '/examples/input2.png', after: '/examples/output2.png' },
    { before: '/examples/input3.png', after: '/examples/output3.png' }
  ];

  // JSX Structure (remains the same as your provided code)
  return (
    <div className="stone-bg" style={{ minHeight: '100vh', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
      <Routes>
        <Route path="/success" element={
          <div className="grass-top" style={{ padding: '60px 20px', textAlign: 'center' }}>
            {/* ... Success Page Content ... */}
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
            {/* ... Cancel Page Content ... */}
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
            {/* Hero Section */}
            <div className="grass-top" style={{ padding: '60px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              {/* ... Hero Content ... */}
              <h1 className="minecraft-text" style={{ fontSize: '48px', marginBottom: '30px', color: '#FFFFFF', lineHeight: '1.4', cursor: 'pointer' }} onClick={() => navigate('/')}>
                Turn Your Photos Into Minecraft Art!
              </h1>
               {/* ... Rest of your conditional rendering logic (convertedImage, pendingImage, upload form) ... */}
               {/* Make sure buttons inside here also have console.log onClick */}
               {convertedImage ? (
                <div style={{ marginBottom: '40px' }}>
                  {/* ... Converted Image Display ... */}
                   <button
                      className="minecraft-btn minecraft-text"
                      onClick={handleGoBackToHome}
                      style={{ backgroundColor: '#4CAF50', /*...*/ }}
                    >
                      Go Back to Home
                    </button>
                    <button
                      className="minecraft-btn minecraft-text"
                      onClick={handleRetryWithAnotherPicture}
                       style={{ backgroundColor: '#ff8c1a', /*...*/ }}
                    >
                      Retry with Another Picture
                    </button>
                     <button
                        className="minecraft-btn minecraft-text"
                        onClick={() => {
                          console.log('View Plans button clicked (result screen)');
                          handlePurchase('starter'); // Directly initiate purchase
                        }}
                        style={{ backgroundColor: '#ff8c1a', /*...*/ }}
                      >
                        View Plans
                      </button>
                </div>
              ) : pendingImage ? (
                <div style={{ marginBottom: '40px' }}>
                    {/* ... Pending Image Display ... */}
                     <button
                      className="minecraft-btn minecraft-text"
                      onClick={() => {
                        console.log('Purchase Credits button clicked (preview screen)');
                        handlePurchase('starter'); // Directly initiate purchase
                      }}
                      style={{ backgroundColor: '#ff8c1a', /*...*/ }}
                    >
                      Purchase Credits
                    </button>
                    <button
                      className="minecraft-btn minecraft-text"
                      onClick={() => {
                        console.log('Go Back button clicked (preview screen)');
                        setPendingImage(null);
                        setUploadedImage(null);
                        setError('');
                      }}
                      style={{ backgroundColor: '#4CAF50', /*...*/ }}
                    >
                      Go Back
                    </button>
                </div>
              ) : (
                <>
                    <ImageUpload onImageSelect={handleImageSelect} />
                    {isConverting && (
                         <div style={{ marginTop: '20px', /*...*/ }}>
                            <div className="minecraft-text breaking">Converting your photo...</div>
                        </div>
                    )}
                    <ErrorMessage
                        message={error}
                        onClose={() => { console.log('Error message closed by user.'); setError(''); }}
                    />
                 </>
                )}
            </div>

            {/* Only show examples if no image is being processed */}
            {!uploadedImage && !pendingImage && !isConverting && (
                <>
                  {/* How It Works Section */}
                  <div className="dirt-bg" style={{ padding: '60px 20px', color: '#FFFFFF', textAlign: 'center' }}>
                     {/* ... How it works content ... */}
                  </div>

                  {/* Examples Section */}
                  <div className="stone-bg" style={{ padding: '60px 20px', color: '#FFFFFF', textAlign: 'center' }}>
                     {/* ... Examples content ... */}
                      {examplePairs.map((pair, index) => (
                        <div key={index} className="minecraft-box dirt-bg" style={{ /*...*/ }}>
                            {/* ... Example Pair display ... */}
                        </div>
                     ))}
                  </div>

                  {/* Pricing Section */}
                  <div id="pricing-section" className="grass-top" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    {/* ... Pricing Content ... */}
                     <button
                        className="minecraft-btn minecraft-text"
                        onClick={() => { console.log('Pricing: Starter Pack clicked'); handlePurchase('starter'); }}
                        style={{ backgroundColor: '#ff4d4d', /*...*/ }}
                      >
                        Get Started
                      </button>
                       <button
                        className="minecraft-btn minecraft-text"
                        onClick={() => { console.log('Pricing: Value Pack clicked'); handlePurchase('value'); }}
                        style={{ backgroundColor: '#ff8c1a', /*...*/ }}
                      >
                        Best Value!
                      </button>
                       <button
                        className="minecraft-btn minecraft-text"
                        onClick={() => { console.log('Pricing: Family Pack clicked'); handlePurchase('family'); }}
                        style={{ backgroundColor: '#4CAF50', /*...*/ }}
                      >
                        Get Started
                      </button>
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

// Main App component wrapping AppContent with Router
function App() {
  console.log('[App Wrapper] Rendering Router.'); // Log when the main App component renders
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;