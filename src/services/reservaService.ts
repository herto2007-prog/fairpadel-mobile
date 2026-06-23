import { api } from './api';

// ═══════════════════════════════════════════════════════
// TIPOS — reflejan el contrato del back (alquileres, público + auth)
// ═══════════════════════════════════════════════════════

export interface SlotDisp {
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
}

export interface CanchaDisp {
  cancha: { id: string; nombre: string; tipo: string; tieneLuz: boolean };
  slots: SlotDisp[];
}

export interface SedeDisp {
  sede: { id: string; nombre: string; ciudad: string; logoUrl?: string | null; direccion?: string | null };
  canchasDisponibles: number;
  totalCanchas: number;
  horarios: string[];
  totalHorarios: number;
  canchas: CanchaDisp[];
}

export interface MiReserva {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'RECHAZADA' | 'COMPLETADA';
  sedeCancha?: { nombre: string; sede?: { nombre: string; ciudad?: string } };
}

export interface CrearReservaInput {
  sedeCanchaId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  duracionMinutos: number;
}

export const reservaService = {
  /** GET /alquileres/disponibilidad-global — sedes con servicio activo + canchas/slots libres */
  getDisponibilidadGlobal: async (fecha: string, duracionMinutos: number): Promise<SedeDisp[]> => {
    const res = await api.get('/alquileres/disponibilidad-global', { params: { fecha, duracionMinutos } });
    return res.data?.sedes ?? [];
  },

  /** POST /alquileres/reservas — crea la reserva (auth) */
  crearReserva: async (data: CrearReservaInput) => {
    const res = await api.post('/alquileres/reservas', data);
    return res.data;
  },

  /** GET /alquileres/mis-reservas — reservas del jugador (auth) */
  getMisReservas: async (): Promise<MiReserva[]> => {
    const res = await api.get('/alquileres/mis-reservas');
    return Array.isArray(res.data) ? res.data : res.data?.reservas ?? [];
  },

  /** POST /alquileres/reservas/:id/cancelar — el jugador cancela su reserva (auth) */
  cancelarReserva: async (id: string) => {
    const res = await api.post(`/alquileres/reservas/${id}/cancelar`, {});
    return res.data;
  },
};
