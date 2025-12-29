# Diseño de Base de Datos en Supabase - Turnero de Padel

## Resumen Ejecutivo

Este documento define el esquema de base de datos para el turnero de padel utilizando **Supabase** como backend. El diseño se basa en la estructura de datos mock del frontend actual y está optimizado para soportar autenticación, reservas en tiempo real, pagos y administración.

## Arquitectura de Base de Datos

### Tecnologías
- **Base de datos**: PostgreSQL (Supabase)
- **Autenticación**: Supabase Auth
- **APIs**: PostgREST (auto-generadas)
- **Tiempo real**: Supabase Realtime
- **Almacenamiento**: Supabase Storage (para avatares/documentos)

## Esquema de Tablas

### 1. Tabla `profiles` (Perfiles de Usuario)
Extiende la tabla `auth.users` de Supabase con información adicional.

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Información personal
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- Configuración
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT true,
  
  -- Metadatos
  last_login TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_active ON public.profiles(is_active);
```

### 2. Tabla `courts` (Canchas)
Define las canchas disponibles para reserva.

```sql
CREATE TABLE public.courts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Información básica
  name TEXT NOT NULL,
  description TEXT,
  
  -- Configuración de precios
  base_price INTEGER NOT NULL, -- Precio en centavos (ej: 600000 = $6000)
  price_multiplier DECIMAL(3,2) DEFAULT 1.0,
  
  -- Características
  features TEXT[] DEFAULT '{}',
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Configuración de horarios
  operating_hours JSONB DEFAULT '{
    "start": "00:00",
    "end": "23:00",
    "slot_duration": 90
  }'::jsonb
);

-- Índices
CREATE INDEX idx_courts_active ON public.courts(is_active);
```

### 3. Tabla `bookings` (Reservas)
Almacena todas las reservas de canchas.

```sql
CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Referencias
  court_id UUID REFERENCES public.courts(id) ON DELETE RESTRICT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Información de la reserva
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  
  -- Precios
  total_price INTEGER NOT NULL, -- En centavos
  deposit_amount INTEGER NOT NULL DEFAULT 0,
  
  -- Estados
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'fully_paid')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'card')),
  
  -- Metadatos
  notes TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

-- Índices
CREATE INDEX idx_bookings_court_date ON public.bookings(court_id, booking_date);
CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_date_time ON public.bookings(booking_date, start_time);

-- Constraint para evitar solapamientos
CREATE UNIQUE INDEX idx_bookings_no_overlap 
ON public.bookings(court_id, booking_date, start_time, end_time) 
WHERE status NOT IN ('cancelled');
```

### 4. Tabla `booking_players` (Jugadores por Reserva)
Maneja los 4 jugadores por reserva y su estado de pago individual.

```sql
CREATE TABLE public.booking_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Referencias
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  
  -- Información del jugador
  player_name TEXT NOT NULL,
  player_phone TEXT,
  player_email TEXT,
  
  -- Estado de pago
  has_paid BOOLEAN DEFAULT false,
  paid_amount INTEGER DEFAULT 0, -- En centavos
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'card')),
  
  -- Posición del jugador (1-4)
  position INTEGER CHECK (position BETWEEN 1 AND 4),
  
  -- Metadatos
  notes TEXT
);

-- Índices
CREATE INDEX idx_booking_players_booking ON public.booking_players(booking_id);
CREATE INDEX idx_booking_players_payment ON public.booking_players(has_paid);

-- Constraint para máximo 4 jugadores por reserva
CREATE UNIQUE INDEX idx_booking_players_position 
ON public.booking_players(booking_id, position);
```

### 5. Tabla `payments` (Historial de Pagos)
Registra todos los movimientos de dinero.

```sql
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Referencias
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES public.booking_players(id) ON DELETE CASCADE,
  processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Información del pago
  amount INTEGER NOT NULL, -- En centavos
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'card')),
  payment_type TEXT DEFAULT 'payment' CHECK (payment_type IN ('payment', 'refund', 'adjustment')),
  
  -- Detalles
  reference_number TEXT, -- Para transferencias
  notes TEXT,
  
  -- Estado
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

-- Índices
CREATE INDEX idx_payments_booking ON public.payments(booking_id);
CREATE INDEX idx_payments_date ON public.payments(created_at);
CREATE INDEX idx_payments_method ON public.payments(payment_method);
```

### 6. Tabla `court_availability` (Disponibilidad de Canchas)
Cache de disponibilidad para optimizar consultas.

```sql
CREATE TABLE public.court_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Referencias
  court_id UUID REFERENCES public.courts(id) ON DELETE CASCADE NOT NULL,
  
  -- Slot de tiempo
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Estado
  is_available BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false, -- Para mantenimiento
  
  -- Precios dinámicos (opcional)
  dynamic_price INTEGER, -- Sobrescribe precio base si está definido
  
  -- Metadatos
  blocked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE UNIQUE INDEX idx_court_availability_unique 
ON public.court_availability(court_id, date, start_time);
CREATE INDEX idx_court_availability_date ON public.court_availability(date);
```

### 7. Tabla `system_settings` (Configuraciones del Sistema)
Configuraciones globales del sistema.

```sql
CREATE TABLE public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Clave única de configuración
  key TEXT UNIQUE NOT NULL,
  
  -- Valor (JSON para flexibilidad)
  value JSONB NOT NULL,
  
  -- Metadatos
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false -- Si puede ser leído por usuarios no admin
);

-- Índices
CREATE INDEX idx_system_settings_category ON public.system_settings(category);
CREATE INDEX idx_system_settings_public ON public.system_settings(is_public);
```

## Row Level Security (RLS)

### Políticas de Seguridad

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para courts (lectura pública, escritura admin)
CREATE POLICY "Anyone can view active courts" ON public.courts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage courts" ON public.courts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas para bookings
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending bookings" ON public.bookings
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    status IN ('pending', 'confirmed')
  );

CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## Triggers y Funciones

### 1. Trigger para actualizar `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar a todas las tablas relevantes
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courts_updated_at 
  BEFORE UPDATE ON public.courts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON public.bookings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Función para crear perfil automáticamente

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil cuando se registra un usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Configuración de Realtime

```sql
-- Habilitar realtime para las tablas necesarias
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.court_availability;
```

## Datos Iniciales

### Insertar canchas por defecto

```sql
INSERT INTO public.courts (name, description, base_price, price_multiplier, features) VALUES
('Premium Padel Court A', 'Professional court with LED lighting', 600000, 1.0, 
 ARRAY['LED Lighting', 'Premium Surface', 'Climate Control']),
('Premium Padel Court B', 'Standard court with natural lighting', 600000, 0.9, 
 ARRAY['Natural Lighting', 'Standard Surface', 'Outdoor Feel']),
('Premium Padel Court C', 'Deluxe court with premium amenities', 600000, 1.2, 
 ARRAY['Premium Lighting', 'Deluxe Surface', 'VIP Amenities']);
```

### Configuraciones del sistema

```sql
INSERT INTO public.system_settings (key, value, description, category) VALUES
('booking_advance_days', '30', 'Días máximos para reservar con anticipación', 'booking'),
('min_booking_hours', '2', 'Horas mínimas de anticipación para reservar', 'booking'),
('default_slot_duration', '90', 'Duración por defecto de slots en minutos', 'booking'),
('deposit_percentage', '50', 'Porcentaje de depósito requerido', 'payment'),
('cancellation_hours', '24', 'Horas mínimas para cancelar sin penalidad', 'booking');
```

## Próximos Pasos

1. **Implementar autenticación**: Configurar Supabase Auth con roles
2. **Crear APIs**: Configurar PostgREST y funciones personalizadas
3. **Configurar cache**: Implementar Redis para optimización
4. **Migrar datos mock**: Reemplazar datos del frontend con APIs reales

Este esquema proporciona una base sólida y escalable para el turnero de padel, con todas las funcionalidades necesarias para soportar el frontend actual.
