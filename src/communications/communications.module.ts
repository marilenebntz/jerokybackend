import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Communication } from './entities/communication.entity';
import { CommunicationLog } from './entities/communication-log.entity';
import { User } from '../users/entities/user.entity';
import { Tutor } from '../students/entities/tutor.entity';
import { Student } from '../students/entities/student.entity';
import { Enrollment } from '../students/entities/enrollment.entity';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';
import { RecipientResolverService } from './domain/recipient-resolver.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Communication,
      CommunicationLog,
      User,
      Tutor,
      Student,
      Enrollment,
    ]),
    MailModule,
  ],
  controllers: [CommunicationsController],
  providers: [CommunicationsService, RecipientResolverService],
  exports: [CommunicationsService, RecipientResolverService],
})
export class CommunicationsModule {}
