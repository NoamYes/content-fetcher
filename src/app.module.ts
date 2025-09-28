import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UrlFetcherController } from './controllers/url-fetcher.controller';
import { HealthController } from './controllers/health.controller';
import { UrlFetcherService } from './services/url-fetcher.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
    ],
    controllers: [UrlFetcherController, HealthController],
    providers: [UrlFetcherService],
})
export class AppModule { }
