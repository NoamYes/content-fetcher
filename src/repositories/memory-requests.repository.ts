import { Injectable, Logger } from '@nestjs/common';
import { IRequestsRepository } from './requests.repository.interface';
import { StoredFetchRequest } from '../interfaces/url-fetch-result.interface';

/**
 * In-memory implementation of RequestsRepository
 * Data is stored in a Map and lost when the service restarts
 * 
 * Best for: Development, testing, temporary data
 */
@Injectable()
export class MemoryRequestsRepository implements IRequestsRepository {
    private readonly logger = new Logger(MemoryRequestsRepository.name);
    private readonly requests: Map<string, StoredFetchRequest> = new Map();

    async save(request: StoredFetchRequest): Promise<void> {
        this.requests.set(request.id, request);
        this.logger.debug(`Saved request ${request.id} to memory storage`);
    }

    async findById(id: string): Promise<StoredFetchRequest | null> {
        const request = this.requests.get(id);
        return request || null;
    }

    async findAll(): Promise<StoredFetchRequest[]> {
        return Array.from(this.requests.values());
    }

    async delete(id: string): Promise<void> {
        this.requests.delete(id);
        this.logger.debug(`Deleted request ${id} from memory storage`);
    }

    async clear(): Promise<void> {
        this.requests.clear();
        this.logger.debug('Cleared all requests from memory storage');
    }

    async exists(id: string): Promise<boolean> {
        return this.requests.has(id);
    }
}

