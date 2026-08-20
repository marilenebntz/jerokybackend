import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AcademicPeriod,
  EvaluationStage,
} from './entities/academic-period.entity';
import { CreateAcademicPeriodDto } from './dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from './dto/update-academic-period.dto';
import { Grade } from '../grades/entities/grade.entity';
import { Course } from '../courses/entities/course.entity';

export const DEFAULT_STAGE_DATES: Record<
  EvaluationStage,
  { startMonthDay: string; endMonthDay: string }
> = {
  [EvaluationStage.ETAPA_1]: {
    startMonthDay: '02-01',
    endMonthDay: '06-30',
  },
  [EvaluationStage.ETAPA_2]: {
    startMonthDay: '07-01',
    endMonthDay: '10-31',
  },
  [EvaluationStage.EXAMEN_FINAL]: {
    startMonthDay: '11-01',
    endMonthDay: '11-30',
  },
  [EvaluationStage.RECUPERATORIO]: {
    startMonthDay: '12-01',
    endMonthDay: '12-15',
  },
};

@Injectable()
export class AcademicPeriodsService {
  constructor(
    @InjectRepository(AcademicPeriod)
    private readonly academicPeriodRepository: Repository<AcademicPeriod>,
    @InjectRepository(Grade)
    private readonly gradeRepository: Repository<Grade>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async getDistinctYears(): Promise<number[]> {
    const currentYear = new Date().getFullYear();

    const periodYearsRaw = await this.academicPeriodRepository
      .createQueryBuilder('period')
      .select('DISTINCT period.year', 'year')
      .getRawMany();

    const courseYearsRaw = await this.courseRepository
      .createQueryBuilder('course')
      .select('DISTINCT course.year', 'year')
      .where('course.year IS NOT NULL')
      .getRawMany();

    const yearsSet = new Set<number>([
      currentYear - 1,
      currentYear,
      currentYear + 1,
    ]);

    periodYearsRaw.forEach((r) => {
      const y = parseInt(r.year, 10);
      if (!isNaN(y)) yearsSet.add(y);
    });

    courseYearsRaw.forEach((r) => {
      const y = parseInt(r.year, 10);
      if (!isNaN(y)) yearsSet.add(y);
    });

    return Array.from(yearsSet).sort((a, b) => a - b);
  }

  async findAll(
    year?: number,
    name?: string,
  ): Promise<AcademicPeriod[]> {
    const where: { year?: number; name?: string } = {};
    if (year) where.year = year;
    if (name) where.name = name;
    return this.academicPeriodRepository.find({
      where,
      order: {
        year: 'DESC',
        startDate: 'ASC',
      },
    });
  }

  async list(year?: number, name?: string): Promise<AcademicPeriod[]> {
    return this.findAll(year, name);
  }

  async findById(id: string): Promise<AcademicPeriod> {
    const period = await this.academicPeriodRepository.findOne({
      where: { id },
    });
    if (!period) {
      throw new NotFoundException('Periodo académico no encontrado');
    }
    return period;
  }

  async findByYearAndStage(
    year: number,
    name: string,
  ): Promise<AcademicPeriod | null> {
    return this.academicPeriodRepository.findOne({
      where: { year, name },
    });
  }

  async createOrUpdate(
    dto: CreateAcademicPeriodDto,
  ): Promise<AcademicPeriod> {
    if (dto.startDate > dto.endDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior o igual a la fecha de fin',
      );
    }

    let period = await this.academicPeriodRepository.findOne({
      where: { year: dto.year, name: dto.name },
    });

    if (period) {
      period.startDate = dto.startDate;
      period.endDate = dto.endDate;
    } else {
      period = this.academicPeriodRepository.create({
        year: dto.year,
        name: dto.name,
        startDate: dto.startDate,
        endDate: dto.endDate,
      });
    }

    return this.academicPeriodRepository.save(period);
  }

  async update(
    id: string,
    dto: UpdateAcademicPeriodDto,
  ): Promise<AcademicPeriod> {
    const period = await this.findById(id);

    const newStartDate = dto.startDate ?? period.startDate;
    const newEndDate = dto.endDate ?? period.endDate;

    if (newStartDate > newEndDate) {
      throw new BadRequestException(
        'La fecha de inicio debe ser anterior o igual a la fecha de fin',
      );
    }

    if (dto.name && dto.name !== period.name) {
      // Check if target name already exists for this year
      const conflict = await this.academicPeriodRepository.findOne({
        where: { year: period.year, name: dto.name },
      });
      if (conflict && conflict.id !== id) {
        throw new BadRequestException(
          `Ya existe un período con el nombre "${dto.name}" para el año ${period.year}`,
        );
      }
      period.name = dto.name;
    }

    period.startDate = newStartDate;
    period.endDate = newEndDate;

    return this.academicPeriodRepository.save(period);
  }

  async delete(id: string): Promise<{ message: string }> {
    const period = await this.findById(id);

    // VR-006: Check if grades exist for this stage and year
    const gradesCount = await this.gradeRepository
      .createQueryBuilder('grade')
      .innerJoin('grade.course', 'course')
      .where('grade.stage = :stage', { stage: period.name })
      .andWhere('course.year = :year', { year: period.year })
      .getCount();

    if (gradesCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar el periodo académico porque existen calificaciones registradas para esta etapa y año.',
      );
    }

    await this.academicPeriodRepository.delete(id);
    return { message: 'Periodo académico eliminado exitosamente.' };
  }

  async seedDefaults(year: number): Promise<AcademicPeriod[]> {
    const stages: EvaluationStage[] = [
      EvaluationStage.ETAPA_1,
      EvaluationStage.ETAPA_2,
    ];

    for (const stage of stages) {
      const config = DEFAULT_STAGE_DATES[stage];
      const existing = await this.academicPeriodRepository.findOne({
        where: { year, name: stage },
      });

      if (!existing) {
        const period = this.academicPeriodRepository.create({
          year,
          name: stage,
          startDate: `${year}-${config.startMonthDay}`,
          endDate: `${year}-${config.endMonthDay}`,
        });
        await this.academicPeriodRepository.save(period);
      }
    }

    return this.findAll(year);
  }
}
