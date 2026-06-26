import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tutor } from './tutor.entity';
import { User } from '../../users/entities/user.entity';
import { EncryptionTransformer } from '../../utils/encryption.transformer';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  ci: string;

  @Column('date')
  birthDate: Date;

  @Column({
    type: 'text',
    nullable: true,
    transformer: new EncryptionTransformer(),
  })
  encryptedMedicalInfo: string | null;

  @Column({ type: 'varchar', nullable: true })
  biometricTemplateId: string | null;

  @Column({ default: false })
  biometricConsent: boolean;

  @ManyToOne(() => Tutor, (tutor) => tutor.students, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  tutor: Tutor | null;

  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  user: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
