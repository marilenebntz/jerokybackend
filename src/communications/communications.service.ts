import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Communication } from './entities/communication.entity';
import { CommunicationLog } from './entities/communication-log.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Tutor } from '../students/entities/tutor.entity';
import { Enrollment } from '../students/entities/enrollment.entity';
import { CreateCommunicationDto } from './dto/create-communication.dto';

@Injectable()
export class CommunicationsService {
  constructor(
    @InjectRepository(Communication)
    private readonly communicationRepository: Repository<Communication>,
    @InjectRepository(CommunicationLog)
    private readonly logRepository: Repository<CommunicationLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tutor)
    private readonly tutorRepository: Repository<Tutor>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
  ) {}

  async create(
    dto: CreateCommunicationDto,
    senderId: string,
  ): Promise<Communication> {
    const communication = this.communicationRepository.create({
      subject: dto.subject,
      body: dto.body,
      targetRoles: dto.targetRoles,
      channels: dto.channels,
      courseId: dto.courseId || null,
      senderId,
    });

    const saved = await this.communicationRepository.save(communication);
    const logs: CommunicationLog[] = [];

    const hasTutorRole = dto.targetRoles.includes(UserRole.TUTOR);
    const systemRoles = dto.targetRoles.filter((r) => r !== UserRole.TUTOR);

    // 1. If Tutor is in target roles, fetch tutors from tutors table
    if (hasTutorRole) {
      let tutorsToNotify: Tutor[] = [];
      if (dto.courseId) {
        const enrollments = await this.enrollmentRepository.find({
          where: { courseId: dto.courseId, status: 'active' },
          relations: { student: { tutor: true } },
        });
        const tutorMap = new Map<string, Tutor>();
        for (const e of enrollments) {
          if (e.student?.tutor) {
            tutorMap.set(e.student.tutor.id, e.student.tutor);
          }
        }
        tutorsToNotify = Array.from(tutorMap.values());
      } else {
        tutorsToNotify = await this.tutorRepository.find();
      }

      for (const tutor of tutorsToNotify) {
        for (const channel of dto.channels) {
          const log = this.logRepository.create({
            communication: saved,
            communicationId: saved.id,
            recipient: null,
            recipientId: tutor.id,
            recipientEmail: tutor.email,
            recipientName: `${tutor.firstName} ${tutor.lastName}`,
            recipientRole: 'Tutor',
            channel,
            status: 'delivered',
          });
          logs.push(log);
        }
      }
    }

    // 2. For system roles, fetch users from users table
    if (systemRoles.length > 0) {
      const recipients = await this.userRepository.find({
        where: { role: In(systemRoles), isActive: true },
      });

      for (const recipient of recipients) {
        for (const channel of dto.channels) {
          const log = this.logRepository.create({
            communication: saved,
            communicationId: saved.id,
            recipient,
            recipientId: recipient.id,
            recipientEmail: recipient.email,
            recipientName: `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || recipient.email,
            recipientRole: recipient.role,
            channel,
            status: 'delivered',
          });
          logs.push(log);
        }
      }
    }

    if (logs.length > 0) {
      await this.logRepository.save(logs);
    }

    return saved;
  }

  async getLogs(): Promise<CommunicationLog[]> {
    return this.logRepository.find({
      relations: {
        communication: {
          sender: true,
        },
        recipient: true,
      },
      order: { sentAt: 'DESC' },
    });
  }

  async getCommunications(): Promise<Communication[]> {
    return this.communicationRepository.find({
      relations: { sender: true },
      order: { createdAt: 'DESC' },
    });
  }
}
