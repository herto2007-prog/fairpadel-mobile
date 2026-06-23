import { api } from './api';

// ═══════════════════════════════════════════════════════
// TIPOS — reflejan GET /users/profile/me del back
// ═══════════════════════════════════════════════════════

export type NivelLogro = 'oro' | 'plata' | 'bronce' | 'especial';

export interface PerfilJugador {
  id: string;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  fotoUrl?: string;
  bannerUrl?: string;
  bio?: string;
  ciudad?: string;
  pais?: string;
  telefono?: string;
  instagram?: string;
  facebook?: string;
  categoria?: { id: string; nombre: string; tipo: string; orden: number };
  edad?: number | null;
  estado: string;
  esPremium: boolean;
  roles: string[];
  seguidores: number;
  siguiendo: number;
  stats: {
    torneosJugados: number;
    torneosGanados: number;
    finalesJugadas: number;
    semifinalesJugadas: number;
  };
  partidos: {
    jugados: number;
    ganados: number;
    perdidos: number;
    efectividad: number;
    rachaActual: number;
    mejorRacha: number;
  };
  ranking: Array<{
    tipo: string;
    alcance: string;
    alcanceNombre?: string;
    posicion: number;
    puntosTotales: number;
    torneosJugados: number;
    victorias: number;
    temporada: string;
  }>;
  historialPuntos: Array<{
    torneo: string;
    categoria: string;
    posicion: string;
    puntos: number;
    fecha: string;
  }>;
  logros: Array<{
    id: string;
    icon: string;
    nombre: string;
    descripcion: string;
    nivel: NivelLogro;
    progreso: number;
  }>;
  privado?: {
    inscripcionesPendientes: number;
    notificacionesNoLeidas: number;
  };
  whatsapp?: {
    consentCheckbox: boolean;
    consentStatus: string | null;
    consentDate: string | null;
    preferenciaNotificacion: 'EMAIL' | 'WHATSAPP' | 'AMBOS';
  };
}

export type PreferenciaNotif = 'EMAIL' | 'WHATSAPP' | 'AMBOS';

export const perfilService = {
  /** GET /users/profile/me — perfil del jugador autenticado (con datos privados) */
  getMiPerfil: async (): Promise<PerfilJugador> => {
    const res = await api.get('/users/profile/me');
    return res.data.data;
  },

  /** GET /users/profile/:id — perfil público de otro jugador */
  getPerfilJugador: async (userId: string): Promise<PerfilJugador> => {
    const res = await api.get(`/users/profile/${userId}`);
    return res.data.data;
  },

  /** PUT /users/profile — actualiza datos de texto del perfil */
  updatePerfil: async (data: {
    bio?: string;
    ciudad?: string;
    pais?: string;
    telefono?: string;
    instagram?: string;
    facebook?: string;
  }): Promise<PerfilJugador> => {
    const res = await api.put('/users/profile', data);
    return res.data.data;
  },

  /** PUT /users/profile/foto — sube la foto de perfil (multipart, campo 'image') */
  updateFoto: async (uri: string): Promise<void> => {
    const form = new FormData();
    const name = uri.split('/').pop() || 'avatar.jpg';
    const ext = (name.split('.').pop() || 'jpg').toLowerCase();
    const type = ext === 'png' ? 'image/png' : 'image/jpeg';
    // En RN, el archivo se adjunta como { uri, name, type }
    form.append('image', { uri, name, type } as any);
    await api.put('/users/profile/foto', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  /** PUT /users/profile/password */
  updatePassword: async (passwordActual: string, passwordNuevo: string) => {
    const res = await api.put('/users/profile/password', { passwordActual, passwordNuevo });
    return res.data;
  },

  /** PUT /users/profile/preferencias-notificacion */
  updatePreferenciasNotificacion: async (preferenciaNotificacion: PreferenciaNotif) => {
    const res = await api.put('/users/profile/preferencias-notificacion', { preferenciaNotificacion });
    return res.data;
  },

  /** POST /users/profile/whatsapp/solicitar-consentimiento */
  solicitarWhatsapp: async () => {
    const res = await api.post('/users/profile/whatsapp/solicitar-consentimiento');
    return res.data;
  },

  /** POST /users/profile/whatsapp/revocar */
  revocarWhatsapp: async () => {
    const res = await api.post('/users/profile/whatsapp/revocar');
    return res.data;
  },

  /** POST /users/profile/desactivar — soft-delete de la propia cuenta (historial preservado) */
  desactivarCuenta: async () => {
    const res = await api.post('/users/profile/desactivar');
    return res.data;
  },
};
