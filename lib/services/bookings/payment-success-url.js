/**
 * Construye la URL de éxito para el retorno de Mercado Pago.
 * Si el tenant tiene slug, redirige a /{slug}?section=turnos; si no, a /reservas/exito.
 * @param {string} baseUrl
 * @param {string|null|undefined} tenantSlug
 * @returns {string}
 */
function buildPaymentSuccessUrl(baseUrl, tenantSlug) {
  if (tenantSlug && tenantSlug.trim()) {
    return `${baseUrl.replace(/\/$/, '')}/${tenantSlug.replace(/^\//, '')}?section=turnos`;
  }
  return `${baseUrl.replace(/\/$/, '')}/reservas/exito`;
}

module.exports = { buildPaymentSuccessUrl };
