export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface SendEmailOptions {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: EmailRecipient;
  tags?: string[];
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  statusCode?: number;
  rawResponse?: any;
}

export interface IEmailProvider {
  sendEmail(options: SendEmailOptions): Promise<EmailSendResult>;
}
