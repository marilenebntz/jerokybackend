import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AttendanceService,
  normalizeDay,
  normalizeStageName,
  resolveDefaultStageDates,
  parseTimeToMinutes,
  dateToMinutes,
  getZonedDayName,
  getZonedMinutes,
  getZonedStartOfDay,
  getZonedDateKey,
  parseAttendanceDate,
  resolveDayBounds,
  resolvePeriodDateRange,
  calculateRegularity,
} from './attendance.service';
import { AttendanceType } from './entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';
import { EvaluationStage } from '../academic-periods/entities/academic-period.entity';

describe('AttendanceService - Unit Tests', () => {
  let service: AttendanceService;
  let attendanceRepo: any;
  let studentRepo: any;
  let enrollmentRepo: any;
  let courseRepo: any;
  let facesService: any;
  let academicPeriodsService: any;

  beforeEach(() => {
    attendanceRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn(async (att) => ({
        ...att,
        id: 'att-1',
        timestamp: att.timestamp || new Date(),
      })),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    studentRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    enrollmentRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    courseRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    facesService = {
      identifyFace: jest.fn(),
    };

    academicPeriodsService = {
      findByYearAndStage: jest.fn(),
    };

    service = new AttendanceService(
      attendanceRepo,
      studentRepo,
      enrollmentRepo,
      courseRepo,
      facesService,
      academicPeriodsService,
    );
  });

  describe('Helper Functions', () => {
    it('normalizeDay should lowercase and remove accents', () => {
      expect(normalizeDay('Lunes')).toBe('lunes');
      expect(normalizeDay('Miércoles')).toBe('miercoles');
      expect(normalizeDay('MIERCOLES')).toBe('miercoles');
      expect(normalizeDay('Sábado')).toBe('sabado');
      expect(normalizeDay('  Jueves  ')).toBe('jueves');
      expect(normalizeDay('')).toBe('');
    });

    it('normalizeStageName should accurately identify canonical stages and legacy labels', () => {
      expect(normalizeStageName('1ª Etapa')).toBe(EvaluationStage.ETAPA_1);
      expect(normalizeStageName('1a Etapa')).toBe(EvaluationStage.ETAPA_1);
      expect(normalizeStageName('1 Etapa')).toBe(EvaluationStage.ETAPA_1);
      expect(normalizeStageName('2026-I')).toBe(EvaluationStage.ETAPA_1);
      expect(normalizeStageName('Periodo 2026 - 1ª Etapa')).toBe(EvaluationStage.ETAPA_1);
      expect(normalizeStageName('Primera Etapa')).toBe(EvaluationStage.ETAPA_1);

      expect(normalizeStageName('2ª Etapa')).toBe(EvaluationStage.ETAPA_2);
      expect(normalizeStageName('2a Etapa')).toBe(EvaluationStage.ETAPA_2);
      expect(normalizeStageName('2 Etapa')).toBe(EvaluationStage.ETAPA_2);
      expect(normalizeStageName('2026-II')).toBe(EvaluationStage.ETAPA_2);
      expect(normalizeStageName('Periodo 2026 - 2ª Etapa')).toBe(EvaluationStage.ETAPA_2);
      expect(normalizeStageName('Segunda Etapa')).toBe(EvaluationStage.ETAPA_2);

      expect(normalizeStageName('Examen Final')).toBe(EvaluationStage.EXAMEN_FINAL);
      expect(normalizeStageName('final')).toBe(EvaluationStage.EXAMEN_FINAL);

      expect(normalizeStageName('Recuperatorio')).toBe(EvaluationStage.RECUPERATORIO);
      expect(normalizeStageName('recup')).toBe(EvaluationStage.RECUPERATORIO);

      expect(normalizeStageName('Ciclo Completo')).toBeNull();
      expect(normalizeStageName('2026')).toBeNull();
      expect(normalizeStageName('')).toBeNull();
      expect(normalizeStageName(undefined)).toBeNull();
    });

    it('resolveDefaultStageDates should return standard Paraguayan calendar dates', () => {
      const stage1 = resolveDefaultStageDates(EvaluationStage.ETAPA_1, 2026);
      expect(stage1.startDate).toEqual(new Date(2026, 1, 1, 0, 0, 0, 0)); // Feb 1
      expect(stage1.endDate).toEqual(new Date(2026, 5, 30, 23, 59, 59, 999)); // Jun 30

      const stage2 = resolveDefaultStageDates(EvaluationStage.ETAPA_2, 2026);
      expect(stage2.startDate).toEqual(new Date(2026, 6, 1, 0, 0, 0, 0)); // Jul 1
      expect(stage2.endDate).toEqual(new Date(2026, 9, 31, 23, 59, 59, 999)); // Oct 31

      const stageFinal = resolveDefaultStageDates(EvaluationStage.EXAMEN_FINAL, 2026);
      expect(stageFinal.startDate).toEqual(new Date(2026, 10, 1, 0, 0, 0, 0)); // Nov 1
      expect(stageFinal.endDate).toEqual(new Date(2026, 10, 30, 23, 59, 59, 999)); // Nov 30

      const stageRecup = resolveDefaultStageDates(EvaluationStage.RECUPERATORIO, 2026);
      expect(stageRecup.startDate).toEqual(new Date(2026, 11, 1, 0, 0, 0, 0)); // Dec 1
      expect(stageRecup.endDate).toEqual(new Date(2026, 11, 15, 23, 59, 59, 999)); // Dec 15
    });

    it('parseTimeToMinutes should convert HH:mm to minutes', () => {
      expect(parseTimeToMinutes('00:00')).toBe(0);
      expect(parseTimeToMinutes('08:30')).toBe(510);
      expect(parseTimeToMinutes('16:00')).toBe(960);
      expect(parseTimeToMinutes('17:30')).toBe(1050);
      expect(parseTimeToMinutes('23:59')).toBe(1439);
      expect(parseTimeToMinutes('')).toBe(0);
    });

    it('dateToMinutes should convert date to minutes', () => {
      const date = new Date(2026, 7, 18, 16, 30);
      expect(dateToMinutes(date)).toBe(16 * 60 + 30);
    });

    it('getZonedDayName should return normalized day in target timezone', () => {
      // 2026-08-17 is Monday
      const mondayUtc = new Date('2026-08-17T15:00:00Z');
      expect(getZonedDayName(mondayUtc, 'America/Asuncion')).toBe('lunes');

      // 2026-08-18 is Tuesday
      const tuesdayUtc = new Date('2026-08-18T20:00:00Z');
      expect(getZonedDayName(tuesdayUtc, 'America/Asuncion')).toBe('martes');
    });

    it('getZonedMinutes should return minutes from midnight in target timezone', () => {
      // 16:30 UTC in UTC timezone -> 990 minutes
      const dateUtc = new Date('2026-08-18T16:30:00Z');
      expect(getZonedMinutes(dateUtc, 'UTC')).toBe(16 * 60 + 30);
    });

    it('getZonedStartOfDay should return start of day date object', () => {
      const dateUtc = new Date('2026-08-18T16:30:00Z');
      const startOfDay = getZonedStartOfDay(dateUtc, 'UTC');
      expect(startOfDay.getHours()).toBe(0);
      expect(startOfDay.getMinutes()).toBe(0);
      expect(startOfDay.getSeconds()).toBe(0);
    });

    it('getZonedDateKey should return YYYY-MM-DD string in target timezone', () => {
      const dateUtc = new Date('2026-08-18T16:30:00Z');
      expect(getZonedDateKey(dateUtc, 'UTC')).toBe('2026-08-18');
    });

    it('resolvePeriodDateRange should parse stages, full cycle, and year strings correctly', () => {
      const range1 = resolvePeriodDateRange('1ª Etapa', 2026);
      expect(range1?.startDate).toEqual(new Date(2026, 1, 1, 0, 0, 0, 0)); // Feb 1
      expect(range1?.endDate).toEqual(new Date(2026, 5, 30, 23, 59, 59, 999)); // Jun 30

      const range2 = resolvePeriodDateRange('2ª Etapa', 2026);
      expect(range2?.startDate).toEqual(new Date(2026, 6, 1, 0, 0, 0, 0)); // Jul 1
      expect(range2?.endDate).toEqual(new Date(2026, 9, 31, 23, 59, 59, 999)); // Oct 31

      const rangeExam = resolvePeriodDateRange('Examen Final', 2026);
      expect(rangeExam?.startDate).toEqual(new Date(2026, 10, 1, 0, 0, 0, 0)); // Nov 1
      expect(rangeExam?.endDate).toEqual(new Date(2026, 10, 30, 23, 59, 59, 999)); // Nov 30

      const rangeRecup = resolvePeriodDateRange('Recuperatorio', 2026);
      expect(rangeRecup?.startDate).toEqual(new Date(2026, 11, 1, 0, 0, 0, 0)); // Dec 1
      expect(rangeRecup?.endDate).toEqual(new Date(2026, 11, 15, 23, 59, 59, 999)); // Dec 15

      const rangeFull = resolvePeriodDateRange('Ciclo Completo', 2026);
      expect(rangeFull?.startDate).toEqual(new Date(2026, 0, 1, 0, 0, 0, 0));
      expect(rangeFull?.endDate).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));

      const rangeYear = resolvePeriodDateRange('2026');
      expect(rangeYear?.startDate).toEqual(new Date(2026, 0, 1, 0, 0, 0, 0));
      expect(rangeYear?.endDate).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));

      expect(resolvePeriodDateRange(undefined)).toBeNull();
    });

    it('calculateRegularity should return REGULAR for 0 classes held without penalizing', () => {
      expect(calculateRegularity(100, 0)).toBe('REGULAR');
      expect(calculateRegularity(0, 0)).toBe('REGULAR');
      expect(calculateRegularity(100, 5)).toBe('REGULAR');
      expect(calculateRegularity(75, 20)).toBe('REGULAR');
      expect(calculateRegularity(74, 20)).toBe('EN ALERTA');
      expect(calculateRegularity(70, 20)).toBe('EN ALERTA');
      expect(calculateRegularity(69, 20)).toBe('IRREGULAR');
      expect(calculateRegularity(0, 20)).toBe('IRREGULAR');
    });

    it('parseAttendanceDate should safely anchor YYYY-MM-DD date-only strings to noon', () => {
      const parsed = parseAttendanceDate('2026-08-19');
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(7); // August (0-indexed)
      expect(parsed.getDate()).toBe(19);
      expect(parsed.getHours()).toBe(12);

      const parsedIso = parseAttendanceDate('2026-08-19T15:30:00.000Z');
      expect(parsedIso.toISOString()).toBe('2026-08-19T15:30:00.000Z');

      const now = new Date();
      expect(parseAttendanceDate(null)).toBeInstanceOf(Date);
      expect(parseAttendanceDate(undefined)).toBeInstanceOf(Date);
      expect(parseAttendanceDate(now)).toBe(now);
    });

    it('resolveDayBounds should return start of day (00:00:00.000) and end of day (23:59:59.999)', () => {
      const { startOfDay, endOfDay } = resolveDayBounds('2026-08-19');
      expect(startOfDay.getFullYear()).toBe(2026);
      expect(startOfDay.getMonth()).toBe(7);
      expect(startOfDay.getDate()).toBe(19);
      expect(startOfDay.getHours()).toBe(0);
      expect(startOfDay.getMinutes()).toBe(0);
      expect(startOfDay.getSeconds()).toBe(0);

      expect(endOfDay.getFullYear()).toBe(2026);
      expect(endOfDay.getMonth()).toBe(7);
      expect(endOfDay.getDate()).toBe(19);
      expect(endOfDay.getHours()).toBe(23);
      expect(endOfDay.getMinutes()).toBe(59);
      expect(endOfDay.getSeconds()).toBe(59);
      expect(endOfDay.getMilliseconds()).toBe(999);
    });

    it('resolveDayBounds should throw BadRequestException for invalid date string', () => {
      expect(() => resolveDayBounds('invalid-date-string')).toThrow(BadRequestException);
    });
  });

  describe('resolveCourseForStudent', () => {
    const courseBallet: Course = {
      id: 'course-ballet',
      name: 'Ballet Clásico',
      level: 'Nivel Inicial',
      capacity: 20,
      year: 2026,
      classCode: 'BAL-INI-2026',
      teacher: null,
      teacherId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      schedules: [
        {
          id: 'sch-1',
          courseId: 'course-ballet',
          course: null as any,
          dayOfWeek: 'Lunes',
          startTime: '16:00',
          endTime: '17:30',
          classroom: 'Aula A',
        },
      ],
    };

    const courseDanzaPy: Course = {
      id: 'course-danza-py',
      name: 'Danza Paraguaya',
      level: 'Nivel Intermedio',
      capacity: 20,
      year: 2026,
      classCode: 'DAN-PAR-2026',
      teacher: null,
      teacherId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      schedules: [
        {
          id: 'sch-2',
          courseId: 'course-danza-py',
          course: null as any,
          dayOfWeek: 'Martes',
          startTime: '17:00',
          endTime: '18:30',
          classroom: 'Aula B',
        },
      ],
    };

    const courseJazz: Course = {
      id: 'course-jazz',
      name: 'Jazz',
      level: 'Nivel Avanzado',
      capacity: 15,
      year: 2026,
      classCode: 'JAZ-AVA-2026',
      teacher: null,
      teacherId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      schedules: [
        {
          id: 'sch-3',
          courseId: 'course-jazz',
          course: null as any,
          dayOfWeek: 'Lunes',
          startTime: '18:00',
          endTime: '19:30',
          classroom: 'Aula A',
        },
      ],
    };

    it('should return null if student has no active enrollments', async () => {
      enrollmentRepo.find.mockResolvedValue([]);
      const result = await service.resolveCourseForStudent('student-1');
      expect(result).toBeNull();
    });

    it('should select Ballet when marking on Monday at 15:45 (45 min tolerance before 16:00)', async () => {
      enrollmentRepo.find.mockResolvedValue([
        { studentId: 's1', status: 'active', course: courseBallet },
        { studentId: 's1', status: 'active', course: courseDanzaPy },
      ]);

      // Monday (2026-08-17 is Monday) at 15:45
      const mondayTime = new Date(2026, 7, 17, 15, 45);
      const result = await service.resolveCourseForStudent('s1', mondayTime);

      expect(result).toBeDefined();
      expect(result?.id).toBe('course-ballet');
    });

    it('should select Danza Paraguaya when marking on Tuesday at 17:15', async () => {
      enrollmentRepo.find.mockResolvedValue([
        { studentId: 's1', status: 'active', course: courseBallet },
        { studentId: 's1', status: 'active', course: courseDanzaPy },
      ]);

      // Tuesday (2026-08-18 is Tuesday) at 17:15
      const tuesdayTime = new Date(2026, 7, 18, 17, 15);
      const result = await service.resolveCourseForStudent('s1', tuesdayTime);

      expect(result).toBeDefined();
      expect(result?.id).toBe('course-danza-py');
    });

    it('should distinguish between two courses on the same day by time (Ballet at 16:00 vs Jazz at 18:00)', async () => {
      enrollmentRepo.find.mockResolvedValue([
        { studentId: 's1', status: 'active', course: courseBallet },
        { studentId: 's1', status: 'active', course: courseJazz },
      ]);

      // Monday at 16:15 -> Ballet
      const mondayBalletTime = new Date(2026, 7, 17, 16, 15);
      const resultBallet = await service.resolveCourseForStudent(
        's1',
        mondayBalletTime,
      );
      expect(resultBallet?.id).toBe('course-ballet');

      // Monday at 18:05 -> Jazz
      const mondayJazzTime = new Date(2026, 7, 17, 18, 5);
      const resultJazz = await service.resolveCourseForStudent(
        's1',
        mondayJazzTime,
      );
      expect(resultJazz?.id).toBe('course-jazz');
    });

    it('should fallback to closest schedule today when marking outside the 45m window', async () => {
      enrollmentRepo.find.mockResolvedValue([
        { studentId: 's1', status: 'active', course: courseBallet },
        { studentId: 's1', status: 'active', course: courseJazz },
      ]);

      // Monday at 13:00 (3 hours before Ballet at 16:00, 5 hours before Jazz at 18:00)
      const earlyMondayTime = new Date(2026, 7, 17, 13, 0);
      const result = await service.resolveCourseForStudent('s1', earlyMondayTime);

      expect(result?.id).toBe('course-ballet');
    });

    it('should fallback to first active course when today has no scheduled classes', async () => {
      enrollmentRepo.find.mockResolvedValue([
        { studentId: 's1', status: 'active', course: courseBallet },
        { studentId: 's1', status: 'active', course: courseDanzaPy },
      ]);

      // Sunday (2026-08-16 is Sunday)
      const sundayTime = new Date(2026, 7, 16, 10, 0);
      const result = await service.resolveCourseForStudent('s1', sundayTime);

      expect(result?.id).toBe('course-ballet');
    });

    it('should match correctly with accented and unaccented schedule dayOfWeek', async () => {
      const courseWednesday: Course = {
        ...courseBallet,
        id: 'course-wed',
        schedules: [
          {
            id: 'sch-w',
            courseId: 'course-wed',
            course: null as any,
            dayOfWeek: 'Miércoles',
            startTime: '15:00',
            endTime: '16:30',
            classroom: 'Aula A',
          },
        ],
      };

      enrollmentRepo.find.mockResolvedValue([
        { studentId: 's1', status: 'active', course: courseWednesday },
      ]);

      // Wednesday (2026-08-19 is Wednesday) at 15:10
      const wednesdayTime = new Date(2026, 7, 19, 15, 10);
      const result = await service.resolveCourseForStudent('s1', wednesdayTime);

      expect(result?.id).toBe('course-wed');
    });
  });

  describe('checkInBiometric', () => {
    const mockStudent = {
      id: 'student-uuid',
      firstName: 'Camila',
      lastName: 'Gómez',
      biometricTemplateId: 'face-uuid-1',
    };

    const mockCourse: Course = {
      id: 'course-ballet',
      name: 'Ballet Clásico',
      level: 'Nivel Inicial',
      capacity: 20,
      year: 2026,
      classCode: 'BAL-INI-2026',
      teacher: null,
      teacherId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      schedules: [
        {
          id: 'sch-1',
          courseId: 'course-ballet',
          course: null as any,
          dayOfWeek: 'Lunes',
          startTime: '16:00',
          endTime: '17:30',
          classroom: 'Aula Principal',
        },
      ],
    };

    it('should throw BadRequestException when base64 is invalid', async () => {
      await expect(service.checkInBiometric(null as any)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when face recognition fails or has no match', async () => {
      facesService.identifyFace.mockResolvedValue({ matched: false });
      const base64Img = 'data:image/jpeg;base64,' + Buffer.from('img').toString('base64');

      await expect(service.checkInBiometric(base64Img)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when student is not found in database', async () => {
      facesService.identifyFace.mockResolvedValue({
        matched: true,
        faceId: 'non-existent-face-id',
      });
      studentRepo.findOne.mockResolvedValue(null);

      const base64Img = 'data:image/jpeg;base64,' + Buffer.from('img').toString('base64');
      await expect(service.checkInBiometric(base64Img)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should register ENTRADA for student on first check-in of the course today', async () => {
      facesService.identifyFace.mockResolvedValue({
        matched: true,
        faceId: 'face-uuid-1',
      });
      studentRepo.findOne.mockResolvedValue(mockStudent);
      enrollmentRepo.find.mockResolvedValue([
        { studentId: mockStudent.id, status: 'active', course: mockCourse },
      ]);
      attendanceRepo.findOne.mockResolvedValue(null); // No prior attendance today

      const base64Img = 'data:image/jpeg;base64,' + Buffer.from('img').toString('base64');
      const result = await service.checkInBiometric(base64Img);

      expect(result.success).toBe(true);
      expect(result.studentName).toBe('Camila Gómez');
      expect(result.type).toBe(AttendanceType.ENTRADA);
      expect(result.courseName).toBe('Ballet Clásico - Nivel Inicial');
      expect(result.courseId).toBe('course-ballet');
    });

    it('should register ENTRADA with null course when student has no active enrollments', async () => {
      facesService.identifyFace.mockResolvedValue({
        matched: true,
        faceId: 'face-uuid-1',
      });
      studentRepo.findOne.mockResolvedValue(mockStudent);
      enrollmentRepo.find.mockResolvedValue([]); // No active enrollments
      attendanceRepo.findOne.mockResolvedValue(null);

      const base64Img = 'data:image/jpeg;base64,' + Buffer.from('img').toString('base64');
      const result = await service.checkInBiometric(base64Img);

      expect(result.success).toBe(true);
      expect(result.studentName).toBe('Camila Gómez');
      expect(result.type).toBe(AttendanceType.ENTRADA);
      expect(result.courseId).toBeNull();
      expect(result.courseName).toBeUndefined();
    });

    it('should prevent accidental checkout if checked in again within the 2-minute debounce window', async () => {
      facesService.identifyFace.mockResolvedValue({
        matched: true,
        faceId: 'face-uuid-1',
      });
      studentRepo.findOne.mockResolvedValue(mockStudent);
      enrollmentRepo.find.mockResolvedValue([
        { studentId: mockStudent.id, status: 'active', course: mockCourse },
      ]);

      // Last attendance was ENTRADA 30 seconds ago
      const recentTimestamp = new Date(Date.now() - 30 * 1000);
      attendanceRepo.findOne.mockResolvedValue({
        id: 'att-prev',
        studentId: mockStudent.id,
        courseId: mockCourse.id,
        type: AttendanceType.ENTRADA,
        timestamp: recentTimestamp,
      });

      const base64Img = 'data:image/jpeg;base64,' + Buffer.from('img').toString('base64');
      const result = await service.checkInBiometric(base64Img);

      expect(result.success).toBe(true);
      expect(result.type).toBe(AttendanceType.ENTRADA);
      expect(result.message).toContain('registrada recientemente');
      // Should not call save since it did not create a new attendance
      expect(attendanceRepo.save).not.toHaveBeenCalled();
    });

    it('should register SALIDA for student on second check-in after the debounce window', async () => {
      facesService.identifyFace.mockResolvedValue({
        matched: true,
        faceId: 'face-uuid-1',
      });
      studentRepo.findOne.mockResolvedValue(mockStudent);
      enrollmentRepo.find.mockResolvedValue([
        { studentId: mockStudent.id, status: 'active', course: mockCourse },
      ]);

      // Last attendance was ENTRADA 1 hour ago
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      attendanceRepo.findOne.mockResolvedValue({
        id: 'att-prev',
        studentId: mockStudent.id,
        courseId: mockCourse.id,
        type: AttendanceType.ENTRADA,
        timestamp: oneHourAgo,
      });

      const base64Img = 'data:image/jpeg;base64,' + Buffer.from('img').toString('base64');
      const result = await service.checkInBiometric(base64Img);

      expect(result.success).toBe(true);
      expect(result.type).toBe(AttendanceType.SALIDA);
      expect(attendanceRepo.save).toHaveBeenCalled();
    });
  });

  describe('getReports', () => {
    const studentSofia = {
      id: 'student-1',
      firstName: 'Sofía',
      lastName: 'Pérez',
    };
    const studentMateo = {
      id: 'student-2',
      firstName: 'Mateo',
      lastName: 'Gómez',
    };

    const mockCourse = {
      id: 'course-1',
      name: 'Ballet Clásico',
      level: 'Nivel Inicial',
      year: 2026,
    };

    it('should return 100% and REGULAR without penalizing students when 0 classes have been held at start of period', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      enrollmentRepo.find.mockResolvedValue([
        { studentId: studentSofia.id, student: studentSofia, status: 'active' },
        { studentId: studentMateo.id, student: studentMateo, status: 'active' },
      ]);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]), // No attendances recorded yet
      };
      attendanceRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const reports = await service.getReports('course-1', '2026-I');

      expect(reports).toHaveLength(2);
      expect(reports[0].studentName).toBe('Mateo Gómez');
      expect(reports[0].percentage).toBe(100);
      expect(reports[0].classesHeld).toBe(0);
      expect(reports[0].regularity).toBe('REGULAR');

      expect(reports[1].studentName).toBe('Sofía Pérez');
      expect(reports[1].percentage).toBe(100);
      expect(reports[1].classesHeld).toBe(0);
      expect(reports[1].regularity).toBe('REGULAR');
    });

    it('should calculate 100% (REGULAR) for student who attended the only class held in week 1, and 0% (IRREGULAR) for absent student', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      enrollmentRepo.find.mockResolvedValue([
        { studentId: studentSofia.id, student: studentSofia, status: 'active' },
        { studentId: studentMateo.id, student: studentMateo, status: 'active' },
      ]);

      const classDate1 = new Date(2026, 2, 2, 16, 0); // 2026-03-02
      const mockAttendances = [
        {
          id: 'att-1',
          studentId: studentSofia.id,
          student: studentSofia,
          courseId: 'course-1',
          type: AttendanceType.ENTRADA,
          timestamp: classDate1,
        },
        {
          id: 'att-2',
          studentId: studentSofia.id,
          student: studentSofia,
          courseId: 'course-1',
          type: AttendanceType.SALIDA,
          timestamp: new Date(2026, 2, 2, 17, 30),
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAttendances),
      };
      attendanceRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const reports = await service.getReports('course-1', '2026-I');

      expect(reports).toHaveLength(2);
      const sofiaReport = reports.find((r) => r.studentId === studentSofia.id);
      const mateoReport = reports.find((r) => r.studentId === studentMateo.id);

      expect(sofiaReport).toBeDefined();
      expect(sofiaReport?.classesHeld).toBe(1);
      expect(sofiaReport?.entradas).toBe(1);
      expect(sofiaReport?.percentage).toBe(100); // 1 / 1 * 100 = 100% (eliminates the old 5% bias!)
      expect(sofiaReport?.regularity).toBe('REGULAR');

      expect(mateoReport).toBeDefined();
      expect(mateoReport?.classesHeld).toBe(1);
      expect(mateoReport?.entradas).toBe(0);
      expect(mateoReport?.percentage).toBe(0); // 0 / 1 = 0%
      expect(mateoReport?.regularity).toBe('IRREGULAR');
    });

    it('should classify regularity thresholds (75% Regular, 70% En Alerta, 50% Irregular) over 20 classes held', async () => {
      const studentValentina = {
        id: 'student-3',
        firstName: 'Valentina',
        lastName: 'Giménez',
      };
      const studentCamila = {
        id: 'student-4',
        firstName: 'Camila',
        lastName: 'Díaz',
      };

      courseRepo.findOne.mockResolvedValue(mockCourse);
      enrollmentRepo.find.mockResolvedValue([
        { studentId: studentSofia.id, student: studentSofia, status: 'active' },
        { studentId: studentMateo.id, student: studentMateo, status: 'active' },
        { studentId: studentValentina.id, student: studentValentina, status: 'active' },
        { studentId: studentCamila.id, student: studentCamila, status: 'active' },
      ]);

      // 20 distinct dates
      const attendances: any[] = [];
      for (let day = 1; day <= 20; day++) {
        const date = new Date(2026, 2, day, 16, 0);
        // Camila attends all 20 days (100%)
        attendances.push({
          id: `att-c-${day}`,
          studentId: studentCamila.id,
          student: studentCamila,
          courseId: 'course-1',
          type: AttendanceType.ENTRADA,
          timestamp: date,
        });
        // Sofia attends 15 days (75%)
        if (day <= 15) {
          attendances.push({
            id: `att-s-${day}`,
            studentId: studentSofia.id,
            student: studentSofia,
            courseId: 'course-1',
            type: AttendanceType.ENTRADA,
            timestamp: date,
          });
        }
        // Mateo attends 14 days (70%)
        if (day <= 14) {
          attendances.push({
            id: `att-m-${day}`,
            studentId: studentMateo.id,
            student: studentMateo,
            courseId: 'course-1',
            type: AttendanceType.ENTRADA,
            timestamp: date,
          });
        }
        // Valentina attends 10 days (50%)
        if (day <= 10) {
          attendances.push({
            id: `att-v-${day}`,
            studentId: studentValentina.id,
            student: studentValentina,
            courseId: 'course-1',
            type: AttendanceType.ENTRADA,
            timestamp: date,
          });
        }
      }

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(attendances),
      };
      attendanceRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const reports = await service.getReports('course-1', '2026-I');

      const sofia = reports.find((r) => r.studentId === studentSofia.id);
      const mateo = reports.find((r) => r.studentId === studentMateo.id);
      const valentina = reports.find((r) => r.studentId === studentValentina.id);

      expect(sofia?.classesHeld).toBe(20);
      expect(sofia?.percentage).toBe(75);
      expect(sofia?.regularity).toBe('REGULAR');

      expect(mateo?.classesHeld).toBe(20);
      expect(mateo?.percentage).toBe(70);
      expect(mateo?.regularity).toBe('EN ALERTA');

      expect(valentina?.classesHeld).toBe(20);
      expect(valentina?.percentage).toBe(50);
      expect(valentina?.regularity).toBe('IRREGULAR');
    });

    it('should count multiple check-ins on the same day as 1 class session attended for percentage', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      enrollmentRepo.find.mockResolvedValue([
        { studentId: studentSofia.id, student: studentSofia, status: 'active' },
      ]);

      const sameDayTime1 = new Date(2026, 2, 2, 16, 0);
      const sameDayTime2 = new Date(2026, 2, 2, 16, 5);

      const mockAttendances = [
        {
          id: 'att-1',
          studentId: studentSofia.id,
          student: studentSofia,
          courseId: 'course-1',
          type: AttendanceType.ENTRADA,
          timestamp: sameDayTime1,
        },
        {
          id: 'att-2',
          studentId: studentSofia.id,
          student: studentSofia,
          courseId: 'course-1',
          type: AttendanceType.ENTRADA,
          timestamp: sameDayTime2,
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockAttendances),
      };
      attendanceRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const reports = await service.getReports('course-1');

      expect(reports).toHaveLength(1);
      expect(reports[0].classesHeld).toBe(1);
      expect(reports[0].attendedClasses).toBe(1);
      expect(reports[0].presentCount).toBe(1);
      expect(reports[0].entradas).toBe(2); // Raw checkins preserved
      expect(reports[0].percentage).toBe(100); // 1 distinct day / 1 class held = 100%
      expect(reports[0].regularity).toBe('REGULAR');
    });

    it('should throw BadRequestException when courseId is not provided', async () => {
      await expect(service.getReports()).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when courseId does not exist', async () => {
      courseRepo.findOne.mockResolvedValue(null);
      await expect(service.getReports('non-existent-course')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should filter attendances by database-configured stage dates when available', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      enrollmentRepo.find.mockResolvedValue([
        { studentId: studentSofia.id, student: studentSofia, status: 'active' },
      ]);

      academicPeriodsService.findByYearAndStage.mockResolvedValue({
        id: 'p-1',
        year: 2026,
        name: EvaluationStage.ETAPA_1,
        startDate: '2026-02-15',
        endDate: '2026-06-20',
      });

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      attendanceRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getReports('course-1', '1ª Etapa');

      expect(academicPeriodsService.findByYearAndStage).toHaveBeenCalledWith(
        2026,
        EvaluationStage.ETAPA_1,
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'attendance.timestamp >= :startDate',
        { startDate: new Date(2026, 1, 15, 0, 0, 0, 0) },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'attendance.timestamp <= :endDate',
        { endDate: new Date(2026, 5, 20, 23, 59, 59, 999) },
      );
    });

    it('should filter attendances with default Paraguay calendar dates when stage not configured in DB', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      enrollmentRepo.find.mockResolvedValue([
        { studentId: studentSofia.id, student: studentSofia, status: 'active' },
      ]);

      academicPeriodsService.findByYearAndStage.mockResolvedValue(null);

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      attendanceRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getReports('course-1', '2ª Etapa');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'attendance.timestamp >= :startDate',
        { startDate: new Date(2026, 6, 1, 0, 0, 0, 0) },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'attendance.timestamp <= :endDate',
        { endDate: new Date(2026, 9, 31, 23, 59, 59, 999) },
      );
    });
    it('should support explicit year parameter in getReports', async () => {
      courseRepo.findOne.mockResolvedValue(mockCourse);
      enrollmentRepo.find.mockResolvedValue([
        { studentId: studentSofia.id, student: studentSofia, status: 'active' },
      ]);

      academicPeriodsService.findByYearAndStage.mockResolvedValue({
        id: 'p-2025',
        year: 2025,
        name: EvaluationStage.ETAPA_1,
        startDate: '2025-02-15',
        endDate: '2025-06-30',
      });

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      attendanceRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const reports = await service.getReports('course-1', '1ª Etapa', 2025);

      expect(academicPeriodsService.findByYearAndStage).toHaveBeenCalledWith(
        2025,
        EvaluationStage.ETAPA_1,
      );
      expect(reports).toHaveLength(1);
      expect(reports[0].presentCount).toBe(0);
      expect(reports[0].absentCount).toBe(0);
      expect(reports[0].status).toBe('REGULAR');
    });
  });

  describe('resolvePeriodDateRange and resolvePeriodDateRangeAsync', () => {
    it('should return custom date range from database when record exists for (year, stage)', async () => {
      academicPeriodsService.findByYearAndStage.mockResolvedValue({
        id: 'p-custom',
        year: 2026,
        name: EvaluationStage.ETAPA_1,
        startDate: '2026-02-10',
        endDate: '2026-06-25',
      });

      const range1 = await service.resolvePeriodDateRange(2026, '1ª Etapa');
      expect(range1).toBeDefined();
      expect(range1?.startDate).toEqual(new Date(2026, 1, 10, 0, 0, 0, 0));
      expect(range1?.endDate).toEqual(new Date(2026, 5, 25, 23, 59, 59, 999));

      const range2 = await service.resolvePeriodDateRange('1ª Etapa', 2026);
      expect(range2).toEqual(range1);

      const rangeAsync = await service.resolvePeriodDateRangeAsync('1ª Etapa', 2026);
      expect(rangeAsync).toEqual(range1);
    });

    it('should fallback to default Paraguayan dates when no DB record exists for all canonical stages', async () => {
      academicPeriodsService.findByYearAndStage.mockResolvedValue(null);

      const range1 = await service.resolvePeriodDateRange(2026, '1ª Etapa');
      expect(range1?.startDate).toEqual(new Date(2026, 1, 1, 0, 0, 0, 0));
      expect(range1?.endDate).toEqual(new Date(2026, 5, 30, 23, 59, 59, 999));

      const range2 = await service.resolvePeriodDateRange(2026, '2ª Etapa');
      expect(range2?.startDate).toEqual(new Date(2026, 6, 1, 0, 0, 0, 0));
      expect(range2?.endDate).toEqual(new Date(2026, 9, 31, 23, 59, 59, 999));

      const rangeExam = await service.resolvePeriodDateRange(2026, 'Examen Final');
      expect(rangeExam?.startDate).toEqual(new Date(2026, 10, 1, 0, 0, 0, 0));
      expect(rangeExam?.endDate).toEqual(new Date(2026, 10, 30, 23, 59, 59, 999));

      const rangeRecup = await service.resolvePeriodDateRange(2026, 'Recuperatorio');
      expect(rangeRecup?.startDate).toEqual(new Date(2026, 11, 1, 0, 0, 0, 0));
      expect(rangeRecup?.endDate).toEqual(new Date(2026, 11, 15, 23, 59, 59, 999));
    });

    it('should fallback to default Paraguayan dates when service throws an error', async () => {
      academicPeriodsService.findByYearAndStage.mockRejectedValue(new Error('Connection lost'));

      const range = await service.resolvePeriodDateRange(2026, '1ª Etapa');
      expect(range?.startDate).toEqual(new Date(2026, 1, 1, 0, 0, 0, 0));
      expect(range?.endDate).toEqual(new Date(2026, 5, 30, 23, 59, 59, 999));
    });

    it('should return full year range for Ciclo Completo or standalone year', async () => {
      const rangeFull = await service.resolvePeriodDateRange(2026, 'Ciclo Completo');
      expect(rangeFull?.startDate).toEqual(new Date(2026, 0, 1, 0, 0, 0, 0));
      expect(rangeFull?.endDate).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));

      const rangeYear = await service.resolvePeriodDateRange('2026', 2026);
      expect(rangeYear?.startDate).toEqual(new Date(2026, 0, 1, 0, 0, 0, 0));
      expect(rangeYear?.endDate).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));
    });

    it('should return null when period is undefined or empty', async () => {
      expect(await service.resolvePeriodDateRange(2026, undefined)).toBeNull();
      expect(await service.resolvePeriodDateRange(2026, '')).toBeNull();
      expect(await service.resolvePeriodDateRange(undefined)).toBeNull();
    });
  });

  describe('checkInByDocument', () => {
    const mockStudent = {
      id: 'student-doc-1',
      firstName: 'Lucía',
      lastName: 'Mendoza',
      ci: '1234567',
      status: 'active',
    };

    const mockCourse: Course = {
      id: 'course-ballet',
      name: 'Ballet Clásico',
      level: 'Nivel Inicial',
      capacity: 20,
      year: 2026,
      classCode: 'BAL-INI-2026',
      teacher: null,
      teacherId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      schedules: [],
    };

    it('should throw BadRequestException if CI is missing', async () => {
      await expect(service.checkInByDocument({ ci: '' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if student with CI is not found or inactive', async () => {
      studentRepo.findOne.mockResolvedValue(null);
      await expect(service.checkInByDocument({ ci: '999999' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should register ENTRADA for student by CI', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);
      courseRepo.findOne.mockResolvedValue(mockCourse);
      enrollmentRepo.find.mockResolvedValue([
        { studentId: mockStudent.id, status: 'active', course: mockCourse },
      ]);
      attendanceRepo.findOne.mockResolvedValue(null);

      const result = await service.checkInByDocument({ ci: '1234567' });
      expect(result.success).toBe(true);
      expect(result.studentName).toBe('Lucía Mendoza');
      expect(result.type).toBe(AttendanceType.ENTRADA);
    });

    it('should normalize CI with dots (e.g. 1.234.567)', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);
      courseRepo.findOne.mockResolvedValue(mockCourse);
      enrollmentRepo.find.mockResolvedValue([
        { studentId: mockStudent.id, status: 'active', course: mockCourse },
      ]);
      attendanceRepo.findOne.mockResolvedValue(null);

      const result = await service.checkInByDocument({ ci: '1.234.567' });
      expect(result.success).toBe(true);
      expect(studentRepo.findOne).toHaveBeenCalledWith({
        where: { ci: '1234567', status: 'active' },
      });
    });
  });

  describe('getAttendancesByDate', () => {
    it('should return list of enrolled students with attendance state on a specific date', async () => {
      const mockCourse = { id: 'course-1', name: 'Ballet' };
      const student1 = { id: 's-1', firstName: 'Lucía', lastName: 'Mendoza', ci: '123456' };
      const student2 = { id: 's-2', firstName: 'Ana', lastName: 'Ríos', ci: '654321' };

      courseRepo.findOne.mockResolvedValue(mockCourse);
      enrollmentRepo.find.mockResolvedValue([
        { studentId: student1.id, student: student1, status: 'active' },
        { studentId: student2.id, student: student2, status: 'active' },
      ]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 'att-1',
            studentId: student1.id,
            courseId: 'course-1',
            type: AttendanceType.ENTRADA,
            method: 'Biometric',
            timestamp: new Date(2026, 7, 19, 16, 5),
          },
        ]),
      };
      attendanceRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getAttendancesByDate('course-1', '2026-08-19');

      expect(result).toHaveLength(2);
      const ana = result.find((r) => r.studentId === student2.id);
      const lucia = result.find((r) => r.studentId === student1.id);

      expect(lucia?.isPresent).toBe(true);
      expect(lucia?.attendanceId).toBe('att-1');
      expect(lucia?.method).toBe('Biometric');

      expect(ana?.isPresent).toBe(false);
      expect(ana?.attendanceId).toBeNull();
    });
  });

  describe('deleteAttendance', () => {
    it('should throw NotFoundException if attendance ID does not exist', async () => {
      attendanceRepo.findOne.mockResolvedValue(null);
      await expect(service.deleteAttendance('non-existent')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('should remove attendance successfully when ID exists', async () => {
      const mockAtt = { id: 'att-123', studentId: 's-1' };
      attendanceRepo.findOne.mockResolvedValue(mockAtt);
      attendanceRepo.remove.mockResolvedValue(mockAtt);

      const res = await service.deleteAttendance('att-123');
      expect(res.success).toBe(true);
      expect(attendanceRepo.remove).toHaveBeenCalledWith(mockAtt);
    });
  });
});

