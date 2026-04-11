import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import ThemeProviderWrapper from "./theme/ThemeProviderWrapper";
import i18n from "./i18n/i18n";
import { I18nextProvider } from "react-i18next";
import { store } from "./redux/store";
import { Provider } from "react-redux";
import { CssBaseline } from "@mui/material";
import { AuthProvider } from "react-oidc-context";
import { oauthConfig } from "./auth/authUtils";
import NotificationToaster from "./components/common/Notification";


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProviderWrapper>
      <CssBaseline />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <I18nextProvider i18n={i18n}>
          <Provider store={store}>
            <AuthProvider {...oauthConfig}>
              <NotificationToaster />
              <App />
            </AuthProvider>
          </Provider>
        </I18nextProvider>
      </BrowserRouter>
    </ThemeProviderWrapper>
  </React.StrictMode>
);