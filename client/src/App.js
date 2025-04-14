// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './minecraft.css';
import ImageUpload from './components/ImageUpload'; // Keep the import even if component isn't rendered directly now
import ErrorMessage from './components/ErrorMessage'; // Keep the import
import analytics from './services/analyticsService';

const API_URL = process.env.REACT_APP_API_URL;

function AppContent() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedImage, setConvertedImage] = useState(null);
  const [error, setError] = useState('');
  const [userCredits, setUserCredits] = useState(0);
  const [hasUsedFreeConversion, setHasUsedFreeConversion] = useState(
    localStorage.getItem('hasUsedFreeConversion') === 'true'
  );
  const location = useLocation();
  const navigate = useNavigate();

  // <<< LOGGING >>>: Log component render/re-render
  console.log('[AppContent] Component rendering or re-rendering. Location:', location.pathname + location.search);

  // Check for successful payment on redirect (Keep original logic with logs)
  useEffect(() => {
    console.log('[Payment Verification useEffect] Running. Current URL:', window.location.href);
    const query = new URLSearchParams(location.search);
    const sessionId = query.get('session_id');
    console.log('[Payment Verification useEffect] Checking for session_id in query:', location.search);
    console.log('[Payment Verification useEffect] Found session_id:', sessionId);
    if (sessionId && sessionId !== '{CHECKOUT_SESSION_ID}' && sessionId.length > 10) {
      console.log('[Payment Verification useEffect] Valid session_id found. Proceeding with verification for:', sessionId);
      fetch(`${API_URL}/api/stripe/session/${sessionId}`)
        .then(res => {
          console.log('[Payment Verification useEffect] Fetch response status:', res.status);
          if (!res.ok) {
            console.error(`[Payment Verification useEffect] Server error status: ${res.status} ${res.statusText}`);
            throw new Error(`Server returned ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('[Payment Verification useEffect] Verification API response data:', data);
          if (data.success) {
            console.log('[Payment Verification useEffect] Payment success. Updating credits and potentially converting.');
            setUserCredits(prev => prev + parseInt(data.quantity || 0));
            setError('');
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
  }, [location, navigate, pendingImage]); // Keep original dependencies

  // Track initial page view (Keep original logic with logs)
  useEffect(() => {
    console.log('[PageView useEffect] Tracking page view for home.');
    analytics.trackPageView('home');
  }, []);

  // Original log for location change (Keep original logic with logs)
  useEffect(() => {
    console.log('[Location Change useEffect - React Router] Route changed:', {
        path: location.pathname, search: location.search, state: location.state,
        previousPageInSessionStorage: sessionStorage.getItem('previousPage'),
        historyLength: window.history.length
      });
  }, [location]); // Keep original dependency

  // popstate listener (Keep original logic with logs)
  useEffect(() => {
    const handlePopState = (event) => {
      console.log('[PopState Event Listener] Detected browser navigation (back/forward).');
      console.log('[PopState Event Listener] New location (window.location):', window.location.href);
      console.log('[PopState Event Listener] History state object (event.state):', event.state);
      console.log('[PopState Event Listener] sessionStorage previousPage at event time:', sessionStorage.getItem('previousPage'));
    };
    console.log('[AppContent Mount Effect] Adding popstate listener for debugging.');
    window.addEventListener('popstate', handlePopState);
    return () => {
      console.log('[AppContent Unmount Effect] Removing popstate listener.');
      window.removeEventListener('popstate', handlePopState);
    };
  }, []); // Empty dependency array

  // Original potentially problematic useEffect - KEEP COMMENTED OUT FOR NOW
    /*
    useEffect(() => {
      console.log('[Single Run useEffect - Potential Back Nav] Navigation effect triggered:', { ... });
      const previousPage = sessionStorage.getItem('previousPage');
      console.log('[Single Run useEffect - Potential Back Nav] Checking previousPage:', previousPage, 'against current path:', window.location.pathname);
      if (previousPage && previousPage !== window.location.pathname) {
        console.log('[Single Run useEffect - Potential Back Nav] Found previousPage in sessionStorage:', previousPage, '- Navigating now.');
        // navigate(previousPage);
        // sessionStorage.removeItem('previousPage');
      } else if (previousPage && previousPage === window.location.pathname) {
          console.log('[Single Run useEffect - Potential Back Nav] previousPage matches current path. Navigation skipped by this effect.');
          // sessionStorage.removeItem('previousPage');
      } else {
          console.log('[Single Run useEffect - Potential Back Nav] No previousPage found in sessionStorage. No navigation triggered by this effect.');
      }
    }, [navigate]);
    */

  // All handlers (handleError, handleImageSelect, handleImageConversion, handlePurchase, handleGoBackToHome, etc.) remain the same as your original code with logs added previously
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
    console.log('[handleImageSelect] Checking conversion eligibility:', { hasUsedFreeConversion, userCredits });
    if (!hasUsedFreeConversion || userCredits > 0) {
      console.log('[handleImageSelect] Eligible for conversion, calling handleImageConversion.');
      handleImageConversion(file);
    } else {
      console.log('[handleImageSelect] Not eligible for free conversion and no credits. Setting pending image.');
      setPendingImage(file);
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
    setPendingImage(null);
    const startTime = Date.now();
    console.log('[handleImageConversion] Start time:', startTime);
    try {
      const reader = new FileReader();
      console.log('[handleImageConversion] Reading file as Data URL...');
      const base64Image = await new Promise((resolve, reject) => {
        reader.onloadend = () => { console.log('[handleImageConversion] File read complete.'); resolve(reader.result.split(',')[1]); }
        reader.onerror = (error) => { console.error('[handleImageConversion] FileReader error:', error); reject(new Error("Error reading file")); };
        reader.readAsDataURL(file);
      });
      console.log('[handleImageConversion] Sending request to API:', API_URL + '/api/convert');
      const response = await fetch(`${API_URL}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image, /* prompt, size */ }),
      });
      console.log('[handleImageConversion] API Response Status:', response.status);
      const data = await response.json();
      console.log('Client received:', JSON.stringify(data, null, 2)); // Your original detailed log
      if (!response.ok || !data.success) {
         console.error('[handleImageConversion] API Error or Non-Success:', data.error || `Status: ${response.status}`);
        throw new Error(data.error || 'Failed to convert image');
      }
      console.log('[handleImageConversion] Conversion successful. Received URL:', data.url);
      setConvertedImage(data.url);
      if (!hasUsedFreeConversion) {
        console.log('[handleImageConversion] Marking free conversion as used.');
        setHasUsedFreeConversion(true);
        localStorage.setItem('hasUsedFreeConversion', 'true');
      } else {
        console.log('[handleImageConversion] Deducting 1 user credit.');
        setUserCredits(prev => Math.max(0, prev - 1));
      }
      const duration = Date.now() - startTime;
      console.log('[handleImageConversion] Conversion took:', duration, 'ms');
      analytics.trackConversion('success', duration);
    } catch (err) {
      console.error('Conversion error:', err);
      setError('Failed to convert image. Please try again.');
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
      console.log('[handlePurchase] Tracked payment initiation for plan:', plan);
      const currentPagePath = location.pathname;
      console.log('[handlePurchase] Current location.pathname:', currentPagePath);
      sessionStorage.setItem('previousPage', currentPagePath);
      const storedValue = sessionStorage.getItem('previousPage');
      console.log('[handlePurchase] sessionStorage previousPage set to:', storedValue);
      console.log('[handlePurchase] Sending request to create checkout session:', `${API_URL}/api/stripe/create-checkout-session`);
      const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }),
      });
      console.log('[handlePurchase] Server response status:', response.status);
      const data = await response.json();
      console.log('[handlePurchase] Received response from server:', data);
      if (data.success && data.url) {
        console.log('[handlePurchase] Redirecting to Stripe Checkout URL:', data.url);
        console.log('[handlePurchase] --- Redirecting NOW using window.location.href ---');
        window.location.href = data.url;
        analytics.trackPayment(data.plan || plan, 'completed');
      } else {
        console.error('[handlePurchase] Failed to initiate payment (API error or no URL):', data.error || 'No error message provided.');
        setError('Failed to initiate payment. Please try again.');
      }
    } catch (err) {
      console.error('[handlePurchase] Error during fetch or processing:', err);
      setError('Error initiating payment: ' + err.message);
    }
  };

  const handleGoBackToHome = () => {
    console.log('[handleGoBackToHome] called - Resetting state.');
    setUploadedImage(null); setConvertedImage(null); setPendingImage(null); setError('');
    if (location.pathname !== '/') { console.log('[handleGoBackToHome] Navigating to /'); navigate('/'); }
  };

  const handleRetryWithAnotherPicture = () => {
    console.log('[handleRetryWithAnotherPicture] called - Resetting state.');
    setUploadedImage(null); setConvertedImage(null); setPendingImage(null); setError('');
    if (location.pathname !== '/') { console.log('[handleRetryWithAnotherPicture] Navigating to /'); navigate('/'); }
  };

  // Unused handleGoBack kept for completeness from original code
  // const handleGoBack = () => { console.log('[handleGoBack] Navigating back using navigate(-1)'); navigate(-1); };

  // Original examplePairs array - not rendered in this version
  // const examplePairs = [ ... ];


  // *** MODIFIED JSX FOR TESTING ***
  return (
    <div className="stone-bg" style={{ minHeight: '100vh', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
      <Routes>
        {/* Original /success route */}
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
              onClick={() => { console.log('[Button Click] Convert a Photo button clicked (success page)'); navigate('/'); }}
              style={{ backgroundColor: '#4CAF50', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
            >
              Convert a Photo
            </button>
          </div>
        } />
        {/* Original /cancel route */}
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
              onClick={() => { console.log('[Button Click] Try Again button clicked (cancel page)'); navigate('/'); }}
              style={{ backgroundColor: '#4CAF50', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
            >
              Try Again
            </button>
          </div>
        } />

        {/* Modified / route */}
        <Route path="/" element={
          <>
            {/* Restore Hero Section structure */}
            <div className="grass-top" style={{ padding: '60px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              {/* Restore basic header content */}
              <h1 className="minecraft-text" style={{ fontSize: '48px', marginBottom: '30px', color: '#FFFFFF', lineHeight: '1.4', cursor: 'pointer' }} onClick={() => navigate('/')}>
                Turn Your Photos Into Minecraft Art!
              </h1>
              <p style={{ fontSize: '20px', marginBottom: '10px', color: '#FFFFFF', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                First conversion free! Additional conversions start at $5 for 10 photos.
              </p>
              {/* Add back a simple button first */}
              <button
                className="minecraft-btn minecraft-text"
                onClick={() => console.log('Test Pricing Button Clicked')} // Simplified onClick for now
                style={{ backgroundColor: '#ff8c1a', padding: '8px 16px', fontSize: '14px', marginBottom: '20px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
              >
                View Pricing (Test)
              </button>
              {/* Use state variable */}
              <p style={{ fontSize: '20px', marginBottom: '30px', color: '#FFFFFF', maxWidth: '600px', margin: '0 auto 30px', lineHeight: '1.6', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                You have {userCredits} credits remaining. (Test)
              </p>

              {/* Restore the main conditional rendering logic */}
              {convertedImage ? (
                 // *** Keep content simple initially ***
                <div style={{padding: '20px', border: '1px dashed white', margin: '20px'}}>Converted Image Placeholder</div>
              ) : pendingImage ? (
                 // *** Keep content simple initially ***
                <div style={{padding: '20px', border: '1px dashed white', margin: '20px'}}>Pending Image Placeholder</div>
              ) : (
                <>
                  {/* *** Temporarily render placeholder instead of ImageUpload *** */}
                  <div style={{padding: '20px', border: '1px dashed white', margin: '20px'}}>Image Upload Placeholder</div>

                  {/* *** Temporarily render placeholder instead of ErrorMessage *** */}
                  {error && <div style={{padding: '10px', border: '1px solid red', margin: '20px', color: 'red'}}>Error Message Placeholder: {error}</div>}

                  {/* *** Keep isConverting simple initially *** */}
                  {isConverting && <div style={{padding: '10px', border: '1px dashed yellow', margin: '20px'}}>Converting Placeholder...</div>}
                </>
              )}
            </div> {/* End Hero Section div */}

            {/* *** Temporarily COMMENT OUT the rest (How It Works, Examples, Pricing) *** */}
            {/*
            {!uploadedImage && !pendingImage && !isConverting && (
              <>
                 // How It Works section ...
                 // Examples Section ...
                 // Pricing Section ...
              </>
            )}
            */}

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
  console.log('[App Wrapper] Rendering Router.');
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;