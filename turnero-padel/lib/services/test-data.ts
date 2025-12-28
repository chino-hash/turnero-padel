// Usando strings directamente en lugar de enums para evitar problemas en tests

// Datos de prueba para usuarios
export const testUsers = [
  {
    id: 'test-user-1',
    name: 'Juan Pérez',
    email: 'juan.perez@example.com',
    fullName: 'Juan Carlos Pérez',
    phone: '+54 11 1234-5678',
    role: 'USER',
    isActive: true,
    preferences: JSON.stringify({
      notifications: true,
      language: 'es',
      theme: 'light'
    })
  },
  {
    id: 'test-user-2',
    name: 'María González',
    email: 'maria.gonzalez@example.com',
    fullName: 'María Elena González',
    phone: '+54 11 2345-6789',
    role: 'USER',
    isActive: true,
    preferences: JSON.stringify({
      notifications: false,
      language: 'es',
      theme: 'dark'
    })
  },
  {
    id: 'test-admin-1',
    name: 'Admin Sistema',
    email: 'admin@padel.com',
    fullName: 'Administrador del Sistema',
    phone: '+54 11 9999-0000',
    role: 'ADMIN',
    isActive: true,
    preferences: JSON.stringify({
      notifications: true,
      language: 'es',
      theme: 'light',
      adminPanel: true
    })
  },
  {
    id: 'test-user-3',
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@example.com',
    fullName: 'Carlos Alberto Rodríguez',
    phone: '+54 11 3456-7890',
    role: 'USER',
    isActive: false,
    preferences: JSON.stringify({
      notifications: true,
      language: 'es'
    })
  }
];

// Datos de prueba para canchas
export const testCourts = [
  {
    id: 'test-court-1',
    name: 'Cancha 1 - Principal',
    description: 'Cancha principal con césped sintético de última generación',
    basePrice: 5000,
    priceMultiplier: 1.0,
    features: JSON.stringify({
      lighting: true,
      roof: false,
      surface: 'synthetic_grass',
      size: 'standard',
      amenities: ['parking', 'changing_room', 'shower']
    }),
    isActive: true,
    operatingHours: JSON.stringify({
      start: '08:00',
      end: '22:00',
      slot_duration: 90
    })
  },
  {
    id: 'test-court-2',
    name: 'Cancha 2 - Techada',
    description: 'Cancha techada ideal para días de lluvia',
    basePrice: 6000,
    priceMultiplier: 1.2,
    features: JSON.stringify({
      lighting: true,
      roof: true,
      surface: 'synthetic_grass',
      size: 'standard',
      amenities: ['parking', 'changing_room', 'shower', 'air_conditioning']
    }),
    isActive: true,
    operatingHours: JSON.stringify({
      start: '07:00',
      end: '23:00',
      slot_duration: 90
    })
  },
  {
    id: 'test-court-3',
    name: 'Cancha 3 - Premium',
    description: 'Cancha premium con todas las comodidades',
    basePrice: 7500,
    priceMultiplier: 1.5,
    features: JSON.stringify({
      lighting: true,
      roof: true,
      surface: 'professional_grass',
      size: 'standard',
      amenities: ['vip_parking', 'premium_changing_room', 'shower', 'air_conditioning', 'sound_system']
    }),
    isActive: true,
    operatingHours: JSON.stringify({
      start: '06:00',
      end: '24:00',
      slot_duration: 90
    })
  },
  {
    id: 'test-court-4',
    name: 'Cancha 4 - Mantenimiento',
    description: 'Cancha en mantenimiento',
    basePrice: 5000,
    priceMultiplier: 1.0,
    features: JSON.stringify({
      lighting: false,
      roof: false,
      surface: 'synthetic_grass',
      size: 'standard'
    }),
    isActive: false,
    operatingHours: JSON.stringify({
      start: '08:00',
      end: '20:00',
      slot_duration: 90
    })
  }
];

// Datos de prueba para reservas
export const testBookings = [
  {
    id: 'test-booking-1',
    courtId: 'test-court-1',
    userId: 'test-user-1',
    bookingDate: new Date('2024-02-15'),
    startTime: '10:00',
    endTime: '11:30',
    durationMinutes: 90,
    totalPrice: 5000,
    depositAmount: 2500,
    status: 'CONFIRMED',
    paymentStatus: 'DEPOSIT_PAID',
    paymentMethod: 'BANK_TRANSFER',
    notes: 'Reserva para torneo interno'
  },
  {
    id: 'test-booking-2',
    courtId: 'test-court-2',
    userId: 'test-user-2',
    bookingDate: new Date('2024-02-15'),
    startTime: '14:00',
    endTime: '15:30',
    durationMinutes: 90,
    totalPrice: 7200,
    depositAmount: 7200,
    status: 'CONFIRMED',
    paymentStatus: 'FULLY_PAID',
    paymentMethod: 'CASH',
    notes: 'Clase particular'
  },
  {
    id: 'test-booking-3',
    courtId: 'test-court-1',
    userId: 'test-user-1',
    bookingDate: new Date('2024-02-16'),
    startTime: '18:00',
    endTime: '19:30',
    durationMinutes: 90,
    totalPrice: 5000,
    depositAmount: 0,
    status: 'PENDING',
    paymentStatus: 'PENDING',
    notes: 'Pendiente de confirmación'
  },
  {
    id: 'test-booking-4',
    courtId: 'test-court-3',
    userId: 'test-user-2',
    bookingDate: new Date('2024-02-14'),
    startTime: '20:00',
    endTime: '21:30',
    durationMinutes: 90,
    totalPrice: 11250,
    depositAmount: 11250,
    status: 'COMPLETED',
    paymentStatus: 'FULLY_PAID',
    paymentMethod: 'CARD',
    notes: 'Partido completado exitosamente'
  },
  {
    id: 'test-booking-5',
    courtId: 'test-court-1',
    userId: 'test-user-3',
    bookingDate: new Date('2024-02-17'),
    startTime: '16:00',
    endTime: '17:30',
    durationMinutes: 90,
    totalPrice: 5000,
    depositAmount: 2500,
    status: 'CANCELLED',
    paymentStatus: 'DEPOSIT_PAID',
    paymentMethod: 'BANK_TRANSFER',
    notes: 'Cancelado por lluvia',
    cancelledAt: new Date('2024-02-16'),
    cancellationReason: 'Condiciones climáticas adversas'
  }
];

// Datos de prueba para jugadores de reservas
export const testBookingPlayers = [
  {
    id: 'test-player-1',
    bookingId: 'test-booking-1',
    playerName: 'Juan Pérez',
    playerPhone: '+54 11 1234-5678',
    playerEmail: 'juan.perez@example.com',
    hasPaid: true,
    paidAmount: 1250,
    paidAt: new Date('2024-02-10'),
    paymentMethod: 'BANK_TRANSFER',
    position: 1,
    notes: 'Jugador principal'
  },
  {
    id: 'test-player-2',
    bookingId: 'test-booking-1',
    playerName: 'Pedro Martínez',
    playerPhone: '+54 11 5678-9012',
    playerEmail: 'pedro.martinez@example.com',
    hasPaid: true,
    paidAmount: 1250,
    paidAt: new Date('2024-02-10'),
    paymentMethod: 'CASH',
    position: 2,
    notes: 'Compañero de Juan'
  },
  {
    id: 'test-player-3',
    bookingId: 'test-booking-1',
    playerName: 'Luis García',
    playerPhone: '+54 11 9012-3456',
    playerEmail: 'luis.garcia@example.com',
    hasPaid: false,
    paidAmount: 0,
    position: 3,
    notes: 'Pendiente de pago'
  },
  {
    id: 'test-player-4',
    bookingId: 'test-booking-1',
    playerName: 'Ana López',
    playerPhone: '+54 11 3456-7890',
    playerEmail: 'ana.lopez@example.com',
    hasPaid: true,
    paidAmount: 1250,
    paidAt: new Date('2024-02-11'),
    paymentMethod: 'CARD',
    position: 4,
    notes: 'Jugadora experimentada'
  },
  {
    id: 'test-player-5',
    bookingId: 'test-booking-2',
    playerName: 'María González',
    playerPhone: '+54 11 2345-6789',
    playerEmail: 'maria.gonzalez@example.com',
    hasPaid: true,
    paidAmount: 3600,
    paidAt: new Date('2024-02-12'),
    paymentMethod: 'CASH',
    position: 1,
    notes: 'Clase individual'
  },
  {
    id: 'test-player-6',
    bookingId: 'test-booking-2',
    playerName: 'Profesor Carlos',
    playerPhone: '+54 11 7890-1234',
    playerEmail: 'profesor.carlos@padel.com',
    hasPaid: true,
    paidAmount: 3600,
    paidAt: new Date('2024-02-12'),
    paymentMethod: 'CASH',
    position: 2,
    notes: 'Instructor profesional'
  }
];

// Datos de prueba para pagos
export const testPayments = [
  {
    id: 'test-payment-1',
    bookingId: 'test-booking-1',
    playerId: 'test-player-1',
    processedById: 'test-admin-1',
    amount: 1250,
    paymentMethod: 'BANK_TRANSFER',
    paymentType: 'PAYMENT',
    referenceNumber: 'TRF-001-2024',
    notes: 'Pago parcial de Juan Pérez',
    status: 'completed'
  },
  {
    id: 'test-payment-2',
    bookingId: 'test-booking-1',
    playerId: 'test-player-2',
    processedById: 'test-admin-1',
    amount: 1250,
    paymentMethod: 'CASH',
    paymentType: 'PAYMENT',
    notes: 'Pago en efectivo de Pedro',
    status: 'completed'
  },
  {
    id: 'test-payment-3',
    bookingId: 'test-booking-1',
    playerId: 'test-player-4',
    processedById: 'test-admin-1',
    amount: 1250,
    paymentMethod: 'CARD',
    paymentType: 'PAYMENT',
    referenceNumber: 'CARD-002-2024',
    notes: 'Pago con tarjeta de Ana',
    status: 'completed'
  },
  {
    id: 'test-payment-4',
    bookingId: 'test-booking-2',
    playerId: 'test-player-5',
    processedById: 'test-admin-1',
    amount: 7200,
    paymentMethod: 'CASH',
    paymentType: 'PAYMENT',
    notes: 'Pago completo clase particular',
    status: 'completed'
  },
  {
    id: 'test-payment-5',
    bookingId: 'test-booking-4',
    processedById: 'test-admin-1',
    amount: 11250,
    paymentMethod: 'CARD',
    paymentType: 'PAYMENT',
    referenceNumber: 'CARD-003-2024',
    notes: 'Pago completo cancha premium',
    status: 'completed'
  },
  {
    id: 'test-payment-6',
    bookingId: 'test-booking-5',
    processedById: 'test-admin-1',
    amount: 2500,
    paymentMethod: 'BANK_TRANSFER',
    paymentType: 'REFUND',
    referenceNumber: 'REF-001-2024',
    notes: 'Reembolso por cancelación',
    status: 'completed'
  }
];

// Datos de prueba para configuraciones del sistema
export const testSystemSettings = [
  {
    id: 'test-setting-1',
    key: 'booking_advance_days',
    value: '30',
    description: 'Días de anticipación máxima para reservas',
    category: 'booking',
    isPublic: true
  },
  {
    id: 'test-setting-2',
    key: 'default_slot_duration',
    value: '90',
    description: 'Duración por defecto de los turnos en minutos',
    category: 'booking',
    isPublic: true
  },
  {
    id: 'test-setting-3',
    key: 'minimum_deposit_percentage',
    value: '50',
    description: 'Porcentaje mínimo de seña requerido',
    category: 'payment',
    isPublic: true
  },
  {
    id: 'test-setting-4',
    key: 'cancellation_hours_limit',
    value: '24',
    description: 'Horas mínimas para cancelar sin penalización',
    category: 'booking',
    isPublic: true
  },
  {
    id: 'test-setting-5',
    key: 'admin_email',
    value: 'admin@padel.com',
    description: 'Email del administrador principal',
    category: 'system',
    isPublic: false
  },
  {
    id: 'test-setting-6',
    key: 'business_name',
    value: 'Club de Pádel Premium',
    description: 'Nombre del negocio',
    category: 'general',
    isPublic: true
  },
  {
    id: 'test-setting-7',
    key: 'business_phone',
    value: '+54 11 4000-0000',
    description: 'Teléfono del negocio',
    category: 'general',
    isPublic: true
  },
  {
    id: 'test-setting-8',
    key: 'business_address',
    value: 'Av. Libertador 1234, CABA',
    description: 'Dirección del negocio',
    category: 'general',
    isPublic: true
  }
];

// Datos de prueba para productos
export const testProductos = [
  {
    id: 1,
    nombre: 'Pelota de Pádel Wilson',
    precio: 1500.00,
    stock: 50,
    categoria: 'pelotas',
    activo: true
  },
  {
    id: 2,
    nombre: 'Paleta Head Delta Pro',
    precio: 45000.00,
    stock: 15,
    categoria: 'paletas',
    activo: true
  },
  {
    id: 3,
    nombre: 'Zapatillas Adidas Pádel',
    precio: 25000.00,
    stock: 8,
    categoria: 'calzado',
    activo: true
  },
  {
    id: 4,
    nombre: 'Grip Bullpadel',
    precio: 800.00,
    stock: 100,
    categoria: 'accesorios',
    activo: true
  },
  {
    id: 5,
    nombre: 'Bolso Deportivo',
    precio: 8500.00,
    stock: 20,
    categoria: 'accesorios',
    activo: true
  },
  {
    id: 6,
    nombre: 'Paleta Babolat Viper',
    precio: 52000.00,
    stock: 0,
    categoria: 'paletas',
    activo: false
  }
];

// Datos de prueba para whitelist de administradores
export const testAdminWhitelist = [
  {
    id: 'test-whitelist-1',
    email: 'admin@padel.com',
    isActive: true,
    addedBy: 'system',
    notes: 'Administrador principal del sistema'
  },
  {
    id: 'test-whitelist-2',
    email: 'manager@padel.com',
    isActive: true,
    addedBy: 'test-admin-1',
    notes: 'Gerente de operaciones'
  },
  {
    id: 'test-whitelist-3',
    email: 'supervisor@padel.com',
    isActive: true,
    addedBy: 'test-admin-1',
    notes: 'Supervisor de canchas'
  },
  {
    id: 'test-whitelist-4',
    email: 'old.admin@padel.com',
    isActive: false,
    addedBy: 'test-admin-1',
    notes: 'Ex-administrador desactivado'
  }
];

// Función para obtener todos los datos de prueba
export const getAllTestData = () => {
  return {
    users: testUsers,
    courts: testCourts,
    bookings: testBookings,
    bookingPlayers: testBookingPlayers,
    payments: testPayments,
    systemSettings: testSystemSettings,
    productos: testProductos,
    adminWhitelist: testAdminWhitelist
  };
};

// Función para obtener datos de prueba por modelo
export const getTestDataByModel = (model: string) => {
  const allData = getAllTestData();
  const modelMap: { [key: string]: any } = {
    user: allData.users,
    court: allData.courts,
    booking: allData.bookings,
    bookingPlayer: allData.bookingPlayers,
    payment: allData.payments,
    systemSetting: allData.systemSettings,
    producto: allData.productos,
    adminWhitelist: allData.adminWhitelist
  };
  
  return modelMap[model] || [];
};

// Función para limpiar datos de prueba (útil para tests)
export const getCleanTestData = (model: string) => {
  const data = getTestDataByModel(model);
  return data.map((item: any) => {
    const { id, createdAt, updatedAt, ...cleanItem } = item;
    return cleanItem;
  });
};

// Validaciones específicas por modelo
export const getValidationRules = (model: string) => {
  const rules: { [key: string]: any[] } = {
    user: [
      { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 100 },
      { field: 'email', required: true, type: 'email' },
      { field: 'phone', type: 'string', pattern: /^\+?[1-9]\d{1,14}$/ },
      { field: 'role', required: true, custom: (value: any) => ['USER', 'ADMIN'].includes(value) }
    ],
    court: [
      { field: 'name', required: true, type: 'string', minLength: 3, maxLength: 100 },
      { field: 'basePrice', required: true, type: 'number', min: 0 },
      { field: 'priceMultiplier', required: true, type: 'number', min: 0.1, max: 10 }
    ],
    booking: [
      { field: 'courtId', required: true, type: 'string' },
      { field: 'userId', required: true, type: 'string' },
      { field: 'bookingDate', required: true, type: 'date' },
      { field: 'startTime', required: true, type: 'string', pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      { field: 'endTime', required: true, type: 'string', pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ },
      { field: 'totalPrice', required: true, type: 'number', min: 0 }
    ],
    bookingPlayer: [
      { field: 'bookingId', required: true, type: 'string' },
      { field: 'playerName', required: true, type: 'string', minLength: 2, maxLength: 100 },
      { field: 'playerEmail', type: 'email' },
      { field: 'paidAmount', required: true, type: 'number', min: 0 }
    ],
    payment: [
      { field: 'bookingId', required: true, type: 'string' },
      { field: 'amount', required: true, type: 'number', min: 0 },
      { field: 'paymentMethod', required: true, custom: (value: any) => ['CASH', 'BANK_TRANSFER', 'CARD'].includes(value) }
    ],
    systemSetting: [
      { field: 'key', required: true, type: 'string', minLength: 1, maxLength: 100 },
      { field: 'value', required: true, type: 'string' },
      { field: 'category', required: true, type: 'string', minLength: 1, maxLength: 50 }
    ],
    producto: [
      { field: 'nombre', required: true, type: 'string', minLength: 2, maxLength: 200 },
      { field: 'precio', required: true, type: 'number', min: 0 },
      { field: 'stock', required: true, type: 'number', min: 0 },
      { field: 'categoria', required: true, type: 'string', minLength: 1, maxLength: 50 }
    ],
    adminWhitelist: [
      { field: 'email', required: true, type: 'email' }
    ]
  };
  
  return rules[model] || [];
};