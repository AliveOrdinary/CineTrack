/**
 * E2E Test Setup Configuration
 * Sets up Cypress for end-to-end testing
 */

// This file would typically configure Cypress commands and custom assertions
// For now, we'll just export a basic configuration

export const E2E_CONFIG = {
  baseUrl: 'http://localhost:3000',
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 10000,
  requestTimeout: 10000,
  responseTimeout: 30000,
  
  // Test user credentials for E2E tests
  testUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
  },
  
  // Common selectors
  selectors: {
    navigation: {
      homeLink: '[data-testid="nav-home"]',
      searchLink: '[data-testid="nav-search"]',
      profileLink: '[data-testid="nav-profile"]',
      settingsLink: '[data-testid="nav-settings"]',
    },
    auth: {
      loginForm: '[data-testid="login-form"]',
      emailInput: '[data-testid="email-input"]',
      passwordInput: '[data-testid="password-input"]',
      submitButton: '[data-testid="submit-button"]',
      signupLink: '[data-testid="signup-link"]',
    },
    search: {
      searchBar: '[data-testid="search-bar"]',
      searchInput: '[data-testid="search-input"]',
      searchButton: '[data-testid="search-button"]',
      searchResults: '[data-testid="search-results"]',
    },
    content: {
      movieCard: '[data-testid="movie-card"]',
      tvCard: '[data-testid="tv-card"]',
      watchButton: '[data-testid="watch-button"]',
      watchlistButton: '[data-testid="watchlist-button"]',
      ratingInput: '[data-testid="rating-input"]',
    },
    lists: {
      createListButton: '[data-testid="create-list-button"]',
      listCard: '[data-testid="list-card"]',
      addToListButton: '[data-testid="add-to-list-button"]',
      listItems: '[data-testid="list-items"]',
    },
    social: {
      followButton: '[data-testid="follow-button"]',
      unfollowButton: '[data-testid="unfollow-button"]',
      activityFeed: '[data-testid="activity-feed"]',
      reviewButton: '[data-testid="review-button"]',
    }
  }
};

// Common test utilities
export const testUtils = {
  /**
   * Wait for element to be visible and stable
   */
  waitForStableElement: (selector: string, timeout = 10000) => {
    return cy.get(selector, { timeout }).should('be.visible').should('not.be.disabled');
  },

  /**
   * Login with test user credentials
   */
  loginAsTestUser: () => {
    cy.visit('/login');
    cy.get(E2E_CONFIG.selectors.auth.emailInput).type(E2E_CONFIG.testUser.email);
    cy.get(E2E_CONFIG.selectors.auth.passwordInput).type(E2E_CONFIG.testUser.password);
    cy.get(E2E_CONFIG.selectors.auth.submitButton).click();
    cy.url().should('not.include', '/login');
  },

  /**
   * Clear database state for clean test runs
   */
  clearTestData: () => {
    // This would call a custom Cypress command to clear test data
    // Implementation would depend on your database setup
    cy.task('clearDatabase');
  },

  /**
   * Seed database with test data
   */
  seedTestData: () => {
    // This would call a custom Cypress command to seed test data
    cy.task('seedDatabase');
  },

  /**
   * Wait for API call to complete
   */
  waitForApiCall: (endpoint: string, alias?: string) => {
    const aliasName = alias || endpoint.replace(/\//g, '_');
    cy.intercept('GET', `**/api/${endpoint}**`).as(aliasName);
    cy.wait(`@${aliasName}`);
  },

  /**
   * Take screenshot for visual regression testing
   */
  takeScreenshot: (name: string) => {
    cy.screenshot(name, {
      capture: 'viewport',
      blackout: ['.loading-indicator', '.timestamp']
    });
  }
};

// Custom Cypress commands (would be added to cypress/support/commands.ts)
export const customCommands = {
  /**
   * Custom command to interact with TMDB API mock
   */
  mockTMDBApi: (endpoint: string, response: any) => {
    cy.intercept('GET', `**/api.themoviedb.org/3/${endpoint}**`, response);
  },

  /**
   * Custom command to mock Supabase responses
   */
  mockSupabaseQuery: (table: string, response: any) => {
    cy.intercept('GET', `**/rest/v1/${table}**`, response);
  },

  /**
   * Custom command to check accessibility
   */
  checkA11y: (context?: string) => {
    cy.checkA11y(context, {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true }
      }
    });
  }
};

export default E2E_CONFIG;