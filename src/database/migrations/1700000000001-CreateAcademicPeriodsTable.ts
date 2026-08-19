import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAcademicPeriodsTable1700000000001 implements MigrationInterface {
  name = 'CreateAcademicPeriodsTable1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "academic_periods" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "year" integer NOT NULL,
        "name" character varying(50) NOT NULL,
        "startDate" date NOT NULL,
        "endDate" date NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_academic_periods_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_academic_periods_year_name" UNIQUE ("year", "name"),
        CONSTRAINT "CHK_academic_periods_date_order" CHECK ("startDate" <= "endDate")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "academic_periods" CASCADE;`);
  }
}
