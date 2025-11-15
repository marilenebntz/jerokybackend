import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FacesController } from './faces.controller';
import { RekognitionClientProvider } from './providers/rekognition.provider';
import { FacesService } from './faces.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [FacesController],
  providers: [RekognitionClientProvider, FacesService],
  exports: [RekognitionClientProvider, FacesService],
})
export class FacesModule {}
