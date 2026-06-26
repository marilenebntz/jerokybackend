import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Attendance, AttendanceType } from './entities/attendance.entity';
import { Student } from '../students/entities/student.entity';
import { FacesService } from '../faces/faces.service';
import { Enrollment } from '../students/entities/enrollment.entity';

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

  async checkInBiometric(imageBase64: string): Promise<any> {
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

    // 3. Register checkin (Entrada/Salida)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Check if there is an existing attendance today
    const lastAttendance = await this.attendanceRepository.findOne({
      where: {
        studentId: student.id,
        timestamp: MoreThan(todayStart),
      },
      order: { timestamp: 'DESC' },
    });

    let type = AttendanceType.ENTRADA;
    if (lastAttendance && lastAttendance.type === AttendanceType.ENTRADA) {
      type = AttendanceType.SALIDA;
    }

    // Identify active course for the student (based on schedule or active period)
    // For simplicity, find the first active enrollment for this student
    const enrollment = await this.enrollmentRepository.findOne({
      where: { studentId: student.id, status: 'active' },
      relations: { course: true },
    });

    const course = enrollment ? enrollment.course : null;

    const attendance = this.attendanceRepository.create({
      student,
      studentId: student.id,
      course,
      courseId: course ? course.id : null,
      type,
      method: 'Biometric',
    });

    const saved = await this.attendanceRepository.save(attendance);

    return {
      success: true,
      message: 'Asistencia registrada correctamente',
      studentName: `${student.firstName} ${student.lastName}`,
      timestamp: saved.timestamp,
      type: saved.type,
    };
  }

  async getReports(courseId?: string, period?: string): Promise<any> {
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
    const result = Object.entries(studentStats).map(([studentId, stats]) => {
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
    });

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
