/**
 * Dashboard mock data — used as fallback when the backend is unreachable.
 * Matches the API response shapes consumed by the DashboardPage and its tabs.
 */

export const mockBoliche = {
  id: 1,
  nombre: 'NACHT',
  direccion: 'Av. Costanera Norte 1234, Buenos Aires',
  mp_connected: false,
  created_at: '2026-01-15T10:00:00-03:00',
}

export const mockEventos = [
  {
    id: 1,
    nombre: 'NEON PROTOCOL',
    fecha: '2026-08-15T23:59:00-03:00',
    precio_base: 3800,
    precio_publicado: 4500,
    aforo_max: 800,
    estado: 'publicado',
    boliche: 1,
    line_up: ['Cata Ferreyra', 'Lorenzo', 'NIKKA'],
  },
  {
    id: 2,
    nombre: 'AFTER DARK',
    fecha: '2026-08-22T23:30:00-03:00',
    precio_base: 3200,
    precio_publicado: 3900,
    aforo_max: 650,
    estado: 'publicado',
    boliche: 1,
    line_up: ['Mora', 'Santi Paz'],
  },
  {
    id: 3,
    nombre: 'RITUAL 909',
    fecha: '2026-08-29T23:45:00-03:00',
    precio_base: 4000,
    precio_publicado: 4800,
    aforo_max: 500,
    estado: 'cancelado',
    boliche: 1,
    line_up: ['VNTM', 'Juno'],
  },
]

export const mockAforo = {
  evento_id: 1,
  ingresados: 184,
  aforo_max: 300,
  porcentaje: 61,
  pendientes: 42,
}

export const mockRecaudacion = {
  web: { cantidad: 312, monto_bruto: 1404000, comision_norware: 35100 },
  efectivo: { cantidad: 89, monto: 400500 },
  transferencia: { cantidad: 45, monto: 202500 },
  total_recaudado: 2007000,
  comision_norware_web: 35100,
}

export const mockRankingRrpp = [
  {
    rrpp_id: 1,
    nombre: 'Lucía Fernández',
    tipo_comision: 'por_ingreso',
    valor_comision: 500,
    anotados: 28,
    ingresados: 21,
    rebotados: 2,
    tasa_conversion: 75,
    recaudado_total: 94500,
    comision_a_pagar: 10500,
  },
  {
    rrpp_id: 2,
    nombre: 'Matías Gomez',
    tipo_comision: 'por_ingreso',
    valor_comision: 500,
    anotados: 15,
    ingresados: 12,
    rebotados: 1,
    tasa_conversion: 80,
    recaudado_total: 54000,
    comision_a_pagar: 6000,
  },
  {
    rrpp_id: 3,
    nombre: 'Valentina Cruz',
    tipo_comision: 'por_ingreso',
    valor_comision: 500,
    anotados: 42,
    ingresados: 38,
    rebotados: 0,
    tasa_conversion: 90,
    recaudado_total: 171000,
    comision_a_pagar: 19000,
  },
  {
    rrpp_id: 4,
    nombre: 'Bruno Díaz',
    tipo_comision: 'fija',
    valor_comision: 8000,
    anotados: 9,
    ingresados: 5,
    rebotados: 1,
    tasa_conversion: 56,
    recaudado_total: 22500,
    comision_a_pagar: 8000,
  },
]
