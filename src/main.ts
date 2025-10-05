import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Enable CORS for all origins (you might want to restrict this in production)
    app.enableCors();

    // Enable validation pipes globally
    app.useGlobalPipes(new ValidationPipe({
        transform: configService.get('VALIDATION_TRANSFORM', true),
        whitelist: configService.get('VALIDATION_WHITELIST', true),
        forbidNonWhitelisted: configService.get('VALIDATION_FORBID_NON_WHITELISTED', true),
    }));

    const port = configService.get('PORT', 3000);
    await app.listen(port);

    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`📖 API Documentation: http://localhost:${port}/api/v1/requests`);
}

bootstrap();
