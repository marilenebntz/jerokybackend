import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GradesService } from './grades.service';
import { Grade, EvaluationStage } from './entities/grade.entity';
import { Student } from '../students/entities/student.entity';
import { Course } from '../courses/entities/course.entity';
import { Repository } from 'typeorm';

describe('GradesService - Unit Tests', () => {
  let service: GradesService;
  let gradeRepo: jest.Mocked<Repository<Grade>>;
  let studentRepo: jest.Mocked<Repository<Student>>;
  let courseRepo: jest.Mocked<Repository<Course>>;

  const mockStudent: Student = {
    id: 'student-uuid-1',
    firstName: 'Maria',
    lastName: 'Gomez',
    ci: '1234567',
    birthDate: new Date('2010-05-15'),
    encryptedMedicalInfo: null,
    biometricTemplateId: null,
    biometricConsent: false,
    status: 'active',
    tutor: null,
    user: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCourse: Course = {
    id: 'course-uuid-1',
    name: 'Danza Clásica',
    level: 'Principiante',
    capacity: 20,
    year: 2026,
    classCode: 'DAN-CLA-PRI-2026',
    schedules: [],
    teacher: null,
    teacherId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    gradeRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      findBy: jest.fn(),
      create: jest.fn((dto) => ({
        id: 'grade-uuid-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...dto,
      })) as any,
      save: jest.fn(async (grade) => {
        if (Array.isArray(grade)) {
          return grade.map((g) => ({
            id: g.id || 'grade-uuid-1',
            createdAt: new Date(),
            updatedAt: new Date(),
            ...g,
          }));
        }
        return {
          id: grade.id || 'grade-uuid-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...grade,
        };
      }) as any,
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<Grade>>;

    studentRepo = {
      findOne: jest.fn(),
      findBy: jest.fn(),
    } as unknown as jest.Mocked<Repository<Student>>;

    courseRepo = {
      findOne: jest.fn(),
      findBy: jest.fn(),
    } as unknown as jest.Mocked<Repository<Course>>;

    service = new GradesService(gradeRepo, studentRepo, courseRepo);
  });

  describe('uploadBatch / saveBatch', () => {
    it('should return empty array if grades list is empty or undefined', async () => {
      const result1 = await service.uploadBatch([]);
      const result2 = await service.uploadBatch(null as any);
      const result3 = await service.saveBatch([]);

      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(result3).toEqual([]);
      expect(studentRepo.findBy).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if courseId is not specified in item or batch level', async () => {
      await expect(
        service.uploadBatch([
          {
            studentId: 'student-uuid-1',
            techniqueScore: 80,
            expressionScore: 85,
            disciplineScore: 90,
          },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if student is not found', async () => {
      studentRepo.findBy.mockResolvedValue([]);
      courseRepo.findBy.mockResolvedValue([mockCourse]);

      await expect(
        service.uploadBatch([
          {
            studentId: 'student-uuid-1',
            courseId: 'course-uuid-1',
            techniqueScore: 80,
            expressionScore: 85,
            disciplineScore: 90,
            stage: EvaluationStage.ETAPA_1,
          },
        ]),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if course is not found', async () => {
      studentRepo.findBy.mockResolvedValue([mockStudent]);
      courseRepo.findBy.mockResolvedValue([]);

      await expect(
        service.uploadBatch([
          {
            studentId: 'student-uuid-1',
            courseId: 'course-uuid-1',
            techniqueScore: 80,
            expressionScore: 85,
            disciplineScore: 90,
            stage: EvaluationStage.ETAPA_1,
          },
        ]),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create new grade record with correct average calculation when not existing', async () => {
      studentRepo.findBy.mockResolvedValue([mockStudent]);
      courseRepo.findBy.mockResolvedValue([mockCourse]);
      gradeRepo.find.mockResolvedValue([]);

      const items = [
        {
          studentId: 'student-uuid-1',
          courseId: 'course-uuid-1',
          techniqueScore: 90,
          expressionScore: 85,
          disciplineScore: 95,
          stage: EvaluationStage.ETAPA_1,
        },
      ];

      const result = await service.uploadBatch(items);

      expect(gradeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'student-uuid-1',
          courseId: 'course-uuid-1',
          techniqueScore: 90,
          expressionScore: 85,
          disciplineScore: 95,
          average: 90.0, // (90 + 85 + 95) / 3 = 90
          stage: EvaluationStage.ETAPA_1,
        }),
      );
      expect(gradeRepo.save).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].average).toBe(90.0);
    });

    it('should support top-level batchCourseId and batchStage defaults', async () => {
      studentRepo.findBy.mockResolvedValue([mockStudent]);
      courseRepo.findBy.mockResolvedValue([mockCourse]);
      gradeRepo.find.mockResolvedValue([]);

      const items = [
        {
          studentId: 'student-uuid-1',
          techniqueScore: 80,
          expressionScore: 82,
          disciplineScore: 83,
        },
      ];

      const result = await service.uploadBatch(
        items,
        'course-uuid-1',
        EvaluationStage.ETAPA_2,
      );

      expect(gradeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'student-uuid-1',
          courseId: 'course-uuid-1',
          techniqueScore: 80,
          expressionScore: 82,
          disciplineScore: 83,
          average: 81.67, // (80 + 82 + 83) / 3 = 81.6666... -> 81.67
          stage: EvaluationStage.ETAPA_2,
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].average).toBe(81.67);
    });

    it('should update existing grade record and recalculate average without any lock restrictions', async () => {
      studentRepo.findBy.mockResolvedValue([mockStudent]);
      courseRepo.findBy.mockResolvedValue([mockCourse]);

      const existingGrade: Grade = {
        id: 'existing-grade-id',
        studentId: 'student-uuid-1',
        courseId: 'course-uuid-1',
        student: mockStudent,
        course: mockCourse,
        techniqueScore: 60,
        expressionScore: 70,
        disciplineScore: 80,
        average: 70.0,
        stage: EvaluationStage.ETAPA_1,
        createdAt: new Date(),
        updatedAt: new Date(),
        calculateAverage: jest.fn(),
      };

      gradeRepo.find.mockResolvedValue([existingGrade]);

      const items = [
        {
          studentId: 'student-uuid-1',
          courseId: 'course-uuid-1',
          techniqueScore: 100,
          expressionScore: 90,
          disciplineScore: 80,
          stage: EvaluationStage.ETAPA_1,
        },
      ];

      const result = await service.uploadBatch(items);

      expect(gradeRepo.create).not.toHaveBeenCalled();
      expect(gradeRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'existing-grade-id',
            techniqueScore: 100,
            expressionScore: 90,
            disciplineScore: 80,
            average: 90.0,
          }),
        ]),
      );
      expect(result[0].average).toBe(90.0);
    });

    it('should correctly process multiple students and stages in a single batch', async () => {
      const student2: Student = {
        ...mockStudent,
        id: 'student-uuid-2',
        firstName: 'Ana',
      };

      studentRepo.findBy.mockResolvedValue([mockStudent, student2]);
      courseRepo.findBy.mockResolvedValue([mockCourse]);
      gradeRepo.find.mockResolvedValue([]);

      const items = [
        {
          studentId: 'student-uuid-1',
          courseId: 'course-uuid-1',
          techniqueScore: 70,
          expressionScore: 75,
          disciplineScore: 80,
          stage: EvaluationStage.ETAPA_1,
        },
        {
          studentId: 'student-uuid-2',
          courseId: 'course-uuid-1',
          techniqueScore: 88,
          expressionScore: 92,
          disciplineScore: 96,
          stage: EvaluationStage.ETAPA_1,
        },
      ];

      const result = await service.saveBatch(items);

      expect(result).toHaveLength(2);
      expect(result[0].average).toBe(75.0); // (70+75+80)/3
      expect(result[1].average).toBe(92.0); // (88+92+96)/3
    });
  });

  describe('getHistoryByStudent', () => {
    it('should throw NotFoundException if student does not exist', async () => {
      studentRepo.findOne.mockResolvedValue(null);

      await expect(service.getHistoryByStudent('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return grade history for a valid student ordered by createdAt ASC', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);

      const mockGrades: Grade[] = [
        {
          id: 'grade-1',
          studentId: 'student-uuid-1',
          courseId: 'course-uuid-1',
          student: mockStudent,
          course: mockCourse,
          techniqueScore: 80,
          expressionScore: 85,
          disciplineScore: 90,
          average: 85,
          stage: EvaluationStage.ETAPA_1,
          createdAt: new Date('2026-06-01'),
          updatedAt: new Date('2026-06-01'),
          calculateAverage: jest.fn(),
        },
        {
          id: 'grade-2',
          studentId: 'student-uuid-1',
          courseId: 'course-uuid-1',
          student: mockStudent,
          course: mockCourse,
          techniqueScore: 90,
          expressionScore: 95,
          disciplineScore: 100,
          average: 95,
          stage: EvaluationStage.ETAPA_2,
          createdAt: new Date('2026-10-15'),
          updatedAt: new Date('2026-10-15'),
          calculateAverage: jest.fn(),
        },
      ];

      gradeRepo.find.mockResolvedValue(mockGrades);

      const result = await service.getHistoryByStudent('student-uuid-1');

      expect(gradeRepo.find).toHaveBeenCalledWith({
        where: { studentId: 'student-uuid-1' },
        relations: { course: true },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(mockGrades);
    });
  });

  describe('findByCourseAndStage / getGradesByCourse', () => {
    it('should filter by course and stage when stage is specified', async () => {
      gradeRepo.find.mockResolvedValue([]);

      await service.findByCourseAndStage('course-uuid-1', EvaluationStage.ETAPA_1);

      expect(gradeRepo.find).toHaveBeenCalledWith({
        where: { courseId: 'course-uuid-1', stage: EvaluationStage.ETAPA_1 },
        relations: { student: true, course: true },
        order: { createdAt: 'ASC' },
      });
    });

    it('should query all grades for course when stage is omitted via getGradesByCourse', async () => {
      gradeRepo.find.mockResolvedValue([]);

      await service.getGradesByCourse('course-uuid-1');

      expect(gradeRepo.find).toHaveBeenCalledWith({
        where: { courseId: 'course-uuid-1' },
        relations: { student: true, course: true },
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('getAverageGradesByStyle', () => {
    it('should aggregate and calculate averages per course style', async () => {
      const mockQueryBuilder: any = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { style: 'Danza Clásica', average: '88.5432' },
          { style: 'Danza Paraguaya', average: '92.1000' },
        ]),
      };

      gradeRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAverageGradesByStyle();

      expect(result).toEqual([
        { style: 'Danza Clásica', average: 88.54 },
        { style: 'Danza Paraguaya', average: 92.1 },
      ]);
    });
  });
});

