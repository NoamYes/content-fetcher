import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
    @Get()
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            service: 'URL Fetcher Service',
            version: '1.0.0',
        };
    }
}
