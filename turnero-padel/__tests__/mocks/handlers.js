// Mock data para las pruebas
// Nota: MSW se configurará más adelante cuando sea necesario
const mockCourts = [
  {
    id: 1,
    name: 'Cancha 1',
    covered: true,
    pricePerPerson: 500,
    maxPlayers: 4,
    available: true,
  },
  {
    id: 2,
    name: 'Cancha 2',
    covered: false,
    pricePerPerson: 400,
    maxPlayers: 4,
    available: true,
  },
];

const mockBookings = [
  {
    id: 1,
    courtId: 1,
    userId: '1',
    date: '2025-08-15',
    startTime: '10:00',
    endTime: '11:00',
    players: 4,
    totalPrice: 2000,
    status: 'confirmed',
  },
];

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  image: 'https://via.placeholder.com/150',
  role: 'user',
};

// Exportar datos mock para las pruebas
module.exports = {
  mockCourts,
  mockBookings,
  mockUser
};