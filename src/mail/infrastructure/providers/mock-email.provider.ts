import { Injectable, Logger } from '@nestjs/common';
import {
  IEmailProvider,
  SendEmailOptions,
  EmailSendResult,
} from '../../domain/interfaces/email-provider.interface';

@Injectable()
export class MockEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(MockEmailProvider.name);

  async sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
    const mockId = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.logger.log(
      `[MOCK EMAIL SENT] To: ${options.to.map((t) => `${t.name || ''} <${t.email}>`).join(', ')} | Subject: "${options.subject}" | MockId: ${mockId}`,
    );

    return {
      success: true,
      messageId: mockId,
      statusCode: 201,
    };
  }
}
