import React from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted fonts (bundled with the app, nothing is loaded from Google)
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import { App } from './app/App.js';
import { ErrorBoundary } from './app/ErrorBoundary.js';
import './app/styles.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
