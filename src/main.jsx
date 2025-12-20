// Load polyfills first (must be before any other imports that use them)
import './utils/polyfills.js'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/shared/ErrorBoundary'

// Polyfill Buffer for browser
import { Buffer } from 'buffer'
window.Buffer = Buffer

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
