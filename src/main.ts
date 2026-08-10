import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(new ValidationPipe());

  // Configure Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('AnyDnD Backend API')
    .setDescription('API documentation for the AnyDnD Backend')
    .setVersion('1.0.0')
    .addTag('game', 'Game management endpoints')
    .addTag('characters', 'Characters management endpoints')
    .addTag('events', 'Events management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Swagger UI available at http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}
bootstrap();
