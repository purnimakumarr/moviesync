import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Movie, UserMovieArgs } from '../../types';
import { axiosPrivate } from '../../api/axiosConfig';
import { movieKey } from '../../utils/tmdb';

const API_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_BACKEND_URL_PROD
    : import.meta.env.VITE_BACKEND_URL_DEV;

interface WatchState {
  watchLater: Record<string, Movie>;
  watched: Record<string, Movie>;
  loadingWatchLater: boolean;
  loadingWatched: boolean;
  errorWatchLater: string | null;
  errorWatched: string | null;
}

const initialState: WatchState = {
  watchLater: {},
  watched: {},
  loadingWatchLater: false,
  loadingWatched: false,
  errorWatchLater: null,
  errorWatched: null,
};

export const fetchWatchLater = createAsyncThunk<Movie[], void>(
  'watchList/getWatchLater',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosPrivate.post(
        `${API_URL}/api/watch-later/list`,
        {},
      );

      return response.data.movies;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return rejectWithValue('watch_later.error_fetching_watch_later');
    }
  },
);

export const fetchWatched = createAsyncThunk<Movie[], void>(
  'watchList/getWatched',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosPrivate.post(`${API_URL}/api/watched/list`, {});

      return response.data.movies;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return rejectWithValue('watched.error_fetching_watched');
    }
  },
);

export const addWatchLater = createAsyncThunk<Movie, UserMovieArgs>(
  'watchList/addWatchLater',
  async ({ id, media_type }, { rejectWithValue }) => {
    try {
      const response = await axiosPrivate.post(
        `${API_URL}/api/watch-later/add`,
        { id, media_type },
      );

      return response.data.movie;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return rejectWithValue('watch_later.error_adding_watch_later');
    }
  },
);

export const addWatched = createAsyncThunk<Movie, UserMovieArgs>(
  'watchList/addWatched',
  async ({ id, media_type }, { rejectWithValue }) => {
    try {
      const response = await axiosPrivate.post(`${API_URL}/api/watched/add`, {
        id,
        media_type,
      });

      return response.data.movie;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return rejectWithValue('watched.error_adding_watched');
    }
  },
);

export const deleteWatchLater = createAsyncThunk<string, UserMovieArgs>(
  'watchList/deleteWatchLater',
  async ({ id, media_type }, { rejectWithValue }) => {
    try {
      await axiosPrivate.post(`${API_URL}/api/watch/delete`, {
        id,
        media_type,
      });

      return movieKey({ id, media_type });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return rejectWithValue('watch_later.error_deleting_watch_later');
    }
  },
);

export const deleteWatched = createAsyncThunk<string, UserMovieArgs>(
  'watchList/deleteWatched',
  async ({ id, media_type }, { rejectWithValue }) => {
    try {
      await axiosPrivate.post(`${API_URL}/api/watch/delete`, {
        id,
        media_type,
      });

      return movieKey({ id, media_type });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return rejectWithValue('watched.error_deleting_watched');
    }
  },
);

export const clearWatchLater = createAsyncThunk<void, void>(
  'watchList/clearWatchLater',
  async (_, { rejectWithValue }) => {
    try {
      await axiosPrivate.post(`${API_URL}/api/watch-later/clear`, {});

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return rejectWithValue('watch_later.error_clearing_watch_later');
    }
  },
);

export const clearWatched = createAsyncThunk<void, void>(
  'watchList/clearWatched',
  async (_, { rejectWithValue }) => {
    try {
      await axiosPrivate.post(`${API_URL}/api/watched/clear`, {});
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return rejectWithValue('watched.error_clearing_watched');
    }
  },
);

const watchSlice = createSlice({
  name: 'watch',
  initialState,
  reducers: {
    clearErrorWatchLater: (state) => {
      state.errorWatchLater = null;
    },
    clearErrorWatched: (state) => {
      state.errorWatched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch watch later
      .addCase(fetchWatchLater.pending, (state) => {
        state.loadingWatchLater = true;
        state.errorWatchLater = null;
      })
      .addCase(
        fetchWatchLater.fulfilled,
        (state, action: PayloadAction<Movie[]>) => {
          state.loadingWatchLater = false;
          if (!action.payload) {
            state.watchLater = {};
            return;
          }
          action.payload.forEach((movie) => {
            state.watchLater[movieKey(movie)] = movie;
          });
        },
      )
      .addCase(fetchWatchLater.rejected, (state, action) => {
        state.loadingWatchLater = false;
        state.errorWatchLater = action.payload as string;
      })
      // add watch later
      .addCase(addWatchLater.pending, (state) => {
        state.errorWatchLater = null;
      })
      .addCase(addWatchLater.fulfilled, (state, action) => {
        const key = movieKey(action.payload);
        delete state.watched[key];
        state.watchLater[key] = action.payload;
      })
      .addCase(addWatchLater.rejected, (state, action) => {
        state.errorWatchLater = action.payload as string;
      })
      // delete watch later
      .addCase(deleteWatchLater.pending, (state) => {
        state.errorWatchLater = null;
      })
      .addCase(
        deleteWatchLater.fulfilled,
        (state, action: PayloadAction<string>) => {
          delete state.watchLater[action.payload];
        },
      )
      .addCase(deleteWatchLater.rejected, (state, action) => {
        state.errorWatchLater = action.payload as string;
      })
      // clear watch later
      .addCase(clearWatchLater.pending, (state) => {
        state.loadingWatchLater = true;
        state.errorWatchLater = null;
      })
      .addCase(clearWatchLater.fulfilled, (state) => {
        state.loadingWatchLater = false;
        state.watchLater = {};
      })
      .addCase(clearWatchLater.rejected, (state, action) => {
        state.loadingWatchLater = false;
        state.errorWatchLater = action.payload as string;
      })
      // fetch watched
      .addCase(fetchWatched.pending, (state) => {
        state.loadingWatched = true;
        state.errorWatched = null;
      })
      .addCase(
        fetchWatched.fulfilled,
        (state, action: PayloadAction<Movie[]>) => {
          state.loadingWatched = false;
          if (!action.payload) {
            state.watched = {};
            return;
          }
          action.payload.forEach((movie) => {
            state.watched[movieKey(movie)] = movie;
          });
        },
      )
      .addCase(fetchWatched.rejected, (state, action) => {
        state.loadingWatched = false;
        state.errorWatched = action.payload as string;
      })
      // delete watched
      .addCase(deleteWatched.pending, (state) => {
        state.errorWatched = null;
      })
      .addCase(
        deleteWatched.fulfilled,
        (state, action: PayloadAction<string>) => {
          delete state.watched[action.payload];
        },
      )
      .addCase(deleteWatched.rejected, (state, action) => {
        state.errorWatched = action.payload as string;
      })
      // add watched
      .addCase(addWatched.pending, (state) => {
        state.errorWatched = null;
      })
      .addCase(addWatched.fulfilled, (state, action) => {
        const key = movieKey(action.payload);
        delete state.watchLater[key];
        state.watched[key] = action.payload;
      })
      .addCase(addWatched.rejected, (state, action) => {
        state.errorWatched = action.payload as string;
      })
      // clear watched
      .addCase(clearWatched.pending, (state) => {
        state.loadingWatched = true;
        state.errorWatched = null;
      })
      .addCase(clearWatched.fulfilled, (state) => {
        state.loadingWatched = false;
        state.watched = {};
      })
      .addCase(clearWatched.rejected, (state, action) => {
        state.loadingWatched = false;
        state.errorWatched = action.payload as string;
      });
  },
});

export const { clearErrorWatchLater, clearErrorWatched } = watchSlice.actions;

export default watchSlice.reducer;
