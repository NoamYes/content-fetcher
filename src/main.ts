import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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

    // Swagger API Documentation
    const config = new DocumentBuilder()
        .setTitle('URL Fetcher API')
        .setDescription('RESTful API for fetching multiple URLs in parallel with persistent storage')
        .setVersion('1.0')
        .addTag('requests', 'URL fetch request operations')
        .addTag('health', 'Health check')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = configService.get('PORT', 3000);
    await app.listen(port);

    console.log(`\n🚀 Application is running on: http://localhost:${port}`);
    console.log(`\n📖 Interactive API Documentation (Swagger):`);
    console.log(`   👉 http://localhost:${port}/api/docs`);
    console.log(`\n🔗 API Endpoints: http://localhost:${port}/api/v1/requests\n`);
}

bootstrap();
