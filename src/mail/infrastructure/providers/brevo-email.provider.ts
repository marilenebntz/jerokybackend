import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IEmailProvider,
  SendEmailOptions,
  EmailSendResult,
} from '../../domain/interfaces/email-provider.interface';

@Injectable()
export class BrevoEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(BrevoEmailProvider.name);
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;
  private readonly apiUrl = 'https://api.brevo.com/v3/smtp/email';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY') || '';
    this.senderEmail =
      this.configService.get<string>('BREVO_SENDER_EMAIL') ||
      'notificaciones@jerokyparaguai.edu.py';
    this.senderName =
      this.configService.get<string>('BREVO_SENDER_NAME') ||
      'Centro de Danzas Jeroky Paraguai';

    if (!this.apiKey) {
      this.logger.warn(
        'BREVO_API_KEY no está configurada. Los envíos de correo en modo real fallarán si no se establece.',
      );
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
    if (!this.apiKey) {
      const errorMsg =
        'BREVO_API_KEY no configurada en las variables de entorno del servidor.';
      this.logger.error(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }

    if (!options.to || options.to.length === 0) {
      return {
        success: false,
        error: 'No se especificaron destinatarios para el envío.',
      };
    }

    const payload = {
      sender: {
        name: this.senderName,
        email: this.senderEmail,
      },
      to: options.to.map((recipient) => ({
        email: recipient.email.trim(),
        ...(recipient.name ? { name: recipient.name.trim() } : {}),
      })),
      subject: options.subject,
      htmlContent: options.htmlContent,
      ...(options.textContent ? { textContent: options.textContent } : {}),
      ...(options.replyTo
        ? {
            replyTo: {
              email: options.replyTo.email,
              ...(options.replyTo.name ? { name: options.replyTo.name } : {}),
            },
          }
        : {}),
      ...(options.tags && options.tags.length > 0 ? { tags: options.tags } : {}),
    };

    try {
      this.logger.log(
        `Despachando correo vía Brevo REST API a [${options.to.map((r) => r.email).join(', ')}] | Asunto: "${options.subject}"`,
      );

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        headers: {
          'api-key': this.apiKey,
          'accept': 'application/json',
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok && (response.status === 200 || response.status === 201)) {
        const messageId =
          responseData.messageId ||
          (Array.isArray(responseData.messageIds)
            ? responseData.messageIds.join(', ')
            : undefined);

        this.logger.log(
          `Correo despachado exitosamente por Brevo. Message ID: ${messageId || 'OK'}`,
        );

        return {
          success: true,
          messageId,
          statusCode: response.status,
          rawResponse: responseData,
        };
      }

      const errorMessage =
        responseData.message ||
        responseData.code ||
        `Error HTTP ${response.status}: ${response.statusText}`;

      this.logger.error(
        `Error en respuesta de Brevo API (${response.status}): ${JSON.stringify(responseData)}`,
      );

      return {
        success: false,
        error: errorMessage,
        statusCode: response.status,
        rawResponse: responseData,
      };
    } catch (err: any) {
      const exceptionMessage =
        err instanceof Error ? err.message : 'Error de red al conectar con Brevo API';
      this.logger.error(
        `Excepción no controlada al enviar correo con Brevo: ${exceptionMessage}`,
        err.stack,
      );

      return {
        success: false,
        error: exceptionMessage,
      };
    }
  }
}
