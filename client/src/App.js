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
                  console.log('View Pricing button clicked (header)');
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
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="minecraft-box" style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                      <img src={uploadedImage ? URL.createObjectURL(uploadedImage) : ''} alt="Original" style={{ maxWidth: '100%', maxHeight: '300px', border: '4px solid #000' }} />
                      <p style={{ marginTop: '10px' }}>Original</p>
                    </div>
                    <div className="minecraft-box" style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                      <img src={convertedImage} alt="Minecraft Style" style={{ maxWidth: '100%', maxHeight: '300px', border: '4px solid #000' }} />
                      <p style={{ marginTop: '10px' }}>Minecraft Style</p>
                    </div>
                  </div>
                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px', zIndex: 1000 }}>
                    <button
                      className="minecraft-btn minecraft-text"
                      onClick={handleGoBackToHome}
                      style={{ backgroundColor: '#4CAF50', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
                    >
                      Go Back to Home
                    </button>
                    <button
                      className="minecraft-btn minecraft-text"
                      onClick={handleRetryWithAnotherPicture}
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
                          console.log('View Plans button clicked (result screen)');
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
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="minecraft-box" style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                      <img src={pendingImage ? URL.createObjectURL(pendingImage) : ''} alt="Original" style={{ maxWidth: '100%', maxHeight: '300px', border: '4px solid #000' }} />
                      <p style={{ marginTop: '10px' }}>Original</p>
                    </div>
                    <div className="minecraft-box" style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', position: 'relative' }}>
                      <img
                        src={pendingImage ? URL.createObjectURL(pendingImage) : ''}
                        alt="Minecraft Style"
                        style={{ maxWidth: '100%', maxHeight: '300px', border: '4px solid #000', filter: 'blur(10px)' }}
                      />
                      <p style={{ marginTop: '10px' }}>Minecraft Style</p>
                    </div>
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
                        console.log('Purchase Credits button clicked (preview screen)');
                        handlePurchase('starter'); // Directly initiate purchase
                      }}
                      style={{ backgroundColor: '#ff8c1a', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
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
                      style={{ backgroundColor: '#4CAF50', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
                    >
                      Go Back
                    </button>
                  </div>
                  {/* Removed error message as per request */}
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
                    onClose={() => setError('')} 
                  />
          </>
        )}
      </div>

      {/* Only show examples if no image is being processed */}
            {!uploadedImage && !pendingImage && !isConverting && (
        <>
          {/* How It Works */}
                <div className="dirt-bg" style={{ padding: '60px 20px', color: '#FFFFFF', textAlign: 'center' }}>
                  <h2 className="minecraft-text" style={{ fontSize: '36px', marginBottom: '40px', lineHeight: '1.4' }}>
                    How It Works
                  </h2>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="minecraft-box stone-bg" style={{ flex: '1', minWidth: '250px', maxWidth: '350px', padding: '20px' }}>
                      <div className="minecraft-text" style={{ fontSize: '20px', marginBottom: '15px', lineHeight: '1.4' }}>
                        1. Upload Your Photo
                      </div>
                      <p style={{ fontSize: '16px', lineHeight: '1.6', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                        Choose any photo you love - family pictures, vacation memories, or your favorite selfie!
                      </p>
                    </div>
                    <div className="minecraft-box stone-bg" style={{ flex: '1', minWidth: '250px', maxWidth: '350px', padding: '20px' }}>
                      <div className="minecraft-text" style={{ fontSize: '20px', marginBottom: '15px', lineHeight: '1.4' }}>
                        2. Watch the Magic
                      </div>
                      <p style={{ fontSize: '16px', lineHeight: '1.6', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                        Our special tool turns your photo into beautiful Minecraft blocks - just like in the movie!
                      </p>
              </div>
                    <div className="minecraft-box stone-bg" style={{ flex: '1', minWidth: '250px', maxWidth: '350px', padding: '20px' }}>
                      <div className="minecraft-text" style={{ fontSize: '20px', marginBottom: '15px', lineHeight: '1.4' }}>
                        3. Download & Share
              </div>
                      <p style={{ fontSize: '16px', lineHeight: '1.6', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                        Get your Minecraft-style picture and share it with friends and family!
                      </p>
              </div>
            </div>
          </div>

          {/* Examples Section */}
                <div className="stone-bg" style={{ padding: '60px 20px', color: '#FFFFFF', textAlign: 'center' }}>
                  <h2 className="minecraft-text" style={{ fontSize: '36px', marginBottom: '40px', lineHeight: '1.4' }}>
                    See the Magic!
                  </h2>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap', maxWidth: '1200px', margin: '0 auto' }}>
              {examplePairs.map((pair, index) => (
                      <div key={index} className="minecraft-box dirt-bg" style={{ flex: '1', minWidth: '300px', maxWidth: '350px', padding: '20px' }}>
                        <div style={{ border: '4px solid #000', marginBottom: '10px', padding: '8px', backgroundColor: '#5c4033', height: '250px', overflow: 'hidden' }}>
                    <img 
                      src={pair.before}
                      alt="Original" 
                            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', border: '2px solid #000' }}
                    />
                  </div>
                        <div className="minecraft-text" style={{ fontSize: '20px', marginBottom: '5px', color: '#FFFFFF', textShadow: '2px 2px 0px #000' }}>
                          Original
                        </div>
                        <div className="minecraft-text" style={{ fontSize: '24px', margin: '5px 0', color: '#FFFFFF' }}>
                          ↓
                        </div>
                        <div style={{ border: '4px solid #000', marginTop: '10px', padding: '8px', backgroundColor: '#5c4033', height: '250px', overflow: 'hidden' }}>
                    <img 
                      src={pair.after}
                      alt="Minecraft Style" 
                            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', border: '2px solid #000' }}
                    />
                  </div>
                        <div className="minecraft-text" style={{ fontSize: '20px', marginTop: '5px', color: '#FFFFFF', textShadow: '2px 2px 0px #000' }}>
                          Minecraft Style
                        </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Section */}
                <div id="pricing-section" className="grass-top" style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <h2 className="minecraft-text" style={{ fontSize: '36px', marginBottom: '40px', color: '#FFFFFF', lineHeight: '1.4' }}>
                    Simple Pricing
                  </h2>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="minecraft-box stone-bg" style={{ flex: '1', minWidth: '250px', maxWidth: '300px', padding: '30px' }}>
                      <h3 className="minecraft-text" style={{ fontSize: '24px', marginBottom: '15px', lineHeight: '1.4' }}>
                        Starter Pack
                      </h3>
                      <div className="minecraft-text" style={{ fontSize: '36px', marginBottom: '20px' }}>
                        $5
                      </div>
                      <p style={{ marginBottom: '20px', fontSize: '16px', lineHeight: '1.6', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                        10 Photos
                      </p>
                      <button
                        className="minecraft-btn minecraft-text"
                        onClick={() => handlePurchase('starter')}
                        style={{ backgroundColor: '#ff4d4d', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
                      >
                        Get Started
                      </button>
                    </div>
                    <div className="minecraft-box stone-bg" style={{ flex: '1', minWidth: '250px', maxWidth: '300px', padding: '30px', position: 'relative', transform: 'scale(1.05)' }}>
                      <div className="minecraft-text" style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#ff8c1a', padding: '5px 15px', fontSize: '14px', border: '2px solid #000' }}>
                        MOST POPULAR
                      </div>
                      <h3 className="minecraft-text" style={{ fontSize: '24px', marginBottom: '15px', lineHeight: '1.4' }}>
                        Value Pack
                      </h3>
                      <div className="minecraft-text" style={{ fontSize: '36px', marginBottom: '20px' }}>
                        $10
                      </div>
                      <p style={{ marginBottom: '20px', fontSize: '16px', lineHeight: '1.6', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                        30 Photos
                      </p>
                      <button
                        className="minecraft-btn minecraft-text"
                        onClick={() => handlePurchase('value')}
                        style={{ backgroundColor: '#ff8c1a', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
                      >
                        Best Value!
                      </button>
              </div>
                    <div className="minecraft-box stone-bg" style={{ flex: '1', minWidth: '250px', maxWidth: '300px', padding: '30px' }}>
                      <h3 className="minecraft-text" style={{ fontSize: '24px', marginBottom: '15px', lineHeight: '1.4' }}>
                        Family Pack
                      </h3>
                      <div className="minecraft-text" style={{ fontSize: '36px', marginBottom: '20px' }}>
                        $15
              </div>
                      <p style={{ marginBottom: '20px', fontSize: '16px', lineHeight: '1.6', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                        50 Photos
                      </p>
                      <button
                        className="minecraft-btn minecraft-text"
                        onClick={() => handlePurchase('family')}
                        style={{ backgroundColor: '#4CAF50', padding: '10px 20px', fontSize: '16px', zIndex: 1000, cursor: 'pointer', pointerEvents: 'auto !important' }}
                      >
                        Get Started
                      </button>
              </div>
            </div>
                  <div className="minecraft-box" style={{ marginTop: '30px', padding: '15px', display: 'inline-block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <p style={{ fontSize: '16px', lineHeight: '1.6', textShadow: '1px 1px 0px rgba(0,0,0,0.5)' }}>
                      🎁 Want to give this as a gift? Click any package to add a gift message!
                    </p>
            </div>
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

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;