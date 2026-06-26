import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(
    action: string,
    userId: string | null,
    username: string | null,
    ipAddress: string | null,
    details?: string,
  ): Promise<AuditLog> {
    const entry = this.auditRepository.create({
      action,
      userId,
      username,
      ipAddress,
      details: details || null,
    });
    return this.auditRepository.save(entry);
  }

  async findAll(): Promise<AuditLog[]> {
    return this.auditRepository.find({
      order: { timestamp: 'DESC' },
    });
  }
}
