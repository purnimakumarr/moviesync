import { User, WebStorageStateStore } from 'oidc-client-ts';

const AUTHORITY = import.meta.env.VITE_OAUTH_AUTHORITY;
const CLIENT_ID = import.meta.env.VITE_OAUTH_CLIENT_ID;
const OAUTH_LOGOUT_URL = import.meta.env.VITE_OAUTH_LOGOUT_URL;
const FRONTEND_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_FRONTEND_URL_PROD
    : import.meta.env.VITE_FRONTEND_URL_DEV;

export const oauthConfig = {
  authority: AUTHORITY,
  client_id: CLIENT_ID,
  redirect_uri: FRONTEND_URL,
  response_type: 'code',
  scope: 'phone openid email',
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
  userStore: new WebStorageStateStore({ store: window.localStorage }),
};

export const signOutRedirect = () => {
  const clientId = CLIENT_ID;
  const logoutUri = FRONTEND_URL;
  const oauthLogoutUrl = OAUTH_LOGOUT_URL;
  window.location.href = `${oauthLogoutUrl}?client_id=${clientId}&returnTo=${encodeURIComponent(
    logoutUri,
  )}`;
};

export const getUser = () => {
  const oidcStorage = localStorage.getItem(
    `oidc.user:${AUTHORITY}:${CLIENT_ID}`,
  );

  if (!oidcStorage) {
    return null;
  }

  return User.fromStorageString(oidcStorage);
};
