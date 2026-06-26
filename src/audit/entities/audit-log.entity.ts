import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  action: string; // e.g. "USER_LOGIN", "STUDENT_REGISTERED", "BACKUP_GENERATED"

  @Column({ type: 'varchar', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', nullable: true })
  username: string | null; // useful if user is deleted later

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'text', nullable: true })
  details: string | null; // JSON description or details
}
