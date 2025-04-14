// src/components/ImageUpload.js
import React, { useState, useRef, useCallback } from 'react'; // Removed useEffect

function ImageUpload({ onImageSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  // const buttonRef = useRef(null); // No longer needed for listener

  // Keep useCallback if preferred, but direct function is fine too
  const handleButtonClick = useCallback((e) => {
    console.log('[ImageUpload] handleButtonClick triggered.'); // Add log
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (fileInputRef.current) {
       console.log('[ImageUpload] Clicking file input ref.');
      fileInputRef.current.click();
    } else {
       console.log('[ImageUpload] File input ref not found.');
    }
  }, []);

  // REMOVED the useEffect that added the event listener to buttonRef

  const handleFileSelect = (e) => {
    console.log('[ImageUpload] handleFileSelect triggered.'); // Add log
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      console.log('[ImageUpload] Valid file selected via input.');
      onImageSelect(file);
    }
    // Reset the file input to allow re-uploading the same file
    e.target.value = null;
  };

  const validateFile = (file) => {
    console.log('[ImageUpload] validateFile called for:', file.name); // Add log
    // Check file type
    if (!file.type.startsWith('image/')) {
      console.warn('[ImageUpload] Invalid file type:', file.type); // Add log
      onImageSelect(null, 'Please upload an image file');
      return false;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
       console.warn('[ImageUpload] File too large:', file.size); // Add log
      onImageSelect(null, 'Image must be smaller than 5MB. Please choose a smaller image or compress it before uploading.');
      return false;
    }
    console.log('[ImageUpload] File validation passed.');
    return true;
  };

  // Drag handlers remain the same... (add logs inside if needed)
  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragIn = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragOut = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e) => {
    console.log('[ImageUpload] handleDrop triggered.'); // Add log
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
       console.log('[ImageUpload] Valid file selected via drop.');
      onImageSelect(file);
    } else {
        console.log('[ImageUpload] Invalid file dropped or validation failed.');
    }
  };


  console.log('[ImageUpload] Rendering component.'); // Add log

  return (
    <div
      style={{ marginTop: '20px' }}
      onClick={(e) => e.stopPropagation()} // Kept original stopPropagation
    >
      <div
        className={`minecraft-box ${isDragging ? 'breaking' : ''}`}
        style={{
          padding: '40px 20px',
          backgroundColor: isDragging ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          maxWidth: '800px',
          margin: '0 auto',
          position: 'relative'
        }}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        // Add onClick here if you want the whole dropzone to trigger file select
        // onClick={handleButtonClick}
      >
        <div className="minecraft-text" style={{ marginBottom: '10px' }}>
          Drop your photo here
        </div>
        <p style={{ marginBottom: '20px' }}>or</p>
        <button
          // ref={buttonRef} // Removed ref
          className="minecraft-btn"
          onClick={handleButtonClick} // *** USE ONCLICK PROP DIRECTLY ***
          type="button"
          style={{
            backgroundColor: '#4CAF50',
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 10 // Ensure button is clickable if dropzone overlaps
          }}
        >
          Choose a File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*" // This is standard and usually fine
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          aria-label="Upload image"
        />
      </div>
    </div>
  );
}

export default ImageUpload;