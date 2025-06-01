/**
 * Security Headers Testing and Validation Utility
 * Tests the presence and correctness of security headers
 */

export interface SecurityHeaderCheck {
  header: string;
  present: boolean;
  value?: string;
  expected?: string;
  status: 'pass' | 'fail' | 'warning';
  description: string;
}

export interface SecurityReport {
  url: string;
  timestamp: string;
  overallScore: number;
  checks: SecurityHeaderCheck[];
  recommendations: string[];
}

/**
 * Expected security headers and their validation rules
 */
const SECURITY_HEADERS = {
  'content-security-policy': {
    required: true,
    description: 'Content Security Policy prevents XSS and injection attacks',
    validate: (value: string) => {
      const requiredDirectives = ['default-src', 'script-src', 'style-src', 'img-src'];
      return requiredDirectives.every(directive => value.includes(directive));
    },
  },
  'strict-transport-security': {
    required: true,
    description: 'HSTS enforces secure HTTPS connections',
    validate: (value: string) => {
      return (
        value.includes('max-age=') && parseInt(value.match(/max-age=(\d+)/)?.[1] || '0') >= 31536000
      );
    },
  },
  'x-frame-options': {
    required: true,
    description: 'Prevents clickjacking attacks',
    validate: (value: string) => ['DENY', 'SAMEORIGIN'].includes(value.toUpperCase()),
  },
  'x-content-type-options': {
    required: true,
    description: 'Prevents MIME type sniffing',
    validate: (value: string) => value.toLowerCase() === 'nosniff',
  },
  'referrer-policy': {
    required: true,
    description: 'Controls referrer information sent with requests',
    validate: (value: string) => {
      const validPolicies = [
        'no-referrer',
        'no-referrer-when-downgrade',
        'origin',
        'origin-when-cross-origin',
        'same-origin',
        'strict-origin',
        'strict-origin-when-cross-origin',
        'unsafe-url',
      ];
      return validPolicies.includes(value.toLowerCase());
    },
  },
  'permissions-policy': {
    required: true,
    description: 'Controls browser features and APIs',
    validate: (value: string) => value.length > 0,
  },
  'cross-origin-embedder-policy': {
    required: false,
    description: 'Controls cross-origin resource embedding',
    validate: (value: string) =>
      ['unsafe-none', 'require-corp', 'credentialless'].includes(value.toLowerCase()),
  },
  'cross-origin-opener-policy': {
    required: false,
    description: 'Controls cross-origin window interactions',
    validate: (value: string) =>
      ['unsafe-none', 'same-origin-allow-popups', 'same-origin'].includes(value.toLowerCase()),
  },
  'x-xss-protection': {
    required: false,
    description: 'Legacy XSS protection (modern browsers use CSP)',
    validate: (value: string) => value.startsWith('1'),
  },
};

/**
 * Test security headers for a given URL
 */
export async function testSecurityHeaders(url: string): Promise<SecurityReport> {
  const checks: SecurityHeaderCheck[] = [];
  const recommendations: string[] = [];

  try {
    const response = await fetch(url, { method: 'HEAD' });
    const headers = response.headers;

    // Check each security header
    for (const [headerName, config] of Object.entries(SECURITY_HEADERS)) {
      const headerValue = headers.get(headerName);
      const present = headerValue !== null;

      let status: 'pass' | 'fail' | 'warning' = 'fail';

      if (present && headerValue) {
        if (config.validate(headerValue)) {
          status = 'pass';
        } else {
          status = 'warning';
          recommendations.push(`${headerName}: Header present but value may need adjustment`);
        }
      } else if (config.required) {
        status = 'fail';
        recommendations.push(`${headerName}: Required header is missing`);
      } else {
        status = 'warning';
        recommendations.push(`${headerName}: Optional header not present`);
      }

      checks.push({
        header: headerName,
        present,
        value: headerValue || undefined,
        status,
        description: config.description,
      });
    }

    // Calculate overall score
    const totalChecks = checks.length;
    const passedChecks = checks.filter(check => check.status === 'pass').length;
    const overallScore = Math.round((passedChecks / totalChecks) * 100);

    return {
      url,
      timestamp: new Date().toISOString(),
      overallScore,
      checks,
      recommendations,
    };
  } catch (error) {
    throw new Error(
      `Failed to test security headers: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate a human-readable security report
 */
export function generateSecurityReport(report: SecurityReport): string {
  const { url, timestamp, overallScore, checks, recommendations } = report;

  let output = `Security Headers Report\n`;
  output += `======================\n`;
  output += `URL: ${url}\n`;
  output += `Timestamp: ${timestamp}\n`;
  output += `Overall Score: ${overallScore}%\n\n`;

  output += `Header Checks:\n`;
  output += `--------------\n`;

  for (const check of checks) {
    const status = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    output += `${status} ${check.header.toUpperCase()}\n`;
    output += `   Status: ${check.status.toUpperCase()}\n`;
    output += `   Present: ${check.present ? 'Yes' : 'No'}\n`;
    if (check.value) {
      output += `   Value: ${check.value}\n`;
    }
    output += `   Description: ${check.description}\n\n`;
  }

  if (recommendations.length > 0) {
    output += `Recommendations:\n`;
    output += `----------------\n`;
    for (const rec of recommendations) {
      output += `• ${rec}\n`;
    }
  }

  return output;
}

/**
 * Client-side security header checker (for development)
 */
export function checkClientSecurityHeaders(): SecurityHeaderCheck[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const checks: SecurityHeaderCheck[] = [];

  // Check if HTTPS is enforced
  checks.push({
    header: 'https-enforcement',
    present: window.location.protocol === 'https:',
    status: window.location.protocol === 'https:' ? 'pass' : 'fail',
    description: 'HTTPS protocol enforcement',
  });

  // Check if mixed content is blocked
  const hasMixedContent =
    document.querySelectorAll('img[src^="http:"], script[src^="http:"], link[href^="http:"]')
      .length > 0;
  checks.push({
    header: 'mixed-content',
    present: !hasMixedContent,
    status: !hasMixedContent ? 'pass' : 'warning',
    description: 'No mixed HTTP/HTTPS content detected',
  });

  return checks;
}

/**
 * Development helper to log security status
 */
export function logSecurityStatus(): void {
  if (process.env.NODE_ENV === 'development') {
    const clientChecks = checkClientSecurityHeaders();
    console.group('🛡️ Security Status');

    clientChecks.forEach(check => {
      const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${check.description}: ${check.status}`);
    });

    console.log('💡 Run security header tests on deployed URL for complete analysis');
    console.groupEnd();
  }
}
