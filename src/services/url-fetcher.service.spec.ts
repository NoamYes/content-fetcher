import { Test, TestingModule } from '@nestjs/testing';
import { UrlFetcherService } from './url-fetcher.service';
import axios, { AxiosError } from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UrlFetcherService', () => {
    let service: UrlFetcherService;
    let axiosInstance: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [UrlFetcherService],
        }).compile();

        service = module.get<UrlFetcherService>(UrlFetcherService);

        jest.clearAllMocks();

        axiosInstance = {
            get: jest.fn(),
        };
        mockedAxios.create.mockReturnValue(axiosInstance);
    });

    describe('fetchUrls', () => {
        it('should fetch multiple URLs successfully', async () => {
            const urls = ['http://example.com', 'http://google.com'];

            axiosInstance.get.mockResolvedValue({
                status: 200,
                data: '<html>Content</html>',
                headers: { 'content-type': 'text/html' },
                config: { url: urls[0] },
            });

            const result = await service.fetchUrls(urls);

            expect(result.requestId).toBeDefined();
            expect(result.totalUrls).toBe(2);
            expect(result.successfulFetches).toBe(2);
            expect(result.failedFetches).toBe(0);
        });

        it('should handle mix of successful and failed fetches', async () => {
            const urls = ['http://example.com', 'http://invalid.com'];

            axiosInstance.get
                .mockResolvedValueOnce({
                    status: 200,
                    data: 'Success',
                    headers: { 'content-type': 'text/html' },
                    config: { url: urls[0] },
                })
                .mockRejectedValueOnce({
                    message: 'Network error',
                    code: 'ENOTFOUND',
                } as AxiosError);

            const result = await service.fetchUrls(urls);

            expect(result.successfulFetches).toBe(1);
            expect(result.failedFetches).toBe(1);
            expect(result.results[1].error).toBe('Domain not found');
        });
    });

    describe('Error Handling', () => {
        it('should handle timeout errors', async () => {
            axiosInstance.get.mockRejectedValue({
                message: 'timeout exceeded',
                code: 'ECONNABORTED',
            } as AxiosError);

            const result = await service['fetchSingleUrl']('http://example.com');

            expect(result.status).toBe(0);
            expect(result.error).toBe('Request timeout');
        });

        it('should handle domain not found errors', async () => {
            axiosInstance.get.mockRejectedValue({
                message: 'getaddrinfo ENOTFOUND',
                code: 'ENOTFOUND',
            } as AxiosError);

            const result = await service['fetchSingleUrl']('http://nonexistent.com');

            expect(result.error).toBe('Domain not found');
        });

        it('should handle connection refused errors', async () => {
            axiosInstance.get.mockRejectedValue({
                message: 'connect ECONNREFUSED',
                code: 'ECONNREFUSED',
            } as AxiosError);

            const result = await service['fetchSingleUrl']('http://localhost:9999');

            expect(result.error).toBe('Connection refused');
        });

        it('should handle HTTP error responses', async () => {
            axiosInstance.get.mockRejectedValue({
                message: 'Request failed',
                response: {
                    status: 500,
                    statusText: 'Internal Server Error',
                },
            } as AxiosError);

            const result = await service['fetchSingleUrl']('http://example.com');

            expect(result.error).toBe('HTTP 500: Internal Server Error');
        });
    });

    describe('Content and Redirects', () => {
        it('should truncate large content', async () => {
            const largeContent = 'a'.repeat(150000);
            axiosInstance.get.mockResolvedValue({
                status: 200,
                data: largeContent,
                headers: { 'content-type': 'text/html' },
                config: { url: 'http://example.com' },
            });

            const result = await service['fetchSingleUrl']('http://example.com');

            expect(result.content.length).toBeLessThan(largeContent.length);
            expect(result.content).toContain('[Content truncated]');
        });

        it('should follow redirects', async () => {
            const originalUrl = 'http://example.com';
            const redirectUrl = 'http://example.com/new';

            axiosInstance.get
                .mockResolvedValueOnce({
                    status: 301,
                    headers: { location: redirectUrl },
                })
                .mockResolvedValueOnce({
                    status: 200,
                    data: 'Content',
                    headers: { 'content-type': 'text/html' },
                    config: { url: redirectUrl },
                });

            const result = await service['fetchWithRedirectHandling'](
                axiosInstance,
                originalUrl,
                0
            );

            expect(result.status).toBe(200);
            expect(axiosInstance.get).toHaveBeenCalledTimes(2);
        });

        it('should enforce maximum redirect limit', async () => {
            axiosInstance.get.mockResolvedValue({
                status: 301,
                headers: { location: 'http://example.com' },
            });

            await expect(
                service['fetchWithRedirectHandling'](axiosInstance, 'http://example.com', 5)
            ).rejects.toThrow('Maximum redirect limit (5) exceeded');
        });
    });
});
