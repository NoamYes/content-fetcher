import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UrlFetcherController } from './url-fetcher.controller';
import { UrlFetcherService } from '../services/url-fetcher.service';
import { FetchUrlsDto } from '../dto/fetch-urls.dto';
import { FetchUrlsResponse } from '../interfaces/url-fetch-result.interface';

describe('UrlFetcherController', () => {
    let controller: UrlFetcherController;
    let service: UrlFetcherService;

    const mockUrlFetcherService = {
        fetchUrls: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn((key: string, defaultValue: any) => defaultValue),
    };

    const mockRequestsRepository = {
        save: jest.fn(),
        findById: jest.fn(),
        findAll: jest.fn(),
        delete: jest.fn(),
        clear: jest.fn(),
        exists: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [UrlFetcherController],
            providers: [
                {
                    provide: UrlFetcherService,
                    useValue: mockUrlFetcherService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: 'IRequestsRepository',
                    useValue: mockRequestsRepository,
                },
            ],
        }).compile();

        controller = module.get<UrlFetcherController>(UrlFetcherController);
        service = module.get<UrlFetcherService>(UrlFetcherService);

        jest.clearAllMocks();
    });

    describe('POST /api/v1/requests', () => {
        it('should create fetch request successfully', async () => {
            const dto: FetchUrlsDto = {
                urls: ['http://example.com', 'http://google.com'],
            };

            const mockResponse: FetchUrlsResponse = {
                requestId: 'test-id-123',
                results: dto.urls.map((url) => ({
                    url,
                    status: 200,
                    content: 'Content',
                    contentType: 'text/html',
                    contentLength: 100,
                    fetchTime: 150,
                    redirectCount: 0,
                    timestamp: new Date(),
                })),
                totalUrls: 2,
                successfulFetches: 2,
                failedFetches: 0,
                totalFetchTime: 300,
                timestamp: new Date(),
            };

            mockUrlFetcherService.fetchUrls.mockResolvedValue(mockResponse);

            const result = await controller.createFetchRequest(dto);

            expect(result.requestId).toBe('test-id-123');
            expect(result.totalUrls).toBe(2);
            expect(service.fetchUrls).toHaveBeenCalledWith(dto.urls);
        });

        it('should reject empty URLs array', async () => {
            const dto: FetchUrlsDto = { urls: [] };

            await expect(controller.createFetchRequest(dto)).rejects.toThrow('URLs array cannot be empty');
        });

        it('should reject too many URLs', async () => {
            const dto: FetchUrlsDto = {
                urls: Array(51).fill('http://example.com'),
            };

            await expect(controller.createFetchRequest(dto)).rejects.toThrow('Maximum 50 URLs allowed');
        });

        it('should reject duplicate URLs', async () => {
            const dto: FetchUrlsDto = {
                urls: ['http://example.com', 'http://google.com', 'http://example.com'],
            };

            await expect(controller.createFetchRequest(dto)).rejects.toThrow(/Duplicate URL found at index 2/);
        });

        it('should reject invalid URLs', async () => {
            const dto: FetchUrlsDto = {
                urls: ['http://example.com', 'not-a-valid-url'],
            };

            await expect(controller.createFetchRequest(dto)).rejects.toThrow(/Invalid URL at index 1/);
        });

        it('should handle service errors', async () => {
            const dto: FetchUrlsDto = {
                urls: ['http://example.com'],
            };

            mockUrlFetcherService.fetchUrls.mockRejectedValue(new Error('Service error'));

            await expect(controller.createFetchRequest(dto)).rejects.toThrow(
                'Internal server error while fetching URLs'
            );
        });
    });

    describe('GET /api/v1/requests/:id', () => {
        it('should return stored fetch result', async () => {
            const dto: FetchUrlsDto = {
                urls: ['http://example.com'],
            };

            const mockResponse: FetchUrlsResponse = {
                requestId: 'stored-id',
                results: [],
                totalUrls: 1,
                successfulFetches: 1,
                failedFetches: 0,
                totalFetchTime: 150,
                timestamp: new Date(),
            };

            mockUrlFetcherService.fetchUrls.mockResolvedValue(mockResponse);

            const storedRequest = {
                id: 'stored-id',
                urls: dto.urls,
                result: mockResponse,
                createdAt: new Date(),
                status: 'completed' as const,
            };

            mockRequestsRepository.findById.mockResolvedValue(storedRequest);

            const result = await controller.getRequestById('stored-id');

            expect(result.id).toBe('stored-id');
            expect(result.result).toEqual(mockResponse);
        });

        it('should throw 404 for non-existent request ID', async () => {
            mockRequestsRepository.findById.mockResolvedValue(null);

            try {
                await controller.getRequestById('non-existent-id');
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeInstanceOf(HttpException);
                expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
            }
        });
    });

    describe('GET /api/v1/requests', () => {
        it('should return all stored fetch results', async () => {
            const storedRequests = [
                {
                    id: 'id-1',
                    urls: ['http://example1.com'],
                    result: {
                        requestId: 'id-1',
                        results: [],
                        totalUrls: 1,
                        successfulFetches: 1,
                        failedFetches: 0,
                        totalFetchTime: 150,
                        timestamp: new Date(),
                    },
                    createdAt: new Date(),
                    status: 'completed' as const,
                },
                {
                    id: 'id-2',
                    urls: ['http://example2.com'],
                    result: {
                        requestId: 'id-2',
                        results: [],
                        totalUrls: 1,
                        successfulFetches: 1,
                        failedFetches: 0,
                        totalFetchTime: 150,
                        timestamp: new Date(),
                    },
                    createdAt: new Date(),
                    status: 'completed' as const,
                },
            ];

            mockRequestsRepository.findAll.mockResolvedValue(storedRequests);

            const result = await controller.getAllRequests();

            expect(result).toHaveLength(2);
            expect(result.map((r) => r.id)).toContain('id-1');
            expect(result.map((r) => r.id)).toContain('id-2');
        });

        it('should return empty array when no requests exist', async () => {
            mockRequestsRepository.findAll.mockResolvedValue([]);

            const result = await controller.getAllRequests();

            expect(result).toEqual([]);
        });
    });
});
