import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { MsalProvider } from '@azure/msal-react';

let BrowserRouter;
try {
  BrowserRouter = require('react-router-dom').BrowserRouter;
} catch (e) {
  // Fallback if react-router-dom is not available
  BrowserRouter = ({ children }) => React.createElement('div', null, children);
}

const mockMsalInstance = {
  acquireTokenSilent: jest.fn().mockResolvedValue({ accessToken: 'mock-token' }),
  acquireTokenPopup: jest.fn().mockResolvedValue({ accessToken: 'mock-token' }),
  loginPopup: jest.fn().mockResolvedValue({ accessToken: 'mock-token', account: null }),
  logout: jest.fn().mockResolvedValue(undefined),
  logoutPopup: jest.fn().mockResolvedValue(undefined),
  getAllAccounts: jest.fn(() => []),
  getAccountByHomeId: jest.fn(() => null),
  getAccountByLocalId: jest.fn(() => null),
  getAccountByUsername: jest.fn(() => null),
  getLogger: jest.fn(() => ({
    verbose: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
  })),
  addEventCallback: jest.fn(),
  removeEventCallback: jest.fn(),
  addPerformanceCallback: jest.fn(),
  removePerformanceCallback: jest.fn(),
  getTokenCache: jest.fn(() => ({
    getAllAccessTokens: jest.fn(() => []),
    getAllIdTokens: jest.fn(() => []),
    getAllRefreshTokens: jest.fn(() => []),
  })),
  getActiveAccount: jest.fn(() => null),
  setActiveAccount: jest.fn(),
  accountIdentifiers: [],
  getConfiguration: jest.fn(() => ({})),
  getConfiguration: jest.fn(() => ({
    clone: jest.fn(function() { return this; }),
  })),
};

function render(
  ui,
  {
    route = '/',
    ...renderOptions
  } = {}
) {
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    );
  }

  return {
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
    mockMsalInstance,
  };
}

export * from '@testing-library/react';
export { render };
