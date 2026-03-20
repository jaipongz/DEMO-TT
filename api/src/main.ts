import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SnakeCaseResponseInterceptor } from './common/interceptors/snake-case-response.interceptor';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new SnakeCaseResponseInterceptor());

  // Enable CORS
  app.enableCors();
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'stock/:module/:gen/:fileName', method: RequestMethod.GET },
    ],
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('API description')
    .setVersion('1.0')
    .addTag('app')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
