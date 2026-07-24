/**
 * Utility formatters used across the application.
 */

export const formatMoney = (value) => new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
}).format(Number(value || 0))
