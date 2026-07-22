import { activeEvent } from './mockData'

const demoAttendees = [
  {
    id: 101,
    nombre: 'Martina Ríos',
    dni: '40111222',
    tipo_ingreso: 'Entrada web',
    estado: 'pendiente',
    rrpp_nombre: 'Juan RRPP',
    qr_code: 'NORWARE-DEMO-101',
  },
  {
    id: 102,
    nombre: 'Tomás Vega',
    dni: '38987654',
    tipo_ingreso: 'Lista RRPP',
    estado: 'pendiente',
    rrpp_nombre: 'Lola Méndez',
    qr_code: 'NORWARE-DEMO-102',
  },
  {
    id: 103,
    nombre: 'Lucía Ferreyra',
    dni: '42555111',
    tipo_ingreso: 'Venta general',
    estado: 'ingresado',
    rrpp_nombre: null,
    qr_code: 'NORWARE-DEMO-103',
  },
]

export const guardDemoCapacity = {
  ingresados: activeEvent.ingresados,
  aforo_max: activeEvent.aforo_max,
  porcentaje: Math.round((activeEvent.ingresados / activeEvent.aforo_max) * 100),
  pendientes: activeEvent.pendientes,
}

const normalizeValue = (value) => String(value || '').trim().toUpperCase()

export function findDemoAttendee({ qr_code: qrCode, dni }) {
  const attendee = dni
    ? demoAttendees.find((person) => person.dni === String(dni).trim())
    : demoAttendees.find((person) => person.qr_code === normalizeValue(qrCode))

  if (attendee) return { ...attendee }

  if (qrCode) {
    return {
      ...demoAttendees[0],
      id: 900,
      qr_code: normalizeValue(qrCode),
    }
  }

  return null
}

export function applyDemoGuardAction(attendee, action, motivo = '') {
  if (action === 'aprobar') {
    return {
      id: attendee.id,
      estado: 'ingresado',
      aprobado_at: new Date().toISOString(),
      mensaje: 'Ingreso aprobado',
    }
  }

  return {
    id: attendee.id,
    estado: 'rebotado',
    rebotado_at: new Date().toISOString(),
    motivo,
  }
}

export const guardDemoCodes = demoAttendees.map(({ nombre, dni, qr_code: qrCode }) => ({ nombre, dni, qrCode }))
