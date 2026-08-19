import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Grade } from './entities/grade.entity';
import { GradeUploadItemDto } from './dto/upload-grades-batch.dto';
import { Student } from '../students/entities/student.entity';
import { Course } from '../courses/entities/course.entity';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async saveBatch(gradeItems: GradeUploadItemDto[]): Promise<Grade[]> {
    if (!gradeItems || gradeItems.length === 0) {
      return [];
    }

    const studentIds = Array.from(new Set(gradeItems.map((g) => g.studentId)));
    const courseIds = Array.from(new Set(gradeItems.map((g) => g.courseId)));

    const students = await this.studentRepository.findBy({ id: In(studentIds) });
    const courses = await this.courseRepository.findBy({ id: In(courseIds) });

    const studentMap = new Map(students.map((s) => [s.id, s]));
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    const savedGrades: Grade[] = [];

    for (const item of gradeItems) {
      const student = studentMap.get(item.studentId);
      const course = courseMap.get(item.courseId);

      if (!student || !course) {
        throw new NotFoundException(
          `Estudiante ${item.studentId} o Curso ${item.courseId} no encontrado`,
        );
      }

      // Check if grade already exists for this stage, student and course
      let grade = await this.gradeRepository.findOne({
        where: {
          studentId: item.studentId,
          courseId: item.courseId,
          stage: item.stage,
        },
      });

      if (grade) {
        grade.techniqueScore = item.techniqueScore;
        grade.expressionScore = item.expressionScore;
        grade.disciplineScore = item.disciplineScore;
      } else {
        grade = this.gradeRepository.create({
          student,
          course,
          studentId: item.studentId,
          courseId: item.courseId,
          techniqueScore: item.techniqueScore,
          expressionScore: item.expressionScore,
          disciplineScore: item.disciplineScore,
          stage: item.stage,
        });
      }

      // Save (TypeORM will trigger @BeforeInsert / @BeforeUpdate hook to calculate average)
      const saved = await this.gradeRepository.save(grade);
      savedGrades.push(saved);
    }

    return savedGrades;
  }

  async getHistoryByStudent(studentId: string): Promise<Grade[]> {
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    return this.gradeRepository.find({
      where: { studentId },
      relations: { course: true },
      order: { createdAt: 'ASC' },
    });
  }

  async getAverageGradesByStyle(): Promise<any[]> {
    // Computes average of the average score grouped by course style/name
    const rawStats = await this.gradeRepository
      .createQueryBuilder('grade')
      .leftJoin('grade.course', 'course')
      .select('course.name', 'style')
      .addSelect('AVG(grade.average)', 'average')
      .groupBy('course.name')
      .getRawMany();

    return rawStats.map((stat) => ({
      style: stat.style,
      average: parseFloat(parseFloat(stat.average).toFixed(2)),
    }));
  }
}
