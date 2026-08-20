import { Inject, Injectable, Logger } from '@nestjs/common';
import { EMAIL_PROVIDER } from './constants';
import type {
  IEmailProvider,
  EmailSendResult,
  SendEmailOptions,
} from './domain/interfaces/email-provider.interface';
import { generateInstitutionalEmailHtml } from './infrastructure/templates/institutional-email.template';

export interface SendInstitutionalEmailDto {
  recipientName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  tags?: string[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(
    @Inject(EMAIL_PROVIDER)
    private readonly emailProvider: IEmailProvider,
  ) {}

  /**
   * Valida si un string corresponde a una dirección de correo con formato sintáctico válido.
   */
  isValidEmail(email?: string | null): boolean {
    if (!email) return false;
    return this.emailRegex.test(email.trim());
  }

  /**
   * Envía un correo institucional con el diseño oficial HTML y formato estandarizado de Jeroky Soft.
   */
  async sendInstitutionalEmail(
    dto: SendInstitutionalEmailDto,
  ): Promise<EmailSendResult> {
    const trimmedEmail = dto.recipientEmail ? dto.recipientEmail.trim() : '';

    if (!this.isValidEmail(trimmedEmail)) {
      const error = `Formato de correo electrónico inválido: "${dto.recipientEmail}"`;
      this.logger.warn(error);
      return {
        success: false,
        error,
      };
    }

    const htmlContent = generateInstitutionalEmailHtml({
      recipientName: dto.recipientName,
      subject: dto.subject,
      body: dto.body,
    });

    const options: SendEmailOptions = {
      to: [
        {
          email: trimmedEmail,
          name: dto.recipientName,
        },
      ],
      subject: dto.subject,
      htmlContent,
      textContent: `${dto.subject}\n\nEstimado/a ${dto.recipientName}:\n\n${dto.body}\n\n---\nCentro de Danzas Jeroky Paraguai`,
      tags: dto.tags || ['jeroky-soft', 'comunicaciones'],
    };

    return this.emailProvider.sendEmail(options);
  }

  /**
   * Envía un correo genérico directamente con las opciones dadas.
   */
  async sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
    return this.emailProvider.sendEmail(options);
  }
}
