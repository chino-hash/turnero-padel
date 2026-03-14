/**
 * Unit tests for buildPaymentSuccessUrl (used by BookingService.createPaymentPreference).
 * - successUrl uses {baseUrl}/{tenantSlug}?section=turnos when tenant has slug
 * - successUrl falls back to {baseUrl}/reservas/exito when tenant has no slug
 */

const { buildPaymentSuccessUrl } = require('../../../../lib/services/bookings/payment-success-url.js');

describe('buildPaymentSuccessUrl', () => {
  const baseUrl = 'https://www.padelbook.com.ar';

  it('returns baseUrl/slug?section=turnos when tenant has slug', () => {
    expect(buildPaymentSuccessUrl(baseUrl, 'metro-padel-360')).toBe(
      'https://www.padelbook.com.ar/metro-padel-360?section=turnos'
    );
  });

  it('returns baseUrl/reservas/exito?section=turnos when tenantSlug is null', () => {
    expect(buildPaymentSuccessUrl(baseUrl, null)).toBe(
      'https://www.padelbook.com.ar/reservas/exito?section=turnos'
    );
  });

  it('returns baseUrl/reservas/exito?section=turnos when tenantSlug is undefined', () => {
    expect(buildPaymentSuccessUrl(baseUrl, undefined)).toBe(
      'https://www.padelbook.com.ar/reservas/exito?section=turnos'
    );
  });

  it('returns baseUrl/reservas/exito?section=turnos when tenantSlug is empty string', () => {
    expect(buildPaymentSuccessUrl(baseUrl, '')).toBe(
      'https://www.padelbook.com.ar/reservas/exito?section=turnos'
    );
  });

  it('strips trailing slash from baseUrl', () => {
    expect(buildPaymentSuccessUrl(baseUrl + '/', 'metro-padel-360')).toBe(
      'https://www.padelbook.com.ar/metro-padel-360?section=turnos'
    );
  });

  it('appends bookingId to query when provided', () => {
    expect(buildPaymentSuccessUrl(baseUrl, 'metro-padel-360', 'booking-123')).toBe(
      'https://www.padelbook.com.ar/metro-padel-360?section=turnos&bookingId=booking-123'
    );
    expect(buildPaymentSuccessUrl(baseUrl, null, 'booking-456')).toBe(
      'https://www.padelbook.com.ar/reservas/exito?section=turnos&bookingId=booking-456'
    );
  });
});
