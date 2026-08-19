-- Seed file for Jeroky Soft Database
-- This file contains initial and mock data for the PostgreSQL database.

-- 1. CLEAN UP EXISTING MOCK DATA (Optional, order matters due to foreign key constraints)
TRUNCATE TABLE enrollments, students, tutors, course_schedules, courses, users CASCADE;

-- 2. INSERT DEFAULT USERS
-- Password hashes generated using bcrypt (10 rounds):
-- admin123: $2b$10$HnE3mMQvzRgEkn5Ths4CvOaSE2GqXLcFWsfTmFjUE/9RdqSk8.csK
-- director123: $2b$10$jZZO48d4IZ8wM9r8Dp3c7OVjdCG0bK9avqVkncqq0.sXxa3nCl0X2
-- docente123: $2b$10$U6MYlRY9RkwzZWRiqsm6oextgU6kFn4eEGgqOvN22JlvN2f7uHE12
-- operador123: $2b$10$YSapGB3/ZCSdI416BmdU0.9Kh78jVHrfe1EaO1tGIBQR6ynkxXJZ6

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
  (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 
    'director@jeroky.com', 
    '$2b$10$jZZO48d4IZ8wM9r8Dp3c7OVjdCG0bK9avqVkncqq0.sXxa3nCl0X2', 
    'Director', 
    true, 
    'Director', 
    'Jeroky', 
    NOW(), 
    NOW()
  ),
  (
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 
    'docente@jeroky.com', 
    '$2b$10$U6MYlRY9RkwzZWRiqsm6oextgU6kFn4eEGgqOvN22JlvN2f7uHE12', 
    'Docente', 
    true, 
    'Docente', 
    'Jeroky', 
    NOW(), 
    NOW()
  ),
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 
    'operador@jeroky.com', 
    '$2b$10$YSapGB3/ZCSdI416BmdU0.9Kh78jVHrfe1EaO1tGIBQR6ynkxXJZ6', 
    'Operador', 
    true, 
    'Operador', 
    'Jeroky', 
    NOW(), 
    NOW()
  )
ON CONFLICT ("email") DO NOTHING;


-- 3. INSERT DEFAULT COURSES (Assigned to default Docente user)
INSERT INTO "courses" (
  "id", 
  "name", 
  "level", 
  "capacity", 
  "teacherId", 
  "createdAt", 
  "updatedAt"
) VALUES 
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 
    'Ballet Clásico', 
    'Nivel Intermedio', 
    15, 
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 
    NOW(), 
    NOW()
  ),
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 
    'Ballet Clásico', 
    'Nivel Avanzado', 
    12, 
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 
    NOW(), 
    NOW()
  ),
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 
    'Técnica de Puntas', 
    'Nivel Avanzado', 
    8, 
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 
    NOW(), 
    NOW()
  )
ON CONFLICT ("id") DO NOTHING;


-- 3b. INSERT DEFAULT COURSE SCHEDULES
INSERT INTO "course_schedules" (
  "id", 
  "courseId", 
  "dayOfWeek", 
  "startTime", 
  "endTime", 
  "classroom"
) VALUES 
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 
    'Lunes', 
    '16:00', 
    '17:30', 
    'Aula Principal'
  ),
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 
    'Miércoles', 
    '16:00', 
    '17:30', 
    'Aula Principal'
  ),
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 
    'Viernes', 
    '16:00', 
    '17:30', 
    'Aula Principal'
  ),
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 
    'Martes', 
    '18:00', 
    '19:30', 
    'Aula Principal'
  ),
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380c05', 
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 
    'Jueves', 
    '18:00', 
    '19:30', 
    'Aula Principal'
  ),
  (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380c06', 
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 
    'Sábado', 
    '10:00', 
    '11:30', 
    'Aula Principal'
  )
ON CONFLICT ("id") DO NOTHING;


-- 4. INSERT DEFAULT TUTORS
INSERT INTO "tutors" (
  "id",
  "firstName",
  "lastName",
  "ci",
  "phone",
  "email",
  "createdAt",
  "updatedAt"
) VALUES
  (
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
    'Juan',
    'Pérez',
    '1234567',
    '+595981123456',
    'juan.perez@gmail.com',
    NOW(),
    NOW()
  ),
  (
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19',
    'María',
    'Gómez',
    '7654321',
    '+595981654321',
    'maria.gomez@gmail.com',
    NOW(),
    NOW()
  )
ON CONFLICT ("ci") DO NOTHING;


-- 5. INSERT DEFAULT STUDENTS (Referencing Tutors)
INSERT INTO "students" (
  "id",
  "firstName",
  "lastName",
  "ci",
  "birthDate",
  "biometricConsent",
  "tutorId",
  "userId",
  "createdAt",
  "updatedAt"
) VALUES
  (
    '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
    'Sofía',
    'Pérez',
    '5555551',
    '2015-05-15',
    false,
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18',
    NULL,
    NOW(),
    NOW()
  ),
  (
    '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'Mateo',
    'Gómez',
    '5555552',
    '2014-08-20',
    false,
    'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19',
    NULL,
    NOW(),
    NOW()
  )
ON CONFLICT ("ci") DO NOTHING;


-- 6. INSERT DEFAULT ENROLLMENTS (Linking Students and Courses)
INSERT INTO "enrollments" (
  "id",
  "studentId",
  "courseId",
  "status",
  "createdAt",
  "updatedAt"
) VALUES
  (
    '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
    'active',
    NOW(),
    NOW()
  ),
  (
    '40eebc99-9c0b-4ef8-bb6d-6bb9bd380a23',
    '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
    'active',
    NOW(),
    NOW()
  )
ON CONFLICT ("studentId", "courseId") DO NOTHING;
