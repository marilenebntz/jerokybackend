import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Communication } from './entities/communication.entity';
import { CommunicationLog } from './entities/communication-log.entity';
import { User } from '../users/entities/user.entity';
import { Tutor } from '../students/entities/tutor.entity';
import { Enrollment } from '../students/entities/enrollment.entity';
import { CommunicationsService } from './communications.service';
import { CommunicationsController } from './communications.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Communication,
      CommunicationLog,
      User,
      Tutor,
      Enrollment,
    ]),
  ],
  controllers: [CommunicationsController],
  providers: [CommunicationsService],
  exports: [CommunicationsService],
})
export class CommunicationsModule {}
