import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Communication } from './entities/communication.entity';
import { CommunicationLog } from './entities/communication-log.entity';
import { User } from '../users/entities/user.entity';
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
  ) {}

  async create(
    dto: CreateCommunicationDto,
    senderId: string,
  ): Promise<Communication> {
    const communication = this.communicationRepository.create({
      ...dto,
      senderId,
    });

    const saved = await this.communicationRepository.save(communication);

    // Find all users in target roles
    const recipients = await this.userRepository.find({
      where: { role: In(dto.targetRoles), isActive: true },
    });

    // Create logs for each recipient and each selected channel
    const logs: CommunicationLog[] = [];
    for (const recipient of recipients) {
      for (const channel of dto.channels) {
        const log = this.logRepository.create({
          communication: saved,
          communicationId: saved.id,
          recipient,
          recipientId: recipient.id,
          channel,
          status: 'delivered', // simulated immediate delivery
        });
        logs.push(log);
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
