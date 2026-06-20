import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken } from './api';

export interface LoginData {
  documento: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    documento: string;
    estado: string;
    roles: string[];
    fotoUrl?: string;
    genero?: string;
    categoria?: { id: string; nombre: string } | null;
  };
}

export interface RegisterData {
  // Registro mínimo: solo estos 4 son obligatorios (igual que la web).
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  // El resto se completa just-in-time al inscribirse a un torneo.
  documento?: string;
  telefono?: string;
  fechaNacimiento?: string;
  genero?: 'MASCULINO' | 'FEMENINO';
  ciudad?: string;
  categoria?: string;
  fotoUrl?: string;
  consentCheckboxWhatsapp?: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

const TOKEN_KEY = 'fairpadel_token';
const USER_KEY = 'fairpadel_user';

export const authService = {
  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    const result = response.data as LoginResponse;

    await SecureStore.setItemAsync(TOKEN_KEY, result.access_token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(result.user));
    setAuthToken(result.access_token);

    return result;
  },

  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await api.post('/auth/register', data);
    const result = response.data as LoginResponse;
    await SecureStore.setItemAsync('pendingVerificationEmail', data.email);
    return result;
  },

  googleLogin: async (idToken: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/google', { idToken });
    const result = response.data as LoginResponse;
    await SecureStore.setItemAsync(TOKEN_KEY, result.access_token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(result.user));
    setAuthToken(result.access_token);
    return result;
  },

  logout: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setAuthToken(null);
  },

  getToken: async (): Promise<string | null> => {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  getUser: async (): Promise<LoginResponse['user'] | null> => {
    const userStr = await SecureStore.getItemAsync(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return !!token;
  },

  getMe: () => api.get('/auth/me').then((r) => r.data),

  forgotPassword: (data: ForgotPasswordData) =>
    api.post('/auth/forgot-password', data).then((r) => r.data),

  resetPassword: (data: ResetPasswordData) =>
    api.post('/auth/reset-password', data).then((r) => r.data),

  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email?token=${token}`).then((r) => r.data),

  resendVerification: (email: string) =>
    api.post('/auth/resend-verification', { email }).then((r) => r.data),
};
