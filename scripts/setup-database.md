# Configuración de Base de Datos PostgreSQL

## Opción 1: Neon (Recomendado - Gratis)

1. Ve a https://neon.tech
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto llamado "turnero-padel"
4. Copia la connection string que te proporcionen
5. Actualiza `.env.local` con la URL de conexión

Ejemplo:
```
DATABASE_URL="postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

## Opción 2: Railway (Gratis con límites)

1. Ve a https://railway.app
2. Crea una cuenta
3. Crea un nuevo proyecto
4. Agrega PostgreSQL
5. Copia la connection string

## Opción 3: PostgreSQL Local

### Windows (usando Docker):
```bash
docker run --name turnero-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=turnero_padel -p 5432:5432 -d postgres:15
```

### macOS (usando Homebrew):
```bash
brew install postgresql
brew services start postgresql
createdb turnero_padel
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb turnero_padel
```

## Después de configurar la base de datos:

1. Actualiza `.env.local` con la URL correcta
2. Ejecuta las migraciones:
   ```bash
   npx prisma db push
   ```
3. Inicializa datos:
   ```bash
   node scripts/init-admins.js
   ```
4. Inicia el servidor:
   ```bash
   npm run dev
   ```

## Variables de entorno necesarias:

```env
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-nextauth-secret-aqui

# Google OAuth
GOOGLE_CLIENT_ID=process.env.GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=process.env.GOOGLE_CLIENT_SECRET

# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@host:port/database"

# Admin Emails
ADMIN_EMAILS=admin@turnero.com,tu-email@gmail.com

# App Configuration
NODE_ENV=development
```
