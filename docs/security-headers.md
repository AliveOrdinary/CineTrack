# Security Headers Documentation

## Overview

CineTrack implements comprehensive security headers to protect against common web vulnerabilities including XSS, clickjacking, MIME type sniffing, and other security threats.

## Implemented Security Headers

### 1. Content Security Policy (CSP)
**Purpose**: Prevents Cross-Site Scripting (XSS) and injection attacks

**Configuration**:
```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: blob: https://image.tmdb.org https://www.themoviedb.org https://vercel.com;
media-src 'self' https://image.tmdb.org;
connect-src 'self' https://api.themoviedb.org https://*.supabase.co wss://*.supabase.co https://vercel.live https://vitals.vercel-insights.com https://o4507902068293632.ingest.us.sentry.io;
frame-src 'self' https://www.youtube.com https://player.vimeo.com;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

**Explanation**:
- `default-src 'self'`: Only allow resources from same origin by default
- `script-src`: Allow scripts from self, Vercel analytics, and inline scripts (required for Next.js)
- `style-src`: Allow styles from self, inline styles, and Google Fonts
- `img-src`: Allow images from self, data URLs, TMDB, and Vercel
- `connect-src`: Allow connections to APIs (TMDB, Supabase, Sentry)
- `frame-src`: Allow embedding YouTube and Vimeo videos
- `object-src 'none'`: Block all plugins
- `upgrade-insecure-requests`: Automatically upgrade HTTP to HTTPS

### 2. HTTP Strict Transport Security (HSTS)
**Purpose**: Enforces secure HTTPS connections

**Configuration**: `max-age=31536000; includeSubDomains; preload`

**Explanation**:
- `max-age=31536000`: Cache for 1 year (365 days)
- `includeSubDomains`: Apply to all subdomains
- `preload`: Eligible for browser preload lists

### 3. X-Frame-Options
**Purpose**: Prevents clickjacking attacks

**Configuration**: `DENY`

**Explanation**: Completely prevents the page from being embedded in frames

### 4. X-Content-Type-Options
**Purpose**: Prevents MIME type sniffing

**Configuration**: `nosniff`

**Explanation**: Forces browsers to respect declared content types

### 5. Referrer-Policy
**Purpose**: Controls referrer information sent with requests

**Configuration**: `strict-origin-when-cross-origin`

**Explanation**: Sends full URL for same-origin, only origin for cross-origin HTTPS, nothing for HTTP

### 6. Permissions-Policy
**Purpose**: Controls browser features and APIs

**Configuration**: `camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()`

**Explanation**: Disables potentially sensitive browser APIs

### 7. Cross-Origin Policies

#### Cross-Origin-Embedder-Policy
**Configuration**: `credentialless`
**Purpose**: Controls cross-origin resource embedding

#### Cross-Origin-Opener-Policy
**Configuration**: `same-origin`
**Purpose**: Controls cross-origin window interactions

#### Cross-Origin-Resource-Policy
**Configuration**: `cross-origin`
**Purpose**: Controls cross-origin resource sharing

### 8. X-XSS-Protection (Legacy)
**Purpose**: Legacy XSS protection for older browsers

**Configuration**: `1; mode=block`

**Note**: Modern browsers rely on CSP, but this provides fallback protection

## Security Testing

### Automated Testing
The application includes a security header testing utility at `lib/security-headers.ts` that can:

1. Test deployed URLs for header presence and correctness
2. Generate security reports
3. Provide recommendations for improvements
4. Log security status in development mode

### Manual Testing Tools

#### Online Tools
- [Security Headers](https://securityheaders.com/) - Comprehensive header analysis
- [Mozilla Observatory](https://observatory.mozilla.org/) - Security assessment
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - CSP policy analysis

#### Browser DevTools
1. Open DevTools → Network tab
2. Reload page and check response headers
3. Look for security headers in the response

#### Command Line Testing
```bash
# Test security headers with curl
curl -I https://your-domain.com

# Test specific header
curl -I https://your-domain.com | grep -i "content-security-policy"
```

## Development Guidelines

### Adding New External Resources

When adding new external resources, update the CSP policy:

1. **Scripts**: Add to `script-src` directive
2. **Styles**: Add to `style-src` directive  
3. **Images**: Add to `img-src` directive
4. **APIs**: Add to `connect-src` directive
5. **Fonts**: Add to `font-src` directive

### CSP Violation Reporting

To enable CSP violation reporting, add a `report-uri` directive:

```javascript
"report-uri https://your-domain.com/api/csp-report"
```

### Testing Changes

1. **Local Testing**: Security logger runs automatically in development
2. **Staging Testing**: Use security testing utility on staging URL
3. **Production Testing**: Verify headers on production deployment

## Security Considerations

### Trade-offs Made

1. **`unsafe-inline` for styles**: Required for Tailwind CSS and component libraries
2. **`unsafe-eval` for scripts**: Required for Next.js development and some build optimizations
3. **Multiple external domains**: Required for TMDB images and Supabase services

### Future Improvements

1. **Nonce-based CSP**: Replace `unsafe-inline` with nonces for better security
2. **Subresource Integrity**: Add SRI hashes for external resources
3. **Certificate Transparency**: Monitor certificate transparency logs
4. **Security.txt**: Add security.txt file for vulnerability disclosure

## Compliance

### Standards Compliance
- **OWASP**: Follows OWASP security header recommendations
- **Mozilla**: Implements Mozilla's web security guidelines
- **W3C**: Compliant with W3C security specifications

### Security Ratings
Target security ratings:
- Security Headers: A+
- Mozilla Observatory: A+
- SSL Labs: A+

## Monitoring

### Production Monitoring
- Monitor CSP violation reports
- Track security header compliance
- Alert on security misconfigurations

### Development Monitoring
- Automatic security status logging
- CI/CD security header validation
- Pre-deployment security checks

## Incident Response

### CSP Violations
1. Review violation reports
2. Determine if legitimate or attack
3. Update CSP policy if needed
4. Monitor for recurring violations

### Security Header Issues
1. Verify header presence and values
2. Check for configuration drift
3. Update Next.js configuration
4. Redeploy and verify fixes

## Resources

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security)
- [Content Security Policy Reference](https://content-security-policy.com/)
- [Security Headers Best Practices](https://securityheaders.com/) 