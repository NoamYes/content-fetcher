export interface UrlFetchResult {
    url: string;
    status: number;
    content: string;
    contentType: string;
    contentLength: number;
    fetchTime: number;
    redirectCount: number;
    finalUrl?: string;
    error?: string;
    timestamp: Date;
}

export interface FetchUrlsResponse {
    requestId: string;
    results: UrlFetchResult[];
    totalUrls: number;
    successfulFetches: number;
    failedFetches: number;
    totalFetchTime: number;
    timestamp: Date;
}

export interface StoredFetchRequest {
    id: string;
    urls: string[];
    result: FetchUrlsResponse;
    createdAt: Date;
    status: 'pending' | 'completed' | 'failed';
}
