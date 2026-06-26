import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { CourseSchedule } from './entities/course-schedule.entity';
import { CreateCourseBodyDto, UpdateCourseBodyDto } from './dto/course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(CourseSchedule)
    private readonly scheduleRepository: Repository<CourseSchedule>,
  ) {}

  /**
   * Generates a short class code from modality name, level, and year.
   * e.g. "Danza Paraguaya", "Nivel Inicial", 2026 → "DAN-PAR-INI-2026"
   */
  private generateClassCode(name: string, level: string, year: number): string {
    const acronym = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z\s]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.substring(0, 3).toUpperCase())
        .join('-');

    return `${acronym(name)}-${acronym(level)}-${year}`;
  }

  async create(dto: CreateCourseBodyDto): Promise<Course> {
    const currentYear = dto.year ?? new Date().getFullYear();
    const classCode = this.generateClassCode(dto.name, dto.level, currentYear);

    const course = this.courseRepository.create({
      name: dto.name,
      level: dto.level,
      capacity: dto.capacity,
      year: currentYear,
      classCode,
      teacherId: dto.teacherId || null,
      schedules: (dto.schedules ?? []).map((s) =>
        this.scheduleRepository.create({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          classroom: s.classroom || 'Aula Principal',
        }),
      ),
    });

    return this.courseRepository.save(course);
  }

  async findAll(): Promise<Course[]> {
    return this.courseRepository.find({
      relations: { teacher: true },
      order: { year: 'DESC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
      relations: { teacher: true },
    });
    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }
    return course;
  }

  async update(id: string, dto: UpdateCourseBodyDto): Promise<Course> {
    const course = await this.findOne(id);

    if (dto.name !== undefined) course.name = dto.name;
    if (dto.level !== undefined) course.level = dto.level;
    if (dto.capacity !== undefined) course.capacity = dto.capacity;
    if (dto.year !== undefined) course.year = dto.year;
    if (dto.teacherId !== undefined) course.teacherId = dto.teacherId;

    // Regenerate classCode whenever name/level/year may have changed
    course.classCode = this.generateClassCode(
      course.name,
      course.level,
      course.year,
    );

    if (dto.schedules !== undefined) {
      // Replace all schedules for this course
      await this.scheduleRepository.delete({ courseId: id });
      course.schedules = (dto.schedules ?? []).map((s) =>
        this.scheduleRepository.create({
          courseId: id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          classroom: s.classroom || 'Aula Principal',
        }),
      );
    }

    return this.courseRepository.save(course);
  }

  async remove(id: string): Promise<void> {
    const course = await this.findOne(id);
    await this.courseRepository.remove(course);
  }
}
