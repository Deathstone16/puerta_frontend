/**
 * Input filters — normalizan lo que el usuario tipea o pega según el tipo de campo.
 * Se aplican en el onChange para que el valor inválido nunca llegue al state.
 */

/** DNI: solo dígitos, máximo 8. */
export function filterDni(value) {
  return String(value ?? '').replace(/\D/g, '').slice(0, 8)
}

/** Nombre/apellido: letras (con tildes y ñ), espacios y guiones. */
export function filterName(value) {
  return String(value ?? '').replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s'-]/g, '')
}

/** Enteros positivos (aforo, cantidades). */
export function filterInteger(value) {
  return String(value ?? '').replace(/\D/g, '')
}

/** Decimales positivos con un único punto (precios). */
export function filterDecimal(value) {
  return String(value ?? '')
    .replace(/[^0-9.]/g, '')
    .replace(/(\..*)\./g, '$1')
}

/** Usuario de Instagram: alfanumérico, punto, guion bajo. Sin @ inicial duplicado. */
export function filterInstagram(value) {
  return String(value ?? '').replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30)
}
