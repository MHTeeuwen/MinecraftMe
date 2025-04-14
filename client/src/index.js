// Entry point for the React application
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// <<< ADD THIS LOG >>>
console.log('[src/index.js] Script executing NOW.', new Date().toISOString());

console.log('[src/index.js] Found root element. Attempting to render React App...');
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {console.log('[src/index.js] Inside root.render call.')}
    <App />
  </React.StrictMode>
); 