import axios, { AxiosHeaders } from 'axios';
import { getUser } from '../auth/authUtils';
import { decryptPayload, encryptPayload } from '../utils/encryption';

const API_BASE_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_BACKEND_URL_PROD
    : import.meta.env.VITE_BACKEND_URL_DEV;

export const axiosPublic = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const axiosPrivate = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosPrivate.interceptors.request.use(
  async (config) => {
    const user = getUser();
    const newConfig = { ...config };
    if (user && user?.access_token) {
      newConfig.headers = AxiosHeaders.from({
        ...newConfig.headers,
        Authorization: `Bearer ${user.access_token}`,
      });
    }

    if (newConfig.data) {
      const [encryptedPayload, encryptedAESKeyClient] = encryptPayload(
        newConfig.data,
      );

      newConfig.data = encryptedPayload;

      newConfig.headers = AxiosHeaders.from({
        ...newConfig.headers,
        'encrypted-key': encryptedAESKeyClient,
      });
    }
    return newConfig;
  },
  (error) => {
    return Promise.reject(error);
  },
);

axiosPrivate.interceptors.response.use(
  (response) => {
    const newResponse = response;

    if (newResponse.data) {
      const encryptedAESKeyServer = newResponse.headers['encrypted-key'];

      // Return original response if not encrypted
      if (
        !encryptedAESKeyServer ||
        !newResponse.data.iv ||
        !newResponse.data.encryptedData
      ) {
        return newResponse;
      }

      const decryptedResponse = decryptPayload(
        {
          iv: newResponse.data.iv,
          encryptedData: newResponse.data.encryptedData,
        },
        encryptedAESKeyServer,
      );

      newResponse.data = decryptedResponse;
    }

    return newResponse;
  },
  async (error) => {
    if (error.response?.status === 401) {
      console.log('Unauthorized! Redirecting to login...');
    }

    return Promise.reject(error);
  },
);
