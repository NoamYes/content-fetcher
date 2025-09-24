import { Controller, Post, Get, Body, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { UrlFetcherService } from '../services/url-fetcher.service';
import { FetchUrlsDto } from '../dto/fetch-urls.dto';
import { FetchUrlsResponse } from '../interfaces/url-fetch-result.interface';

@Controller('api/fetch')
export class UrlFetcherController {
    private readonly logger = new Logger(UrlFetcherController.name);
    private lastFetchResult: FetchUrlsResponse | null = null;

    constructor(private readonly urlFetcherService: UrlFetcherService) { }

    @Post()
    async fetchUrls(@Body() fetchUrlsDto: FetchUrlsDto): Promise<FetchUrlsResponse> {
        try {
            this.logger.log(`Received request to fetch ${fetchUrlsDto.urls.length} URLs`);

            // Validate URLs
            this.validateUrls(fetchUrlsDto.urls);

            // Fetch URLs
            const result = await this.urlFetcherService.fetchUrls(fetchUrlsDto.urls);

            // Store the result for GET requests
            this.lastFetchResult = result;

            this.logger.log(`Successfully processed ${fetchUrlsDto.urls.length} URLs`);
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

    @Get()
    async getLastFetchResult(): Promise<FetchUrlsResponse | { message: string }> {
        if (!this.lastFetchResult) {
            return {
                message: 'No URLs have been fetched yet. Please submit URLs using POST /api/fetch',
            };
        }

        return this.lastFetchResult;
    }

    private validateUrls(urls: string[]): void {
        const createBadRequest = (message: string) =>
            new HttpException({ statusCode: HttpStatus.BAD_REQUEST, message, error: 'Bad Request' }, HttpStatus.BAD_REQUEST);

        if (!urls?.length) throw createBadRequest('URLs array cannot be empty');
        if (urls.length > 50) throw createBadRequest('Maximum 50 URLs allowed per request');
        if (new Set(urls).size !== urls.length) throw createBadRequest('Duplicate URLs are not allowed');

        urls.forEach((url, index) => {
            try { new URL(url); } catch {
                throw createBadRequest(`Invalid URL at index ${index}: ${url}`);
            }
        });
    }
}
