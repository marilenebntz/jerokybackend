import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { Tutor } from './entities/tutor.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Tutor)
    private readonly tutorRepository: Repository<Tutor>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const existing = await this.studentRepository.findOne({
      where: { ci: createStudentDto.ci },
    });
    if (existing) {
      throw new ConflictException('La CI ya está registrada en el sistema');
    }

    const birthDateObj = new Date(createStudentDto.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDateObj.getDate())
    ) {
      age--;
    }

    const isMinor = age < 18;
    let tutor: Tutor | null = null;

    if (isMinor) {
      if (!createStudentDto.tutorId && !createStudentDto.tutor) {
        throw new BadRequestException(
          'El estudiante es menor de edad y requiere registrar o vincular un Tutor',
        );
      }

      if (createStudentDto.tutorId) {
        tutor = await this.tutorRepository.findOne({
          where: { id: createStudentDto.tutorId },
        });
        if (!tutor) {
          throw new NotFoundException('El tutor vinculado no existe');
        }
      } else if (createStudentDto.tutor) {
        const existingTutor = await this.tutorRepository.findOne({
          where: { ci: createStudentDto.tutor.ci },
        });
        if (existingTutor) {
          tutor = existingTutor;
        } else {
          tutor = this.tutorRepository.create(createStudentDto.tutor);
          tutor = await this.tutorRepository.save(tutor);
        }
      }
    }

    const student = this.studentRepository.create({
      firstName: createStudentDto.firstName,
      lastName: createStudentDto.lastName,
      ci: createStudentDto.ci,
      birthDate: birthDateObj,
      encryptedMedicalInfo: createStudentDto.encryptedMedicalInfo || null,
      biometricConsent: createStudentDto.biometricConsent ?? false,
      tutor,
    });

    return this.studentRepository.save(student);
  }

  async findAll(): Promise<Student[]> {
    return this.studentRepository.find({
      relations: { tutor: true, user: true },
    });
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOne({
      where: { id },
      relations: { tutor: true, user: true },
    });
    if (!student) {
      throw new NotFoundException('Alumno no encontrado');
    }
    return student;
  }

  async update(
    id: string,
    updateStudentDto: UpdateStudentDto,
  ): Promise<Student> {
    const student = await this.findOne(id);

    if (updateStudentDto.ci && updateStudentDto.ci !== student.ci) {
      const existing = await this.studentRepository.findOne({
        where: { ci: updateStudentDto.ci },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('La CI ya está registrada en el sistema');
      }
      student.ci = updateStudentDto.ci;
    }

    if (updateStudentDto.firstName !== undefined) {
      student.firstName = updateStudentDto.firstName;
    }
    if (updateStudentDto.lastName !== undefined) {
      student.lastName = updateStudentDto.lastName;
    }
    if (updateStudentDto.birthDate !== undefined) {
      student.birthDate = new Date(updateStudentDto.birthDate);
    }
    if (updateStudentDto.encryptedMedicalInfo !== undefined) {
      student.encryptedMedicalInfo = updateStudentDto.encryptedMedicalInfo || null;
    }
    if (updateStudentDto.biometricConsent !== undefined) {
      student.biometricConsent = updateStudentDto.biometricConsent;
    }
    if (updateStudentDto.status !== undefined) {
      student.status = updateStudentDto.status;
    }

    if (updateStudentDto.tutorId !== undefined) {
      if (updateStudentDto.tutorId) {
        const tutor = await this.tutorRepository.findOne({
          where: { id: updateStudentDto.tutorId },
        });
        if (!tutor) {
          throw new NotFoundException('El tutor vinculado no existe');
        }
        student.tutor = tutor;
      } else {
        student.tutor = null;
      }
    } else if (updateStudentDto.tutor) {
      let tutor: Tutor | null = null;
      const existingTutor = await this.tutorRepository.findOne({
        where: { ci: updateStudentDto.tutor.ci },
      });
      if (existingTutor) {
        tutor = existingTutor;
      } else {
        tutor = this.tutorRepository.create(updateStudentDto.tutor);
        tutor = await this.tutorRepository.save(tutor);
      }
      student.tutor = tutor;
    }

    // Check minor requirement
    if (student.birthDate) {
      const birthDateObj = new Date(student.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDateObj.getFullYear();
      const monthDiff = today.getMonth() - birthDateObj.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDateObj.getDate())
      ) {
        age--;
      }
      if (age < 18 && !student.tutor) {
        throw new BadRequestException(
          'El estudiante es menor de edad y requiere tener un Tutor asignado',
        );
      }
    }

    return this.studentRepository.save(student);
  }

  async updateStatus(id: string, status: string): Promise<Student> {
    const student = await this.findOne(id);
    if (!['active', 'inactive'].includes(status)) {
      throw new BadRequestException("Estado inválido. Debe ser 'active' o 'inactive'");
    }
    student.status = status;
    return this.studentRepository.save(student);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const student = await this.findOne(id);
    student.status = 'inactive';
    await this.studentRepository.save(student);
    return { success: true, message: 'Alumno inactivado exitosamente' };
  }

  async updateBiometricTemplate(id: string, faceId: string): Promise<Student> {
    const student = await this.findOne(id);
    student.biometricTemplateId = faceId;
    return this.studentRepository.save(student);
  }

  async enroll(dto: EnrollStudentDto): Promise<Enrollment> {
    const student = await this.findOne(dto.studentId);
    const course = await this.courseRepository.findOne({
      where: { id: dto.courseId },
    });
    if (!course) {
      throw new NotFoundException('Modalidad/Curso no encontrado');
    }

    // Check if student is already active in a course of the same modality (course.name) for the same year (course.year)
    const activeModalityEnrollment = await this.enrollmentRepository.findOne({
      where: {
        studentId: dto.studentId,
        status: 'active',
        course: { name: course.name, year: course.year },
      },
      relations: { course: true },
    });

    if (
      activeModalityEnrollment &&
      activeModalityEnrollment.courseId !== dto.courseId
    ) {
      throw new ConflictException(
        `El alumno ya se encuentra matriculado en esta modalidad (${course.name}) para el año lectivo ${course.year}`,
      );
    }

    // Check capacity
    const activeEnrollments = await this.enrollmentRepository.count({
      where: {
        courseId: dto.courseId,
        status: 'active',
      },
    });

    if (activeEnrollments >= course.capacity) {
      throw new BadRequestException(
        'El curso ya se encuentra al límite de su capacidad',
      );
    }

    const existingEnrollment = await this.enrollmentRepository.findOne({
      where: {
        studentId: dto.studentId,
        courseId: dto.courseId,
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'active') {
        throw new ConflictException(
          'El estudiante ya se encuentra matriculado activamente en este curso',
        );
      } else {
        existingEnrollment.status = 'active';
        return this.enrollmentRepository.save(existingEnrollment);
      }
    }

    const enrollment = this.enrollmentRepository.create({
      student,
      course,
      status: 'active',
    });

    return this.enrollmentRepository.save(enrollment);
  }

  async getEnrollments(): Promise<Enrollment[]> {
    return this.enrollmentRepository.find({
      relations: {
        student: true,
        course: { teacher: true, schedules: true },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async updateEnrollmentStatus(
    id: string,
    status: string,
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id },
      relations: { course: true, student: true },
    });
    if (!enrollment) {
      throw new NotFoundException('Matrícula no encontrada');
    }

    if (!['active', 'inactive', 'transferred'].includes(status)) {
      throw new BadRequestException('Estado de matrícula inválido');
    }

    enrollment.status = status;
    return this.enrollmentRepository.save(enrollment);
  }

  async transfer(
    enrollmentId: string,
    targetCourseId: string,
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { id: enrollmentId },
      relations: { student: true, course: true },
    });
    if (!enrollment) {
      throw new NotFoundException('Matrícula de origen no encontrada');
    }

    if (enrollment.status !== 'active') {
      throw new BadRequestException(
        'Solo se pueden transferir matrículas en estado activo',
      );
    }

    if (enrollment.courseId === targetCourseId) {
      throw new BadRequestException(
        'El curso de destino no puede ser igual al curso de origen',
      );
    }

    const targetCourse = await this.courseRepository.findOne({
      where: { id: targetCourseId },
    });
    if (!targetCourse) {
      throw new NotFoundException('Modalidad/Curso de destino no encontrado');
    }

    const oldStatus = enrollment.status;

    // Temporarily mark the old enrollment as 'transferred' to bypass the capacity and duplicate checks
    enrollment.status = 'transferred';
    await this.enrollmentRepository.save(enrollment);

    try {
      // Try to enroll the student in the target course
      return await this.enroll({
        studentId: enrollment.studentId,
        courseId: targetCourseId,
      });
    } catch (err) {
      // Rollback status if the target enrollment fails
      enrollment.status = oldStatus;
      await this.enrollmentRepository.save(enrollment);
      throw err;
    }
  }

  async getTutors(): Promise<Tutor[]> {
    return this.tutorRepository.find();
  }
}
