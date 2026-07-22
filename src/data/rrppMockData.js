const INITIAL_RRPP_EVENTS = [
  {
    id: 1,
    slug: 'juan-neon-protocol',
    nombre: 'Neon Protocol',
    fecha: '2026-05-16T23:30:00-03:00',
    club: 'Club Vértigo',
    link_personal: '/lista/juan-neon-protocol',
    cupo_max: 220,
    anotados: 168,
    ingresados: 95,
    pendientes: 69,
    rebotados: 4,
    comision: { tipo: 'por_ingreso', valor: 1500, acumulada: 142500 },
    invitados_recientes: [
      { id: 'demo-1-1', nombre: 'Camila', apellido: 'Rojas', dni: '42148376', instagram: 'cami.rojas', estado: 'pendiente', creado_en: '2026-05-14T20:42:00-03:00' },
      { id: 'demo-1-2', nombre: 'Tomás', apellido: 'Méndez', dni: '39876541', instagram: 'tomas_mdz', estado: 'ingresado', creado_en: '2026-05-14T19:18:00-03:00' },
      { id: 'demo-1-3', nombre: 'Lara', apellido: 'Paz', dni: '44012387', instagram: 'larapaz99', estado: 'pendiente', creado_en: '2026-05-14T18:51:00-03:00' },
    ],
  },
  {
    id: 2,
    slug: 'juan-after-hours',
    nombre: 'After Hours',
    fecha: '2026-06-06T23:59:00-03:00',
    club: 'Distrito 9',
    link_personal: '/lista/juan-after-hours',
    cupo_max: 140,
    anotados: 87,
    ingresados: 31,
    pendientes: 54,
    rebotados: 2,
    comision: { tipo: 'por_ingreso', valor: 1800, acumulada: 55800 },
    invitados_recientes: [
      { id: 'demo-2-1', nombre: 'Nicolás', apellido: 'Sosa', dni: '41222444', estado: 'pendiente', creado_en: '2026-06-04T21:11:00-03:00' },
      { id: 'demo-2-2', nombre: 'Julieta', apellido: 'Acosta', dni: '43555666', estado: 'pendiente', creado_en: '2026-06-04T20:37:00-03:00' },
    ],
  },
]

const cloneGuest = (guest) => ({ ...guest })
const cloneEvent = (event) => ({
  ...event,
  comision: { ...event.comision },
  invitados_recientes: event.invitados_recientes.map(cloneGuest),
})

let demoEvents = INITIAL_RRPP_EVENTS.map(cloneEvent)
let demoGuestSequence = 100

export function getDemoRrppPanel() {
  return demoEvents.map(cloneEvent)
}

export function addDemoRrppGuest(eventId, guest) {
  const target = demoEvents.find((event) => String(event.id) === String(eventId))
  if (!target) throw new Error('El evento seleccionado ya no está disponible.')
  if (target.anotados >= target.cupo_max) throw new Error('El cupo de este evento está completo.')
  if (demoEvents.some((event) => event.invitados_recientes.some((item) => item.dni === guest.dni))) {
    throw new Error('Ya existe un invitado anotado con ese DNI.')
  }

  demoGuestSequence += 1
  const createdGuest = {
    id: `demo-${eventId}-${demoGuestSequence}`,
    nombre: guest.nombre,
    apellido: guest.apellido,
    dni: guest.dni,
    estado: 'pendiente',
    creado_en: new Date().toISOString(),
  }

  demoEvents = demoEvents.map((event) => String(event.id) !== String(eventId) ? event : {
    ...event,
    anotados: event.anotados + 1,
    pendientes: event.pendientes + 1,
    invitados_recientes: [createdGuest, ...event.invitados_recientes].slice(0, 8),
  })

  return {
    detail: 'Invitado anotado correctamente en la demo.',
    invitado: cloneGuest(createdGuest),
    evento: cloneEvent(demoEvents.find((event) => String(event.id) === String(eventId))),
  }
}
