import { ConfigService } from '@nestjs/config';
import {
  RekognitionClient,
  RekognitionClientConfig,
} from '@aws-sdk/client-rekognition';

export const REKOGNITION_CLIENT = Symbol('REKOGNITION_CLIENT');

export const RekognitionClientProvider = {
  provide: REKOGNITION_CLIENT,
  useFactory: (configService: ConfigService) => {
    const region = configService.getOrThrow<string>('AWS_REGION');
    const accessKeyId = configService.getOrThrow<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = configService.getOrThrow<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    const config: RekognitionClientConfig = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    return new RekognitionClient(config);
  },
  inject: [ConfigService],
};
