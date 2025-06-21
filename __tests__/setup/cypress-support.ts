/**
 * Cypress Support File
 * Sets up global configurations and custom commands for E2E tests
 */

import './commands';

// Import Cypress accessibility testing plugin
import 'cypress-axe';

// Global configuration
Cypress.config('baseUrl', 'http://localhost:3000');

// Prevent Cypress from failing on uncaught exceptions that might occur in the app
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent the error from failing the test
  // This is useful for handling third-party errors or expected errors
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false;
  }
  return true;
});

// Custom commands for better test readability
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with test credentials
       */
      loginAsTestUser(): Chainable<void>;
      
      /**
       * Custom command to clear test data
       */
      clearTestData(): Chainable<void>;
      
      /**
       * Custom command to seed test data
       */
      seedTestData(): Chainable<void>;
      
      /**
       * Custom command to mock TMDB API responses
       */
      mockTMDBApi(endpoint: string, response: any): Chainable<void>;
      
      /**
       * Custom command to mock Supabase API responses
       */
      mockSupabaseQuery(table: string, response: any): Chainable<void>;
      
      /**
       * Custom command to wait for element to be stable
       */
      waitForStableElement(selector: string, timeout?: number): Chainable<JQuery<HTMLElement>>;
      
      /**
       * Custom command to check accessibility
       */
      checkA11y(context?: string): Chainable<void>;
      
      /**
       * Custom command to take screenshot with consistent naming
       */
      takeScreenshot(name: string): Chainable<void>;
    }
  }
}

// Setup hooks for all tests
beforeEach(() => {
  // Clear any existing authentication state
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.clearSessionStorage();
  
  // Inject axe for accessibility testing
  cy.injectAxe();
});

// Global after hook for cleanup
afterEach(() => {
  // Any global cleanup can go here
});

export {};