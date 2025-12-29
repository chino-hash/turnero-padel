# Configuración de Docker para PostgreSQL

## Instalación de Docker en Windows

### Opción 1: Docker Desktop (Recomendado)

1. Descarga Docker Desktop desde: https://www.docker.com/products/docker-desktop/
2. Ejecuta el instalador y sigue las instrucciones
3. Reinicia tu computadora si es necesario
4. Abre Docker Desktop y espera a que se inicie completamente
5. Verifica la instalación ejecutando en PowerShell:
   ```powershell
   docker --version
   docker compose version
   ```

### Opción 2: Usar PostgreSQL en la nube (Alternativa sin Docker)

Si prefieres no instalar Docker, puedes usar servicios en la nube:

#### Neon (Gratis)
1. Ve a https://neon.tech
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto "turnero-padel"
4. Copia la connection string

#### Supabase (Gratis)
1. Ve a https://supabase.com
2. Crea una cuenta y un nuevo proyecto
3. Ve a Settings > Database
4. Copia la connection string

#### Railway (Gratis con límites)
1. Ve a https://railway.app
2. Crea una cuenta
3. Crea un nuevo proyecto y agrega PostgreSQL
4. Copia la connection string

## Uso después de la instalación

### Con Docker (Local)
```powershell
# Iniciar PostgreSQL
docker compose up -d postgres

# Verificar estado
docker ps

# Conectar a la base de datos
docker exec -it turnero-postgres psql -U turnero_user -d turnero_padel

# Detener PostgreSQL
docker compose stop postgres
```

### Con servicio en la nube
1. Copia la connection string del servicio elegido
2. Actualiza el archivo `.env.local` con la URL
3. Ejecuta las migraciones de Prisma

## Variables de entorno necesarias

```env
# Para Docker local
DATABASE_URL="postgresql://turnero_user:turnero_password@localhost:5432/turnero_padel"

# Para servicios en la nube (ejemplo Neon)
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

## Próximos pasos

1. Elige una opción (Docker local o servicio en la nube)
2. Configura las variables de entorno
3. Actualiza el schema de Prisma para PostgreSQL
4. Ejecuta las migraciones