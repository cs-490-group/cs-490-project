import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from "@sentry/react";
import { FlashProvider } from "../src/context/flashContext";
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { App } from './App';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider } from '@react-oauth/google'
import { msalConfig } from "./tools/msal";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";

// Initialize MSAL outside the render cycle
const PCA = new PublicClientApplication(msalConfig);
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const initializeSentry = () => {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // Low sample rate to reduce monitoring overhead
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Disable auto-instrumentation of startup to save the Main Thread
    instrumenter: "sentry", 
  });
};

// Use requestIdleCallback to wait until the "Main Thread" has finished the initial render
if ('requestIdleCallback' in window) {
  window.requestIdleCallback(initializeSentry);
} else {
  // Fallback for older browsers
  window.addEventListener('load', () => {
    setTimeout(initializeSentry, 2000);
  });
}

const SentryRoutes = Sentry.withSentryRouting(BrowserRouter);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <FlashProvider>
      <GoogleOAuthProvider clientId={clientId}>
        <MsalProvider instance={PCA}>
          <SentryRoutes>
            <App />
          </SentryRoutes>
        </MsalProvider>
      </GoogleOAuthProvider>
    </FlashProvider>
  </React.StrictMode>
);

reportWebVitals();