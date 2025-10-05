import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UrlFetcherController } from './url-fetcher.controller';
import { UrlFetcherService } from '../services/url-fetcher.service';
import { ConfigModule } from '@nestjs/config';

describe('URL Fetcher E2E', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule.forRoot()],
            controllers: [UrlFetcherController],
            providers: [UrlFetcherService],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should create a fetch request and retrieve it by ID', async () => {
        // Create fetch request
        const response = await request(app.getHttpServer())
            .post('/api/v1/requests')
            .send({ urls: ['https://www.google.com', 'https://www.github.com'] })
            .expect(HttpStatus.CREATED);

        expect(response.body.requestId).toBeDefined();
        expect(response.body.totalUrls).toBe(2);
        expect(response.body.results).toHaveLength(2);

        const requestId = response.body.requestId;

        // Retrieve by ID
        const getResponse = await request(app.getHttpServer())
            .get(`/api/v1/requests/${requestId}`)
            .expect(HttpStatus.OK);

        expect(getResponse.body.id).toBe(requestId);
        expect(getResponse.body.result.totalUrls).toBe(2);
    });

    it('should accumulate multiple fetch requests', async () => {
        // First request
        const response1 = await request(app.getHttpServer())
            .post('/api/v1/requests')
            .send({ urls: ['https://www.example.com'] })
            .expect(HttpStatus.CREATED);

        // Second request
        const response2 = await request(app.getHttpServer())
            .post('/api/v1/requests')
            .send({ urls: ['https://www.npmjs.com'] })
            .expect(HttpStatus.CREATED);

        // Get all requests
        const allResponse = await request(app.getHttpServer())
            .get('/api/v1/requests')
            .expect(HttpStatus.OK);

        // Should have at least our 2 requests (may have more from other tests)
        expect(allResponse.body.length).toBeGreaterThanOrEqual(2);
        
        // But should definitely contain our two request IDs
        const requestIds = allResponse.body.map((r: any) => r.id);
        expect(requestIds).toContain(response1.body.requestId);
        expect(requestIds).toContain(response2.body.requestId);
    });

    it('should return 404 for non-existent request ID', async () => {
        const response = await request(app.getHttpServer())
            .get('/api/v1/requests/non-existent-id-12345')
            .expect(HttpStatus.NOT_FOUND);

        expect(response.body.message).toContain('Request not found');
    });

    it('should reject empty URLs array with appropriate error', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/v1/requests')
            .send({ urls: [] })
            .expect(HttpStatus.BAD_REQUEST);

        expect(response.body.message).toBe('URLs array cannot be empty');
    });

    it('should reject duplicate URLs with index information', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/v1/requests')
            .send({
                urls: [
                    'https://www.example.com',
                    'https://www.google.com',
                    'https://www.example.com',
                ],
            })
            .expect(HttpStatus.BAD_REQUEST);

        expect(response.body.message).toContain('Duplicate URL found at index 2');
        expect(response.body.message).toContain('https://www.example.com');
    });

    it('should reject invalid URLs with index information', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/v1/requests')
            .send({
                urls: ['https://www.example.com', 'not-a-valid-url', 'https://www.google.com'],
            })
            .expect(HttpStatus.BAD_REQUEST);

        expect(response.body.message).toContain('Invalid URL at index 1');
        expect(response.body.message).toContain('not-a-valid-url');
    });

    it('should handle failed URLs gracefully and still return results', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/v1/requests')
            .send({
                urls: [
                    'https://www.google.com',
                    'https://thisdoesnotexist-xyz-123456789.com',
                ],
            })
            .expect(HttpStatus.CREATED);

        expect(response.body.totalUrls).toBe(2);
        expect(response.body.successfulFetches).toBeGreaterThanOrEqual(1);
        expect(response.body.results).toHaveLength(2);

        // At least one should succeed (google.com)
        const successfulResults = response.body.results.filter((r: any) => r.status === 200);
        expect(successfulResults.length).toBeGreaterThanOrEqual(1);

        // The non-existent domain should have an error
        const failedResults = response.body.results.filter((r: any) => r.error);
        expect(failedResults.length).toBeGreaterThanOrEqual(1);
    });
});

