import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { CoursesModule } from './courses/courses.module';
import { AttendanceModule } from './attendance/attendance.module';
import { GradesModule } from './grades/grades.module';
import { CommunicationsModule } from './communications/communications.module';
import { AuditModule } from './audit/audit.module';
import { SystemModule } from './system/system.module';
import { FacesModule } from './faces/faces.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    CoursesModule,
    AttendanceModule,
    GradesModule,
    CommunicationsModule,
    AuditModule,
    SystemModule,
    FacesModule,
  ],
})
export class AppModule {}
