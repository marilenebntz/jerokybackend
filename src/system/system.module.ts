import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../students/entities/student.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../students/entities/enrollment.entity';
import { Grade } from '../grades/entities/grade.entity';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Course, Enrollment, Grade]),
    AuditModule,
  ],
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}
