-- Seed default users
-- Hashed passwords correspond to: admin123, director123, docente123, operador123

INSERT INTO users (id, email, "passwordHash", role, "isActive", "firstName", "lastName", "createdAt", "updatedAt") VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@jeroky.com', '$2b$10$aotG2kYJvR0NUejxaDywMuvys3ylr4.g95ZOXBznJpN9ThlJstMZm', 'Administrator', true, 'Admin', 'Jeroky', NOW(), NOW()),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'director@jeroky.com', '$2b$10$2hLwYr1h5fpvY2.iQE9xpOdMppEnjyiU1bZ4TPA4L7BSLw8lbAT22', 'Director', true, 'Director', 'Jeroky', NOW(), NOW()),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'docente@jeroky.com', '$2b$10$xTq6ORho4C6QJ55uZkbzT.2A1txyVfAn6DvAyVWoT.jDlFLlA1UuW', 'Docente', true, 'Docente', 'Jeroky', NOW(), NOW()),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'operador@jeroky.com', '$2b$10$INfVcCR81SPXk4QKmsZPhebCh99B1Q0CFY3mImEHw2IE/g4DP73gq', 'Operador', true, 'Operador', 'Jeroky', NOW(), NOW());

-- Seed initial dance courses linked to the default docente user
INSERT INTO courses (id, name, level, capacity, "teacherId", "createdAt", "updatedAt") VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Ballet Clásico', 'Nivel Intermedio', 15, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', NOW(), NOW()),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Ballet Clásico', 'Nivel Avanzado', 12, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', NOW(), NOW()),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'Técnica de Puntas', 'Nivel Avanzado', 8, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', NOW(), NOW());

-- Seed initial dance course schedules
INSERT INTO course_schedules (id, "courseId", "dayOfWeek", "startTime", "endTime", "classroom") VALUES
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Lunes', '16:00', '17:30', 'Aula Principal'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Miércoles', '16:00', '17:30', 'Aula Principal'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'Viernes', '16:00', '17:30', 'Aula Principal'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Martes', '18:00', '19:30', 'Aula Principal'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380c05', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Jueves', '18:00', '19:30', 'Aula Principal'),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380c06', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'Sábado', '10:00', '11:30', 'Aula Principal');
