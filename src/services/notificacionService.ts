import { api } from './api';

export type TipoNotificacion =
  | 'SISTEMA' | 'TORNEO' | 'INSCRIPCION' | 'PARTIDO'
  | 'RANKING' | 'SOCIAL' | 'PAGO' | 'MENSAJE';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion | string;
  titulo: string | null;
  contenido: string;
  enlace: string | null;
  leida: boolean;
  createdAt: string;
}

export const notificacionService = {
  /** GET /notificaciones — lista del usuario */
  getNotificaciones: async (): Promise<Notificacion[]> => {
    const res = await api.get('/notificaciones?limit=50');
    return res.data?.data?.notificaciones ?? [];
  },

  /** GET /notificaciones/no-leidas — contador */
  getNoLeidasCount: async (): Promise<number> => {
    const res = await api.get('/notificaciones/no-leidas');
    return res.data?.data?.count ?? 0;
  },

  /** PUT /notificaciones/:id/leer */
  marcarLeida: async (id: string): Promise<void> => {
    await api.put(`/notificaciones/${id}/leer`);
  },

  /** PUT /notificaciones/leer-todas */
  marcarTodasLeidas: async (): Promise<void> => {
    await api.put('/notificaciones/leer-todas');
  },
};
