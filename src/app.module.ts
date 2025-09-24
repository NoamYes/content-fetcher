import { Module } from '@nestjs/common';
import { UrlFetcherController } from './controllers/url-fetcher.controller';
import { HealthController } from './controllers/health.controller';
import { UrlFetcherService } from './services/url-fetcher.service';

@Module({
    imports: [],
    controllers: [UrlFetcherController, HealthController],
    providers: [UrlFetcherService],
})
export class AppModule { }
