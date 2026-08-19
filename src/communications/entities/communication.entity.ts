import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import { CommunicationLog } from './communication-log.entity';

@Entity('communications')
export class Communication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 250 })
  subject: string;

  @Column({ type: 'text' }) // body up to 2000 chars
  body: string;

  @Column({ type: 'simple-array' })
  targetRoles: UserRole[];

  @Column({ type: 'simple-array' })
  channels: string[]; // 'Web', 'Email'

  @Column({ type: 'varchar', nullable: true })
  courseId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  sender: User;

  @Column()
  senderId: string;

  @OneToMany(() => CommunicationLog, (log) => log.communication)
  logs: CommunicationLog[];

  @CreateDateColumn()
  createdAt: Date;
}
