import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IRequestsRepository } from './requests.repository.interface';
import { MemoryRequestsRepository } from './memory-requests.repository';
import { FileRequestsRepository } from './file-requests.repository';

/**
 * Repositories Module
 * Provides repository implementations based on configuration
 * 
 * Configuration via environment variable:
 * - IS_PERSISTENT=false -> MemoryRequestsRepository (default)
 * - IS_PERSISTENT=true  -> FileRequestsRepository
 */
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'IRequestsRepository',
            useFactory: (configService: ConfigService): IRequestsRepository => {
                const isPersistent = configService.get<boolean>('IS_PERSISTENT', false);
                
                if (isPersistent) {
                    const repo = new FileRequestsRepository(configService);
                    return repo;
                } else {
                    return new MemoryRequestsRepository();
                }
            },
            inject: [ConfigService],
        },
    ],
    exports: ['IRequestsRepository'],
})
export class RepositoriesModule {}

