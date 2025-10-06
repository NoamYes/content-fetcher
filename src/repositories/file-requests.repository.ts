import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IRequestsRepository } from './requests.repository.interface';
import { StoredFetchRequest } from '../interfaces/url-fetch-result.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * File-based implementation of RequestsRepository
 * Data is persisted to disk as JSON and survives service restarts
 * 
 * Best for: Small-scale production, demos, development with persistence
 */
@Injectable()
export class FileRequestsRepository implements IRequestsRepository, OnModuleInit {
    private readonly logger = new Logger(FileRequestsRepository.name);
    private readonly storageDir: string;
    private readonly storageFile: string;
    private cache: Map<string, StoredFetchRequest> = new Map();

    constructor(private readonly configService: ConfigService) {
        this.storageDir = this.configService.get<string>('STORAGE_DIR', './storage');
        this.storageFile = path.join(this.storageDir, 'requests.json');
    }

    async onModuleInit() {
        await this.ensureStorageDirectory();
        await this.loadFromDisk();
        this.logger.log(`File-based requests repository initialized at ${this.storageFile}`);
    }

    private async ensureStorageDirectory(): Promise<void> {
        try {
            await fs.access(this.storageDir);
        } catch {
            await fs.mkdir(this.storageDir, { recursive: true });
            this.logger.log(`Created storage directory: ${this.storageDir}`);
        }
    }

    private async loadFromDisk(): Promise<void> {
        try {
            const data = await fs.readFile(this.storageFile, 'utf-8');
            const requests: StoredFetchRequest[] = JSON.parse(data);
            
            // Restore Map from JSON array
            this.cache = new Map(
                requests.map((req) => [req.id, req])
            );
            
            this.logger.log(`Loaded ${this.cache.size} requests from disk`);
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.logger.log('No existing storage file found, starting with empty repository');
            } else {
                this.logger.error(`Error loading requests from disk: ${error.message}`);
            }
        }
    }

    private async saveToDisk(): Promise<void> {
        try {
            const requests = Array.from(this.cache.values());
            await fs.writeFile(
                this.storageFile,
                JSON.stringify(requests, null, 2),
                'utf-8'
            );
            this.logger.debug(`Persisted ${requests.length} requests to disk`);
        } catch (error) {
            this.logger.error(`Error saving requests to disk: ${error.message}`);
            throw error;
        }
    }

    async save(request: StoredFetchRequest): Promise<void> {
        this.cache.set(request.id, request);
        await this.saveToDisk();
        this.logger.debug(`Saved request ${request.id} to file storage`);
    }

    async findById(id: string): Promise<StoredFetchRequest | null> {
        const request = this.cache.get(id);
        return request || null;
    }

    async findAll(): Promise<StoredFetchRequest[]> {
        return Array.from(this.cache.values());
    }

    async delete(id: string): Promise<void> {
        this.cache.delete(id);
        await this.saveToDisk();
        this.logger.debug(`Deleted request ${id} from file storage`);
    }

    async clear(): Promise<void> {
        this.cache.clear();
        await this.saveToDisk();
        this.logger.log('Cleared all requests from file storage');
    }

    async exists(id: string): Promise<boolean> {
        return this.cache.has(id);
    }
}

