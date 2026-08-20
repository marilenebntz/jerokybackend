import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { EMAIL_PROVIDER } from './constants';
import { IEmailProvider } from './domain/interfaces/email-provider.interface';

describe('MailService', () => {
  let service: MailService;
  const mockEmailProvider: jest.Mocked<IEmailProvider> = {
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: EMAIL_PROVIDER, useValue: mockEmailProvider },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe validar formatos de correos electrónicos correctamente', () => {
    expect(service.isValidEmail('test@example.com')).toBe(true);
    expect(service.isValidEmail('admin.danza@jerokyparaguai.edu.py')).toBe(true);
    expect(service.isValidEmail('invalido-sin-arroba.com')).toBe(false);
    expect(service.isValidEmail('')).toBe(false);
    expect(service.isValidEmail(null)).toBe(false);
  });

  it('debe rechazar envíos con correo inválido sin invocar al proveedor', async () => {
    const result = await service.sendInstitutionalEmail({
      recipientName: 'Juan Pérez',
      recipientEmail: 'correo-invalido',
      subject: 'Aviso de Ensayo',
      body: 'Texto de prueba',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Formato de correo electrónico inválido');
    expect(mockEmailProvider.sendEmail).not.toHaveBeenCalled();
  });

  it('debe generar HTML y despachar al proveedor cuando el correo es válido', async () => {
    mockEmailProvider.sendEmail.mockResolvedValue({
      success: true,
      messageId: 'msg-12345',
    });

    const result = await service.sendInstitutionalEmail({
      recipientName: 'Juan Pérez',
      recipientEmail: 'juan@example.com',
      subject: 'Aviso de Ensayo',
      body: 'Texto de prueba',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg-12345');
    expect(mockEmailProvider.sendEmail).toHaveBeenCalledTimes(1);
    const sentOptions = mockEmailProvider.sendEmail.mock.calls[0][0];
    expect(sentOptions.to[0].email).toBe('juan@example.com');
    expect(sentOptions.htmlContent).toContain('Jeroky Soft');
    expect(sentOptions.htmlContent).toContain('Estimado/a Juan Pérez');
  });

  it('debe escapar correctamente entidades HTML en el asunto, cuerpo y nombre', async () => {
    mockEmailProvider.sendEmail.mockResolvedValue({
      success: true,
      messageId: 'msg-sec-1',
    });

    await service.sendInstitutionalEmail({
      recipientName: '<Admin> & "Tutor"',
      recipientEmail: 'admin@example.com',
      subject: '<script>alert(1)</script>',
      body: 'Texto con <b>HTML</b> & caracteres especiales\n\nSegunda línea <img src="x" />',
    });

    expect(mockEmailProvider.sendEmail).toHaveBeenCalledTimes(1);
    const sentOptions = mockEmailProvider.sendEmail.mock.calls[0][0];
    expect(sentOptions.htmlContent).not.toContain('<script>');
    expect(sentOptions.htmlContent).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(sentOptions.htmlContent).toContain('&lt;Admin&gt; &amp; &quot;Tutor&quot;');
    expect(sentOptions.htmlContent).toContain('&lt;b&gt;HTML&lt;/b&gt; &amp; caracteres especiales');
    expect(sentOptions.htmlContent).toContain('&lt;img src=&quot;x&quot; /&gt;');
  });
});
