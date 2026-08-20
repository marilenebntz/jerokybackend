import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EMAIL_PROVIDER } from './constants';
import { BrevoEmailProvider } from './infrastructure/providers/brevo-email.provider';
import { MockEmailProvider } from './infrastructure/providers/mock-email.provider';
import { MailService } from './mail.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: EMAIL_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const forceMock = configService.get<string>('MOCK_EMAIL') === 'true';
        const nodeEnv = configService.get<string>('NODE_ENV');

        // Si se fuerza el mock o estamos en entorno de test, usamos MockEmailProvider
        if (forceMock || nodeEnv === 'test') {
          return new MockEmailProvider();
        }

        // En otros entornos se usa BrevoEmailProvider (que advertirá si falta BREVO_API_KEY)
        return new BrevoEmailProvider(configService);
      },
      inject: [ConfigService],
    },
    MailService,
  ],
  exports: [MailService, EMAIL_PROVIDER],
})
export class MailModule {}
