-- Seed file for Jeroky Soft Database
-- Comprehensive, realistic mock dataset for the Dance Academy management system.

-- 1. CLEAN UP EXISTING DATA (Cascade handles foreign keys)
TRUNCATE TABLE audit_logs, communication_logs, communications, grades, attendances, academic_periods, enrollments, students, tutors, course_schedules, courses, users RESTART IDENTITY CASCADE;

-- 2. INSERT USERS
-- Default passwords:
-- admin123:    $2b$10$HnE3mMQvzRgEkn5Ths4CvOaSE2GqXLcFWsfTmFjUE/9RdqSk8.csK
-- docente123:  $2b$10$U6MYlRY9RkwzZWRiqsm6oextgU6kFn4eEGgqOvN22JlvN2f7uHE12
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
  -- Operadores / Secretaría
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


-- 3. INSERT ACADEMIC PERIODS (Solo 1ª Etapa y 2ª Etapa para 2026)
INSERT INTO "academic_periods" (
  "id", 
  "year", 
  "name", 
  "startDate", 
  "endDate", 
  "createdAt", 
  "updatedAt"
) VALUES 
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 
    2026, 
    '1ª Etapa', 
    '2026-02-01', 
    '2026-06-30', 
    NOW(), 
    NOW()
  ),
  (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 
    2026, 
    '2ª Etapa', 
    '2026-07-01', 
    '2026-10-31', 
    NOW(), 
    NOW()
  )
ON CONFLICT ("year", "name") DO NOTHING;


-- 4. INSERT COURSES (Oferta Académica 2026)
INSERT INTO "courses" (
  "id", 
  "name", 
  "level", 
  "capacity", 
  "year",
  "classCode",
  "teacherId", 
  "createdAt", 
  "updatedAt"
) VALUES 
  -- Ballet Clásico (Prof. Camila Insfrán)
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 
    'Ballet Clásico', 
    'Nivel Inicial', 
    15, 
    2026,
    'BAL-INI-2026',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 
    NOW(), 
    NOW()
  ),
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 
    'Ballet Clásico', 
    'Nivel Intermedio', 
    15, 
    2026,
    'BAL-INT-2026',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 
    NOW(), 
    NOW()
  ),
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 
    'Ballet Clásico', 
    'Nivel Avanzado', 
    12, 
    2026,
    'BAL-AVN-2026',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 
    NOW(), 
    NOW()
  ),
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 
    'Técnica de Puntas', 
    'Nivel Avanzado', 
    10, 
    2026,
    'BAL-PUN-2026',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 
    NOW(), 
    NOW()
  ),
  -- Danza Paraguaya (Prof. Sofía Benítez)
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 
    'Danza Paraguaya', 
    'Nivel Infantil', 
    16, 
    2026,
    'DPY-INF-2026',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 
    NOW(), 
    NOW()
  ),
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 
    'Danza Paraguaya', 
    'Nivel Intermedio', 
    15, 
    2026,
    'DPY-INT-2026',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 
    NOW(), 
    NOW()
  ),
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 
    'Danza Paraguaya', 
    'Nivel Avanzado', 
    12, 
    2026,
    'DPY-AVN-2026',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 
    NOW(), 
    NOW()
  ),
  -- Danza Contemporánea (Prof. Lucía Ayala)
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 
    'Danza Contemporánea', 
    'Nivel Intermedio', 
    14, 
    2026,
    'DCT-INT-2026',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 
    NOW(), 
    NOW()
  ),
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 
    'Danza Contemporánea', 
    'Nivel Avanzado', 
    12, 
    2026,
    'DCT-AVN-2026',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 
    NOW(), 
    NOW()
  ),
  -- Danzas Urbanas y Ritmos (Prof. Marcos Villalba)
  (
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 
    'Danzas Urbanas y Ritmos', 
    'General', 
    18, 
    2026,
    'URB-GEN-2026',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 
    NOW(), 
    NOW()
  )
ON CONFLICT ("id") DO NOTHING;


-- 5. INSERT COURSE SCHEDULES
INSERT INTO "course_schedules" (
  "id", 
  "courseId", 
  "dayOfWeek", 
  "startTime", 
  "endTime", 
  "classroom"
) VALUES 
  -- Ballet Inicial (Lunes y Miércoles 15:00 - 16:30, Sala de Danzas A)
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Lunes', '15:00', '16:30', 'Sala de Danzas A'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Miércoles', '15:00', '16:30', 'Sala de Danzas A'),
  
  -- Ballet Intermedio (Lunes, Miércoles, Viernes 16:30 - 18:00, Sala de Danzas A)
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Lunes', '16:30', '18:00', 'Sala de Danzas A'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Miércoles', '16:30', '18:00', 'Sala de Danzas A'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c05', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Viernes', '16:30', '18:00', 'Sala de Danzas A'),
  
  -- Ballet Avanzado (Martes y Jueves 17:30 - 19:30, Sala de Danzas A)
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c06', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Martes', '17:30', '19:30', 'Sala de Danzas A'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c07', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'Jueves', '17:30', '19:30', 'Sala de Danzas A'),
  
  -- Técnica de Puntas (Sábados 09:00 - 11:00, Sala de Danzas A)
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c08', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Sábado', '09:00', '11:00', 'Sala de Danzas A'),
  
  -- Danza Paraguaya Infantil (Martes y Jueves 15:00 - 16:30, Sala Principal)
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c09', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'Martes', '15:00', '16:30', 'Aula Principal'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c10', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'Jueves', '15:00', '16:30', 'Aula Principal'),
  
  -- Danza Paraguaya Intermedio (Martes y Jueves 16:30 - 18:00, Sala Principal)
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c11', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'Martes', '16:30', '18:00', 'Aula Principal'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c12', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'Jueves', '16:30', '18:00', 'Aula Principal'),
  
  -- Danza Paraguaya Avanzado (Viernes 17:00 - 19:00, Sábados 11:00 - 13:00, Sala Principal)
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c13', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Viernes', '17:00', '19:00', 'Aula Principal'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c14', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Sábado', '11:00', '13:00', 'Aula Principal'),
  
  -- Danza Contemporánea Intermedio (Lunes y Miércoles 18:00 - 19:30, Sala de Danzas B)
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c15', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Lunes', '18:00', '19:30', 'Sala de Danzas B'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c16', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Miércoles', '18:00', '19:30', 'Sala de Danzas B'),
  
  -- Danza Contemporánea Avanzado (Martes y Jueves 19:00 - 20:30, Sala de Danzas B)
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c17', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'Martes', '19:00', '20:30', 'Sala de Danzas B'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c18', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'Jueves', '19:00', '20:30', 'Sala de Danzas B'),
  
  -- Danzas Urbanas y Ritmos (Viernes 18:00 - 19:30, Sábados 14:00 - 16:00, Sala Principal)
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c19', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'Viernes', '18:00', '19:30', 'Aula Principal'),
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380c20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'Sábado', '14:00', '16:00', 'Aula Principal')
ON CONFLICT ("id") DO NOTHING;


-- 6. INSERT TUTORS (10 Tutores con datos verosímiles paraguayos)
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
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'Juan Carlos', 'Pérez Vera', '3456789', '+595981234567', 'juan.perez@gmail.com', NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'María Elena', 'Gómez Benítez', '4123456', '+595982345678', 'maria.gomez@gmail.com', NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'Carlos Alberto', 'Romero', '3890123', '+595983456789', 'carlos.romero@hotmail.com', NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Laura Beatriz', 'Acosta Duarte', '4567890', '+595984567890', 'laura.acosta@outlook.com', NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Gustavo Adolfo', 'Ferreira', '3234567', '+595985678901', 'gustavo.ferreira@gmail.com', NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'Patricia Elizabeth', 'Giménez', '4789012', '+595986789012', 'patricia.gimenez@gmail.com', NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'Rodrigo Miguel', 'Medina', '3901234', '+595971123456', 'rodrigo.medina@gmail.com', NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'Carmen Raquel', 'Martínez', '4345678', '+595972234567', 'carmen.martinez@gmail.com', NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'Sonia Soledad', 'Ortiz', '4901234', '+595973345678', 'sonia.ortiz@gmail.com', NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 'Walter Ramón', 'Benítez', '3567890', '+595974456789', 'walter.benitez@gmail.com', NOW(), NOW())
ON CONFLICT ("ci") DO NOTHING;


-- 7. INSERT STUDENTS (20 Alumnas y Alumnos)
INSERT INTO "students" (
  "id",
  "firstName",
  "lastName",
  "ci",
  "birthDate",
  "biometricConsent",
  "status",
  "tutorId",
  "userId",
  "createdAt",
  "updatedAt"
) VALUES
  ('10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'Sofía Valentina', 'Pérez Gómez', '5555551', '2015-05-15', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', NULL, NOW(), NOW()),
  ('20eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Mateo Alejandro', 'Gómez Benítez', '5555552', '2014-08-20', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', NULL, NOW(), NOW()),
  ('30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Valentina Luján', 'Romero Acosta', '5555553', '2013-11-05', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', NULL, NOW(), NOW()),
  ('40eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'Camila Belén', 'Ferreira Acosta', '5555554', '2012-03-18', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', NULL, NOW(), NOW()),
  ('50eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'Lucas Gabriel', 'Ferreira Giménez', '5555555', '2016-01-25', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', NULL, NOW(), NOW()),
  ('60eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'Martina Jazmín', 'Giménez Medina', '5555556', '2014-09-14', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', NULL, NOW(), NOW()),
  ('70eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'Thiago Nicolás', 'Medina Ortiz', '5555557', '2011-06-30', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', NULL, NOW(), NOW()),
  ('80eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 'Florencia Montserrat', 'Martínez', '5555558', '2015-12-08', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', NULL, NOW(), NOW()),
  ('90eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 'Joaquín Emilio', 'Ortiz', '5555559', '2013-05-22', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', NULL, NOW(), NOW()),
  ('a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a29', 'Micaela Sol', 'Pérez', '5555560', '2010-02-14', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', NULL, NOW(), NOW()),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 'Agustín Daniel', 'Romero', '5555561', '2015-07-03', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', NULL, NOW(), NOW()),
  ('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'Bianca Agustina', 'Duarte', '5555562', '2012-10-19', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', NULL, NOW(), NOW()),
  ('d1eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 'Rodrigo Sebastián', 'Medina', '5555563', '2009-04-11', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', NULL, NOW(), NOW()),
  ('e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Luciana Nicole', 'Giménez', '5555564', '2014-03-02', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', NULL, NOW(), NOW()),
  ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', 'Enzo Matías', 'Ferreira', '5555565', '2011-12-17', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', NULL, NOW(), NOW()),
  ('12eebc99-9c0b-4ef8-bb6d-6bb9bd380a35', 'Araceli Magalí', 'Benítez', '5555566', '2008-09-05', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', NULL, NOW(), NOW()),
  ('22eebc99-9c0b-4ef8-bb6d-6bb9bd380a36', 'Santiago Jesús', 'Martínez', '5555567', '2016-06-14', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', NULL, NOW(), NOW()),
  ('32eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'Victoria Paz', 'Ortiz', '5555568', '2013-08-29', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', NULL, NOW(), NOW()),
  ('42eebc99-9c0b-4ef8-bb6d-6bb9bd380a38', 'Belén Monserrath', 'Vera', '5555569', '2014-11-10', true, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', NULL, NOW(), NOW()),
  ('52eebc99-9c0b-4ef8-bb6d-6bb9bd380a39', 'Lucas Damián', 'Ayala', '5555570', '2012-04-05', false, 'active', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', NULL, NOW(), NOW())
ON CONFLICT ("ci") DO NOTHING;


-- 8. INSERT ENROLLMENTS (38 Matrículas Activas vinculando alumnos con múltiples modalidades)
INSERT INTO "enrollments" (
  "id",
  "studentId",
  "courseId",
  "status",
  "createdAt",
  "updatedAt"
) VALUES
  -- Ballet Clásico Inicial (e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15)
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e01', '80eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'active', NOW(), NOW()), -- Florencia
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e02', '50eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'active', NOW(), NOW()), -- Lucas Gabriel
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e03', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'active', NOW(), NOW()), -- Agustín

  -- Ballet Clásico Intermedio (e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16)
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e04', '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'active', NOW(), NOW()), -- Sofía Pérez
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e05', '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'active', NOW(), NOW()), -- Valentina Romero
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e06', '60eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'active', NOW(), NOW()), -- Martina Giménez
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e07', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'active', NOW(), NOW()), -- Bianca Duarte
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e08', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'active', NOW(), NOW()), -- Luciana Giménez
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e09', '32eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'active', NOW(), NOW()), -- Victoria Ortiz
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e10', '42eebc99-9c0b-4ef8-bb6d-6bb9bd380a38', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'active', NOW(), NOW()), -- Belén Vera

  -- Ballet Clásico Avanzado (e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17)
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e11', '40eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'active', NOW(), NOW()), -- Camila Ferreira
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e12', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a29', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'active', NOW(), NOW()), -- Micaela Sol Pérez
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e13', '12eebc99-9c0b-4ef8-bb6d-6bb9bd380a35', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'active', NOW(), NOW()), -- Araceli Benítez

  -- Técnica de Puntas Avanzado (e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18)
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e14', '40eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'active', NOW(), NOW()), -- Camila Ferreira
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e15', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a29', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'active', NOW(), NOW()), -- Micaela Pérez
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e16', '12eebc99-9c0b-4ef8-bb6d-6bb9bd380a35', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'active', NOW(), NOW()), -- Araceli Benítez

  -- Danza Paraguaya Infantil (e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19)
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e17', '50eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'active', NOW(), NOW()), -- Lucas Gabriel
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e18', '80eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'active', NOW(), NOW()), -- Florencia
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e19', '22eebc99-9c0b-4ef8-bb6d-6bb9bd380a36', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'active', NOW(), NOW()), -- Santiago Jesús
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e20', 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a30', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'active', NOW(), NOW()), -- Agustín Romero

  -- Danza Paraguaya Intermedio (e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20)
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e21', '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'active', NOW(), NOW()), -- Mateo Gómez
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e22', '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'active', NOW(), NOW()), -- Sofía Pérez
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e23', '60eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'active', NOW(), NOW()), -- Martina Giménez
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e24', '90eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'active', NOW(), NOW()), -- Joaquín Ortiz
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e25', '32eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'active', NOW(), NOW()), -- Victoria Ortiz

  -- Danza Paraguaya Avanzado (e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21)
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e26', '70eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'active', NOW(), NOW()), -- Thiago Medina
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e27', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'active', NOW(), NOW()), -- Enzo Ferreira
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e28', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'active', NOW(), NOW()), -- Rodrigo Medina

  -- Danza Contemporánea Intermedio (e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22)
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e29', '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'active', NOW(), NOW()), -- Valentina Romero
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e30', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'active', NOW(), NOW()), -- Bianca Duarte
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e31', '90eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'active', NOW(), NOW()), -- Joaquín Ortiz
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e32', '52eebc99-9c0b-4ef8-bb6d-6bb9bd380a39', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'active', NOW(), NOW()), -- Lucas Ayala

  -- Danza Contemporánea Avanzado (e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23)
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e33', '12eebc99-9c0b-4ef8-bb6d-6bb9bd380a35', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'active', NOW(), NOW()), -- Araceli Benítez
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e34', 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a32', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'active', NOW(), NOW()), -- Rodrigo Medina

  -- Danzas Urbanas y Ritmos (e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24)
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e35', '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'active', NOW(), NOW()), -- Mateo Gómez
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e36', '70eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'active', NOW(), NOW()), -- Thiago Medina
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e37', 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'active', NOW(), NOW()), -- Enzo Ferreira
  ('a2eebc99-9c0b-4ef8-bb6d-6bb9bd380e38', '52eebc99-9c0b-4ef8-bb6d-6bb9bd380a39', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'active', NOW(), NOW())  -- Lucas Ayala
ON CONFLICT ("studentId", "courseId") DO NOTHING;


-- 9. INSERT CALIFICACIONES (Grades para 1ª Etapa con notas dimensionales y promedios)
-- Ballet Clásico Intermedio (1ª Etapa)
INSERT INTO "grades" (
  "id", 
  "studentId", 
  "courseId", 
  "techniqueScore", 
  "expressionScore", 
  "disciplineScore", 
  "average", 
  "stage", 
  "createdAt", 
  "updatedAt"
) VALUES 
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380001', '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 95, 92, 98, 95.00, '1ª Etapa', NOW(), NOW()), -- Sofía Pérez (Sobresaliente 5)
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380002', '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 88, 90, 86, 88.00, '1ª Etapa', NOW(), NOW()), -- Valentina Romero (Muy Bueno 4)
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380003', '60eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 78, 82, 80, 80.00, '1ª Etapa', NOW(), NOW()), -- Martina Giménez (Bueno 3)
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380004', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 85, 84, 88, 85.67, '1ª Etapa', NOW(), NOW()), -- Bianca Duarte (Muy Bueno 4)
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380005', 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 65, 70, 68, 67.67, '1ª Etapa', NOW(), NOW()), -- Luciana Giménez (Aceptable 2)
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380006', '32eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 82, 85, 84, 83.67, '1ª Etapa', NOW(), NOW()), -- Victoria Ortiz (Muy Bueno 4)
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380007', '42eebc99-9c0b-4ef8-bb6d-6bb9bd380a38', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 55, 58, 60, 57.67, '1ª Etapa', NOW(), NOW()), -- Belén Vera (Insuficiente 1)

  -- Ballet Clásico Avanzado (1ª Etapa)
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380008', '40eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 96, 95, 98, 96.33, '1ª Etapa', NOW(), NOW()), -- Camila Ferreira
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380009', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a29', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 90, 88, 92, 90.00, '1ª Etapa', NOW(), NOW()), -- Micaela Pérez
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380010', '12eebc99-9c0b-4ef8-bb6d-6bb9bd380a35', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 88, 90, 89, 89.00, '1ª Etapa', NOW(), NOW()), -- Araceli Benítez

  -- Danza Paraguaya Intermedio (1ª Etapa)
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380011', '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 92, 94, 90, 92.00, '1ª Etapa', NOW(), NOW()), -- Mateo Gómez
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380012', '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 94, 96, 95, 95.00, '1ª Etapa', NOW(), NOW()), -- Sofía Pérez
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380013', '60eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 80, 85, 82, 82.33, '1ª Etapa', NOW(), NOW()), -- Martina Giménez
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380014', '90eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 75, 78, 80, 77.67, '1ª Etapa', NOW(), NOW()), -- Joaquín Ortiz

  -- Danza Contemporánea Intermedio (1ª Etapa)
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380015', '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 90, 92, 94, 92.00, '1ª Etapa', NOW(), NOW()), -- Valentina Romero
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380016', 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 86, 88, 85, 86.33, '1ª Etapa', NOW(), NOW()), -- Bianca Duarte

  -- Danzas Urbanas y Ritmos (1ª Etapa)
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380017', '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 92, 95, 90, 92.33, '1ª Etapa', NOW(), NOW()), -- Mateo Gómez
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380018', '70eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 88, 90, 87, 88.33, '1ª Etapa', NOW(), NOW())  -- Thiago Medina
ON CONFLICT ("studentId", "courseId", "stage") DO NOTHING;


-- 10. INSERT ATTENDANCES (Marcaciones de Entrada y Salida a lo largo del Ciclo Lectivo 2026)
-- Generando múltiples fechas de clase para simular regularidad, alertas y ausencias reales
INSERT INTO "attendances" (
  "id",
  "studentId",
  "courseId",
  "timestamp",
  "type",
  "method"
) VALUES
  -- -------------------------------------------------------------
  -- SESIÓN 1: Lunes 02 de Marzo de 2026 (Ballet Intermedio)
  -- -------------------------------------------------------------
  (gen_random_uuid(), '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-02 16:25:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-02 18:02:00', 'Salida', 'Biometric'),
  (gen_random_uuid(), '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-02 16:28:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-02 18:05:00', 'Salida', 'Biometric'),
  (gen_random_uuid(), '60eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-02 16:30:00', 'Entrada', 'Manual'),
  (gen_random_uuid(), 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-02 16:26:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '32eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-02 16:32:00', 'Entrada', 'Biometric'),

  -- -------------------------------------------------------------
  -- SESIÓN 2: Miércoles 04 de Marzo de 2026 (Ballet Intermedio)
  -- -------------------------------------------------------------
  (gen_random_uuid(), '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-04 16:24:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-04 18:01:00', 'Salida', 'Biometric'),
  (gen_random_uuid(), '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-04 16:27:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-04 16:29:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-04 16:35:00', 'Entrada', 'Manual'),
  (gen_random_uuid(), '32eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-04 16:28:00', 'Entrada', 'Biometric'),

  -- -------------------------------------------------------------
  -- SESIÓN 3: Viernes 06 de Marzo de 2026 (Ballet Intermedio)
  -- -------------------------------------------------------------
  (gen_random_uuid(), '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-06 16:20:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-06 16:25:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '60eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-06 16:30:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-06 16:28:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '32eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-06 16:31:00', 'Entrada', 'Biometric'),

  -- -------------------------------------------------------------
  -- SESIÓN 4: Lunes 09 de Marzo de 2026 (Ballet Intermedio)
  -- -------------------------------------------------------------
  (gen_random_uuid(), '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-09 16:22:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-09 16:25:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '60eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-09 16:30:00', 'Entrada', 'Manual'),
  (gen_random_uuid(), 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-09 16:29:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '42eebc99-9c0b-4ef8-bb6d-6bb9bd380a38', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-09 16:40:00', 'Entrada', 'Manual'),

  -- -------------------------------------------------------------
  -- SESIÓN 5: Miércoles 11 de Marzo de 2026 (Ballet Intermedio)
  -- -------------------------------------------------------------
  (gen_random_uuid(), '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-11 16:20:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-11 16:25:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '60eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-11 16:30:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-11 16:28:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '32eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-11 16:30:00', 'Entrada', 'Biometric'),

  -- -------------------------------------------------------------
  -- SESIÓN 6: Viernes 13 de Marzo de 2026 (Ballet Intermedio)
  -- -------------------------------------------------------------
  (gen_random_uuid(), '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-13 16:25:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-13 16:28:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-13 16:26:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-13 16:35:00', 'Entrada', 'Document'),
  (gen_random_uuid(), '32eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-13 16:32:00', 'Entrada', 'Biometric'),

  -- -------------------------------------------------------------
  -- SESIÓN 7: Lunes 16 de Marzo de 2026 (Ballet Intermedio)
  -- -------------------------------------------------------------
  (gen_random_uuid(), '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-16 16:22:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-16 16:25:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '60eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-16 16:29:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-16 16:27:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '32eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-16 16:30:00', 'Entrada', 'Biometric'),

  -- -------------------------------------------------------------
  -- SESIÓN 8: Miércoles 18 de Marzo de 2026 (Ballet Intermedio)
  -- -------------------------------------------------------------
  (gen_random_uuid(), '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-18 16:20:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-18 16:24:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '60eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-18 16:30:00', 'Entrada', 'Manual'),
  (gen_random_uuid(), 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-18 16:28:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '32eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', '2026-03-18 16:31:00', 'Entrada', 'Biometric'),

  -- -------------------------------------------------------------
  -- ASISTENCIAS: Danza Paraguaya Intermedio (Martes y Jueves)
  -- -------------------------------------------------------------
  -- Martes 03 de Marzo 2026
  (gen_random_uuid(), '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-03 16:25:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-03 16:26:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '60eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-03 16:28:00', 'Entrada', 'Manual'),
  (gen_random_uuid(), '90eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-03 16:30:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '32eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-03 16:31:00', 'Entrada', 'Biometric'),

  -- Jueves 05 de Marzo 2026
  (gen_random_uuid(), '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-05 16:24:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-05 16:25:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '60eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-05 16:29:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '90eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-05 16:30:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '32eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-05 16:31:00', 'Entrada', 'Biometric'),

  -- Martes 10 de Marzo 2026
  (gen_random_uuid(), '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-10 16:25:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-10 16:27:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '90eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-10 16:30:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '32eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-10 16:32:00', 'Entrada', 'Biometric'),

  -- Jueves 12 de Marzo 2026
  (gen_random_uuid(), '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-12 16:22:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-12 16:25:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '60eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-12 16:28:00', 'Entrada', 'Manual'),
  (gen_random_uuid(), '32eebc99-9c0b-4ef8-bb6d-6bb9bd380a37', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', '2026-03-12 16:30:00', 'Entrada', 'Biometric'),

  -- -------------------------------------------------------------
  -- ASISTENCIAS: Danza Contemporánea (Lunes y Miércoles 18:00)
  -- -------------------------------------------------------------
  (gen_random_uuid(), '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '2026-03-02 17:55:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '2026-03-02 17:58:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '90eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '2026-03-02 18:02:00', 'Entrada', 'Manual'),
  (gen_random_uuid(), '52eebc99-9c0b-4ef8-bb6d-6bb9bd380a39', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '2026-03-02 18:00:00', 'Entrada', 'Document'),

  (gen_random_uuid(), '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '2026-03-04 17:54:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '2026-03-04 17:58:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '52eebc99-9c0b-4ef8-bb6d-6bb9bd380a39', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '2026-03-04 18:01:00', 'Entrada', 'Document'),

  -- -------------------------------------------------------------
  -- ASISTENCIAS: Danzas Urbanas (Viernes 18:00 y Sábados 14:00)
  -- -------------------------------------------------------------
  (gen_random_uuid(), '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', '2026-03-06 17:50:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '70eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', '2026-03-06 17:55:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', '2026-03-06 17:58:00', 'Entrada', 'Manual'),
  (gen_random_uuid(), '52eebc99-9c0b-4ef8-bb6d-6bb9bd380a39', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', '2026-03-06 18:00:00', 'Entrada', 'Document'),

  (gen_random_uuid(), '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', '2026-03-13 17:52:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '70eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', '2026-03-13 17:56:00', 'Entrada', 'Biometric'),
  (gen_random_uuid(), 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a34', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', '2026-03-13 18:02:00', 'Entrada', 'Manual'),

  -- -------------------------------------------------------------
  -- ASISTENCIAS DE LA FECHA ACTUAL (Para interactividad en vivo)
  -- -------------------------------------------------------------
  (gen_random_uuid(), '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', NOW() - INTERVAL '1 hour', 'Entrada', 'Biometric'),
  (gen_random_uuid(), '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', NOW() - INTERVAL '55 minutes', 'Entrada', 'Biometric'),
  (gen_random_uuid(), 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a31', 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', NOW() - INTERVAL '50 minutes', 'Entrada', 'Biometric')
ON CONFLICT ("id") DO NOTHING;


-- 11. INSERT COMMUNICATIONS & COMMUNICATION LOGS
INSERT INTO "communications" (
  "id",
  "subject",
  "body",
  "targetRoles",
  "channels",
  "courseId",
  "senderId",
  "createdAt"
) VALUES
  (
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380001',
    'Apertura Oficial del Ciclo Lectivo 2026 y Reglamento Interno',
    'Estimadas familias y alumnas: Les damos la más cordial bienvenida al Ciclo Lectivo 2026 en el Centro de Danzas Jeroky. Recordamos el cumplimiento estricto del uniforme oficial y la puntualidad en el acceso.',
    'Docente,Alumno,Tutor',
    'Web,Email',
    NULL,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    NOW() - INTERVAL '15 days'
  ),
  (
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380002',
    'Convocatoria al Gran Festival Nacional de Danza Paraguaya 2026',
    'Se convoca a todos los elencos de Danza Paraguaya (Infantil, Intermedio y Avanzado) a los ensayos generales para la gala de apertura.',
    'Alumno,Tutor',
    'Web,Email',
    'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
    NOW() - INTERVAL '8 days'
  ),
  (
    'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380003',
    'Publicación de Calificaciones Oficiales de la 1ª Etapa',
    'Se informa que las calificaciones correspondientes a la 1ª Etapa Evaluativa ya se encuentran disponibles para consulta en el legajo académico de cada alumna.',
    'Tutor,Alumno',
    'Web,Email',
    NULL,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    NOW() - INTERVAL '3 days'
  )
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "communication_logs" (
  "id",
  "communicationId",
  "recipientId",
  "recipientEmail",
  "recipientName",
  "recipientRole",
  "channel",
  "status",
  "errorMessage",
  "externalId",
  "recipientDescription",
  "sentAt"
) VALUES
  (gen_random_uuid(), 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'juan.perez@gmail.com', 'Juan Carlos Pérez', 'Tutor', 'Email', 'delivered', NULL, 'msg_001', 'Tutor de Sofía Pérez', NOW() - INTERVAL '15 days'),
  (gen_random_uuid(), 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380001', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'maria.gomez@gmail.com', 'María Elena Gómez', 'Tutor', 'Email', 'delivered', NULL, 'msg_002', 'Tutor de Mateo Gómez', NOW() - INTERVAL '15 days'),
  (gen_random_uuid(), 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380002', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'maria.gomez@gmail.com', 'María Elena Gómez', 'Tutor', 'Email', 'delivered', NULL, 'msg_003', 'Tutor de Danza Paraguaya', NOW() - INTERVAL '8 days'),
  (gen_random_uuid(), 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380003', 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'juan.perez@gmail.com', 'Juan Carlos Pérez', 'Tutor', 'Web', 'delivered', NULL, NULL, 'Legajo publicado', NOW() - INTERVAL '3 days')
ON CONFLICT ("id") DO NOTHING;


-- 12. INSERT AUDIT LOGS
INSERT INTO "audit_logs" (
  "id",
  "action",
  "userId",
  "username",
  "ipAddress",
  "timestamp",
  "details"
) VALUES
  (gen_random_uuid(), 'USER_LOGIN', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@jeroky.com', '127.0.0.1', NOW() - INTERVAL '2 days', 'Inicio de sesión administrativo exitoso'),
  (gen_random_uuid(), 'STUDENT_REGISTERED', 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'operador@jeroky.com', '127.0.0.1', NOW() - INTERVAL '10 days', 'Inscripción y matriculación de Sofía Valentina Pérez Gómez'),
  (gen_random_uuid(), 'GRADES_BATCH_UPDATED', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'docente@jeroky.com', '127.0.0.1', NOW() - INTERVAL '4 days', 'Carga de calificaciones oficial 1ª Etapa - Ballet Clásico Intermedio'),
  (gen_random_uuid(), 'COMMUNICATION_BROADCAST_SENT', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@jeroky.com', '127.0.0.1', NOW() - INTERVAL '3 days', 'Envío masivo de notificación institucional');
