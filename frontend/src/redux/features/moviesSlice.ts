import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Movie } from '../../types';
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { RootState } from '../store';

const API_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_BACKEND_URL_PROD
    : import.meta.env.VITE_BACKEND_URL_DEV;

export const fetchMovies = createAsyncThunk<
  { movies: Movie[]; totalPages: number },
  void,
  { state: RootState }
>('movies/search', async (_, { getState, rejectWithValue }) => {
  let title = getState().movies.title;
  title = title.trim();

  const { year, type, page } = getState().movies;

  try {
    if (!title) {
      return rejectWithValue('search.error_valid_title');
    }

    const response = await axios.post(`${API_URL}/api/search`, {
      title,
      year,
      type,
      page,
    });

    if (!response.data.success) {
      if (response.data.error === 'Too many results.')
        return rejectWithValue('search.error_too_many_results');

      if (response.data.error === 'Movie not found.')
        return rejectWithValue('search.movie_not_found');

      return rejectWithValue(response.data.error);
    }

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(
        error.response?.data || error.message || 'Network Error'
      );
    }
    return rejectWithValue('An unknown error occurred');
  }
});

interface MoviesState {
  search: Movie[];
  totalPages: number;
  loading: boolean;
  error: string | null;
  page: number;
  title: string;
  year: string;
  type: string;
}

const initialState: MoviesState = {
  search: [],
  totalPages: 1,
  loading: false,
  error: null,
  page: 1,
  title: '',
  year: '',
  type: '',
};

const moviesSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    setTitle: (state, action) => {
      state.title = action.payload;
    },
    setYear: (state, action) => {
      state.year = action.payload;
    },
    setType: (state, action) => {
      state.type = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    clearSearch: (state) => {
      state.search = [];
      state.title = '';
      state.year = '';
      state.type = '';
      state.page = 1;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMovies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        if (!action.payload) {
          state.search = [];
          return;
        }
        state.totalPages = action.payload.totalPages;
        state.search = action.payload.movies;
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.search = [];
      });
  },
});

export const { setTitle, setType, setYear, clearSearch, setPage } =
  moviesSlice.actions;

export default moviesSlice.reducer;
