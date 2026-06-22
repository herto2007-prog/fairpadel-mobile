import { api } from './api';

// ═══════════════════════════════════════════════════════
// TIPOS — reflejan el contrato del back (circuitos.controller, público)
// ═══════════════════════════════════════════════════════

export interface CircuitoListItem {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  ciudad: string;
  temporada: string;
  estado: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  colorPrimario?: string | null;
  _count?: { torneos: number; clasificados: number };
}

export interface CircuitoTorneo {
  id: string; // id del vínculo torneo-circuito
  orden: number;
  estado: string;
  torneo: {
    id: string;
    nombre: string;
    slug: string | null;
    fechaInicio: string;
    fechaFin?: string;
    ciudad: string;
    estado: string;
    flyerUrl?: string | null;
  };
}

export interface CircuitoDetalle extends CircuitoListItem {
  torneos: CircuitoTorneo[];
}

export interface RankingFila {
  posicion: number;
  jugadorId: string;
  puntosAcumulados: number;
  torneosJugados: number;
  jugador?: {
    id: string;
    nombre: string;
    apellido: string;
    fotoUrl?: string | null;
    categoriaActual?: { nombre: string } | null;
  };
}

export const circuitoService = {
  /** GET /circuitos — lista pública de circuitos */
  getCircuitos: async (): Promise<CircuitoListItem[]> => {
    const res = await api.get('/circuitos');
    return res.data?.data ?? [];
  },

  /** GET /circuitos/slug/:slug — detalle (incluye torneos aprobados) */
  getBySlug: async (slug: string): Promise<CircuitoDetalle | null> => {
    const res = await api.get(`/circuitos/slug/${slug}`);
    return res.data?.data ?? null;
  },

  /** GET /circuitos/:id/ranking — tabla del circuito */
  getRanking: async (circuitoId: string): Promise<RankingFila[]> => {
    const res = await api.get(`/circuitos/${circuitoId}/ranking`);
    return res.data?.data ?? [];
  },
};
