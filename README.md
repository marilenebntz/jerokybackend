# Jeroky Soft - Backend Service

Servicio Backend en NestJS con TypeORM, PostgreSQL y Amazon Rekognition para el Sistema de Gestión Integral de Academia de Danza.

---

## 🚀 Inicio Rápido con Docker Compose

Desde la raíz del proyecto:

```bash
# 1. Levantar contenedores (Base de datos PostgreSQL, Backend y Frontend)
docker compose up -d

# 2. Ejecutar migraciones de TypeORM
docker compose exec backend npm run migration:run

# 3. Ejecutar seed de datos iniciales
docker compose exec backend npm run db:seed
```

*(O para ejecutar migraciones y seed en una sola instrucción)*:
```bash
docker compose exec backend npm run db:setup
```

El servidor backend queda accesible en `http://localhost:3001` y expone Swagger en `http://localhost:3001/api/docs`.

---

## 💻 Desarrollo Local (sin Docker para el Backend)

### Requisitos
- Node.js >= 20
- PostgreSQL corriendo (por ejemplo vía `docker compose up -d db`)

### Instalación y Ejecución

```bash
cd backend
npm install
npm run start:dev
```

### Comandos de Base de Datos y Migraciones

| Comando | Descripción |
|---|---|
| `npm run migration:run` | Ejecuta las migraciones pendientes de TypeORM |
| `npm run migration:generate -- src/database/migrations/Nombre` | Genera una nueva migración basada en cambios en las entidades |
| `npm run migration:revert` | Revierte la última migración aplicada |
| `npm run migration:show` | Muestra el estado de las migraciones |
| `npm run db:seed` | Ejecuta el script de seed de datos iniciales (`seed.sql`) |
| `npm run db:setup` | Ejecuta `migration:run` seguido de `db:seed` |

---

## ⚙️ Configuración y Variables de Entorno

Crear o modificar el archivo `.env` en la raíz de `backend/`:

```env
NODE_ENV=development
PORT=3001

# PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=jeroky_soft_db
DATABASE_SYNCHRONIZE=true
DATABASE_MIGRATIONS_RUN=false
DATABASE_LOGGING=false

# Seguridad
JWT_SECRET=tu_secreto_jwt
ENCRYPTION_KEY=clave_de_encriptacion_medica_32_chars

# AWS Rekognition (Face ID)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
REKOGNITION_COLLECTION_ID=academy-faces
REKOGNITION_MATCH_THRESHOLD=98
```

### Diferencias entre Ambientes

- **Desarrollo (`NODE_ENV=development`)**:
  - `DATABASE_SYNCHRONIZE=true`: TypeORM auto-sincroniza entidades con la BD si se desea agilidad, o se puede desactivar para probar migraciones.
  - `DATABASE_MIGRATIONS_RUN=false`: Las migraciones se pueden correr manualmente con `npm run migration:run`.
- **Producción (`NODE_ENV=production`)**:
  - `synchronize` se desactiva estrictamente (`false`) para proteger la integridad de los datos.
  - `DATABASE_MIGRATIONS_RUN=true` (o por defecto en producción): TypeORM aplica automáticamente las migraciones pendientes al levantar la aplicación.

---

## 👥 Usuarios de Prueba (Cargados con el Seed)

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@jeroky.com` | `admin123` |
| Director | `director@jeroky.com` | `director123` |
| Docente | `docente@jeroky.com` | `docente123` |
| Operador | `operador@jeroky.com` | `operador123` |

---

## 🧪 Testing

```bash
npm run test          # Unit tests
npm run test:e2e      # E2E tests
```
