import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Set up polyfill for React.startTransition for older React versions
if (!React.startTransition) {
  React.startTransition = (callback) => {
    setTimeout(() => {
      callback();
    }, 0);
  };
}

// Create the root with concurrent mode
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render with error boundary
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
