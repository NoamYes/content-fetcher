import { StoredFetchRequest } from '../interfaces/url-fetch-result.interface';

/**
 * Repository interface for managing fetch requests
 * Follows the Repository pattern for data access abstraction
 * 
 * This interface can be implemented by:
 * - In-memory storage (for development/testing)
 * - File-based storage (for small-scale persistence)
 * - Database storage (for production)
 * - Redis/Cache storage (for distributed systems)
 */
export interface IRequestsRepository {
    /**
     * Save a fetch request
     */
    save(request: StoredFetchRequest): Promise<void>;

    /**
     * Find a fetch request by its ID
     */
    findById(id: string): Promise<StoredFetchRequest | null>;

    /**
     * Find all fetch requests
     */
    findAll(): Promise<StoredFetchRequest[]>;

    /**
     * Delete a fetch request by its ID
     */
    delete(id: string): Promise<void>;

    /**
     * Clear all fetch requests
     */
    clear(): Promise<void>;

    /**
     * Check if a request exists by ID
     */
    exists(id: string): Promise<boolean>;
}

