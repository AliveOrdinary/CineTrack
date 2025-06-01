# CI/CD Pipeline Documentation

## Overview

This document describes the CI/CD pipeline setup for CineTrack, including automated testing, linting, building, and deployment workflows.

## Pipeline Components

### 1. Continuous Integration (CI)

**File:** `.github/workflows/ci.yml`

The CI pipeline runs on every pull request and push to `main` and `develop` branches. It includes:

#### Jobs:
- **Lint and Type Check**: ESLint, TypeScript type checking, Prettier formatting
- **Test**: Unit tests with coverage reporting
- **Build**: Application build verification
- **Security Scan**: npm audit and Trivy vulnerability scanning

#### Triggers:
- Pull requests to `main` or `develop`
- Direct pushes to `main` or `develop`

### 2. Deployment

**File:** `.github/workflows/deploy.yml`

Automated deployment to staging and production environments:

#### Staging Deployment:
- **Trigger**: Push to `develop` branch
- **Environment**: Staging Supabase project
- **URL**: Staging Vercel deployment

#### Production Deployment:
- **Trigger**: Push to `main` branch
- **Environment**: Production Supabase project
- **URL**: Production Vercel deployment
- **Additional**: Creates GitHub releases

### 3. Dependency Management

**Files:** 
- `.github/workflows/dependency-update.yml`
- `.github/dependabot.yml`

Automated dependency updates:
- **Schedule**: Weekly on Mondays at 9 AM UTC
- **Scope**: npm packages and GitHub Actions
- **Process**: Creates PRs with updated dependencies

## Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
STAGING_SUPABASE_URL=your_staging_supabase_url
STAGING_SUPABASE_ANON_KEY=your_staging_supabase_anon_key
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key
NEXT_PUBLIC_TMDB_API_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
STAGING_SENTRY_DSN=your_staging_sentry_dsn
```

### Deployment Secrets
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
GITHUB_TOKEN=automatically_provided_by_github
```

## Local Development Scripts

### Available Commands

```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run start              # Start production server

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues
npm run type-check         # TypeScript type checking
npm run format             # Format code with Prettier
npm run format:check       # Check Prettier formatting

# Testing
npm run test               # Run tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage
npm run test:ci            # Run tests for CI

# CI Commands
npm run ci:lint            # Lint and type check
npm run ci:test            # Run tests for CI
npm run ci:build           # Build application
npm run ci:all             # Run all CI checks
```

## Configuration Files

### ESLint (`.eslintrc.json`)
- Extends Next.js and TypeScript configurations
- Custom rules for code quality
- Supports both browser and Node.js environments

### Jest (`jest.config.js`, `jest.setup.js`)
- Configured for Next.js with TypeScript
- React Testing Library integration
- Coverage thresholds set to 70%
- Mocks for Next.js router and navigation

### Prettier (`.prettierrc`, `.prettierignore`)
- Consistent code formatting
- Single quotes, semicolons, 100 character line width
- Excludes build files and dependencies

## Branch Strategy

### Main Branches
- **`main`**: Production-ready code, deploys to production
- **`develop`**: Integration branch, deploys to staging

### Feature Workflow
1. Create feature branch from `develop`
2. Make changes and commit
3. Push branch and create PR to `develop`
4. CI pipeline runs automatically
5. After review and approval, merge to `develop`
6. Staging deployment happens automatically
7. When ready for production, create PR from `develop` to `main`

## Environment Setup

### GitHub Repository Setup
1. Enable GitHub Actions in repository settings
2. Configure branch protection rules for `main` and `develop`
3. Add required secrets in repository settings
4. Set up environments for staging and production

### Vercel Setup
1. Connect GitHub repository to Vercel
2. Configure environment variables for each environment
3. Set up custom domains if needed
4. Configure build and deployment settings

### Supabase Setup
1. Create separate projects for staging and production
2. Configure database schemas and RLS policies
3. Set up environment variables
4. Configure CORS settings for your domains

## Monitoring and Alerts

### Coverage Reports
- Uploaded to Codecov automatically
- Visible in PR comments
- Tracks coverage trends over time

### Security Scanning
- npm audit for known vulnerabilities
- Trivy for container and filesystem scanning
- Results uploaded to GitHub Security tab

### Deployment Notifications
- PR comments with staging URLs
- GitHub releases for production deployments
- Slack/Discord integration (optional)

## Troubleshooting

### Common Issues

#### Build Failures
- Check environment variables are set correctly
- Verify all dependencies are installed
- Review TypeScript errors in build logs

#### Test Failures
- Run tests locally first: `npm run test`
- Check for missing mocks or setup issues
- Review test coverage requirements

#### Deployment Issues
- Verify Vercel token and project settings
- Check environment-specific variables
- Review deployment logs in Vercel dashboard

#### Dependency Updates
- Review breaking changes in updated packages
- Update code to match new API changes
- Test thoroughly before merging

## Best Practices

### Code Quality
- Write tests for new features
- Maintain high test coverage (>70%)
- Follow ESLint and Prettier rules
- Use TypeScript strictly

### Security
- Keep dependencies updated
- Review security scan results
- Use environment variables for secrets
- Enable branch protection rules

### Performance
- Monitor build times
- Optimize bundle size
- Use Next.js performance features
- Monitor Core Web Vitals

## Future Enhancements

### Planned Improvements
- E2E testing with Cypress (TASK-033)
- Performance monitoring integration
- Advanced security scanning
- Multi-environment testing
- Automated rollback capabilities

### Integration Opportunities
- Slack/Discord notifications
- Jira/Linear issue tracking
- Advanced monitoring (DataDog, New Relic)
- Code quality gates (SonarQube) 