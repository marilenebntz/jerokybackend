import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import request from 'supertest';
import { AcademicPeriodsController } from '../src/academic-periods/academic-periods.controller';
import { AcademicPeriodsService } from '../src/academic-periods/academic-periods.service';
import { EvaluationStage } from '../src/academic-periods/entities/academic-period.entity';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';

describe('AcademicPeriodsController (e2e / integration)', () => {
  let app: INestApplication;
  let mockService: Partial<Record<keyof AcademicPeriodsService, jest.Mock>>;

  const mockPeriods = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      year: 2026,
      name: EvaluationStage.ETAPA_1,
      startDate: '2026-02-01',
      endDate: '2026-06-30',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      year: 2026,
      name: EvaluationStage.ETAPA_2,
      startDate: '2026-07-01',
      endDate: '2026-10-31',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      name: EvaluationStage.EXAMEN_FINAL,
      year: 2026,
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'a0000000-0000-0000-0000-000000000004',
      name: EvaluationStage.RECUPERATORIO,
      year: 2026,
      startDate: '2026-12-01',
      endDate: '2026-12-15',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeAll(async () => {
    mockService = {
      findAll: jest
        .fn()
        .mockImplementation((year?: number, name?: EvaluationStage) => {
          let results = mockPeriods;
          if (year) {
            results = results.filter((p) => p.year === year);
          }
          if (name) {
            results = results.filter((p) => p.name === name);
          }
          return Promise.resolve(results);
        }),
      findById: jest.fn().mockImplementation((id: string) => {
        const found = mockPeriods.find((p) => p.id === id);
        if (!found) {
          throw new NotFoundException('Periodo académico no encontrado');
        }
        return Promise.resolve(found);
      }),
      findByYearAndStage: jest
        .fn()
        .mockImplementation((year: number, name: string) => {
          const found = mockPeriods.find(
            (p) => p.year === year && p.name === name,
          );
          return Promise.resolve(found || null);
        }),
      createOrUpdate: jest.fn().mockImplementation((dto) => {
        if (dto.startDate > dto.endDate) {
          throw new BadRequestException(
            'La fecha de inicio debe ser anterior o igual a la fecha de fin',
          );
        }
        return Promise.resolve({
          id: 'a0000000-0000-0000-0000-000000000001',
          ...dto,
        });
      }),
      update: jest.fn().mockImplementation((id, dto) => {
        const found = mockPeriods.find((p) => p.id === id);
        if (!found) {
          throw new NotFoundException('Periodo no encontrado');
        }
        if (dto.startDate && dto.endDate && dto.startDate > dto.endDate) {
          throw new BadRequestException('Fechas inválidas');
        }
        return Promise.resolve({
          ...found,
          ...dto,
        });
      }),
      delete: jest.fn().mockImplementation((id: string) => {
        const found = mockPeriods.find((p) => p.id === id);
        if (!found) {
          throw new NotFoundException('Periodo académico no encontrado');
        }
        if (id === 'a0000000-0000-0000-0000-000000000002') {
          throw new BadRequestException(
            'No se puede eliminar el periodo académico porque existen calificaciones registradas para esta etapa y año.',
          );
        }
        return Promise.resolve({
          message: 'Periodo académico eliminado exitosamente.',
        });
      }),
      seedDefaults: jest.fn().mockImplementation((year: number) => {
        return Promise.resolve(mockPeriods.map((p) => ({ ...p, year })));
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AcademicPeriodsController],
      providers: [
        {
          provide: AcademicPeriodsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /academic-periods', () => {
    it('should return all academic periods when no year filter is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/academic-periods')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(4);
      expect(mockService.findAll).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should filter periods by year when year query param is passed', async () => {
      const res = await request(app.getHttpServer())
        .get('/academic-periods?year=2026')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(mockService.findAll).toHaveBeenCalledWith(2026, undefined);
    });

    it('should filter periods by year and stage name', async () => {
      const res = await request(app.getHttpServer())
        .get('/academic-periods?year=2026&name=1ª%20Etapa')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(mockService.findAll).toHaveBeenCalledWith(
        2026,
        EvaluationStage.ETAPA_1,
      );
    });
  });

  describe('GET /academic-periods/:id', () => {
    it('should return academic period by valid UUID', async () => {
      const validId = 'a0000000-0000-0000-0000-000000000001';
      const res = await request(app.getHttpServer())
        .get(`/academic-periods/${validId}`)
        .expect(200);

      expect(res.body.id).toBe(validId);
      expect(mockService.findById).toHaveBeenCalledWith(validId);
    });

    it('should return 404 if period not found', async () => {
      const missingId = 'b0000000-0000-0000-0000-000000000099';
      await request(app.getHttpServer())
        .get(`/academic-periods/${missingId}`)
        .expect(404);
    });

    it('should return 400 if id is not a valid UUID', async () => {
      await request(app.getHttpServer())
        .get('/academic-periods/invalid-uuid')
        .expect(400);
    });
  });

  describe('POST /academic-periods', () => {
    it('should create or update a period with valid DTO', async () => {
      const payload = {
        year: 2026,
        name: EvaluationStage.ETAPA_1,
        startDate: '2026-02-01',
        endDate: '2026-06-30',
      };

      const res = await request(app.getHttpServer())
        .post('/academic-periods')
        .send(payload)
        .expect(201);

      expect(res.body.name).toBe(EvaluationStage.ETAPA_1);
      expect(mockService.createOrUpdate).toHaveBeenCalledWith(payload);
    });

    it('should return 400 when invalid stage name is passed', async () => {
      const invalidPayload = {
        year: 2026,
        name: 'Etapa Inexistente',
        startDate: '2026-02-01',
        endDate: '2026-06-30',
      };

      await request(app.getHttpServer())
        .post('/academic-periods')
        .send(invalidPayload)
        .expect(400);
    });

    it('should return 400 when startDate is after endDate in service logic', async () => {
      const invalidPayload = {
        year: 2026,
        name: EvaluationStage.ETAPA_1,
        startDate: '2026-07-01',
        endDate: '2026-06-30',
      };

      await request(app.getHttpServer())
        .post('/academic-periods')
        .send(invalidPayload)
        .expect(400);
    });
  });

  describe('PUT /academic-periods/:id', () => {
    it('should update stage dates by valid UUID', async () => {
      const validId = 'a0000000-0000-0000-0000-000000000001';
      const updatePayload = {
        startDate: '2026-02-15',
        endDate: '2026-07-15',
      };

      const res = await request(app.getHttpServer())
        .put(`/academic-periods/${validId}`)
        .send(updatePayload)
        .expect(200);

      expect(res.body.startDate).toBe('2026-02-15');
      expect(mockService.update).toHaveBeenCalledWith(validId, updatePayload);
    });

    it('should return 400 when non-UUID id is passed in param', async () => {
      await request(app.getHttpServer())
        .put('/academic-periods/invalid-uuid-123')
        .send({ startDate: '2026-02-15', endDate: '2026-07-15' })
        .expect(400);
    });
  });

  describe('DELETE /academic-periods/:id', () => {
    it('should delete period successfully when no grades exist', async () => {
      const validId = 'a0000000-0000-0000-0000-000000000001';
      const res = await request(app.getHttpServer())
        .delete(`/academic-periods/${validId}`)
        .expect(200);

      expect(res.body.message).toBe(
        'Periodo académico eliminado exitosamente.',
      );
      expect(mockService.delete).toHaveBeenCalledWith(validId);
    });

    it('should return 400 when grades exist for this period (VR-006 Deletion Guard)', async () => {
      const periodWithGradesId = 'a0000000-0000-0000-0000-000000000002';
      const res = await request(app.getHttpServer())
        .delete(`/academic-periods/${periodWithGradesId}`)
        .expect(400);

      expect(res.body.message).toContain(
        'No se puede eliminar el periodo académico',
      );
    });

    it('should return 404 when period does not exist', async () => {
      const missingId = 'b0000000-0000-0000-0000-000000000099';
      await request(app.getHttpServer())
        .delete(`/academic-periods/${missingId}`)
        .expect(404);
    });

    it('should return 400 when id is not a valid UUID', async () => {
      await request(app.getHttpServer())
        .delete('/academic-periods/invalid-uuid')
        .expect(400);
    });
  });

  describe('POST /academic-periods/seed/:year', () => {
    it('should seed default Paraguayan stages for year 2026', async () => {
      const res = await request(app.getHttpServer())
        .post('/academic-periods/seed/2026')
        .expect(201);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(4);
      expect(mockService.seedDefaults).toHaveBeenCalledWith(2026);
    });

    it('should return 400 when year is not an integer', async () => {
      await request(app.getHttpServer())
        .post('/academic-periods/seed/not-a-year')
        .expect(400);
    });
  });
});

