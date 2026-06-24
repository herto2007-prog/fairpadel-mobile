import { api } from './api';

// ═══════════════════════════════════════════════════════
// TIPOS — reflejan el módulo social del back
// ═══════════════════════════════════════════════════════

export interface JugadorComunidad {
  id: string;
  nombre: string;
  apellido: string;
  fotoUrl: string | null;
  ciudad: string | null;
  pais: string | null;
  estado: string;
  categoria: { id: string; nombre: string } | null;
  seguidores: number;
}

export interface SeguimientoResult {
  success: boolean;
  message: string;
  data?: {
    siguiendo: boolean;
    seguidoresCount: number;
    siguiendoCount: number;
  };
}

export interface UsuarioLista {
  id: string;
  nombre: string;
  apellido: string;
  fotoUrl: string | null;
  ciudad: string | null;
  categoriaActual?: { id: string; nombre: string } | null;
}

// ═══════════════════════════════════════════════════════
// SERVICIO — todos requieren auth (token inyectado por interceptor)
// ═══════════════════════════════════════════════════════

export const socialService = {
  /** GET /comunidad/jugadores — lista de jugadores (descubrir) */
  getComunidad: async (): Promise<JugadorComunidad[]> => {
    const res = await api.get('/comunidad/jugadores');
    return res.data?.data ?? [];
  },

  /** POST /users/:id/seguir */
  seguir: async (usuarioId: string): Promise<SeguimientoResult> => {
    const res = await api.post(`/users/${usuarioId}/seguir`);
    return res.data;
  },

  /** DELETE /users/:id/seguir */
  dejarDeSeguir: async (usuarioId: string): Promise<SeguimientoResult> => {
    const res = await api.delete(`/users/${usuarioId}/seguir`);
    return res.data;
  },

  /** GET /users/:id/siguiendo — ¿el usuario autenticado sigue a :id? */
  checkSiguiendo: async (usuarioId: string): Promise<boolean> => {
    const res = await api.get(`/users/${usuarioId}/siguiendo`);
    return !!res.data?.siguiendo;
  },

  /** GET /users/:id/siguiendo-lista — ids de los jugadores que sigue :id */
  getSiguiendoIds: async (usuarioId: string): Promise<Set<string>> => {
    const res = await api.get(`/users/${usuarioId}/siguiendo-lista?limit=200`);
    const lista: UsuarioLista[] = res.data?.data ?? [];
    return new Set(lista.map((u) => u.id));
  },

  /** GET /users/:id/siguiendo-lista — jugadores que sigue :id */
  getSiguiendo: async (usuarioId: string): Promise<UsuarioLista[]> => {
    const res = await api.get(`/users/${usuarioId}/siguiendo-lista?limit=200`);
    return res.data?.data ?? [];
  },

  /** GET /users/:id/seguidores — jugadores que siguen a :id */
  getSeguidores: async (usuarioId: string): Promise<UsuarioLista[]> => {
    const res = await api.get(`/users/${usuarioId}/seguidores?limit=200`);
    return res.data?.data ?? [];
  },

  /** DELETE /users/:id/seguidor — eliminar a :id de mis seguidores */
  eliminarSeguidor: async (usuarioId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.delete(`/users/${usuarioId}/seguidor`);
    return res.data;
  },

  // ── "Seguir pareja" en el cuadro (para alentar / ver su camino). NO es social. ──

  /** POST /jugador/parejas/:inscripcionId/seguir */
  seguirPareja: async (inscripcionId: string): Promise<void> => {
    await api.post(`/jugador/parejas/${inscripcionId}/seguir`);
  },

  /** DELETE /jugador/parejas/:inscripcionId/seguir */
  dejarDeSeguirPareja: async (inscripcionId: string): Promise<void> => {
    await api.delete(`/jugador/parejas/${inscripcionId}/seguir`);
  },

  /** GET /jugador/torneos/:tournamentId/parejas-seguidas — parejas seguidas en ese torneo */
  getParejasSeguidasTorneo: async (
    tournamentId: string,
  ): Promise<{ inscripcionId: string; jugadorIds: string[] }[]> => {
    const res = await api.get(`/jugador/torneos/${tournamentId}/parejas-seguidas`);
    return res.data?.data ?? [];
  },
};
