import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock de next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Configuración de sesión mock por defecto
const defaultSession = {
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://via.placeholder.com/150',
    role: 'user',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

// Configuración de QueryClient para pruebas
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Wrapper personalizado que incluye todos los providers necesarios
interface AllTheProvidersProps {
  children: React.ReactNode;
  session?: any;
  queryClient?: QueryClient;
}

const AllTheProviders = ({ 
  children, 
  session = defaultSession,
  queryClient = createTestQueryClient()
}: AllTheProvidersProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
};

// Función de render personalizada
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: any;
  queryClient?: QueryClient;
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { session, queryClient, ...renderOptions } = options;
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders session={session} queryClient={queryClient}>
      {children}
    </AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Función para renderizar con sesión de usuario autenticado
export const renderWithAuth = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  return customRender(ui, {
    session: defaultSession,
    ...options,
  });
};

// Función para renderizar sin autenticación
export const renderWithoutAuth = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  return customRender(ui, {
    session: null,
    ...options,
  });
};

// Función para renderizar con sesión de admin
export const renderWithAdminAuth = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const adminSession = {
    ...defaultSession,
    user: {
      ...defaultSession.user,
      role: 'admin',
    },
  };
  
  return customRender(ui, {
    session: adminSession,
    ...options,
  });
};

// Utilidades para crear datos de prueba
export const createMockCourt = (overrides = {}) => ({
  id: 1,
  name: 'Cancha Test',
  covered: true,
  pricePerPerson: 500,
  maxPlayers: 4,
  available: true,
  ...overrides,
});

export const createMockBooking = (overrides = {}) => ({
  id: 1,
  courtId: 1,
  courtName: 'Cancha Test',
  userId: '1',
  userName: 'Test User',
  userEmail: 'test@example.com',
  date: '2025-08-15',
  startTime: '10:00',
  endTime: '11:00',
  duration: 60,
  players: 4,
  pricePerPerson: 500,
  totalPrice: 2000,
  status: 'confirmed',
  paymentStatus: 'paid',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  image: 'https://via.placeholder.com/150',
  role: 'user',
  ...overrides,
});

// Utilidades para simular eventos
export const mockFormSubmit = (form: HTMLFormElement, data: Record<string, any>) => {
  Object.keys(data).forEach(key => {
    const input = form.querySelector(`[name="${key}"]`) as HTMLInputElement;
    if (input) {
      input.value = data[key];
    }
  });
  
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
};

// Utilidades para esperar por elementos
export const waitForLoadingToFinish = async () => {
  const { waitForElementToBeRemoved } = await import('@testing-library/react');
  await waitForElementToBeRemoved(
    () => document.querySelector('[data-testid="loading"]'),
    { timeout: 5000 }
  );
};

// Utilidades para fechas
export const getDateString = (daysFromNow = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

export const getTimeString = (hour: number, minute = 0) => {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Utilidades para localStorage
export const mockLocalStorage = () => {
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
  
  return localStorageMock;
};

// Utilidades para console
export const mockConsole = () => {
  const originalConsole = { ...console };
  
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  return originalConsole;
};

// Re-exportar todo de testing-library
export * from '@testing-library/react';
export { customRender as render };