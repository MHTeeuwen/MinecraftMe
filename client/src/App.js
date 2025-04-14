// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './minecraft.css';
// Use the simplified ImageUpload component for this test
import ImageUpload from './components/ImageUpload'; // <<< MAKE SURE ImageUpload.js IS THE SIMPLIFIED VERSION WITHOUT THE BUTTON USEEFFECT >>>
import ErrorMessage from './components/ErrorMessage'; // Keep import
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

  // Keep all existing useEffects and handlers with logs...
  // <<< LOGGING >>>: Log component render/re-render
  console.log('[AppContent] Component rendering or re-rendering. Location:', location.pathname + location.search);

  // Check for successful payment on redirect
  useEffect(() => { /* ... keep existing code with logs ... */
    console.log('[Payment Verification useEffect] Running. Current URL:', window.location.href);
    const query = new URLSearchParams(location.search);
    const sessionId = query.get('session_id');
    console.log('[Payment Verification useEffect] Checking for session_id in query:', location.search);
    console.log('[Payment Verification useEffect] Found session_id:', sessionId);
    if (sessionId && sessionId !== '{CHECKOUT_SESSION_ID}' && sessionId.length > 10) {
      console.log('[Payment Verification useEffect] Valid session_id found. Proceeding with verification for:', sessionId);
      fetch(`${API_URL}/api/stripe/session/${sessionId}`)
        .then(res => { /* ... verification logic ... */ console.log('[Payment Verification useEffect] Fetch response status:', res.status); if (!res.ok) { throw new Error(`Server returned ${res.status}: ${res.statusText}`); } return res.json(); })
        .then(data => { /* ... success/failure logic ... */ console.log('[Payment Verification useEffect] Verification API response data:', data); if (data.success) { /* ... */ navigate('/success'); } else { /* ... */ navigate('/cancel'); } })
        .catch(err => { /* ... error handling ... */ console.error('[Payment Verification useEffect] Payment verification fetch/processing error:', err); navigate('/cancel'); });
    } else {
        console.log('[Payment Verification useEffect] No valid session_id found or session_id is placeholder.');
    }
  }, [location, navigate, pendingImage]);

  // Track initial page view
  useEffect(() => { /* ... keep existing code with logs ... */
     console.log('[PageView useEffect] Tracking page view for home.');
     analytics.trackPageView('home');
  }, []);

  // Log location change
  useEffect(() => { /* ... keep existing code with logs ... */
     console.log('[Location Change useEffect - React Router] Route changed:', { path: location.pathname, search: location.search, state: location.state, previousPageInSessionStorage: sessionStorage.getItem('previousPage'), historyLength: window.history.length });
  }, [location]);

  // popstate listener
  useEffect(() => { /* ... keep existing code with logs ... */
    const handlePopState = (event) => { console.log('[PopState Event Listener] Detected browser navigation (back/forward).', { href: window.location.href, state: event.state }); };
    console.log('[AppContent Mount Effect] Adding popstate listener for debugging.');
    window.addEventListener('popstate', handlePopState);
    return () => { console.log('[AppContent Unmount Effect] Removing popstate listener.'); window.removeEventListener('popstate', handlePopState); };
  }, []);

  // Original potentially problematic useEffect - KEEP COMMENTED OUT
  /* useEffect(() => { ... }, [navigate]); */

  // All handlers (handleError, handleImageSelect, handleImageConversion, handlePurchase, etc.) remain the same
  const handleError = (errorType, errorMessage) => { console.log('[handleError] Called with:', { errorType, errorMessage }); analytics.trackError(errorType, errorMessage); setError(errorMessage); };
  const handleImageSelect = async (file, errorMessage) => { console.log('[handleImageSelect] Called.'); /* ... */ };
  const handleImageConversion = async (file) => { console.log('[handleImageConversion] Initiated.'); /* ... */ };
  const handlePurchase = async (plan) => { console.log('[handlePurchase] Initiated.'); /* ... */ };
  const handleGoBackToHome = () => { console.log('[handleGoBackToHome] called.'); /* ... */ };
  const handleRetryWithAnotherPicture = () => { console.log('[handleRetryWithAnotherPicture] called.'); /* ... */ };
  // const handleGoBack = () => { /* ... */ };

  return (
    <div className="stone-bg" style={{ minHeight: '100vh', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
      <Routes>
        {/* Original /success route */}
        <Route path="/success" element={ <div className="grass-top" /* ... */ > {/* ... Success page JSX ... */} </div> } />
        {/* Original /cancel route */}
        <Route path="/cancel" element={ <div className="grass-top" /* ... */ > {/* ... Cancel page JSX ... */} </div> } />

        {/* Modified / route - Reintroducing ONLY ImageUpload */}
        <Route path="/" element={
          <>
            {/* Hero Section structure */}
            <div className="grass-top" style={{ padding: '60px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              {/* Basic header content */}
              <h1 className="minecraft-text" style={{ fontSize: '48px', /*...*/ }} onClick={() => navigate('/')}>
                Turn Your Photos Into Minecraft Art!
              </h1>
              <p style={{ fontSize: '20px', /*...*/ }}>
                First conversion free! Additional conversions start at $5 for 10 photos.
              </p>
              <button
                className="minecraft-btn minecraft-text"
                onClick={() => console.log('Test Pricing Button Clicked')}
                style={{ backgroundColor: '#ff8c1a', /*...*/ }}
              >
                View Pricing (Test)
              </button>
              <p style={{ fontSize: '20px', /*...*/ }}>
                You have {userCredits} credits remaining. (Test)
              </p>

              {/* Conditional rendering logic */}
              {convertedImage ? (
                <div style={{padding: '20px', border: '1px dashed white', margin: '20px'}}>Converted Image Placeholder</div>
              ) : pendingImage ? (
                <div style={{padding: '20px', border: '1px dashed white', margin: '20px'}}>Pending Image Placeholder</div>
              ) : (
                <>
                  {/* *** REINTRODUCE ImageUpload COMPONENT *** */}
                  <ImageUpload onImageSelect={handleImageSelect} />

                  {/* Keep ErrorMessage as placeholder for now */}
                  {error && <div style={{padding: '10px', border: '1px solid red', margin: '20px', color: 'red'}}>Error Message Placeholder: {error}</div>}

                  {/* Keep isConverting as placeholder */}
                  {isConverting && <div style={{padding: '10px', border: '1px dashed yellow', margin: '20px'}}>Converting Placeholder...</div>}
                </>
              )}
            </div> {/* End Hero Section div */}

            {/* Keep the rest commented out */}
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
              <p style={{ /*...*/ }}>
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