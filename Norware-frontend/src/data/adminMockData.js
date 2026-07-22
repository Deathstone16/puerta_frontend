/**
 * Admin Norware mock data — fallback when GET /api/admin/metricas/ is unreachable.
 */

export const adminMockData = {
  totales: {
    entradas_web_total: 3420,
    comision_norware_total: 684000,
    eventos_activos: 4,
    eventos_cancelados: 1,
  },
  por_evento: [
    {
      evento_id: 1,
      evento_nombre: 'NEON PROTOCOL',
      boliche: 'NACHT',
      fecha: '2026-08-15',
      estado: 'publicado',
      entradas_web: 1245,
      comision_norware: 249000,
      recaudado_total_web: 5602500,
    },
    {
      evento_id: 2,
      evento_nombre: 'AFTER DARK',
      boliche: 'HALO CLUB',
      fecha: '2026-08-22',
      estado: 'publicado',
      entradas_web: 890,
      comision_norware: 178000,
      recaudado_total_web: 3471000,
    },
    {
      evento_id: 3,
      evento_nombre: 'RITUAL 909',
      boliche: 'SUBSUELO',
      fecha: '2026-08-29',
      estado: 'cancelado',
      entradas_web: 412,
      comision_norware: 82400,
      recaudado_total_web: 1977600,
    },
    {
      evento_id: 4,
      evento_nombre: 'LATENCIA',
      boliche: 'DÓMINA',
      fecha: '2026-09-05',
      estado: 'publicado',
      entradas_web: 873,
      comision_norware: 174600,
      recaudado_total_web: 3666600,
    },
  ],
}
