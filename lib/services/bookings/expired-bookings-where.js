/**
 * Construye el where para buscar reservas PENDING expiradas y sin ningún pago.
 * Usado por ExpiredBookingsService para no cancelar reservas que ya tienen pago (webhook puede no haber actualizado aún).
 * @param {Date} now
 * @param {string|null|undefined} [tenantId]
 * @returns {{ status: string, expiresAt: { lt: Date }, payments: { none: {} }, tenantId?: string }}
 */
function buildExpiredPendingWithoutPaymentsWhere(now, tenantId) {
  const where = {
    status: 'PENDING',
    expiresAt: { lt: now },
    payments: { none: {} },
  };
  if (tenantId) {
    where.tenantId = tenantId;
  }
  return where;
}

module.exports = { buildExpiredPendingWithoutPaymentsWhere };
