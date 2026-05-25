import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('ms-client-scheduling')
    .setDescription('API de agendamento para clientes finais')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .addTag('auth', 'Autenticação Google OAuth')
    .addTag('catalog', 'Catálogo de serviços e profissionais')
    .addTag('booking', 'Agendamento e sessões')
    .addTag('clientes', 'Área do cliente')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3003);

  await app.listen(port);
  console.log(`ms-client-scheduling running on port ${port}`);
  console.log(`Swagger available at http://localhost:${port}/api`);
}
bootstrap();
