/**
 * Custom Cypress Commands
 * Defines reusable commands for E2E tests
 */

import { E2E_CONFIG } from './e2e-setup';

// Custom command to login as test user
Cypress.Commands.add('loginAsTestUser', () => {
  cy.visit('/login');
  cy.get(E2E_CONFIG.selectors.auth.emailInput)
    .should('be.visible')
    .type(E2E_CONFIG.testUser.email);
  cy.get(E2E_CONFIG.selectors.auth.passwordInput)
    .should('be.visible')
    .type(E2E_CONFIG.testUser.password);
  cy.get(E2E_CONFIG.selectors.auth.submitButton)
    .should('be.visible')
    .click();
  
  // Wait for successful login (should not be on login page anymore)
  cy.url().should('not.include', '/login');
  cy.get('[data-testid="user-menu"]', { timeout: 10000 }).should('be.visible');
});

// Custom command to clear test data
Cypress.Commands.add('clearTestData', () => {
  cy.task('clearDatabase').then(() => {
    cy.log('Test data cleared');
  });
});

// Custom command to seed test data
Cypress.Commands.add('seedTestData', () => {
  cy.task('seedDatabase').then(() => {
    cy.log('Test data seeded');
  });
});

// Custom command to mock TMDB API
Cypress.Commands.add('mockTMDBApi', (endpoint: string, response: any) => {
  cy.intercept('GET', `**/api.themoviedb.org/3/${endpoint}**`, {
    statusCode: 200,
    body: response
  }).as(`tmdb_${endpoint.replace(/\//g, '_')}`);
});

// Custom command to mock Supabase queries
Cypress.Commands.add('mockSupabaseQuery', (table: string, response: any) => {
  cy.intercept('GET', `**/rest/v1/${table}**`, {
    statusCode: 200,
    body: response
  }).as(`supabase_${table}`);
});

// Custom command to wait for stable element
Cypress.Commands.add('waitForStableElement', (selector: string, timeout = 10000) => {
  return cy.get(selector, { timeout })
    .should('be.visible')
    .should('not.be.disabled')
    .should('not.have.class', 'loading');
});

// Custom command for accessibility testing
Cypress.Commands.add('checkA11y', (context?: string) => {
  const options = {
    rules: {
      'color-contrast': { enabled: true },
      'focus-management': { enabled: true },
      'keyboard-navigation': { enabled: true }
    }
  };
  
  if (context) {
    cy.checkA11y(context, options);
  } else {
    cy.checkA11y(options);
  }
});

// Custom command for consistent screenshots
Cypress.Commands.add('takeScreenshot', (name: string) => {
  cy.screenshot(name, {
    capture: 'viewport',
    blackout: [
      '[data-testid="loading-indicator"]',
      '.timestamp',
      '.loading-spinner'
    ]
  });
});

export {};