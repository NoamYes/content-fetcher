# URL Fetcher Service

A robust NestJS-based HTTP service that fetches content from multiple URLs and provides a REST API for submitting URLs and retrieving fetch results.

## 🚀 Features

- **Bulk URL Fetching**: Submit multiple URLs in a single request (up to 50 URLs)
- **Redirect Handling**: Automatically follows redirects up to 5 levels deep
- **Comprehensive Error Handling**: Detailed error messages for various failure scenarios
- **Content Management**: Automatic content truncation for large responses (10MB limit)
- **Performance Optimized**: Parallel processing of URLs for faster execution
- **Health Monitoring**: Built-in health check endpoint
- **Production Ready**: Built with NestJS best practices and robust error handling

## 📋 Requirements

- Node.js (v16 or higher)
- npm or yarn
- Internet connection for fetching external URLs

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd guardz-assignment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the application**
   ```bash
   npm run build
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run start:prod
```

### Debug Mode
```bash
npm run start:debug
```

The service will start on `http://localhost:3000` by default.

## 📡 API Endpoints

### 1. Health Check
```bash
GET /health
```
Returns the service health status and basic information.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.456,
  "service": "URL Fetcher Service",
  "version": "1.0.0"
}
```

### 2. Fetch URLs
```bash
POST /api/fetch
Content-Type: application/json
```

Submit URLs to be fetched.

**Request Body:**
```json
{
  "urls": [
    "https://example.com",
    "https://httpbin.org/get",
    "https://jsonplaceholder.typicode.com/posts/1"
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "url": "https://example.com",
      "status": 200,
      "content": "<html>...</html>",
      "contentType": "text/html",
      "contentLength": 1256,
      "fetchTime": 150,
      "redirectCount": 0,
      "finalUrl": "https://www.example.com",
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ],
  "totalUrls": 3,
  "successfulFetches": 2,
  "failedFetches": 1,
  "totalFetchTime": 500,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 3. Get Last Fetch Results
```bash
GET /api/fetch
```

Retrieve the results from the last URL fetch operation.

**Response:**
```json
{
  "results": [...],
  "totalUrls": 3,
  "successfulFetches": 2,
  "failedFetches": 1,
  "totalFetchTime": 500,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

If no URLs have been fetched yet:
```json
{
  "message": "No URLs have been fetched yet. Please submit URLs using POST /api/fetch"
}
```

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:cov
```

### Run End-to-End Tests
```bash
npm run test:e2e
```

### Run All Tests in Watch Mode
```bash
npm run test:watch
```

## 📝 Usage Examples

### Using curl

1. **Submit URLs for fetching:**
   ```bash
   curl -X POST -H "Content-Type: application/json" \
        -d '{"urls": ["https://httpbin.org/get", "https://jsonplaceholder.typicode.com/posts/1"]}' \
        http://localhost:3000/api/fetch
   ```

2. **Get the results:**
   ```bash
   curl http://localhost:3000/api/fetch
   ```

3. **Check service health:**
   ```bash
   curl http://localhost:3000/health
   ```

### Using JavaScript/Node.js

```javascript
const axios = require('axios');

// Submit URLs for fetching
const response = await axios.post('http://localhost:3000/api/fetch', {
  urls: [
    'https://httpbin.org/get',
    'https://jsonplaceholder.typicode.com/posts/1'
  ]
});

console.log('Fetch results:', response.data);

// Get results later
const results = await axios.get('http://localhost:3000/api/fetch');
console.log('Last fetch results:', results.data);
```

## ⚙️ Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)

### Service Configuration

The service has the following built-in limits and settings:

- **Maximum URLs per request**: 50
- **Maximum redirects**: 5 levels
- **Request timeout**: 10 seconds
- **Maximum content length**: 10MB
- **Content truncation**: 100KB (with truncation notice)

## 🔧 Error Handling

The service handles various error scenarios:

- **Invalid URLs**: Returns 400 Bad Request with specific error message
- **Network errors**: Captures and reports connection issues
- **Timeouts**: Handles request timeouts gracefully
- **Redirect loops**: Prevents infinite redirects with configurable limit
- **Large content**: Automatically truncates oversized responses
- **Server errors**: Returns appropriate HTTP status codes

## 📊 Response Fields

Each URL fetch result contains:

- `url`: Original URL requested
- `status`: HTTP status code
- `content`: Response content (truncated if necessary)
- `contentType`: MIME type of the response
- `contentLength`: Size of the content in bytes
- `fetchTime`: Time taken to fetch the URL in milliseconds
- `redirectCount`: Number of redirects followed
- `finalUrl`: Final URL after all redirects
- `error`: Error message if fetch failed
- `timestamp`: When the fetch was completed

## 🏗️ Architecture

The service is built using:

- **NestJS**: Modern Node.js framework
- **Axios**: HTTP client for URL fetching
- **Class Validator**: Request validation
- **Jest**: Testing framework
- **TypeScript**: Type-safe development

### Project Structure

```
src/
├── controllers/          # API controllers
├── services/            # Business logic services
├── dto/                 # Data transfer objects
├── interfaces/          # TypeScript interfaces
├── app.module.ts        # Main application module
└── main.ts             # Application entry point
test/
└── app.e2e-spec.ts     # End-to-end tests
```

## 🚀 Deployment

### Using Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

### Production Considerations

1. **Environment Variables**: Set appropriate PORT and other configs
2. **Logging**: Configure proper logging for production
3. **Monitoring**: Add monitoring and alerting
4. **Rate Limiting**: Consider adding rate limiting for production use
5. **Security**: Review and enhance security measures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with detailed information
3. Include error messages, request examples, and environment details

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Basic URL fetching functionality
- Redirect handling
- Comprehensive error handling
- Full test coverage
- REST API endpoints
