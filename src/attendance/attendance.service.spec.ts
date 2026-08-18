import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  AttendanceService,
  normalizeDay,
  parseTimeToMinutes,
  dateToMinutes,
  getZonedDayName,
  getZonedMinutes,
  getZonedStartOfDay,
} from './attendance.service';
import { AttendanceType } from './entities/attendance.entity';
import { Course } from '../courses/entities/course.entity';

describe('AttendanceService - Unit Tests', () => {
  let service: AttendanceService;
  let attendanceRepo: any;
  let studentRepo: any;
  let enrollmentRepo: any;
  let facesService: any;

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

    facesService = {
      identifyFace: jest.fn(),
    };

    service = new AttendanceService(
      attendanceRepo,
      studentRepo,
      enrollmentRepo,
      facesService,
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
});
