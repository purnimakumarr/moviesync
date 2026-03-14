import { createSlice } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { axiosPrivate } from '../../api/axiosConfig';

const API_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_BACKEND_URL_PROD
    : import.meta.env.VITE_BACKEND_URL_DEV;

interface UserState {
  userID: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  phone: string | null;
  dob: string | null;
  country: string | null;
  loading: boolean;
}

const initialState: UserState = {
  userID: null,
  firstName: null,
  middleName: null,
  lastName: null,
  phone: null,
  dob: null,
  country: null,
  loading: false,
};

type UserArgsType = {
  userID: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  phone: string | null;
  dob: string | null;
  country: string | null;
};

export const initializeUser = createAsyncThunk<UserArgsType, string>(
  'user/create',
  async (userID, { rejectWithValue }) => {
    try {
      if (!userID) rejectWithValue('Email is required');

      const response = await axiosPrivate.post(
        `${API_URL}/api/user/create-user`,
        { userID }
      );

      console.log('userSlice: User created => ', response.data);

      if (response.data.country) {
        return { ...response.data, userID };
      }

      // const responseCountry = await axiosPrivate.post(
      //   `${API_URL}/api/user/get-country`
      // );

      // if (!response.data.success) {
      //   return {
      //     ...response.data,
      //     userID,
      //     country: 'IN',
      //     message: responseCountry.data.error,
      //   };
      // }

      return {
        ...response.data,
        country: 'IN',
        userID,
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data || error.message || 'Network Error'
        );
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const updateUser = createAsyncThunk<UserArgsType, UserArgsType>(
  'user/update',
  async (
    {
      userID,
      firstName,
      middleName = null,
      lastName,
      phone = null,
      dob = null,
      country = null,
    },
    { rejectWithValue }
  ) => {
    try {
      if (!userID) {
        return rejectWithValue('Email is required');
      }

      if (!firstName) {
        return rejectWithValue('First name is required');
      }
      if (!lastName) {
        return rejectWithValue('Last name is required');
      }

      const filteredData = Object.fromEntries(
        Object.entries({
          userID,
          firstName,
          middleName,
          lastName,
          phone,
          dob,
          country,
        }).filter(([, value]) => value !== null)
      );

      const response = await axiosPrivate.post(
        `${API_URL}/api/user/update-user`,
        {
          ...filteredData,
        }
      );

      console.log('userSlice: User updated => ', response);
      return response.data.user as UserArgsType;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data || error.message || 'Network Error'
        );
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const fetchUser = createAsyncThunk<UserArgsType, string>(
  'user/fetch',
  async (userID, { rejectWithValue }) => {
    try {
      const response = await axiosPrivate.post(`${API_URL}/api/user/get-user`, {
        userID,
      });

      console.log('userSlice: User retrieved => ', response);
      return response.data.user as UserArgsType;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data || error.message || 'Network Error'
        );
      }
      console.log(error);
      return rejectWithValue('An unknown error occurred');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(initializeUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(initializeUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userID = action.payload.userID;
        state.firstName = action.payload.firstName;
        state.middleName = action.payload.middleName;
        state.lastName = action.payload.lastName;
        state.phone = action.payload.phone;
        state.dob = action.payload.dob;
        state.country = action.payload.country;
      })
      .addCase(initializeUser.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.firstName = action.payload.firstName;
        state.middleName = action.payload.middleName;
        state.lastName = action.payload.lastName;
        state.phone = action.payload.phone;
        state.dob = action.payload.dob;
      })
      .addCase(fetchUser.rejected, (state) => {
        state.loading = false;
      })
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.firstName = action.payload.firstName;
        state.middleName = action.payload.middleName;
        state.lastName = action.payload.lastName;
        state.phone = action.payload.phone;
        state.dob = action.payload.dob;
        state.country = action.payload.country;
      })
      .addCase(updateUser.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default userSlice.reducer;
