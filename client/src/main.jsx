import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'rgba(16, 18, 22, 0.96)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#f4f4f5',
          fontSize: '14px',
          fontWeight: 500,
          borderRadius: '14px',
          boxShadow: '0 24px 60px -24px rgba(0,0,0,1)',
        },
        success: { iconTheme: { primary: '#c6f135', secondary: '#0a0b0d' } },
        error: { iconTheme: { primary: '#f87171', secondary: '#0a0b0d' } },
      }}
    />
  </React.StrictMode>,
);
