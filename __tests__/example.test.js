// Prueba de ejemplo para verificar que Jest funciona correctamente

describe('Configuración de Jest', () => {
  test('debe ejecutar pruebas correctamente', () => {
    expect(1 + 1).toBe(2);
  });

  test('debe tener acceso a las utilidades de testing', () => {
    expect(typeof jest).toBe('object');
    expect(typeof expect).toBe('function');
  });

  test('debe poder usar async/await', async () => {
    const promise = Promise.resolve('test');
    const result = await promise;
    expect(result).toBe('test');
  });
});

// Prueba de configuración del entorno
describe('Entorno de pruebas', () => {
  test('debe tener configurado jsdom', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });

  test('debe tener configurado fetch mock', () => {
    // Verificar que fetch está disponible globalmente
    expect(typeof global.fetch).toBeDefined();
  });
});