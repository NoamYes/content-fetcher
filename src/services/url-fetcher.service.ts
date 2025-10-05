import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { UrlFetchResult, FetchUrlsResponse } from '../interfaces/url-fetch-result.interface';
import { randomUUID } from 'crypto';

@Injectable()
export class UrlFetcherService {
    private readonly logger = new Logger(UrlFetcherService.name);
    private readonly maxRedirects = 5;
    private readonly requestTimeout = 10000; // 10 seconds
    private readonly maxContentLength = 10 * 1024 * 1024; // 10MB

    async fetchUrls(urls: string[], requestId?: string): Promise<FetchUrlsResponse> {
        const id = requestId || randomUUID();
        const startTime = Date.now();
        const results: UrlFetchResult[] = [];

        this.logger.log(`Starting to fetch ${urls.length} URLs with request ID: ${id}`);

        // Process URLs in parallel for better performance
        const fetchPromises = urls.map(url => this.fetchSingleUrl(url));
        const urlResults = await Promise.allSettled(fetchPromises);

        urlResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                // Handle rejected promises
                results.push({
                    url: urls[index],
                    status: 0,
                    content: '',
                    contentType: '',
                    contentLength: 0,
                    fetchTime: 0,
                    redirectCount: 0,
                    error: result.reason?.message || 'Unknown error occurred',
                    timestamp: new Date(),
                });
            }
        });

        const totalFetchTime = Date.now() - startTime;
        const successfulFetches = results.filter(r => r.status >= 200 && r.status < 400).length;
        const failedFetches = results.length - successfulFetches;

        this.logger.log(`Completed fetching URLs with request ID ${id}. Success: ${successfulFetches}, Failed: ${failedFetches}, Total time: ${totalFetchTime}ms`);

        return {
            requestId: id,
            results,
            totalUrls: urls.length,
            successfulFetches,
            failedFetches,
            totalFetchTime,
            timestamp: new Date(),
        };
    }

    private async fetchSingleUrl(url: string): Promise<UrlFetchResult> {
        const startTime = Date.now();
        let redirectCount = 0;
        let currentUrl = url;

        try {
            // Create axios instance with custom configuration
            const axiosInstance = axios.create({
                timeout: this.requestTimeout,
                maxContentLength: this.maxContentLength,
                maxRedirects: this.maxRedirects,
                validateStatus: (status) => status < 500, // Accept all status codes < 500
                headers: {
                    'User-Agent': 'NestJS-URL-Fetcher/1.0',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                },
            });

            // Handle redirects manually to track redirect count
            const response = await this.fetchWithRedirectHandling(axiosInstance, currentUrl, redirectCount);

            const fetchTime = Date.now() - startTime;
            const contentLength = response.data ? Buffer.byteLength(response.data, 'utf8') : 0;

            return {
                url,
                status: response.status,
                content: this.truncateContent(response.data),
                contentType: response.headers['content-type'] || 'unknown',
                contentLength,
                fetchTime,
                redirectCount,
                finalUrl: response.config.url !== url ? response.config.url : undefined,
                timestamp: new Date(),
            };

        } catch (error) {
            const fetchTime = Date.now() - startTime;
            const axiosError = error as AxiosError;

            this.logger.error(`Error fetching URL ${url}: ${axiosError.message}`);

            return {
                url,
                status: axiosError.response?.status || 0,
                content: '',
                contentType: '',
                contentLength: 0,
                fetchTime,
                redirectCount,
                error: this.getErrorMessage(axiosError),
                timestamp: new Date(),
            };
        }
    }

    private async fetchWithRedirectHandling(
        axiosInstance: any,
        url: string,
        redirectCount: number
    ): Promise<AxiosResponse> {
        const response = await axiosInstance.get(url);

        // Check if response is a redirect
        if (this.isRedirect(response.status) && response.headers.location) {
            if (redirectCount >= this.maxRedirects) {
                throw new Error(`Maximum redirect limit (${this.maxRedirects}) exceeded`);
            }

            const newUrl = this.resolveUrl(url, response.headers.location);
            this.logger.log(`Following redirect from ${url} to ${newUrl}`);

            return this.fetchWithRedirectHandling(axiosInstance, newUrl, redirectCount + 1);
        }

        return response;
    }

    private isRedirect(status: number): boolean {
        return status >= 300 && status < 400;
    }

    private resolveUrl(baseUrl: string, relativeUrl: string): string {
        try {
            return new URL(relativeUrl, baseUrl).toString();
        } catch (error) {
            throw new Error(`Invalid redirect URL: ${relativeUrl}`);
        }
    }

    private truncateContent(content: string, maxLength: number = 100000): string {
        if (!content || content.length <= maxLength) {
            return content || '';
        }
        return content.substring(0, maxLength) + '\n... [Content truncated]';
    }

    private getErrorMessage(error: AxiosError): string {
        if (error.code === 'ECONNABORTED') {
            return 'Request timeout';
        }
        if (error.code === 'ENOTFOUND') {
            return 'Domain not found';
        }
        if (error.code === 'ECONNREFUSED') {
            return 'Connection refused';
        }
        if (error.response) {
            return `HTTP ${error.response.status}: ${error.response.statusText}`;
        }
        if (error.request) {
            return 'Network error - no response received';
        }
        return error.message || 'Unknown error occurred';
    }
}
