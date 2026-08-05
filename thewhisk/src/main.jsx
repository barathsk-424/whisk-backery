import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Capture the initial hash immediately before Supabase SDK or React Router can strip it
window.__INITIAL_HASH__ = window.location.hash;

const rootEl = document.getElementById('root');

if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  console.error('Root element #root not found in the DOM.');
}
