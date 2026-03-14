/**
 * Construye la URL de éxito para el retorno de Mercado Pago.
 * Si el tenant tiene slug, redirige a /{slug}?section=turnos&bookingId=xxx; si no, a /reservas/exito?bookingId=xxx.
 * bookingId permite al front llamar sync-payment-status al volver del checkout.
 * @param {string} baseUrl
 * @param {string|null|undefined} tenantSlug
 * @param {string} [bookingId]
 * @returns {string}
 */
function buildPaymentSuccessUrl(baseUrl, tenantSlug, bookingId) {
  const base = baseUrl.replace(/\/$/, '');
  const query = new URLSearchParams();
  query.set('section', 'turnos');
  if (bookingId && bookingId.trim()) query.set('bookingId', bookingId.trim());
  const qs = query.toString();
  if (tenantSlug && tenantSlug.trim()) {
    return `${base}/${tenantSlug.replace(/^\//, '')}${qs ? '?' + qs : ''}`;
  }
  return `${base}/reservas/exito${qs ? '?' + qs : ''}`;
}

module.exports = { buildPaymentSuccessUrl };
