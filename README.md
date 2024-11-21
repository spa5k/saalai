# Random User Data Service

A high-performance API service built with Bun and Hono for fetching, storing, and managing random user data with configurable batch processing and rate limiting.

## Features

- **Batch Processing**: Fetch and store user data in configurable batches
- **Rate Limiting**: Configurable rate limiting for external API requests
- **Background Processing**: Asynchronous batch processing with progress tracking
- **RESTful API**: Well-documented API with OpenAPI/Swagger support
- **Data Persistence**: MongoDB storage with proper indexing
- **Type Safety**: Full TypeScript support
- **API Versioning**: Proper API versioning with /api/v1 prefix
- **Validation**: Request/response validation using Zod
- **Documentation**: Interactive API documentation with Swagger UI

## Prerequisites

- [Bun](https://bun.sh) v1.1.36 or higher
- [MongoDB](https://www.mongodb.com/) v4.4 or higher
- [Docker](https://www.docker.com/) (optional)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

## Development

Start the development server with hot reloading:

```bash
bun run dev
```

Run tests:

```bash
bun test
```

## Docker Support

Build the Docker image:

```bash
make build
# or
docker compose build
```

Start services:

```bash
make up
# or
docker compose up -d
```

View logs:

```bash
make logs
# or
docker compose logs -f
```

Stop services:

```bash
make down
# or
docker compose down
```

Clean up:

```bash
make clean
# or
docker compose down -v
```

## API Documentation

Once the server is running, access the API documentation at:

- OpenAPI Specification: http://localhost:3000/api/v1/docs
- Swagger UI: http://localhost:3000/api/v1/ui

## API Endpoints

- `GET /api/v1/users` - Get paginated list of users
- `POST /api/v1/users/fetch` - Start user data fetch process
- `GET /api/v1/users/fetch/{progressId}` - Get batch progress status
- `PUT /api/v1/config/random-user` - Update API configuration

## Configuration

The service can be configured through the database or API:

- Rate limits
- Batch sizes
- Sleep times
- API endpoints
- Pagination settings

## Architecture

- **Hono**: Web framework with OpenAPI support
- **MongoDB**: Data persistence
- **Zod**: Schema validation
- **TypeScript**: Type safety
- **Bun**: Runtime environment
- **Docker**: Containerization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
