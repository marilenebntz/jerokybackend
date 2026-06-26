import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CourseSchedule } from './course-schedule.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Modalidad: e.g. "Danza Paraguaya"

  @Column()
  level: string; // Nivel: e.g. "Nivel Inicial"

  @Column({ default: 20 })
  capacity: number;

  @Column({ type: 'int', default: new Date().getFullYear() })
  year: number; // Año lectivo: e.g. 2026

  @Column({ type: 'varchar', nullable: true })
  classCode: string | null; // e.g. "DAN-PAR-INI-2026"

  @OneToMany(() => CourseSchedule, (schedule) => schedule.course, {
    cascade: true,
    eager: true,
  })
  schedules: CourseSchedule[];

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  teacher: User | null;

  @Column({ type: 'varchar', nullable: true })
  teacherId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
