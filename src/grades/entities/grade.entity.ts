import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Course } from '../../courses/entities/course.entity';

@Entity('grades')
export class Grade {
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

  @Column('int')
  techniqueScore: number; // 0 - 100

  @Column('int')
  expressionScore: number; // 0 - 100

  @Column('int')
  disciplineScore: number; // 0 - 100

  @Column('float')
  average: number; // computed automatically

  @Column()
  period: string; // e.g. "2026-I"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  calculateAverage() {
    this.average = parseFloat(
      (
        (this.techniqueScore + this.expressionScore + this.disciplineScore) /
        3
      ).toFixed(2),
    );
  }
}
