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
import { refreshOnEarlyUpdate } from './app/swUpdate.js';
import { CompanionProvider } from './features/companion/CompanionProvider.js';
import './app/styles.css';

// After a new version is published, show it on the first visit instead of the second.
if ('serviceWorker' in navigator) refreshOnEarlyUpdate(navigator.serviceWorker);

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <CompanionProvider>
        <App />
      </CompanionProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
