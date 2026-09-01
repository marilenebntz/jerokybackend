-- Seed file for Jeroky Soft Database (Solo Usuarios de Prueba / Seed Mínimo)
-- Limpia todas las tablas de datos y únicamente crea los usuarios de prueba para login.

-- 1. CLEAN UP EXISTING DATA (Cascade handles foreign keys)
TRUNCATE TABLE 
  audit_logs, 
  communication_logs, 
  communications, 
  grades, 
  attendances, 
  academic_periods, 
  enrollments, 
  students, 
  tutors, 
  course_schedules, 
  courses, 
  users 
RESTART IDENTITY CASCADE;

-- 2. INSERT USERS
-- Contraseñas por defecto:
-- admin@jeroky.com    -> admin123
-- docente@jeroky.com  -> docente123
-- operador@jeroky.com -> operador123

INSERT INTO "users" (
  "id", 
  "email", 
  "passwordHash", 
  "role", 
  "isActive", 
  "firstName", 
  "lastName", 
  "createdAt", 
  "updatedAt"
) VALUES 
  -- Administrador
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 
    'admin@jeroky.com', 
    '$2b$10$HnE3mMQvzRgEkn5Ths4CvOaSE2GqXLcFWsfTmFjUE/9RdqSk8.csK', 
    'Administrator', 
    true, 
    'Admin', 
    'Jeroky', 
    NOW(), 
    NOW()
  ),
  -- Docentes Especialistas
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 
    'docente@jeroky.com', 
    '$2b$10$U6MYlRY9RkwzZWRiqsm6oextgU6kFn4eEGgqOvN22JlvN2f7uHE12', 
    'Docente', 
    true, 
    'Camila', 
    'Insfrán', 
    NOW(), 
    NOW()
  ),
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 
    'sofia.benitez@jeroky.com', 
    '$2b$10$U6MYlRY9RkwzZWRiqsm6oextgU6kFn4eEGgqOvN22JlvN2f7uHE12', 
    'Docente', 
    true, 
    'Sofía', 
    'Benítez', 
    NOW(), 
    NOW()
  ),
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 
    'lucia.ayala@jeroky.com', 
    '$2b$10$U6MYlRY9RkwzZWRiqsm6oextgU6kFn4eEGgqOvN22JlvN2f7uHE12', 
    'Docente', 
    true, 
    'Lucía', 
    'Ayala', 
    NOW(), 
    NOW()
  ),
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 
    'marcos.villalba@jeroky.com', 
    '$2b$10$U6MYlRY9RkwzZWRiqsm6oextgU6kFn4eEGgqOvN22JlvN2f7uHE12', 
    'Docente', 
    true, 
    'Marcos', 
    'Villalba', 
    NOW(), 
    NOW()
  ),
  -- Operador / Secretaría
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 
    'operador@jeroky.com', 
    '$2b$10$YSapGB3/ZCSdI416BmdU0.9Kh78jVHrfe1EaO1tGIBQR6ynkxXJZ6', 
    'Operador', 
    true, 
    'Ana', 
    'Gómez', 
    NOW(), 
    NOW()
  )
ON CONFLICT ("email") DO NOTHING;
