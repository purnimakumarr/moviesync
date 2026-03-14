import { useAuth } from "react-oidc-context";
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from './redux/store';

import AppRoutes from './routes/AppRoutes';
import { Box, CircularProgress, Typography } from '@mui/material';

import { fetchFavourites } from './redux/features/favouritesSlice';
import { fetchWatched, fetchWatchLater } from './redux/features/watchSlice';
import { initializeUser } from './redux/features/userSlice';
import { fetchFeatured } from "./redux/features/featuredSlice";

import { useAuthUser, useIsAuthenticated } from './auth/authHooks';
import { useTranslation } from 'react-i18next';
import { featured } from './utils/featuredMovies';

import './App.css';

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useAuth();
  const user = useAuthUser();
  const isAuthenticated = useIsAuthenticated();
  const { t } = useTranslation();

  const email = user?.profile.email;

  // Initialize user if authenticated
  useEffect(() => {
    if (!isAuthenticated || !email) return;
    dispatch(initializeUser(email));
  }, [dispatch, email, isAuthenticated]);

  // Fetch lists if user authenticated 
  useEffect(() => {
    if (!isAuthenticated || !email) return;

    dispatch(fetchFavourites(email));
    dispatch(fetchWatchLater(email));
    dispatch(fetchWatched(email));
  }, [dispatch, isAuthenticated, email]);

  // Fetch featured movies
  useEffect(() => {
    dispatch(fetchFeatured(featured));
  }, [dispatch]);

  if (auth.isLoading) {
    return <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
    >
      <CircularProgress color="primary" />
      <Typography variant="h6" mt={2}>
        {t("app.loading_text")}
      </Typography>
    </Box>;
  }

  if (auth.error) {
    return <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100vh"
    >
      <Typography variant="h6" color="error" textAlign="center">
        {`${t("app.error_text")}: ${auth.error.message}`}
      </Typography>
    </Box>

  }

  return <AppRoutes />
};

export default App;