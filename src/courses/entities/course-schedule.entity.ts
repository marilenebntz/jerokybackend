import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Course } from './course.entity';

@Entity('course_schedules')
export class CourseSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Course, (course) => course.schedules, {
    onDelete: 'CASCADE',
  })
  course: Course;

  @Column()
  courseId: string;

  @Column()
  dayOfWeek: string; // "Lunes", "Martes", etc.

  @Column()
  startTime: string; // "16:00"

  @Column()
  endTime: string; // "17:30"

  @Column({ default: 'Aula Principal' })
  classroom: string;
}
