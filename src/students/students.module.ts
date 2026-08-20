import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { Tutor } from './entities/tutor.entity';
import { Enrollment } from './entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { FacesModule } from '../faces/faces.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Student, Tutor, Enrollment, Course]),
    FacesModule,
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
