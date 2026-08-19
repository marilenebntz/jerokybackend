import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Student } from './student.entity';
import { Course } from '../../courses/entities/course.entity';

@Entity('enrollments')
@Unique(['studentId', 'courseId'])
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  student: Student;

  @Column()
  studentId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  course: Course;

  @Column()
  courseId: string;

  @Column({ default: 'active' })
  status: string; // active, inactive, transferred

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
