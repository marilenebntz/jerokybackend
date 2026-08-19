import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index } from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Course } from '../../courses/entities/course.entity';

export enum AttendanceType {
  ENTRADA = 'Entrada',
  SALIDA = 'Salida',
}

@Entity('attendances')
@Index(['studentId', 'courseId', 'timestamp'])
@Index(['courseId', 'timestamp'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  student: Student;

  @Column()
  studentId: string;

  @ManyToOne(() => Course, { nullable: true, onDelete: 'SET NULL' })
  course: Course | null;

  @Column({ type: 'varchar', nullable: true })
  courseId: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({
    type: 'enum',
    enum: AttendanceType,
    default: AttendanceType.ENTRADA,
  })
  type: AttendanceType;

  @Column({ default: 'Biometric' }) // Biometric, Manual
  method: string;
}
