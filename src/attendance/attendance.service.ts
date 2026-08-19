import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull, FindOptionsWhere } from 'typeorm';
import { isUUID } from 'class-validator';
import { Attendance, AttendanceType } from './entities/attendance.entity';
import { Student } from '../students/entities/student.entity';
import { FacesService } from '../faces/faces.service';
import { Enrollment } from '../students/entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { CourseSchedule } from '../courses/entities/course-schedule.entity';
import { ManualAttendanceDto } from './dto/manual-attendance.dto';
import { AcademicPeriodsService } from '../academic-periods/academic-periods.service';
import { EvaluationStage } from '../academic-periods/entities/academic-period.entity';

/** Default timezone for the academy (Paraguay: America/Asuncion) */
export const DEFAULT_TIMEZONE =
  process.env.ACADEMY_TIMEZONE || process.env.TZ || 'America/Asuncion';

/** Tolerance window in minutes before class start and after class end */
export const WINDOW_BEFORE_MINUTES = 45;
export const WINDOW_AFTER_MINUTES = 45;

/** Minimum cooldown interval (2 minutes) to prevent accidental immediate check-out on rapid scans */
export const MIN_CHECKOUT_INTERVAL_MS = 2 * 60 * 1000;

/** Map JavaScript getDay() integer (0=Sunday ... 6=Saturday) to normalized Spanish day names */
export const DAY_NAMES_MAP: Record<number, string> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
};

/**
 * Normalizes day name string for consistent comparisons (lowercase, trimmed, without accents)
 * e.g., "Miércoles" -> "miercoles", "Sábado " -> "sabado"
 */
export function normalizeDay(day: string): string {
  if (!day) return '';
  return day
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalizes an arbitrary period / stage string to the canonical EvaluationStage enum.
 */
export function normalizeStageName(period?: string): EvaluationStage | null {
  if (!period) return null;
  const p = period.toLowerCase().trim();

  if (p.includes('recuperatorio') || p.includes('recup')) {
    return EvaluationStage.RECUPERATORIO;
  }
  if (p.includes('examen') || p.includes('final')) {
    return EvaluationStage.EXAMEN_FINAL;
  }
  if (
    /[-_ ](ii|2)$/i.test(p) ||
    /2[aª]?\s*etapa/i.test(p) ||
    /etapa\s*2/i.test(p) ||
    p.includes('2ª etapa') ||
    p.includes('2a etapa') ||
    p.includes('segund')
  ) {
    return EvaluationStage.ETAPA_2;
  }
  if (
    /[-_ ](i|1)$/i.test(p) ||
    /1[aª]?\s*etapa/i.test(p) ||
    /etapa\s*1/i.test(p) ||
    p.includes('1ª etapa') ||
    p.includes('1a etapa') ||
    p.includes('primer')
  ) {
    return EvaluationStage.ETAPA_1;
  }
  return null;
}

/**
 * Returns default Paraguayan academic dates for each stage in a given year.
 */
export function resolveDefaultStageDates(
  stage: EvaluationStage,
  year: number,
): { startDate: Date; endDate: Date } {
  switch (stage) {
    case EvaluationStage.ETAPA_1:
      return {
        startDate: new Date(year, 1, 1, 0, 0, 0, 0), // Feb 1
        endDate: new Date(year, 5, 30, 23, 59, 59, 999), // Jun 30
      };
    case EvaluationStage.ETAPA_2:
      return {
        startDate: new Date(year, 6, 1, 0, 0, 0, 0), // Jul 1
        endDate: new Date(year, 9, 31, 23, 59, 59, 999), // Oct 31
      };
    case EvaluationStage.EXAMEN_FINAL:
      return {
        startDate: new Date(year, 10, 1, 0, 0, 0, 0), // Nov 1
        endDate: new Date(year, 10, 30, 23, 59, 59, 999), // Nov 30
      };
    case EvaluationStage.RECUPERATORIO:
      return {
        startDate: new Date(year, 11, 1, 0, 0, 0, 0), // Dec 1
        endDate: new Date(year, 11, 15, 23, 59, 59, 999), // Dec 15
      };
  }
}

/**
 * Resolves the day of the week name (normalized, lowercase Spanish) in the target timezone.
 */
export function getZonedDayName(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE,
): string {
  try {
    const formatter = new Intl.DateTimeFormat('es-ES', {
      timeZone,
      weekday: 'long',
    });
    return normalizeDay(formatter.format(date));
  } catch {
    return DAY_NAMES_MAP[date.getDay()] || '';
  }
}

/**
 * Converts a Date object's hours and minutes to minutes from midnight in the target timezone.
 */
export function getZonedMinutes(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE,
): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(date);
    let hour = 0;
    let minute = 0;
    for (const part of parts) {
      if (part.type === 'hour') hour = parseInt(part.value, 10) || 0;
      if (part.type === 'minute') minute = parseInt(part.value, 10) || 0;
    }
    return hour * 60 + minute;
  } catch {
    return date.getHours() * 60 + date.getMinutes();
  }
}

/**
 * Calculates start of day (00:00:00.000) for a given date in the target timezone.
 */
export function getZonedStartOfDay(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE,
): Date {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const dateStr = formatter.format(date);
    const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  } catch {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }
}

/**
 * Converts a time string (HH:mm) to minutes from midnight (0..1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.trim().split(':').map((v) => parseInt(v, 10));
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converts a Date object's hours and minutes to minutes from midnight (local fallback).
 */
export function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Returns the calendar date string in YYYY-MM-DD format for a given date in the target timezone.
 */
export function getZonedDateKey(
  date: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE,
): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Resolves start and end date boundaries synchronously using standard default calendar dates.
 */
export function resolvePeriodDateRange(
  period?: string,
  defaultYear: number = new Date().getFullYear(),
): { startDate: Date; endDate: Date } | null {
  if (!period) {
    return null;
  }

  const trimmed = period.trim();
  const yearMatch = trimmed.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : defaultYear;

  const stage = normalizeStageName(trimmed);
  if (stage) {
    return resolveDefaultStageDates(stage, year);
  }

  const lower = trimmed.toLowerCase();
  if (lower.includes('ciclo') || lower.includes('completo') || yearMatch) {
    return {
      startDate: new Date(year, 0, 1, 0, 0, 0, 0),
      endDate: new Date(year, 11, 31, 23, 59, 59, 999),
    };
  }

  return null;
}

/**
 * Classifies attendance regularity based on thesis threshold (>= 75% Regular, 70-74% En Alerta, < 70% Irregular).
 */
export function calculateRegularity(
  percentage: number,
  classesHeld: number = 0,
): 'REGULAR' | 'EN ALERTA' | 'IRREGULAR' {
  if (classesHeld === 0) {
    return 'REGULAR';
  }
  if (percentage >= 75) {
    return 'REGULAR';
  }
  if (percentage >= 70) {
    return 'EN ALERTA';
  }
  return 'IRREGULAR';
}

export interface BiometricCheckInResponse {
  success: boolean;
  message: string;
  studentName: string;
  courseName?: string;
  courseId: string | null;
  timestamp: Date;
  type: AttendanceType;
}

export interface ReportItem {
  studentId: string;
  studentName: string;
  totalCheckins: number;
  entradas: number;
  salidas: number;
  percentage: number;
  classesHeld?: number;
  regularity?: 'REGULAR' | 'EN ALERTA' | 'IRREGULAR';
  presentCount?: number;
  absentCount?: number;
  status?: string;
}

interface ScheduleMatch {
  course: Course;
  schedule: CourseSchedule;
  distanceToInterval: number;
  distanceToStart: number;
  isWithinTolerance: boolean;
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly facesService: FacesService,
    @Optional()
    private readonly academicPeriodsService?: AcademicPeriodsService,
  ) {}

  /**
   * Resolves start and end date boundaries asynchronously by querying AcademicPeriodsService
   * with fallback to standard Paraguayan calendar dates.
   * Supports both (year, periodName) and (periodName, defaultYear) call signatures.
   */
  async resolvePeriodDateRange(
    arg1?: string | number,
    arg2?: string | number,
  ): Promise<{ startDate: Date; endDate: Date } | null> {
    let year: number = new Date().getFullYear();
    let period: string | undefined;

    if (typeof arg1 === 'number') {
      year = arg1;
      period = typeof arg2 === 'string' ? arg2 : undefined;
    } else if (typeof arg1 === 'string') {
      period = arg1;
      year = typeof arg2 === 'number' ? arg2 : new Date().getFullYear();
    } else if (typeof arg2 === 'number') {
      year = arg2;
    }

    if (!period || typeof period !== 'string' || period.trim() === '') {
      return null;
    }

    const trimmed = period.trim();
    const yearMatch = trimmed.match(/(\d{4})/);
    if (yearMatch && typeof arg1 !== 'number' && typeof arg2 !== 'number') {
      year = parseInt(yearMatch[1], 10);
    }

    const normalizedStage = normalizeStageName(trimmed);

    if (normalizedStage) {
      if (this.academicPeriodsService) {
        try {
          const periodRecord =
            await this.academicPeriodsService.findByYearAndStage(
              year,
              normalizedStage,
            );
          if (periodRecord && periodRecord.startDate && periodRecord.endDate) {
            const [sYear, sMonth, sDay] = periodRecord.startDate
              .toString()
              .split('-')
              .map((v) => parseInt(v, 10));
            const [eYear, eMonth, eDay] = periodRecord.endDate
              .toString()
              .split('-')
              .map((v) => parseInt(v, 10));

            return {
              startDate: new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0),
              endDate: new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999),
            };
          }
        } catch {
          // Graceful fallback to defaults
        }
      }

      return resolveDefaultStageDates(normalizedStage, year);
    }

    const lower = trimmed.toLowerCase();
    if (lower.includes('ciclo') || lower.includes('completo') || yearMatch) {
      return {
        startDate: new Date(year, 0, 1, 0, 0, 0, 0),
        endDate: new Date(year, 11, 31, 23, 59, 59, 999),
      };
    }

    return null;
  }

  /**
   * Alias for backwards compatibility
   */
  async resolvePeriodDateRangeAsync(
    period?: string,
    defaultYear: number = new Date().getFullYear(),
  ): Promise<{ startDate: Date; endDate: Date } | null> {
    return this.resolvePeriodDateRange(period, defaultYear);
  }

  /**
   * Resolves the most appropriate active Course for a student at a given timestamp
   * by cross-referencing day of the week, time of day, and CourseSchedule.
   */
  async resolveCourseForStudent(
    studentId: string,
    timestamp: Date = new Date(),
    timeZone: string = DEFAULT_TIMEZONE,
  ): Promise<Course | null> {
    const enrollments = await this.enrollmentRepository.find({
      where: { studentId, status: 'active' },
      relations: {
        course: {
          schedules: true,
        },
      },
    });

    if (!enrollments || enrollments.length === 0) {
      return null;
    }

    const activeCourses = enrollments
      .map((e) => e.course)
      .filter((c): c is Course => Boolean(c));

    if (activeCourses.length === 0) {
      return null;
    }

    const currentDayName = getZonedDayName(timestamp, timeZone);
    const currentMinutes = getZonedMinutes(timestamp, timeZone);

    const todayMatches: ScheduleMatch[] = [];

    for (const course of activeCourses) {
      const schedules = course.schedules || [];
      for (const schedule of schedules) {
        if (normalizeDay(schedule.dayOfWeek) === currentDayName) {
          const startMinutes = parseTimeToMinutes(schedule.startTime);
          const endMinutes = parseTimeToMinutes(schedule.endTime);

          const windowStart = startMinutes - WINDOW_BEFORE_MINUTES;
          const windowEnd = endMinutes + WINDOW_AFTER_MINUTES;

          const isWithinTolerance =
            currentMinutes >= windowStart && currentMinutes <= windowEnd;

          let distanceToInterval = 0;
          if (currentMinutes < startMinutes) {
            distanceToInterval = startMinutes - currentMinutes;
          } else if (currentMinutes > endMinutes) {
            distanceToInterval = currentMinutes - endMinutes;
          }

          const distanceToStart = Math.abs(currentMinutes - startMinutes);

          todayMatches.push({
            course,
            schedule,
            distanceToInterval,
            distanceToStart,
            isWithinTolerance,
          });
        }
      }
    }

    // 1. Prioritize matches falling inside the tolerance window for today
    const inWindowMatches = todayMatches.filter((m) => m.isWithinTolerance);
    if (inWindowMatches.length > 0) {
      inWindowMatches.sort((a, b) => {
        if (a.distanceToInterval !== b.distanceToInterval) {
          return a.distanceToInterval - b.distanceToInterval;
        }
        return a.distanceToStart - b.distanceToStart;
      });
      return inWindowMatches[0].course;
    }

    // 2. Closest scheduled class today if outside standard tolerance window
    if (todayMatches.length > 0) {
      todayMatches.sort((a, b) => {
        if (a.distanceToInterval !== b.distanceToInterval) {
          return a.distanceToInterval - b.distanceToInterval;
        }
        return a.distanceToStart - b.distanceToStart;
      });
      return todayMatches[0].course;
    }

    // 3. Fallback to first active course when student has no classes scheduled today
    return activeCourses[0];
  }

  async checkInBiometric(
    imageBase64: string,
    timeZone: string = DEFAULT_TIMEZONE,
  ): Promise<BiometricCheckInResponse> {
    // 1. Identify face
    const buffer = this.getBufferFromBase64(imageBase64);
    let match;
    try {
      match = await this.facesService.identifyFace(buffer);
    } catch {
      throw new NotFoundException('Usuario no identificado');
    }

    if (!match || !match.matched) {
      throw new NotFoundException('Usuario no identificado');
    }

    // 2. Find student
    const student = await this.studentRepository.findOne({
      where: { biometricTemplateId: match.faceId },
    });

    if (!student) {
      throw new NotFoundException('Usuario no identificado');
    }

    const now = new Date();

    // 3. Resolve active course based on CourseSchedule (day and time match)
    const course = await this.resolveCourseForStudent(student.id, now, timeZone);

    // 4. Register checkin (Entrada/Salida) contextualized by student and course
    const todayStart = getZonedStartOfDay(now, timeZone);

    const whereClause: FindOptionsWhere<Attendance> = {
      studentId: student.id,
      timestamp: MoreThan(todayStart),
      courseId: course ? course.id : IsNull(),
    };

    // Check if there is an existing attendance today for this course/student
    const lastAttendance = await this.attendanceRepository.findOne({
      where: whereClause,
      order: { timestamp: 'DESC' },
    });

    let type = AttendanceType.ENTRADA;
    if (lastAttendance && lastAttendance.type === AttendanceType.ENTRADA) {
      const elapsedMs =
        now.getTime() - new Date(lastAttendance.timestamp).getTime();
      if (elapsedMs < MIN_CHECKOUT_INTERVAL_MS) {
        // Return recent check-in response without creating an accidental immediate checkout
        return {
          success: true,
          message: 'Asistencia ya registrada recientemente (Entrada)',
          studentName: `${student.firstName} ${student.lastName}`,
          courseName: course ? `${course.name} - ${course.level}` : undefined,
          courseId: course ? course.id : null,
          timestamp: lastAttendance.timestamp,
          type: lastAttendance.type,
        };
      }
      type = AttendanceType.SALIDA;
    }

    const attendance = this.attendanceRepository.create({
      student,
      studentId: student.id,
      course,
      courseId: course ? course.id : null,
      type,
      method: 'Biometric',
      timestamp: now,
    });

    const saved = await this.attendanceRepository.save(attendance);

    return {
      success: true,
      message: 'Asistencia registrada correctamente',
      studentName: `${student.firstName} ${student.lastName}`,
      courseName: course ? `${course.name} - ${course.level}` : undefined,
      courseId: course ? course.id : null,
      timestamp: saved.timestamp,
      type: saved.type,
    };
  }

  async checkInManual(
    dto: ManualAttendanceDto,
    timeZone: string = DEFAULT_TIMEZONE,
  ): Promise<{
    success: boolean;
    message: string;
    studentName: string;
    courseName?: string;
    timestamp: Date;
    type: AttendanceType;
    method: string;
  }> {
    const student = await this.studentRepository.findOne({
      where: { id: dto.studentId },
    });
    if (!student) {
      throw new NotFoundException('Alumno no encontrado');
    }

    const course = await this.courseRepository.findOne({
      where: { id: dto.courseId },
    });
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    const attendanceDate = dto.timestamp ? new Date(dto.timestamp) : new Date();
    const todayStart = getZonedStartOfDay(attendanceDate, timeZone);

    let type = dto.type;
    if (!type) {
      const lastAttendance = await this.attendanceRepository.findOne({
        where: {
          studentId: student.id,
          courseId: course.id,
          timestamp: MoreThan(todayStart),
        },
        order: { timestamp: 'DESC' },
      });

      if (lastAttendance && lastAttendance.type === AttendanceType.ENTRADA) {
        type = AttendanceType.SALIDA;
      } else {
        type = AttendanceType.ENTRADA;
      }
    }

    const attendance = this.attendanceRepository.create({
      student,
      studentId: student.id,
      course,
      courseId: course.id,
      type,
      method: 'Manual',
      timestamp: attendanceDate,
    });

    const saved = await this.attendanceRepository.save(attendance);

    return {
      success: true,
      message: `Asistencia registrada manualmente (${type})`,
      studentName: `${student.firstName} ${student.lastName}`,
      courseName: `${course.name} - ${course.level}`,
      timestamp: saved.timestamp,
      type: saved.type,
      method: 'Manual',
    };
  }

  async getReports(
    courseId?: string,
    period?: string,
    year?: number,
  ): Promise<ReportItem[]> {
    if (!courseId) {
      throw new BadRequestException(
        'El parámetro courseId es obligatorio para consultar reportes de asistencia',
      );
    }

    // 1. Resolve date range from period or course year
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    const defaultYear = year || course.year || new Date().getFullYear();
    const dateRange = await this.resolvePeriodDateRange(
      period,
      defaultYear,
    );

    // 2. Fetch active enrollments to ensure all enrolled students are included
    const enrolledStudentsMap = new Map<
      string,
      {
        studentName: string;
        total: number;
        entrada: number;
        salida: number;
        attendedDays: Set<string>;
      }
    >();

    const enrollments = await this.enrollmentRepository.find({
      where: { courseId, status: 'active' },
      relations: { student: true },
    });

    for (const e of enrollments) {
      if (e.student) {
        enrolledStudentsMap.set(e.studentId, {
          studentName: `${e.student.firstName} ${e.student.lastName}`.trim(),
          total: 0,
          entrada: 0,
          salida: 0,
          attendedDays: new Set<string>(),
        });
      }
    }

    // 3. Query attendances
    const query = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .leftJoinAndSelect('attendance.course', 'course');

    if (courseId) {
      query.andWhere('attendance.courseId = :courseId', { courseId });
    }

    if (dateRange) {
      query.andWhere('attendance.timestamp >= :startDate', {
        startDate: dateRange.startDate,
      });
      query.andWhere('attendance.timestamp <= :endDate', {
        endDate: dateRange.endDate,
      });
    }

    const attendances = await query.getMany();

    // 4. Determine classes held: distinct calendar dates where attendance (ENTRADA) was registered
    const distinctClassDates = new Set<string>();

    attendances.forEach((att) => {
      if (!att.student) return;
      const sId = att.studentId;
      const dateKey = getZonedDateKey(new Date(att.timestamp));

      if (att.type === AttendanceType.ENTRADA) {
        distinctClassDates.add(dateKey);
      }

      if (!enrolledStudentsMap.has(sId)) {
        enrolledStudentsMap.set(sId, {
          studentName: `${att.student.firstName} ${att.student.lastName}`.trim(),
          total: 0,
          entrada: 0,
          salida: 0,
          attendedDays: new Set<string>(),
        });
      }

      const stats = enrolledStudentsMap.get(sId)!;
      stats.total++;
      if (att.type === AttendanceType.ENTRADA) {
        stats.entrada++;
        stats.attendedDays.add(dateKey);
      } else {
        stats.salida++;
      }
    });

    const classesHeld = distinctClassDates.size;

    // 5. Calculate percentage and regularity without bias
    const result: ReportItem[] = Array.from(enrolledStudentsMap.entries()).map(
      ([studentId, stats]) => {
        const attendedDaysCount = stats.attendedDays.size;

        let percentage = 100;
        if (classesHeld > 0) {
          percentage = Math.min(
            100,
            Math.round((attendedDaysCount / classesHeld) * 100),
          );
        }

        const regularity = calculateRegularity(percentage, classesHeld);

        return {
          studentId,
          studentName: stats.studentName,
          totalCheckins: stats.total,
          entradas: stats.entrada,
          salidas: stats.salida,
          percentage,
          classesHeld,
          regularity,
          presentCount: stats.entrada,
          absentCount: Math.max(0, classesHeld - attendedDaysCount),
          status: regularity,
        };
      },
    );

    // Sort alphabetically by student name
    result.sort((a, b) => a.studentName.localeCompare(b.studentName));

    return result;
  }

  private getBufferFromBase64(base64Str: string): Buffer {
    if (!base64Str || typeof base64Str !== 'string') {
      throw new BadRequestException('Formato de imagen Base64 inválido');
    }
    const commaIndex = base64Str.indexOf(',');
    const data =
      commaIndex !== -1 ? base64Str.slice(commaIndex + 1) : base64Str;
    try {
      return Buffer.from(data, 'base64');
    } catch {
      throw new BadRequestException('Formato de imagen Base64 inválido');
    }
  }
}
