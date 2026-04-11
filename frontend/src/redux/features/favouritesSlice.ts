import { createSlice } from '@reduxjs/toolkit';
import { Movie, UserMovieArgs } from '../../types';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { axiosPrivate } from '../../api/axiosConfig';

const API_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_BACKEND_URL_PROD
    : import.meta.env.VITE_BACKEND_URL_DEV;

interface FavouritesState {
  details: Record<string, Movie>;
  loading: boolean;
  error: string | null;
}

const initialState: FavouritesState = {
  details: {},
  loading: false,
  error: null,
};

export const fetchFavourites = createAsyncThunk<Movie[], string | null>(
  'favourites/list',
  async (userID, { rejectWithValue }) => {
    try {
      const response = await axiosPrivate.post(
        `${API_URL}/api/favourite/list`,
        { userID },
      );

      return response.data.movies;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return rejectWithValue('favourites.error_fetching_favourites');
    }
  },
);

export const addFavourite = createAsyncThunk<Movie, UserMovieArgs>(
  'favourites/add',
  async ({ userID, imdbID }, { rejectWithValue }) => {
    try {
      const response = await axiosPrivate.post(`${API_URL}/api/favourite/add`, {
        userID,
        imdbID,
      });

      return response.data.movie;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return rejectWithValue('favourites.error_adding_favourite');
    }
  },
);

export const deleteFavourite = createAsyncThunk<string, UserMovieArgs>(
  'favourites/delete',
  async ({ userID, imdbID }, { rejectWithValue }) => {
    try {
      await axiosPrivate.post(`${API_URL}/api/favourite/delete`, {
        userID,
        imdbID,
      });

      return imdbID;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return rejectWithValue('favourites.error_deleting_favourite');
    }
  },
);

export const clearFavourites = createAsyncThunk<void, string | null>(
  'favourites/clear',
  async (userID, { rejectWithValue }) => {
    try {
      await axiosPrivate.post(`${API_URL}/api/favourite/clear`, { userID });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return rejectWithValue('favourites.error_clearing_favourites');
    }
  },
);

const favouritesSlice = createSlice({
  name: 'favourites',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavourites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavourites.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (!action.payload) {
          state.details = {};
          return;
        }
        action.payload.forEach((movie) => {
          state.details[movie.imdbID] = movie;
        });
      })
      .addCase(fetchFavourites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addFavourite.pending, (state) => {
        state.error = null;
      })
      .addCase(addFavourite.fulfilled, (state, action) => {
        state.details[action.payload.imdbID] = action.payload;
      })
      .addCase(addFavourite.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deleteFavourite.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteFavourite.fulfilled, (state, action) => {
        delete state.details[action.payload];
      })
      .addCase(deleteFavourite.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(clearFavourites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearFavourites.fulfilled, (state) => {
        state.loading = false;
        state.details = {};
      })
      .addCase(clearFavourites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default favouritesSlice.reducer;
