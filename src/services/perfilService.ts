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
}

export const perfilService = {
  /** GET /users/profile/me — perfil del jugador autenticado (con datos privados) */
  getMiPerfil: async (): Promise<PerfilJugador> => {
    const res = await api.get('/users/profile/me');
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
};
