import React, { useState, useRef, useEffect, useCallback } from 'react';

function ImageUpload({ onImageSelect }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const buttonRef = useRef(null);

  const handleButtonClick = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  useEffect(() => {
    const currentButton = buttonRef.current;
    
    if (currentButton) {
      const clickHandler = (e) => {
        handleButtonClick(e);
      };
      
      currentButton.addEventListener('click', clickHandler);
      
      return () => {
        currentButton.removeEventListener('click', clickHandler);
      };
    }
  }, [handleButtonClick]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      onImageSelect(file);
    }
    // Reset the file input to allow re-uploading the same file
    e.target.value = null;
  };

  const validateFile = (file) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      onImageSelect(null, 'Please upload an image file');
      return false;
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      onImageSelect(null, 'Image must be smaller than 5MB. Please choose a smaller image or compress it before uploading.');
      return false;
    }
    
    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      onImageSelect(file);
    }
  };

  return (
    <div 
      style={{ marginTop: '20px' }}
      onClick={(e) => e.stopPropagation()}
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
      >
        <div className="minecraft-text" style={{ marginBottom: '10px' }}>
          Drop your photo here
        </div>
        <p style={{ marginBottom: '20px' }}>or</p>
        <button
          ref={buttonRef}
          className="minecraft-btn"
          onClick={handleButtonClick}
          type="button"
          style={{
            backgroundColor: '#4CAF50',
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            position: 'relative',
            zIndex: 10
          }}
        >
          Choose a File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          aria-label="Upload image"
        />
      </div>
    </div>
  );
}

export default ImageUpload;