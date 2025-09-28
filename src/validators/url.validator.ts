/**
 * URL validation utility functions
 * Each function returns a boolean indicating whether the validation passes
 */

/**
 * Checks if the URLs array is not empty
 * @param urls - Array of URLs to validate
 * @returns true if the array has at least one URL, false otherwise
 */
export function hasUrls(urls: string[]): boolean {
    return urls && urls.length > 0;
}

/**
 * Checks if the number of URLs is within the allowed limit
 * @param urls - Array of URLs to validate
 * @param maxUrls - Maximum number of URLs allowed (default: 50)
 * @returns true if the number of URLs is within the limit, false otherwise
 */
export function isWithinUrlLimit(urls: string[], maxUrls: number = 50): boolean {
    return urls.length <= maxUrls;
}

/**
 * Checks if all URLs in the array are unique (no duplicates)
 * @param urls - Array of URLs to validate
 * @returns true if all URLs are unique, false if there are duplicates
 */
export function hasUniqueUrls(urls: string[]): boolean {
    return new Set(urls).size === urls.length;
}

/**
 * Checks if a single URL is valid
 * @param url - URL string to validate
 * @returns true if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Checks if all URLs in the array are valid
 * @param urls - Array of URLs to validate
 * @returns true if all URLs are valid, false if any URL is invalid
 */
export function areAllUrlsValid(urls: string[]): boolean {
    return urls.every(url => isValidUrl(url));
}

/**
 * Finds the first invalid URL in the array
 * @param urls - Array of URLs to validate
 * @returns the index of the first invalid URL, or -1 if all URLs are valid
 */
export function findFirstInvalidUrlIndex(urls: string[]): number {
    return urls.findIndex(url => !isValidUrl(url));
}

/**
 * Finds the first duplicate URL in the array
 * @param urls - Array of URLs to validate
 * @returns the index of the first duplicate URL, or -1 if all URLs are unique
 */
export function findFirstDuplicateUrlIndex(urls: string[]): number {
    const seen = new Set<string>();
    for (let i = 0; i < urls.length; i++) {
        if (seen.has(urls[i])) {
            return i;
        }
        seen.add(urls[i]);
    }
    return -1;
}
