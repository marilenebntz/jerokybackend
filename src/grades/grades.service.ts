import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Grade, EvaluationStage } from './entities/grade.entity';
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

  /**
   * Batch upsert student marks for a given stage and course.
   * Operates on an open temporal model without stage locking barriers.
   */
  async uploadBatch(
    gradeItems: GradeUploadItemDto[],
    batchCourseId?: string,
    batchStage?: EvaluationStage,
  ): Promise<Grade[]> {
    if (!gradeItems || gradeItems.length === 0) {
      return [];
    }

    // Resolve courseId and stage for each item
    const resolvedItems = gradeItems.map((item) => {
      const courseId = item.courseId || batchCourseId;
      const stage = item.stage || batchStage || EvaluationStage.ETAPA_1;

      if (!courseId) {
        throw new BadRequestException(
          `El ID del curso es obligatorio para la calificación del estudiante ${item.studentId}`,
        );
      }

      return {
        ...item,
        courseId,
        stage,
      };
    });

    const studentIds = Array.from(new Set(resolvedItems.map((g) => g.studentId)));
    const courseIds = Array.from(new Set(resolvedItems.map((g) => g.courseId)));

    const students = await this.studentRepository.findBy({ id: In(studentIds) });
    const courses = await this.courseRepository.findBy({ id: In(courseIds) });

    const studentMap = new Map(students.map((s) => [s.id, s]));
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    for (const item of resolvedItems) {
      const student = studentMap.get(item.studentId);
      const course = courseMap.get(item.courseId);

      if (!student || !course) {
        throw new NotFoundException(
          `Estudiante ${item.studentId} o Curso ${item.courseId} no encontrado`,
        );
      }
    }

    const existingGrades =
      (await this.gradeRepository.find({
        where: {
          studentId: In(studentIds),
          courseId: In(courseIds),
        },
      })) || [];

    const existingMap = new Map<string, Grade>();
    for (const g of existingGrades) {
      existingMap.set(`${g.studentId}#${g.courseId}#${g.stage}`, g);
    }

    const entitiesToSave: Grade[] = [];

    for (const item of resolvedItems) {
      const student = studentMap.get(item.studentId)!;
      const course = courseMap.get(item.courseId)!;

      const key = `${item.studentId}#${item.courseId}#${item.stage}`;
      let grade = existingMap.get(key);

      // Calculate 3-dimension average (Técnica, Expresión, Disciplina) rounded to 2 decimals
      const average = parseFloat(
        (
          (item.techniqueScore + item.expressionScore + item.disciplineScore) /
          3
        ).toFixed(2),
      );

      if (grade) {
        grade.techniqueScore = item.techniqueScore;
        grade.expressionScore = item.expressionScore;
        grade.disciplineScore = item.disciplineScore;
        grade.average = average;
      } else {
        grade = this.gradeRepository.create({
          student,
          course,
          studentId: item.studentId,
          courseId: item.courseId,
          techniqueScore: item.techniqueScore,
          expressionScore: item.expressionScore,
          disciplineScore: item.disciplineScore,
          average,
          stage: item.stage,
        });
      }

      entitiesToSave.push(grade);
    }

    return this.gradeRepository.save(entitiesToSave);
  }

  /**
   * Backward-compatible alias for uploadBatch.
   */
  async saveBatch(
    gradeItems: GradeUploadItemDto[],
    batchCourseId?: string,
    batchStage?: EvaluationStage,
  ): Promise<Grade[]> {
    return this.uploadBatch(gradeItems, batchCourseId, batchStage);
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

  async findByCourseAndStage(
    courseId: string,
    stage?: string,
  ): Promise<Grade[]> {
    const where: any = { courseId };
    if (stage) {
      where.stage = stage;
    }

    return this.gradeRepository.find({
      where,
      relations: { student: true, course: true },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Alias for findByCourseAndStage matching contracts.
   */
  async getGradesByCourse(
    courseId: string,
    stage?: string,
  ): Promise<Grade[]> {
    return this.findByCourseAndStage(courseId, stage);
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

