import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AcademicPeriodsService,
  DEFAULT_STAGE_DATES,
} from './academic-periods.service';
import {
  AcademicPeriod,
  EvaluationStage,
} from './entities/academic-period.entity';
import { Grade } from '../grades/entities/grade.entity';
import { Course } from '../courses/entities/course.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';

describe('AcademicPeriodsService - Unit Tests', () => {
  let service: AcademicPeriodsService;
  let academicPeriodRepo: jest.Mocked<Repository<AcademicPeriod>>;
  let gradeRepo: jest.Mocked<Repository<Grade>>;
  let courseRepo: jest.Mocked<Repository<Course>>;
  let queryBuilder: Partial<SelectQueryBuilder<Grade>>;
  let periodQueryBuilder: Partial<SelectQueryBuilder<AcademicPeriod>>;
  let courseQueryBuilder: Partial<SelectQueryBuilder<Course>>;

  beforeEach(() => {
    periodQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ year: '2025' }, { year: '2026' }]),
    };

    academicPeriodRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto as AcademicPeriod),
      save: jest.fn(async (period) => ({
        id: 'mock-uuid-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...period,
      })) as any,
      delete: jest.fn().mockResolvedValue({ affected: 1 } as any),
      createQueryBuilder: jest.fn().mockReturnValue(periodQueryBuilder),
    } as unknown as jest.Mocked<Repository<AcademicPeriod>>;

    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };

    gradeRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    } as unknown as jest.Mocked<Repository<Grade>>;

    courseQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ year: '2026' }, { year: '2027' }]),
    };

    courseRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(courseQueryBuilder),
    } as unknown as jest.Mocked<Repository<Course>>;

    service = new AcademicPeriodsService(academicPeriodRepo, gradeRepo, courseRepo);
  });

  describe('DEFAULT_STAGE_DATES', () => {
    it('should have correct default Paraguayan calendar date ranges', () => {
      expect(DEFAULT_STAGE_DATES[EvaluationStage.ETAPA_1]).toEqual({
        startMonthDay: '02-01',
        endMonthDay: '06-30',
      });
      expect(DEFAULT_STAGE_DATES[EvaluationStage.ETAPA_2]).toEqual({
        startMonthDay: '07-01',
        endMonthDay: '10-31',
      });
      expect(DEFAULT_STAGE_DATES[EvaluationStage.EXAMEN_FINAL]).toEqual({
        startMonthDay: '11-01',
        endMonthDay: '11-30',
      });
      expect(DEFAULT_STAGE_DATES[EvaluationStage.RECUPERATORIO]).toEqual({
        startMonthDay: '12-01',
        endMonthDay: '12-15',
      });
    });
  });

  describe('findAll and list', () => {
    const mockPeriods: AcademicPeriod[] = [
      {
        id: '1',
        year: 2026,
        name: EvaluationStage.ETAPA_1,
        startDate: '2026-02-01',
        endDate: '2026-06-30',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        year: 2026,
        name: EvaluationStage.ETAPA_2,
        startDate: '2026-07-01',
        endDate: '2026-10-31',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should return all periods ordered by year DESC and startDate ASC when no filter is given', async () => {
      academicPeriodRepo.find.mockResolvedValue(mockPeriods);

      const result = await service.findAll();

      expect(academicPeriodRepo.find).toHaveBeenCalledWith({
        where: {},
        order: { year: 'DESC', startDate: 'ASC' },
      });
      expect(result).toEqual(mockPeriods);
    });

    it('should filter by year when year parameter is provided', async () => {
      academicPeriodRepo.find.mockResolvedValue(mockPeriods);

      const result = await service.findAll(2026);

      expect(academicPeriodRepo.find).toHaveBeenCalledWith({
        where: { year: 2026 },
        order: { year: 'DESC', startDate: 'ASC' },
      });
      expect(result).toEqual(mockPeriods);
    });

    it('should filter by year and stage when both parameters are provided', async () => {
      academicPeriodRepo.find.mockResolvedValue([mockPeriods[0]]);

      const result = await service.findAll(2026, EvaluationStage.ETAPA_1);

      expect(academicPeriodRepo.find).toHaveBeenCalledWith({
        where: { year: 2026, name: EvaluationStage.ETAPA_1 },
        order: { year: 'DESC', startDate: 'ASC' },
      });
      expect(result).toEqual([mockPeriods[0]]);
    });

    it('list alias should behave identically to findAll', async () => {
      academicPeriodRepo.find.mockResolvedValue(mockPeriods);

      const result = await service.list(2026);

      expect(result).toEqual(mockPeriods);
    });
  });

  describe('findById', () => {
    it('should return academic period if id exists', async () => {
      const mockPeriod: AcademicPeriod = {
        id: 'uuid-1',
        year: 2026,
        name: EvaluationStage.ETAPA_1,
        startDate: '2026-02-01',
        endDate: '2026-06-30',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      academicPeriodRepo.findOne.mockResolvedValue(mockPeriod);

      const result = await service.findById('uuid-1');

      expect(academicPeriodRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(result).toEqual(mockPeriod);
    });

    it('should throw NotFoundException if id does not exist', async () => {
      academicPeriodRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByYearAndStage', () => {
    it('should return academic period if matching year and name exists', async () => {
      const mockPeriod: AcademicPeriod = {
        id: 'uuid-1',
        year: 2026,
        name: EvaluationStage.ETAPA_1,
        startDate: '2026-02-01',
        endDate: '2026-06-30',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      academicPeriodRepo.findOne.mockResolvedValue(mockPeriod);

      const result = await service.findByYearAndStage(
        2026,
        EvaluationStage.ETAPA_1,
      );

      expect(academicPeriodRepo.findOne).toHaveBeenCalledWith({
        where: { year: 2026, name: EvaluationStage.ETAPA_1 },
      });
      expect(result).toEqual(mockPeriod);
    });

    it('should return null if period does not exist', async () => {
      academicPeriodRepo.findOne.mockResolvedValue(null);

      const result = await service.findByYearAndStage(2026, 'NonExistentStage');

      expect(result).toBeNull();
    });
  });

  describe('createOrUpdate', () => {
    it('should throw BadRequestException if startDate is after endDate', async () => {
      await expect(
        service.createOrUpdate({
          year: 2026,
          name: EvaluationStage.ETAPA_1,
          startDate: '2026-07-01',
          endDate: '2026-06-30',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create new record when stage does not exist for that year', async () => {
      academicPeriodRepo.findOne.mockResolvedValue(null);

      const result = await service.createOrUpdate({
        year: 2026,
        name: EvaluationStage.ETAPA_1,
        startDate: '2026-02-01',
        endDate: '2026-06-30',
      });

      expect(academicPeriodRepo.create).toHaveBeenCalledWith({
        year: 2026,
        name: EvaluationStage.ETAPA_1,
        startDate: '2026-02-01',
        endDate: '2026-06-30',
      });
      expect(academicPeriodRepo.save).toHaveBeenCalled();
      expect(result.year).toBe(2026);
      expect(result.name).toBe(EvaluationStage.ETAPA_1);
    });

    it('should update existing record when stage already exists for that year', async () => {
      const existingPeriod: AcademicPeriod = {
        id: 'existing-id',
        year: 2026,
        name: EvaluationStage.ETAPA_1,
        startDate: '2026-02-01',
        endDate: '2026-06-30',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      academicPeriodRepo.findOne.mockResolvedValue(existingPeriod);

      const result = await service.createOrUpdate({
        year: 2026,
        name: EvaluationStage.ETAPA_1,
        startDate: '2026-02-15',
        endDate: '2026-07-10',
      });

      expect(academicPeriodRepo.create).not.toHaveBeenCalled();
      expect(academicPeriodRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'existing-id',
          startDate: '2026-02-15',
          endDate: '2026-07-10',
        }),
      );
      expect(result.startDate).toBe('2026-02-15');
      expect(result.endDate).toBe('2026-07-10');
    });
  });

  describe('update', () => {
    const existingPeriod: AcademicPeriod = {
      id: 'existing-id',
      year: 2026,
      name: EvaluationStage.ETAPA_1,
      startDate: '2026-02-01',
      endDate: '2026-06-30',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should throw NotFoundException if id not found', async () => {
      academicPeriodRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', {
          startDate: '2026-02-10',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if updated date range is invalid', async () => {
      academicPeriodRepo.findOne.mockResolvedValue({ ...existingPeriod });

      await expect(
        service.update('existing-id', {
          startDate: '2026-07-01', // existing endDate is 2026-06-30
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update dates successfully', async () => {
      academicPeriodRepo.findOne.mockResolvedValue({ ...existingPeriod });

      const result = await service.update('existing-id', {
        startDate: '2026-02-10',
        endDate: '2026-07-05',
      });

      expect(academicPeriodRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'existing-id',
          startDate: '2026-02-10',
          endDate: '2026-07-05',
        }),
      );
      expect(result.startDate).toBe('2026-02-10');
      expect(result.endDate).toBe('2026-07-05');
    });
  });

  describe('delete (VR-006 Deletion Guard)', () => {
    const existingPeriod: AcademicPeriod = {
      id: 'period-uuid-1',
      year: 2026,
      name: EvaluationStage.ETAPA_1,
      startDate: '2026-02-01',
      endDate: '2026-06-30',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should throw NotFoundException if period to delete does not exist', async () => {
      academicPeriodRepo.findOne.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject deletion with BadRequestException if grades exist for this stage and year', async () => {
      academicPeriodRepo.findOne.mockResolvedValue({ ...existingPeriod });
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(5); // 5 grades exist

      await expect(service.delete('period-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(academicPeriodRepo.delete).not.toHaveBeenCalled();
    });

    it('should successfully delete period if no grades exist for this stage and year', async () => {
      academicPeriodRepo.findOne.mockResolvedValue({ ...existingPeriod });
      (queryBuilder.getCount as jest.Mock).mockResolvedValue(0); // 0 grades

      const result = await service.delete('period-uuid-1');

      expect(academicPeriodRepo.delete).toHaveBeenCalledWith('period-uuid-1');
      expect(result).toEqual({
        message: 'Periodo académico eliminado exitosamente.',
      });
    });
  });

  describe('seedDefaults', () => {
    it('should create all 4 stages when none exist for the year', async () => {
      academicPeriodRepo.findOne.mockResolvedValue(null);
      academicPeriodRepo.find.mockResolvedValue([
        {
          id: '1',
          year: 2026,
          name: EvaluationStage.ETAPA_1,
          startDate: '2026-02-01',
          endDate: '2026-06-30',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          year: 2026,
          name: EvaluationStage.ETAPA_2,
          startDate: '2026-07-01',
          endDate: '2026-10-31',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          year: 2026,
          name: EvaluationStage.EXAMEN_FINAL,
          startDate: '2026-11-01',
          endDate: '2026-11-30',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '4',
          year: 2026,
          name: EvaluationStage.RECUPERATORIO,
          startDate: '2026-12-01',
          endDate: '2026-12-15',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.seedDefaults(2026);

      expect(academicPeriodRepo.create).toHaveBeenCalledTimes(4);
      expect(academicPeriodRepo.create).toHaveBeenCalledWith({
        year: 2026,
        name: EvaluationStage.ETAPA_1,
        startDate: '2026-02-01',
        endDate: '2026-06-30',
      });
      expect(academicPeriodRepo.create).toHaveBeenCalledWith({
        year: 2026,
        name: EvaluationStage.ETAPA_2,
        startDate: '2026-07-01',
        endDate: '2026-10-31',
      });
      expect(academicPeriodRepo.create).toHaveBeenCalledWith({
        year: 2026,
        name: EvaluationStage.EXAMEN_FINAL,
        startDate: '2026-11-01',
        endDate: '2026-11-30',
      });
      expect(academicPeriodRepo.create).toHaveBeenCalledWith({
        year: 2026,
        name: EvaluationStage.RECUPERATORIO,
        startDate: '2026-12-01',
        endDate: '2026-12-15',
      });
      expect(result).toHaveLength(4);
    });

    it('should only create missing stages when some stages already exist', async () => {
      academicPeriodRepo.findOne.mockImplementation(async ({ where }: any) => {
        if (where.name === EvaluationStage.ETAPA_1) {
          return {
            id: '1',
            year: 2026,
            name: EvaluationStage.ETAPA_1,
            startDate: '2026-02-01',
            endDate: '2026-06-30',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        return null;
      });

      await service.seedDefaults(2026);

      expect(academicPeriodRepo.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('getDistinctYears', () => {
    it('should aggregate distinct years from periods, courses and current years', async () => {
      const years = await service.getDistinctYears();
      const currentYear = new Date().getFullYear();

      expect(academicPeriodRepo.createQueryBuilder).toHaveBeenCalledWith('period');
      expect(courseRepo.createQueryBuilder).toHaveBeenCalledWith('course');
      expect(years).toContain(2025);
      expect(years).toContain(2026);
      expect(years).toContain(2027);
      expect(years).toContain(currentYear);
      expect(years).toEqual([...new Set(years)].sort((a, b) => a - b));
    });
  });
});

