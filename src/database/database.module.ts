import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { Tutor } from '../students/entities/tutor.entity';
import { Enrollment } from '../students/entities/enrollment.entity';
import { Course } from '../courses/entities/course.entity';
import { CourseSchedule } from '../courses/entities/course-schedule.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Grade } from '../grades/entities/grade.entity';
import { Communication } from '../communications/entities/communication.entity';
import { CommunicationLog } from '../communications/entities/communication-log.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { AcademicPeriod } from '../academic-periods/entities/academic-period.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const syncEnv = configService.get<string>('DATABASE_SYNCHRONIZE');
        const synchronize = isProduction ? false : syncEnv !== 'false';
        const migrationsRun =
          isProduction || configService.get<string>('DATABASE_MIGRATIONS_RUN') === 'true';

        return {
          type: 'postgres',
          host: configService.get<string>('DATABASE_HOST', 'localhost'),
          port: configService.get<number>('DATABASE_PORT', 5432),
          username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
          password: configService.get<string>('DATABASE_PASSWORD', 'password'),
          database: configService.get<string>('DATABASE_NAME', 'jeroky_soft_db'),
          entities: [
            User,
            Student,
            Tutor,
            Enrollment,
            Course,
            CourseSchedule,
            Attendance,
            Grade,
            Communication,
            CommunicationLog,
            AuditLog,
            AcademicPeriod,
          ],
          migrations: [path.join(__dirname, 'migrations', '*{.ts,.js}')],
          migrationsRun,
          synchronize,
          logging: !isProduction && configService.get<string>('DATABASE_LOGGING') === 'true',
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
