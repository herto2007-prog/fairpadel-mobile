import { api } from './api';

// ═══════════════════════════════════════════════════════
// TIPOS — reflejan el contrato del back (public-tournaments.controller)
// ═══════════════════════════════════════════════════════

export interface TorneoCategoria {
  id: string;
  nombre: string;
  tipo: string;
  orden: number;
  inscripcionAbierta: boolean;
  // Solo en el detalle:
  tournamentCategoryId?: string;
  estado?: string;
}

export interface TorneoListItem {
  id: string;
  nombre: string;
  slug: string | null;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  fechaLimiteInscr?: string;
  ciudad: string;
  flyerUrl?: string;
  // El back serializa el Decimal como string (ej: "50000"); coercer con Number() al mostrar.
  costoInscripcion: number | string;
  organizador: { id: string; nombre: string; apellido: string };
  sede?: { id: string; nombre: string; ciudad: string } | null;
  categorias: TorneoCategoria[];
  totalInscritos: number;
}

export interface JugadorInscrito {
  id: string;
  nombre: string;
  apellido: string;
  fotoUrl?: string | null;
}
export interface ParejaInscrita {
  id: string;
  jugador1: JugadorInscrito;
  jugador2?: JugadorInscrito | null;
  fechaInscripcion?: string;
}
export interface CategoriaInscritos {
  categoriaId: string;
  categoriaNombre: string;
  categoriaTipo: string;
  parejas: ParejaInscrita[];
}

export interface TorneoDetalle extends TorneoListItem {
  region?: string;
  pais?: string;
  minutosPorPartido?: number;
  estado?: string; // PUBLICADO | EN_CURSO | FINALIZADO
  inscripcionesAbiertas: boolean;
  sedePrincipal?: {
    id: string;
    nombre: string;
    ciudad: string;
    direccion?: string;
    canchas?: Array<{ id: string; nombre: string }>;
  } | null;
  sedes?: Array<{ id: string; nombre: string; ciudad: string; direccion?: string }>;
  modalidades?: Array<{ id: string; nombre: string; descripcion?: string }>;
  premios?: Array<{ id: string; puesto: number; descripcion: string }>;
  sponsors?: Array<{ id: string; nombre: string; logoUrl?: string; nivel?: string }>;
  organizador: { id: string; nombre: string; apellido: string; telefono?: string; email?: string };
}

// ── Cuadro / bracket ──
export interface JugadorBracket {
  id?: string | null;
  nombre: string;
  apellido: string;
  fotoUrl?: string | null;
}
export interface ParejaBracket {
  id?: string | null; // id de la inscripción (la pareja) — para "seguir pareja"
  jugador1?: JugadorBracket | null;
  jugador2?: JugadorBracket | null;
}
export interface PartidoBracket {
  id: string;
  fase: string; // ZONA, OCTAVOS, CUARTOS, SEMIS, FINAL, REPECHAJE...
  orden: number;
  esBye: boolean;
  inscripcion1?: ParejaBracket | null;
  inscripcion2?: ParejaBracket | null;
  origen1?: string | null;
  origen2?: string | null;
  ganador?: ParejaBracket | null;
  resultado?: { set1: [number, number]; set2?: [number, number]; set3?: [number, number] };
  fecha?: string | null;
  hora?: string | null;
  cancha?: string | null;
  sede?: string | null;
}
export interface CategoriaBracket {
  id: string;
  nombre: string;
  tipo: string;
}
export interface Campeon {
  categoriaId: string;
  categoriaNombre: string;
  campeon: {
    id?: string;
    jugador1?: { id: string; nombre: string; apellido: string; fotoUrl?: string | null } | null;
    jugador2?: { id: string; nombre: string; apellido: string; fotoUrl?: string | null } | null;
  };
}

export type TorneoEstadoFiltro = 'proximos' | 'en-curso' | 'finalizados' | 'todos';

export interface TorneoFilters {
  q?: string;
  ciudad?: string;
  categoria?: string;
  estado?: TorneoEstadoFiltro;
  page?: number;
  limit?: number;
}

export interface TorneosPublicResponse {
  success: boolean;
  torneos: TorneoListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface DatosFiltros {
  success: boolean;
  ciudades: string[];
  categorias: Array<{ id: string; nombre: string; tipo: string }>;
}

// ═══════════════════════════════════════════════════════
// SERVICIO
// ═══════════════════════════════════════════════════════

export const torneoService = {
  /** GET /t/public — lista pública de torneos con filtros */
  getPublicTorneos: async (filters: TorneoFilters = {}): Promise<TorneosPublicResponse> => {
    const params = new URLSearchParams();
    if (filters.q) params.append('q', filters.q);
    if (filters.ciudad) params.append('ciudad', filters.ciudad);
    if (filters.categoria) params.append('categoria', filters.categoria);
    if (filters.estado) params.append('estado', filters.estado);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    const res = await api.get(`/t/public?${params.toString()}`);
    return res.data;
  },

  /** GET /t/:slug — detalle de un torneo por slug */
  getTorneoBySlug: async (slug: string): Promise<TorneoDetalle> => {
    const res = await api.get(`/t/${slug}`);
    return res.data.torneo;
  },

  /** GET /public/torneos/:id/inscritos — parejas inscriptas (confirmadas) por categoría */
  getInscritos: async (tournamentId: string): Promise<{ totalInscritos: number; categorias: CategoriaInscritos[] }> => {
    const res = await api.get(`/public/torneos/${tournamentId}/inscritos`);
    return { totalInscritos: res.data?.totalInscritos ?? 0, categorias: res.data?.categorias ?? [] };
  },

  /** GET /public/torneos/:id/categorias — categorías con cuadro publicado */
  getCategoriasBracket: async (tournamentId: string): Promise<CategoriaBracket[]> => {
    const res = await api.get(`/public/torneos/${tournamentId}/categorias`);
    return res.data?.categorias ?? [];
  },

  /** GET /public/torneos/:id/bracket?categoriaId= — partidos del cuadro */
  getBracket: async (tournamentId: string, categoriaId: string): Promise<PartidoBracket[]> => {
    const res = await api.get(`/public/torneos/${tournamentId}/bracket?categoriaId=${categoriaId}`);
    return res.data?.partidos ?? [];
  },

  /** GET /public/torneos/:id/campeones — campeón por categoría (finalizados) */
  getCampeones: async (tournamentId: string): Promise<Campeon[]> => {
    const res = await api.get(`/public/torneos/${tournamentId}/campeones`);
    return res.data?.campeones ?? [];
  },

  /** GET /t/datos/filtros — ciudades y categorías para los filtros */
  getDatosFiltros: async (): Promise<DatosFiltros> => {
    const res = await api.get('/t/datos/filtros');
    return res.data;
  },
};
