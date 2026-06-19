import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// URL del backend
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  'https://api.fairpadel.com/api';

// Token en memoria para interceptores rápidos
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const loadToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync('fairpadel_token');
    authToken = token;
    return token;
  } catch {
    return null;
  }
};

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Si el servidor responde 401 (token inválido), limpiamos todo
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      await SecureStore.deleteItemAsync('fairpadel_token');
      await SecureStore.deleteItemAsync('fairpadel_user');
      authToken = null;
    }
    return Promise.reject(error);
  }
);
