import { api } from './api';

// ═══════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════

export interface JugadorBusqueda {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  email?: string;
  genero?: 'MASCULINO' | 'FEMENINO';
  fotoUrl?: string;
  categoria?: { id: string; nombre: string; tipo: string; orden: number } | null;
}

export interface CategoriaPermitida {
  id: string;
  nombre: string;
  tipo: string;
  orden: number;
  permitido: boolean;
  motivo?: string;
  tipoCategoria?: string;
}

export interface CategoriaCatalogo {
  id: string;
  nombre: string;
  tipo: string;
  orden: number;
}

export interface Jugador2NoRegistrado {
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  email: string;
}

export interface CrearInscripcionPayload {
  tournamentId: string;
  categoryId: string;
  modoPago?: 'COMPLETO' | 'INDIVIDUAL';
  jugador2Id?: string;
  jugador2NoRegistrado?: Jugador2NoRegistrado;
}

export type InscripcionEstado =
  | 'PENDIENTE_PAGO'
  | 'PENDIENTE_CONFIRMACION'
  | 'CONFIRMADA'
  | 'CANCELADA';

export interface JugadorInscripcion {
  id: string;
  nombre: string;
  apellido: string;
  documento?: string;
}

export interface MiInscripcion {
  id: string;
  estado: InscripcionEstado;
  jugador1Id: string;
  jugador2Id?: string | null;
  jugador1?: JugadorInscripcion | null;
  jugador2?: JugadorInscripcion | null;
  tournament?: {
    id: string;
    nombre: string;
    ciudad?: string | null;
    slug?: string | null;
    fechaInicio?: string | null;
    fechaFin?: string | null;
  } | null;
  category?: { id: string; nombre: string } | null;
  createdAt?: string;
}

// ═══════════════════════════════════════════════════════
// SERVICIO — todos requieren auth (token inyectado por interceptor)
// ═══════════════════════════════════════════════════════

export const inscripcionService = {
  /** GET /inscripciones/public/buscar-pareja?nombre= */
  buscarPareja: async (nombre: string): Promise<JugadorBusqueda[]> => {
    const res = await api.get(`/inscripciones/public/buscar-pareja?nombre=${encodeURIComponent(nombre)}`);
    return res.data?.jugadores ?? [];
  },

  /** GET /inscripciones/public/categorias — catálogo de categorías personales */
  getCategoriasCatalogo: async (): Promise<CategoriaCatalogo[]> => {
    const res = await api.get('/inscripciones/public/categorias');
    return res.data?.categorias ?? [];
  },

  /** GET /inscripciones/public/torneos/:tournamentId/categorias-permitidas?jugador2Id= */
  getCategoriasPermitidas: async (tournamentId: string, jugador2Id?: string): Promise<CategoriaPermitida[]> => {
    const qs = jugador2Id ? `?jugador2Id=${jugador2Id}` : '';
    const res = await api.get(`/inscripciones/public/torneos/${tournamentId}/categorias-permitidas${qs}`);
    return res.data?.categorias ?? [];
  },

  /** PUT /users/profile/completar-datos — datos de competidor just-in-time */
  completarDatos: async (payload: { documento?: string; genero?: string; categoria?: string }) => {
    const res = await api.put('/users/profile/completar-datos', payload);
    return res.data;
  },

  /** POST /inscripciones/public — crea la inscripción */
  crear: async (payload: CrearInscripcionPayload) => {
    const res = await api.post('/inscripciones/public', payload);
    return res.data;
  },

  /** GET /inscripciones/my — inscripciones donde soy jugador 1 o pareja */
  getMisInscripciones: async (): Promise<MiInscripcion[]> => {
    const res = await api.get('/inscripciones/my');
    return Array.isArray(res.data) ? res.data : res.data?.inscripciones ?? [];
  },

  /** PATCH /inscripciones/:id/cancelar — cancelar (solo jugador 1) */
  cancelar: async (id: string, motivo?: string) => {
    const res = await api.patch(`/inscripciones/${id}/cancelar`, motivo ? { motivo } : {});
    return res.data;
  },
};
