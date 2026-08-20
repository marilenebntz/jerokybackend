import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import { Tutor } from '../../students/entities/tutor.entity';
import { Student } from '../../students/entities/student.entity';
import { Enrollment } from '../../students/entities/enrollment.entity';

export interface ResolvedRecipient {
  recipientId: string | null;
  email: string;
  name: string;
  role: string;
  description: string;
  userEntity?: User | null;
  isFallback?: boolean;
}

@Injectable()
export class RecipientResolverService {
  private readonly logger = new Logger(RecipientResolverService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tutor)
    private readonly tutorRepository: Repository<Tutor>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  /**
   * Calcula la edad en años a partir de la fecha de nacimiento.
   */
  calculateAge(birthDate: Date | string): number {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  }

  /**
   * Resuelve todos los destinatarios aplicando las reglas de negocio de segmentación,
   * evaluación de mayoría de edad, fallback de alumnos a tutores y deduplicación por correo.
   */
  async resolveRecipients(
    targetRoles: UserRole[],
    courseId?: string | null,
  ): Promise<ResolvedRecipient[]> {
    const rawRecipients: ResolvedRecipient[] = [];

    const hasTutorRole = targetRoles.includes(UserRole.TUTOR);
    const hasAlumnoRole = targetRoles.includes(UserRole.ALUMNO);
    const systemRoles = targetRoles.filter(
      (r) => r !== UserRole.TUTOR && r !== UserRole.ALUMNO,
    );

    // 1. Resolución de Tutores
    if (hasTutorRole) {
      let tutors: Tutor[] = [];
      if (courseId) {
        const enrollments = await this.enrollmentRepository.find({
          where: { courseId, status: 'active' },
          relations: { student: { tutor: true } },
        });
        const tutorMap = new Map<string, Tutor>();
        for (const e of enrollments) {
          if (e.student?.tutor) {
            tutorMap.set(e.student.tutor.id, e.student.tutor);
          }
        }
        tutors = Array.from(tutorMap.values());
      } else {
        tutors = await this.tutorRepository.find();
      }

      for (const tutor of tutors) {
        if (tutor.email) {
          rawRecipients.push({
            recipientId: tutor.id,
            email: tutor.email.trim().toLowerCase(),
            name: `${tutor.firstName} ${tutor.lastName}`.trim(),
            role: 'Tutor',
            description: `Tutor: ${tutor.firstName} ${tutor.lastName}`,
            userEntity: null,
          });
        }
      }
    }

    // 2. Resolución de Alumnos (con verificación de mayoría de edad y Fallback a Tutor)
    if (hasAlumnoRole) {
      let students: Student[] = [];
      if (courseId) {
        const enrollments = await this.enrollmentRepository.find({
          where: { courseId, status: 'active' },
          relations: { student: { tutor: true, user: true } },
        });
        const studentMap = new Map<string, Student>();
        for (const e of enrollments) {
          if (e.student) {
            studentMap.set(e.student.id, e.student);
          }
        }
        students = Array.from(studentMap.values());
      } else {
        students = await this.studentRepository.find({
          where: { status: 'active' },
          relations: { tutor: true, user: true },
        });
      }

      for (const student of students) {
        const studentName = `${student.firstName} ${student.lastName}`.trim();
        const age = this.calculateAge(student.birthDate);
        const isAdult = age >= 18;
        const studentEmail = student.user?.email ? student.user.email.trim().toLowerCase() : null;

        if (isAdult && studentEmail) {
          // Mayor de edad con correo propio asignado
          rawRecipients.push({
            recipientId: student.user?.id || student.id,
            email: studentEmail,
            name: studentName,
            role: 'Alumno',
            description: `Estudiante (${age} años - Mayor de edad)`,
            userEntity: student.user || null,
          });
        } else if (student.tutor && student.tutor.email) {
          // Menor de edad o sin correo propio -> Fallback automático al Tutor Legal
          const tutor = student.tutor;
          const tutorEmail = tutor.email.trim().toLowerCase();
          const tutorName = `${tutor.firstName} ${tutor.lastName}`.trim();

          rawRecipients.push({
            recipientId: tutor.id,
            email: tutorEmail,
            name: tutorName,
            role: 'Tutor',
            description: `${studentName} (vía Tutor: ${tutorName} - ${isAdult ? 'Sin email personal' : 'Menor de edad'})`,
            userEntity: null,
            isFallback: true,
          });
        } else if (studentEmail) {
          // Menor sin tutor asignado pero con email directo
          rawRecipients.push({
            recipientId: student.user?.id || student.id,
            email: studentEmail,
            name: studentName,
            role: 'Alumno',
            description: `Estudiante (${studentName})`,
            userEntity: student.user || null,
          });
        } else {
          this.logger.warn(
            `El estudiante "${studentName}" no posee correo propio ni tutor con correo asignado. No se podrá despachar.`,
          );
        }
      }
    }

    // 3. Resolución de Roles del Sistema (Admin, Docente, Operador)
    if (systemRoles.length > 0) {
      const users = await this.userRepository.find({
        where: { role: In(systemRoles), isActive: true },
      });

      for (const user of users) {
        if (user.email) {
          const userName =
            `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
          rawRecipients.push({
            recipientId: user.id,
            email: user.email.trim().toLowerCase(),
            name: userName,
            role: user.role,
            description: `Personal: ${user.role} (${userName})`,
            userEntity: user,
          });
        }
      }
    }

    // 4. Deduplicación inteligente por dirección de correo electrónico
    // Si un tutor tiene 2 hijas en el curso, o una persona coincide en email,
    // consolidamos la descripción para el registro de auditoría pero garantizamos 1 solo envío.
    const deduplicatedMap = new Map<string, ResolvedRecipient>();

    for (const item of rawRecipients) {
      const existing = deduplicatedMap.get(item.email);
      if (!existing) {
        deduplicatedMap.set(item.email, item);
      } else {
        // Combinamos la descripción si aporta información de múltiples estudiantes
        if (item.description && !existing.description.includes(item.description)) {
          existing.description = `${existing.description} / ${item.description}`;
        }
      }
    }

    const finalRecipients = Array.from(deduplicatedMap.values());
    this.logger.log(
      `Destinatarios resueltos: ${rawRecipients.length} candidatos -> ${finalRecipients.length} únicos tras deduplicación.`,
    );

    return finalRecipients;
  }
}
