import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Communication } from './entities/communication.entity';
import { CommunicationLog } from './entities/communication-log.entity';
import { CreateCommunicationDto } from './dto/create-communication.dto';
import { RecipientResolverService } from './domain/recipient-resolver.service';
import { MailService } from '../mail/mail.service';

export interface CreateCommunicationResult {
  communication: Communication;
  summary: {
    totalRecipients: number;
    emailDispatches: {
      total: number;
      delivered: number;
      failed: number;
    };
    webDispatches: {
      total: number;
      delivered: number;
    };
  };
}

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(
    @InjectRepository(Communication)
    private readonly communicationRepository: Repository<Communication>,
    @InjectRepository(CommunicationLog)
    private readonly logRepository: Repository<CommunicationLog>,
    private readonly recipientResolver: RecipientResolverService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Emite y despacha un nuevo comunicado masivo o segmentado por curso y canales.
   */
  async create(
    dto: CreateCommunicationDto,
    senderId: string,
  ): Promise<CreateCommunicationResult> {
    // 1. Guardar la entidad de la comunicación
    const communication = this.communicationRepository.create({
      subject: dto.subject,
      body: dto.body,
      targetRoles: dto.targetRoles,
      channels: dto.channels,
      courseId: dto.courseId || null,
      senderId,
    });

    const savedCommunication =
      await this.communicationRepository.save(communication);

    // 2. Resolver los destinatarios de acuerdo a la segmentación y reglas de negocio
    let recipients = dto.testEmail
      ? [
          {
            recipientId: null,
            email: dto.testEmail.trim().toLowerCase(),
            name: dto.testName?.trim() || 'Destinatario de Prueba',
            role: 'Test / Individual',
            description: `Envío Directo de Prueba (${dto.testEmail.trim()})`,
            userEntity: null,
          },
        ]
      : await this.recipientResolver.resolveRecipients(
          dto.targetRoles,
          dto.courseId,
        );

    const logsToSave: CommunicationLog[] = [];
    const hasEmailChannel = dto.channels.includes('Email');
    const hasWebChannel = dto.channels.includes('Web');

    let emailDeliveredCount = 0;
    let emailFailedCount = 0;
    let webDeliveredCount = 0;

    // 3. Despacho por Canal Email (Integración con Brevo en lotes concurrentes)
    if (hasEmailChannel) {
      const BATCH_SIZE = 5;
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (recipient) => {
            this.logger.log(
              `Iniciando despacho por email a "${recipient.name}" <${recipient.email}>`,
            );

            let status = 'delivered';
            let errorMessage: string | null = null;
            let externalId: string | null = null;
            let isDelivered = false;

            try {
              const sendResult = await this.mailService.sendInstitutionalEmail({
                recipientName: recipient.name,
                recipientEmail: recipient.email,
                subject: dto.subject,
                body: dto.body,
                tags: ['comunicados', `rol-${recipient.role.toLowerCase()}`],
              });

              if (sendResult.success) {
                status = 'delivered';
                externalId = sendResult.messageId || null;
                isDelivered = true;
              } else {
                status = 'failed';
                errorMessage = sendResult.error || 'Fallo en la entrega del correo';
              }
            } catch (err: any) {
              status = 'failed';
              errorMessage =
                err instanceof Error ? err.message : 'Error inesperado al despachar email';
            }

            const log = this.logRepository.create({
              communication: savedCommunication,
              communicationId: savedCommunication.id,
              recipientId: recipient.recipientId,
              recipientEmail: recipient.email,
              recipientName: recipient.name,
              recipientRole: recipient.role,
              recipientDescription: recipient.description,
              channel: 'Email',
              status,
              errorMessage,
              externalId,
            });

            return { log, isDelivered };
          }),
        );

        for (const item of batchResults) {
          logsToSave.push(item.log);
          if (item.isDelivered) {
            emailDeliveredCount++;
          } else {
            emailFailedCount++;
          }
        }
      }
    }

    // 4. Despacho por Canal Web (Notificaciones en Plataforma)
    if (hasWebChannel) {
      for (const recipient of recipients) {
        webDeliveredCount++;
        const log = this.logRepository.create({
          communication: savedCommunication,
          communicationId: savedCommunication.id,
          recipientId: recipient.recipientId,
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          recipientRole: recipient.role,
          recipientDescription: recipient.description,
          channel: 'Web',
          status: 'delivered',
          errorMessage: null,
          externalId: null,
        });

        logsToSave.push(log);
      }
    }

    // 5. Persistir todos los registros de auditoría de entrega
    if (logsToSave.length > 0) {
      await this.logRepository.save(logsToSave);
    }

    this.logger.log(
      `Comunicado [${savedCommunication.id}] procesado. Logs creados: ${logsToSave.length} (Email: ${emailDeliveredCount} entregados, ${emailFailedCount} fallidos | Web: ${webDeliveredCount})`,
    );

    return {
      communication: savedCommunication,
      summary: {
        totalRecipients: recipients.length,
        emailDispatches: {
          total: hasEmailChannel ? recipients.length : 0,
          delivered: emailDeliveredCount,
          failed: emailFailedCount,
        },
        webDispatches: {
          total: hasWebChannel ? recipients.length : 0,
          delivered: webDeliveredCount,
        },
      },
    };
  }

  /**
   * Obtiene la lista completa del historial de logs de entrega para auditoría.
   */
  async getLogs(): Promise<CommunicationLog[]> {
    return this.logRepository.find({
      relations: {
        communication: {
          sender: true,
        },
      },
      order: { sentAt: 'DESC' },
      take: 150,
    });
  }

  /**
   * Obtiene la lista histórica de comunicaciones emitidas.
   */
  async getCommunications(): Promise<Communication[]> {
    return this.communicationRepository.find({
      relations: { sender: true },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
