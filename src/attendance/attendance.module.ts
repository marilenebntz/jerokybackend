import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Student } from '../students/entities/student.entity';
import { Enrollment } from '../students/entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { FacesModule } from '../faces/faces.module';
import { AcademicPeriodsModule } from '../academic-periods/academic-periods.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, Student, Enrollment, Course]),
    FacesModule,
    AcademicPeriodsModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}

