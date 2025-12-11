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

 // Sentry monitoring going up.

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});


const PCA = new PublicClientApplication(msalConfig);

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID; // from .env
console.log(clientId)

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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
