import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension if available
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // Enum for User Roles
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."users_role_enum" AS ENUM('Administrator', 'Docente', 'Operador', 'Alumno', 'Tutor');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 1. Users table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "firstName" character varying,
        "lastName" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      );
    `);

    // 2. Tutors table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tutors" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "ci" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "email" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tutors_ci" UNIQUE ("ci"),
        CONSTRAINT "PK_tutors_id" PRIMARY KEY ("id")
      );
    `);

    // 3. Students table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "students" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "firstName" character varying NOT NULL,
        "lastName" character varying NOT NULL,
        "ci" character varying NOT NULL,
        "birthDate" date NOT NULL,
        "encryptedMedicalInfo" text,
        "biometricTemplateId" character varying,
        "biometricConsent" boolean NOT NULL DEFAULT false,
        "status" character varying NOT NULL DEFAULT 'active',
        "tutorId" uuid,
        "userId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_students_ci" UNIQUE ("ci"),
        CONSTRAINT "REL_students_userId" UNIQUE ("userId"),
        CONSTRAINT "PK_students_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_students_tutor" FOREIGN KEY ("tutorId") REFERENCES "tutors"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT "FK_students_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      );
    `);

    // 4. Courses table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "courses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "level" character varying NOT NULL,
        "capacity" integer NOT NULL DEFAULT 20,
        "year" integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
        "classCode" character varying,
        "teacherId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_courses_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_courses_teacher" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      );
    `);

    // 5. Course Schedules table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "course_schedules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "courseId" uuid NOT NULL,
        "dayOfWeek" character varying NOT NULL,
        "startTime" character varying NOT NULL,
        "endTime" character varying NOT NULL,
        "classroom" character varying NOT NULL DEFAULT 'Aula Principal',
        CONSTRAINT "PK_course_schedules_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_course_schedules_course" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      );
    `);

    // 6. Enrollments table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "enrollments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "studentId" uuid NOT NULL,
        "courseId" uuid NOT NULL,
        "status" character varying NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_enrollments_student_course" UNIQUE ("studentId", "courseId"),
        CONSTRAINT "PK_enrollments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_enrollments_student" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_enrollments_course" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      );
    `);

    // 7. Attendances table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "attendances" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "studentId" uuid NOT NULL,
        "courseId" uuid,
        "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "type" character varying NOT NULL DEFAULT 'Entrada',
        "method" character varying NOT NULL DEFAULT 'Biometric',
        CONSTRAINT "PK_attendances_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_attendances_student" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_attendances_course" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      );
    `);

    // 8. Grades table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "grades" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "studentId" uuid NOT NULL,
        "courseId" uuid NOT NULL,
        "techniqueScore" integer NOT NULL,
        "expressionScore" integer NOT NULL,
        "disciplineScore" integer NOT NULL,
        "average" double precision NOT NULL,
        "stage" character varying NOT NULL DEFAULT '1ª Etapa',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_grades_student_course_stage" UNIQUE ("studentId", "courseId", "stage"),
        CONSTRAINT "PK_grades_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_grades_student" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_grades_course" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      );
    `);

    // 9. Communications table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "communications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "subject" character varying(250) NOT NULL,
        "body" text NOT NULL,
        "targetRoles" text NOT NULL,
        "channels" text NOT NULL,
        "senderId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_communications_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_communications_sender" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
      );
    `);

    // 10. Communication Logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "communication_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "communicationId" uuid NOT NULL,
        "recipientId" uuid NOT NULL,
        "channel" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'sent',
        "sentAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_communication_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_communication_logs_comm" FOREIGN KEY ("communicationId") REFERENCES "communications"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_communication_logs_recipient" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      );
    `);

    // 11. Audit Logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "action" character varying NOT NULL,
        "userId" character varying,
        "username" character varying,
        "ipAddress" character varying,
        "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "details" text,
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "communication_logs" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "communications" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "grades" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendances" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "enrollments" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "course_schedules" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "courses" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "students" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tutors" CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum" CASCADE;`);
  }
}
