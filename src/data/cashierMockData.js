import { activeEvent } from './mockData'

const demoCashierPeople = [
  {
    id: 201,
    nombre: 'Martina',
    apellido: 'Ríos',
    dni: '40111222',
    rrpp_nombre: null,
    tipo_ingreso: 'entrada_web',
    estado: 'aprobado_guardia',
    monto_pago: 0,
    qr_code: 'NORWARE-WEB-201',
  },
  {
    id: 202,
    nombre: 'Tomás',
    apellido: 'Vega',
    dni: '38987654',
    rrpp_nombre: 'Juan RRPP',
    tipo_ingreso: 'lista_rrpp',
    estado: 'pendiente_pago',
    monto_pago: 5500,
    qr_code: 'NORWARE-LISTA-202',
  },
  {
    id: 203,
    nombre: 'Lucía',
    apellido: 'Ferreyra',
    dni: '42555111',
    rrpp_nombre: 'Lola Méndez',
    tipo_ingreso: 'lista_rrpp',
    estado: 'pendiente_pago',
    monto_pago: 5500,
    qr_code: 'NORWARE-LISTA-203',
  },
]

export const cashierDemoCapacity = {
  ingresados: activeEvent.ingresados,
  aforo_max: activeEvent.aforo_max,
  porcentaje: Math.round((activeEvent.ingresados / activeEvent.aforo_max) * 100),
  pendientes: activeEvent.pendientes,
}

export function findDemoCashierPersonByDni(dni) {
  const person = demoCashierPeople.find((item) => item.dni === String(dni).trim())
  return person ? { ...person } : null
}

export function parseCashierQr(value) {
  const raw = String(value || '').trim()
  const demoPerson = demoCashierPeople.find((item) => item.qr_code === raw)
  return demoPerson ? { ...demoPerson } : null
}

export function createDemoCashierTransaction(type, payload = {}) {
  const id = Date.now()
  const labels = {
    web: 'Entrada web validada',
    lista: `Pago por ${payload.metodo_pago || 'caja'} registrado`,
    venta: `${payload.personas?.length || 1} entrada${payload.personas?.length === 1 ? '' : 's'} vendida${payload.personas?.length === 1 ? '' : 's'}`,
  }
  return { id, estado: 'ingresado', mensaje: labels[type], created_at: new Date().toISOString() }
}

export function undoDemoCashierTransaction(id) {
  return { id, estado: 'deshecho', mensaje: 'Operación deshecha correctamente' }
}

export const cashierDemoHints = {
  webQr: 'NORWARE-WEB-201',
  listDni: '38987654',
}
