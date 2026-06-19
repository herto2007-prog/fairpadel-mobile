import { api } from './api';

// ═══════════════════════════════════════════════════════
// TIPOS — reflejan el contrato del back (módulo jugador)
// ═══════════════════════════════════════════════════════

export type FeedTipo = 'resultado' | 'torneo_nuevo' | 'inscripcion_seguido';

export interface FeedItem {
  id: string;
  tipo: FeedTipo | string;
  fecha: string; // ISO
  titulo: string;
  detalle: string;
  link: string | null;
}

export interface NodoAgenda {
  fase: string;
  fecha: string | null; // YYYY-MM-DD
  hora: string | null; // HH:MM
  cancha: string | null;
  sede: string | null;
  rival: string | null;
  programado: boolean;
}

export interface Agenda {
  torneo: { id: string; nombre: string };
  categoria: string | null;
  inscripcionId: string;
  estado: string;
  mensaje: string;
  proximoPartido: NodoAgenda | null;
  siGanas: NodoAgenda[];
  siPerdes: NodoAgenda | null;
}

// ═══════════════════════════════════════════════════════
// SERVICIO
// ═══════════════════════════════════════════════════════

export const jugadorService = {
  /** GET /jugador/feed — "Pulso de tu pádel" (actividad de su mundo) */
  getFeed: async (): Promise<FeedItem[]> => {
    const res = await api.get('/jugador/feed');
    return res.data?.data ?? [];
  },

  /** GET /jugador/mi-agenda — próximo partido + camino si gana/pierde */
  getMiAgenda: async (): Promise<Agenda[]> => {
    const res = await api.get('/jugador/mi-agenda');
    return res.data?.data ?? [];
  },
};
