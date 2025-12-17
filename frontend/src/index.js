import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from "@sentry/react";
import { FlashProvider } from "../src/context/flashContext";
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { App } from './App';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { msalConfig } from "./tools/msal";
import { PublicClientApplication } from "@azure/msal-browser"; // Standard import
import { MsalProvider } from "@azure/msal-react";

// 1. Initialize MSAL immediately so MsalProvider doesn't crash on null
const PCA = new PublicClientApplication(msalConfig);
const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// 2. ⚡ PERFORMANCE: Only delay Sentry. This is the part that eats CPU during boot
const initializeSentry = () => {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, 
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    instrumenter: "sentry", 
  });
};

// Delay Sentry until after the logo has had a chance to paint
if ('requestIdleCallback' in window) {
  window.requestIdleCallback(initializeSentry);
} else {
  window.addEventListener('load', () => setTimeout(initializeSentry, 2000));
}

const SentryRoutes = Sentry.withSentryRouting(BrowserRouter);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <FlashProvider>
      <GoogleOAuthProvider clientId={clientId}>
        {/* PCA is now guaranteed to be defined here, fixing the getLogger error */}
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