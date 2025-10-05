import {
    hasUrls,
    isWithinUrlLimit,
    hasUniqueUrls,
    isValidUrl,
    areAllUrlsValid,
    findFirstInvalidUrlIndex,
    findFirstDuplicateUrlIndex
} from './url.validator';

describe('URL Validator', () => {
    describe('hasUrls', () => {
        it('should validate non-empty arrays', () => {
            expect(hasUrls(['http://example.com'])).toBe(true);
            expect(hasUrls([])).toBe(false);
            expect(hasUrls(null as any)).toBeFalsy();
        });
    });

    describe('isWithinUrlLimit', () => {
        it('should enforce URL limits', () => {
            expect(isWithinUrlLimit(Array(50).fill('http://example.com'))).toBe(true);
            expect(isWithinUrlLimit(Array(51).fill('http://example.com'))).toBe(false);
        });
    });

    describe('hasUniqueUrls', () => {
        it('should detect duplicate URLs', () => {
            expect(hasUniqueUrls(['http://example.com', 'http://google.com'])).toBe(true);
            expect(hasUniqueUrls(['http://example.com', 'http://example.com'])).toBe(false);
        });
    });

    describe('isValidUrl', () => {
        it('should validate URL formats', () => {
            expect(isValidUrl('http://example.com')).toBe(true);
            expect(isValidUrl('https://example.com:8080/path?query=value')).toBe(true);
            expect(isValidUrl('http://localhost:3000')).toBe(true);
            expect(isValidUrl('example.com')).toBe(false);
            expect(isValidUrl('not a url')).toBe(false);
        });
    });

    describe('areAllUrlsValid', () => {
        it('should validate all URLs in array', () => {
            expect(areAllUrlsValid(['http://example.com', 'https://google.com'])).toBe(true);
            expect(areAllUrlsValid(['http://example.com', 'invalid-url'])).toBe(false);
        });
    });

    describe('findFirstInvalidUrlIndex', () => {
        it('should find index of first invalid URL', () => {
            expect(findFirstInvalidUrlIndex(['http://example.com', 'invalid', 'https://google.com'])).toBe(1);
            expect(findFirstInvalidUrlIndex(['http://example.com', 'https://google.com'])).toBe(-1);
        });
    });

    describe('findFirstDuplicateUrlIndex', () => {
        it('should find index of first duplicate URL', () => {
            expect(findFirstDuplicateUrlIndex(['http://example.com', 'http://google.com', 'http://example.com'])).toBe(2);
            expect(findFirstDuplicateUrlIndex(['http://example.com', 'http://google.com'])).toBe(-1);
        });
    });
});
