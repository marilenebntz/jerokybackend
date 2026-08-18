import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
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

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'password',
  database: process.env.DATABASE_NAME || 'jeroky_soft_db',
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
  ],
  migrations: [path.join(__dirname, 'migrations', '*{.ts,.js}')],
  synchronize: false,
};

const AppDataSource = new DataSource(dataSourceOptions);

export default AppDataSource;
