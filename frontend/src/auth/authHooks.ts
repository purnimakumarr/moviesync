import { useAuth } from 'react-oidc-context';

export const useAuthUser = () => {
  const auth = useAuth();
  return auth?.user;
};

export const useIsAuthenticated = () => {
  const auth = useAuth();
  return auth?.isAuthenticated;
};
