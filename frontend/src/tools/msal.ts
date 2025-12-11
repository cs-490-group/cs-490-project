import { LogLevel } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "bbe87bbf-f010-4e1c-aa54-1d3979116bdd",
    authority: "https://login.microsoftonline.com/17dcb00c-6941-4050-b69e-bd7eb8951712",
    knownAuthorities: [],
    redirectUri: "https://localhost:3000/", // Fix later
    postLogoutRedirectUri: "https://localhost:3000/", // profile later
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (
        level: LogLevel,
        message: string,
        containsPii: boolean
      ): void => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
      piiLoggingEnabled: false,
    },
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
  },
};
