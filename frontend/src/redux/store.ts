import { configureStore } from '@reduxjs/toolkit';
import favouritesReducer from './features/favouritesSlice';
import watchReducer from './features/watchSlice';
import moviesReducer from './features/moviesSlice';
import featuredReducer from './features/featuredSlice';
import userReducer from './features/userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    movies: moviesReducer,
    favourites: favouritesReducer,
    watch: watchReducer,
    featured: featuredReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
