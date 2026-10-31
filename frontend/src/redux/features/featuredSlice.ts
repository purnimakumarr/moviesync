import { createSlice } from '@reduxjs/toolkit';
import { FeaturedMovie } from '../../types';
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { axiosPublic } from '../../api/axiosConfig';

const API_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_BACKEND_URL_PROD
    : import.meta.env.VITE_BACKEND_URL_DEV;

// Live TMDB titles, already tagged with their carousel by the backend.
export const fetchFeatured = createAsyncThunk<FeaturedMovie[], void>(
  'featured/list',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosPublic.get(`${API_URL}/api/featured`);

      if (!response.data.success || response.data.movies.length === 0) {
        return rejectWithValue('Cannot fetch featured movies at this moment.');
      }

      return response.data.movies;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data || error.message || 'Network Error',
        );
      }
      return rejectWithValue('An unknown error occurred');
    }
  },
);

interface featuredState {
  movies: FeaturedMovie[];
  loading: boolean;
}

// Fetched as soon as the app mounts, so start in the loading state.
const initialState: featuredState = {
  movies: [],
  loading: true,
};

const featuredSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeatured.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFeatured.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload) {
          state.movies = [];
          return;
        }
        state.movies = action.payload;
      })
      .addCase(fetchFeatured.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default featuredSlice.reducer;
