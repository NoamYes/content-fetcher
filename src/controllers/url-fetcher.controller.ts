import { Controller, Post, Get, Body, HttpException, HttpStatus, Logger, Param, Req, HttpCode } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UrlFetcherService } from '../services/url-fetcher.service';
import { FetchUrlsDto } from '../dto/fetch-urls.dto';
import { FetchUrlsResponse } from '../interfaces/url-fetch-result.interface';
import {
    hasUrls,
    isWithinUrlLimit,
    hasUniqueUrls,
    areAllUrlsValid,
    findFirstInvalidUrlIndex,
    findFirstDuplicateUrlIndex
} from '../validators/url.validator';

@Controller('api/fetch')
export class UrlFetcherController {
    private readonly logger = new Logger(UrlFetcherController.name);
    private fetchResults: Map<string, FetchUrlsResponse> = new Map();

    constructor(
        private readonly urlFetcherService: UrlFetcherService,
        private readonly configService: ConfigService
    ) { }

    @Post('*')
    @HttpCode(HttpStatus.OK)
    async fetchUrls(@Req() req: any, @Body() fetchUrlsDto: FetchUrlsDto): Promise<FetchUrlsResponse> {
        try {
            const path = req.params[0] || '';
            this.logger.log(`Received request to fetch ${fetchUrlsDto.urls.length} URLs at path: ${path}`);

            // Validate URLs
            this.validateUrls(fetchUrlsDto.urls);

            // Fetch URLs
            const result = await this.urlFetcherService.fetchUrls(fetchUrlsDto.urls);

            // Store the result for GET requests using the path as key
            this.fetchResults.set(path, result);

            this.logger.log(`Successfully processed ${fetchUrlsDto.urls.length} URLs and stored at path: ${path}`);
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

    @Get('*')
    async getFetchResult(@Req() req: any): Promise<FetchUrlsResponse | { message: string }> {
        const path = req.params[0] || '';
        const result = this.fetchResults.get(path);
        
        if (!result) {
            return {
                message: `No URLs have been fetched for path '${path}' yet. Please submit URLs using POST /api/fetch/${path}`,
            };
        }

        return result;
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
