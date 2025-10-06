import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
    @Get()
    @ApiOperation({ summary: 'Health check', description: 'Returns API status and uptime' })
    @ApiResponse({ status: 200, description: 'API is healthy' })
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
