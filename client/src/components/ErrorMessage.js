import React from 'react';

/**
 * Reusable error message component with Minecraft styling
 */
function ErrorMessage({ message, onClose }) {
  if (!message) return null;
  
  return (
    <div 
      className="minecraft-box" 
      style={{ 
        backgroundColor: 'rgba(139, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        margin: '15px 0',
        position: 'relative',
        maxWidth: '800px',
        margin: '10px auto'
      }}
    >
      <div className="minecraft-text" style={{ fontSize: '16px' }}>
        {message}
      </div>
      
      {onClose && (
        <button 
          onClick={onClose}
          className="minecraft-btn"
          style={{
            position: 'absolute',
            right: '10px',
            top: '10px',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0 5px'
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default ErrorMessage; 