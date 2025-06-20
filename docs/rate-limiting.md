# Rate Limiting

CineTrack implements rate limiting to prevent abuse and ensure fair usage of the platform.

## Overview

Rate limiting is applied to API endpoints to control the number of requests a client can make within a specific time window. The system tracks requests by user ID (for authenticated requests) or IP address (for anonymous requests).

## Rate Limit Configurations

### Authentication Endpoints
- **Limit**: 5 requests per minute
- **Applied to**: `/auth/callback`, `/auth/confirm`
- **Purpose**: Prevent brute force attacks and abuse of authentication flows

### API Endpoints
- **Limit**: 100 requests per minute
- **Applied to**: General API endpoints like `/api/reviews`
- **Purpose**: Prevent API abuse while allowing normal usage

### Content Browsing
- **Limit**: 1000 requests per minute
- **Applied to**: Content fetching endpoints
- **Purpose**: Allow heavy browsing while preventing automated scraping

### Moderation Actions
- **Limit**: 10 requests per 5 minutes
- **Applied to**: `/api/reports`, moderation endpoints
- **Purpose**: Prevent spam reporting and moderation abuse

## Implementation

### Using the Rate Limit Middleware

```typescript
import { withRateLimit, RateLimitConfigs } from '@/lib/rate-limit';

async function handleRequest(request: NextRequest) {
  // Your endpoint logic here
}

export const POST = withRateLimit(RateLimitConfigs.api)(handleRequest);
```

### Custom Rate Limit Configuration

```typescript
const customConfig = {
  limit: 50,
  window: 300, // 5 minutes
  message: 'Custom rate limit exceeded',
  identifier: (request) => `custom:${getCustomId(request)}`
};

export const POST = withRateLimit(customConfig)(handleRequest);
```

## Rate Limit Headers

All responses include rate limit information in headers:

- `X-RateLimit-Limit`: Maximum requests allowed per window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the window resets
- `Retry-After`: Seconds to wait before retrying (only on 429 responses)

## Error Responses

When rate limit is exceeded, the API returns:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 45
}
```

HTTP Status: `429 Too Many Requests`

## Client Identification

The system identifies clients using:

1. **User ID** (for authenticated requests): From authorization header or session
2. **IP Address** (fallback): From `x-forwarded-for`, `x-real-ip`, or direct IP

## Storage

In development, rate limit data is stored in memory. For production, consider:

- Redis for distributed rate limiting
- Database-backed storage for persistence
- CDN-level rate limiting for additional protection

## Monitoring

The system includes:

- Automatic cleanup of expired rate limit entries
- Configurable cleanup intervals
- Request tracking and logging

## Best Practices

### For API Consumers

1. Check rate limit headers in responses
2. Implement exponential backoff for retries
3. Respect the `Retry-After` header on 429 responses
4. Batch requests when possible

### For Developers

1. Choose appropriate rate limits for each endpoint
2. Consider user experience vs. security trade-offs
3. Monitor rate limit hit rates
4. Implement graceful degradation

## Configuration Reference

| Config | Limit | Window | Use Case |
|--------|-------|--------|----------|
| `auth` | 5 | 60s | Authentication flows |
| `api` | 100 | 60s | General API usage |
| `content` | 1000 | 60s | Content browsing |
| `moderation` | 10 | 300s | Moderation actions |

## Future Enhancements

- User-specific rate limits based on account tier
- Dynamic rate limiting based on system load
- Rate limit analytics and reporting
- Integration with external rate limiting services