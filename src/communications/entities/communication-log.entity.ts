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

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  recipient: User;

  @Column()
  recipientId: string;

  @Column()
  channel: string; // 'Web', 'Email'

  @Column({ default: 'sent' }) // sent, delivered, failed
  status: string;

  @CreateDateColumn()
  sentAt: Date;
}
