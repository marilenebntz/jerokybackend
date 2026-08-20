import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const envOrigins =
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    process.env.ALLOWED_ORIGINS;
  const configuredOrigins = envOrigins
    ? envOrigins.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];

  const defaultOrigins = [
    'https://jerokysoft.site',
    'https://www.jerokysoft.site',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  const allowedOrigins = Array.from(
    new Set([...configuredOrigins, ...defaultOrigins]),
  );

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (ej. curl, SSR, apps móviles, healthchecks)
      if (!origin) return callback(null, true);

      if (
        envOrigins === '*' ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.jerokysoft.site') ||
        (process.env.NODE_ENV !== 'production' && origin.includes('localhost'))
      ) {
        return callback(null, true);
      }

      if (process.env.NODE_ENV === 'production' && envOrigins !== '*') {
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      }

      callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Authentication',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
  });

  // Increase payload size limit to support Base64 biometric face image uploads
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Yeruti Academia de Danza API')
    .setDescription(
      'API documentation for the Yeruti Dance Academy management system',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT token to access secured endpoints',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Write OpenAPI JSON specification in development only
  if (process.env.NODE_ENV !== 'production') {
    try {
      fs.writeFileSync(
        path.join(process.cwd(), 'openapi.json'),
        JSON.stringify(document, null, 2),
      );
    } catch (error) {
      console.error('Failed to write openapi.json:', error);
    }
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
}
bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
