import { Controller, Post, Get, Body, HttpException, HttpStatus, Logger, Param, Req, HttpCode } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UrlFetcherService } from '../services/url-fetcher.service';
import { FetchUrlsDto } from '../dto/fetch-urls.dto';
import { FetchUrlsResponse, StoredFetchRequest } from '../interfaces/url-fetch-result.interface';
import {
    hasUrls,
    isWithinUrlLimit,
    hasUniqueUrls,
    areAllUrlsValid,
    findFirstInvalidUrlIndex,
    findFirstDuplicateUrlIndex
} from '../validators/url.validator';

@Controller('api/v1/requests')
export class UrlFetcherController {
    private readonly logger = new Logger(UrlFetcherController.name);
    private fetchResults: Map<string, StoredFetchRequest> = new Map();

    constructor(
        private readonly urlFetcherService: UrlFetcherService,
        private readonly configService: ConfigService
    ) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createFetchRequest(@Body() fetchUrlsDto: FetchUrlsDto): Promise<FetchUrlsResponse> {
        try {
            this.logger.log(`Received request to fetch ${fetchUrlsDto.urls.length} URLs`);

            // Validate URLs
            this.validateUrls(fetchUrlsDto.urls);

            // Fetch URLs (service will generate a unique ID)
            const result = await this.urlFetcherService.fetchUrls(fetchUrlsDto.urls);

            // Store the result with metadata
            const storedRequest: StoredFetchRequest = {
                id: result.requestId,
                urls: fetchUrlsDto.urls,
                result: result,
                createdAt: new Date(),
                status: 'completed'
            };

            this.fetchResults.set(result.requestId, storedRequest);

            this.logger.log(`Successfully processed ${fetchUrlsDto.urls.length} URLs with request ID: ${result.requestId}`);
            return result;

        } catch (error) {
            this.logger.error(`Error processing fetch request: ${error.message}`);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Internal server error while fetching URLs',
                    error: error.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get(':id')
    async getRequestById(@Param('id') id: string): Promise<StoredFetchRequest> {
        const storedRequest = this.fetchResults.get(id);

        if (!storedRequest) {
            throw new HttpException(
                {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: `Request not found with ID: ${id}`,
                    error: 'Not Found'
                },
                HttpStatus.NOT_FOUND
            );
        }

        return storedRequest;
    }

    @Get()
    async getAllRequests(): Promise<StoredFetchRequest[]> {
        const requests = Array.from(this.fetchResults.values());

        return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    private validateUrls(urls: string[]): void {
        const createBadRequest = (message: string) =>
            new HttpException({ statusCode: HttpStatus.BAD_REQUEST, message, error: 'Bad Request' }, HttpStatus.BAD_REQUEST);

        if (!hasUrls(urls)) {
            throw createBadRequest('URLs array cannot be empty');
        }

        if (!isWithinUrlLimit(urls)) {
            const maxUrls = this.configService.get<number>('MAX_URLS_PER_REQUEST', 50);
            throw createBadRequest(`Maximum ${maxUrls} URLs allowed per request`);
        }

        if (!hasUniqueUrls(urls)) {
            const duplicateIndex = findFirstDuplicateUrlIndex(urls);
            throw createBadRequest(`Duplicate URL found at index ${duplicateIndex}: ${urls[duplicateIndex]}`);
        }

        if (!areAllUrlsValid(urls)) {
            const invalidIndex = findFirstInvalidUrlIndex(urls);
            throw createBadRequest(`Invalid URL at index ${invalidIndex}: ${urls[invalidIndex]}`);
        }
    }
}
