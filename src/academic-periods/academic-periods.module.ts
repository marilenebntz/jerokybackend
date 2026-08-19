import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicPeriod } from './entities/academic-period.entity';
import { Grade } from '../grades/entities/grade.entity';
import { Course } from '../courses/entities/course.entity';
import { AcademicPeriodsService } from './academic-periods.service';
import { AcademicPeriodsController } from './academic-periods.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicPeriod, Grade, Course])],
  controllers: [AcademicPeriodsController],
  providers: [AcademicPeriodsService],
  exports: [AcademicPeriodsService, TypeOrmModule],
})
export class AcademicPeriodsModule {}
