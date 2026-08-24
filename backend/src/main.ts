import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Saare routes /api se shuru honge -> /api/agent/stream, /api/products ...
  app.setGlobalPrefix('api');

  const origin = process.env.CORS_ORIGIN ?? 'http://localhost:4200';
  app.enableCors({
    origin: origin === '*' ? true : origin.split(','),
    credentials: true,
  });

  // DTOs automatically validate honge; extra fields chup chaap gir jayenge
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');

  Logger.log('AgentDesk API ready -> http://localhost:' + port + '/api', 'Bootstrap');
  Logger.log('LLM provider: ' + (process.env.LLM_PROVIDER ?? 'mock'), 'Bootstrap');
}

bootstrap();
