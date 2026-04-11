import { createSlice } from '@reduxjs/toolkit';
import { FeaturedMovie } from '../../types';
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { axiosPublic } from '../../api/axiosConfig';

const API_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_BACKEND_URL_PROD
    : import.meta.env.VITE_BACKEND_URL_DEV;

export const fetchFeatured = createAsyncThunk<
  FeaturedMovie[],
  { id: string; tag: string }[]
>('featured/list', async (featuredList, { rejectWithValue }) => {
  try {
    if (featuredList.length === 0) {
      return rejectWithValue('No IMDB IDs provided.');
    }

    const responses = await Promise.all(
      featuredList.map(async ({ id }) => {
        const res = await axiosPublic.post(`${API_URL}/api/getById`, {
          imdbID: id,
        });
        if (res.data.success) {
          return {
            ...res.data.movie,
            tag: featuredList.find((item) => item.id === id)?.tag,
          };
        }
      }),
    );

    const validResponses = responses.filter(Boolean);

    if (validResponses.length === 0) {
      return rejectWithValue('Cannot fetch featured movies at this moment.');
    }

    return validResponses;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(
        error.response?.data || error.message || 'Network Error',
      );
    }
    return rejectWithValue('An unknown error occurred');
  }
});

interface featuredState {
  movies: FeaturedMovie[];
  loading: boolean;
}

const initialState: featuredState = {
  movies: [],
  loading: false,
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
