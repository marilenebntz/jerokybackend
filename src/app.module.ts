import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FacesModule } from './faces/faces.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    FacesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
