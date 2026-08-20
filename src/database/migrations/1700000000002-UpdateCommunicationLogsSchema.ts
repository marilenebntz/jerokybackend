import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCommunicationLogsSchema1700000000002
  implements MigrationInterface
{
  name = 'UpdateCommunicationLogsSchema1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "communication_logs" 
      ADD COLUMN IF NOT EXISTS "errorMessage" text,
      ADD COLUMN IF NOT EXISTS "externalId" character varying,
      ADD COLUMN IF NOT EXISTS "recipientDescription" character varying,
      ADD COLUMN IF NOT EXISTS "recipientEmail" character varying,
      ADD COLUMN IF NOT EXISTS "recipientName" character varying,
      ADD COLUMN IF NOT EXISTS "recipientRole" character varying;
    `);

    // Ensure recipientId foreign key is not strictly blocking tutor UUIDs or non-user IDs
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'FK_communication_logs_recipient'
        ) THEN
          ALTER TABLE "communication_logs" DROP CONSTRAINT "FK_communication_logs_recipient";
        END IF;
      END $$;
    `);

    // Ensure courseId exists in communications table if not already
    await queryRunner.query(`
      ALTER TABLE "communications"
      ADD COLUMN IF NOT EXISTS "courseId" character varying;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "communication_logs" 
      DROP COLUMN IF EXISTS "errorMessage",
      DROP COLUMN IF EXISTS "externalId",
      DROP COLUMN IF EXISTS "recipientDescription",
      DROP COLUMN IF EXISTS "recipientEmail",
      DROP COLUMN IF EXISTS "recipientName",
      DROP COLUMN IF EXISTS "recipientRole";
    `);

    await queryRunner.query(`
      ALTER TABLE "communications"
      DROP COLUMN IF EXISTS "courseId";
    `);
  }
}
