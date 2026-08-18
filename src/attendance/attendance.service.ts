import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull, FindOptionsWhere } from 'typeorm';
import { Attendance, AttendanceType } from './entities/attendance.entity';
import { Student } from '../students/entities/student.entity';
import { FacesService } from '../faces/faces.service';
import { Enrollment } from '../students/entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { CourseSchedule } from '../courses/entities/course-schedule.entity';

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
    private readonly facesService: FacesService,
  ) {}

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

  async getReports(
    courseId?: string,
    period?: string,
  ): Promise<ReportItem[]> {
    void period;
    const query = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .leftJoinAndSelect('attendance.course', 'course');

    if (courseId) {
      query.andWhere('attendance.courseId = :courseId', { courseId });
    }

    const attendances = await query.getMany();

    // Group by student to calculate attendance percentage
    const studentStats: Record<
      string,
      { studentName: string; total: number; entrada: number; salida: number }
    > = {};

    attendances.forEach((att) => {
      const sId = att.studentId;
      if (!studentStats[sId]) {
        studentStats[sId] = {
          studentName: `${att.student.firstName} ${att.student.lastName}`,
          total: 0,
          entrada: 0,
          salida: 0,
        };
      }
      studentStats[sId].total++;
      if (att.type === AttendanceType.ENTRADA) {
        studentStats[sId].entrada++;
      } else {
        studentStats[sId].salida++;
      }
    });

    // In a real scenario, attendance percentage would be based on expected classes.
    // Let's assume 20 classes is 100% for this period.
    const result: ReportItem[] = Object.entries(studentStats).map(
      ([studentId, stats]) => {
        const expectedClasses = 20;
        const percentage = Math.min(
          Math.round((stats.entrada / expectedClasses) * 100),
          100,
        );
        return {
          studentId,
          studentName: stats.studentName,
          totalCheckins: stats.total,
          entradas: stats.entrada,
          salidas: stats.salida,
          percentage,
        };
      },
    );

    return result;
  }

  private getBufferFromBase64(base64Str: string): Buffer {
    try {
      const matches = base64Str.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      let data = base64Str;
      if (matches && matches.length === 3) {
        data = matches[2];
      }
      return Buffer.from(data, 'base64');
    } catch {
      throw new BadRequestException('Formato de imagen Base64 inválido');
    }
  }
}
