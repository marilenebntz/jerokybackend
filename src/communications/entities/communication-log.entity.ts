import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Communication } from './communication.entity';
import { User } from '../../users/entities/user.entity';

@Entity('communication_logs')
export class CommunicationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Communication, (comm) => comm.logs, { onDelete: 'CASCADE' })
  communication: Communication;

  @Column()
  communicationId: string;

  @Column({ type: 'varchar', nullable: true })
  recipientId: string | null;

  @Column({ type: 'varchar', nullable: true })
  recipientEmail: string;

  @Column({ type: 'varchar', nullable: true })
  recipientName: string;

  @Column({ type: 'varchar', nullable: true })
  recipientRole: string;

  @Column()
  channel: string; // 'Web', 'Email'

  @Column({ default: 'sent' }) // delivered, failed, pending, sent
  status: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'varchar', nullable: true })
  externalId: string | null;

  @Column({ type: 'varchar', nullable: true })
  recipientDescription: string | null;

  @CreateDateColumn()
  sentAt: Date;
}
