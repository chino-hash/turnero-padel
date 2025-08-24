# Comandos de Migración

## 1. Desinstalar Supabase
```bash
npm uninstall @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/ssr
```

## 2. Instalar NextAuth.js v5 y Prisma
```bash
npm install next-auth@beta @auth/prisma-adapter prisma @prisma/client
npm install -D prisma
```

## 3. Instalar driver de PostgreSQL
```bash
npm install pg @types/pg
```

## 4. Inicializar Prisma
```bash
npx prisma init
```

## 5. Generar cliente Prisma (después de configurar schema)
```bash
npx prisma generate
```

## 6. Ejecutar migraciones
```bash
npx prisma db push
```

## 7. Abrir Prisma Studio (opcional)
```bash
npx prisma studio
```
