import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RecipientResolverService } from './domain/recipient-resolver.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Tutor } from '../students/entities/tutor.entity';
import { Student } from '../students/entities/student.entity';
import { Enrollment } from '../students/entities/enrollment.entity';

describe('RecipientResolverService', () => {
  let service: RecipientResolverService;

  const mockUserRepo = {
    find: jest.fn(),
  };
  const mockTutorRepo = {
    find: jest.fn(),
  };
  const mockStudentRepo = {
    find: jest.fn(),
  };
  const mockEnrollmentRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipientResolverService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Tutor), useValue: mockTutorRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: getRepositoryToken(Enrollment), useValue: mockEnrollmentRepo },
      ],
    }).compile();

    service = module.get<RecipientResolverService>(RecipientResolverService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe calcular la edad correctamente', () => {
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
    expect(service.calculateAge(twentyYearsAgo)).toBe(20);

    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    expect(service.calculateAge(fiveYearsAgo)).toBe(5);
  });

  it('debe resolver tutores generales y deduplicar por correo', async () => {
    mockTutorRepo.find.mockResolvedValue([
      {
        id: 'tutor-1',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
      },
      {
        id: 'tutor-2',
        firstName: 'Juan P.',
        lastName: 'Pérez',
        email: 'juan@example.com', // duplicado
      },
    ]);

    const result = await service.resolveRecipients([UserRole.TUTOR]);

    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('juan@example.com');
    expect(result[0].name).toBe('Juan Pérez');
    expect(result[0].role).toBe('Tutor');
  });

  it('debe aplicar fallback a tutor en alumnos menores de edad', async () => {
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

    mockStudentRepo.find.mockResolvedValue([
      {
        id: 'student-1',
        firstName: 'Sofía',
        lastName: 'Mendieta',
        birthDate: tenYearsAgo,
        user: null,
        tutor: {
          id: 'tutor-1',
          firstName: 'Carlos',
          lastName: 'Mendieta',
          email: 'carlos@example.com',
        },
      },
    ]);

    const result = await service.resolveRecipients([UserRole.ALUMNO]);

    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('carlos@example.com');
    expect(result[0].name).toBe('Carlos Mendieta');
    expect(result[0].isFallback).toBe(true);
    expect(result[0].description).toContain('Sofía Mendieta (vía Tutor: Carlos Mendieta - Menor de edad)');
  });

  it('debe enviar al correo del alumno si es mayor de edad y tiene usuario', async () => {
    const twentyYearsAgo = new Date();
    twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);

    mockStudentRepo.find.mockResolvedValue([
      {
        id: 'student-2',
        firstName: 'Ana',
        lastName: 'Gómez',
        birthDate: twentyYearsAgo,
        user: {
          id: 'user-ana',
          email: 'ana@example.com',
        },
        tutor: {
          id: 'tutor-2',
          firstName: 'Pedro',
          lastName: 'Gómez',
          email: 'pedro@example.com',
        },
      },
    ]);

    const result = await service.resolveRecipients([UserRole.ALUMNO]);

    expect(result).toHaveLength(1);
    expect(result[0].email).toBe('ana@example.com');
    expect(result[0].name).toBe('Ana Gómez');
    expect(result[0].role).toBe('Alumno');
  });
});
