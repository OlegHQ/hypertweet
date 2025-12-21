# HyperTweet Server

F# web API backend for the HyperTweet browser extension.

## Prerequisites

- .NET 8.0 SDK
- MongoDB (local or remote)

## Quick Start

```bash
# Run the server (development)
dotnet run

# Build only
dotnet build

# Build for production
dotnet build --configuration Release
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `JWT_SECRET` | `super-secret-key-change-in-production` | JWT signing secret |

## Example with custom config

```bash
MONGODB_URI="mongodb://user:pass@host:27017" JWT_SECRET="my-secret" dotnet run
```

## API Endpoints

The server runs on `http://localhost:5000` by default.

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /tones` - List user tones (requires auth)
- `POST /tones` - Create tone (requires auth)
