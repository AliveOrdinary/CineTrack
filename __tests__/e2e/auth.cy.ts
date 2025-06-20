/**
 * E2E tests for authentication flow
 * These tests would run with Cypress
 */

import { E2E_CONFIG, testUtils } from '../setup/e2e-setup';

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear any existing auth state
    cy.clearCookies();
    cy.clearLocalStorage();
    testUtils.clearTestData();
  });

  describe('Login', () => {
    it('should allow user to login with valid credentials', () => {
      cy.visit('/login');
      
      // Check that login form is visible
      cy.get(E2E_CONFIG.selectors.auth.loginForm).should('be.visible');
      
      // Fill in credentials
      cy.get(E2E_CONFIG.selectors.auth.emailInput)
        .type(E2E_CONFIG.testUser.email)
        .should('have.value', E2E_CONFIG.testUser.email);
      
      cy.get(E2E_CONFIG.selectors.auth.passwordInput)
        .type(E2E_CONFIG.testUser.password)
        .should('have.value', E2E_CONFIG.testUser.password);
      
      // Submit form
      cy.get(E2E_CONFIG.selectors.auth.submitButton).click();
      
      // Should redirect to home page
      cy.url().should('eq', `${E2E_CONFIG.baseUrl}/`);
      
      // Should show user menu or profile indicator
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');
      
      cy.get(E2E_CONFIG.selectors.auth.emailInput).type('invalid@example.com');
      cy.get(E2E_CONFIG.selectors.auth.passwordInput).type('wrongpassword');
      cy.get(E2E_CONFIG.selectors.auth.submitButton).click();
      
      // Should show error message
      cy.get('[data-testid="error-message"]')
        .should('be.visible')
        .should('contain', 'Invalid credentials');
      
      // Should remain on login page
      cy.url().should('include', '/login');
    });

    it('should validate required fields', () => {
      cy.visit('/login');
      
      // Try to submit without filling fields
      cy.get(E2E_CONFIG.selectors.auth.submitButton).click();
      
      // Should show validation errors
      cy.get('[data-testid="email-error"]').should('be.visible');
      cy.get('[data-testid="password-error"]').should('be.visible');
    });

    it('should allow navigation to signup page', () => {
      cy.visit('/login');
      
      cy.get(E2E_CONFIG.selectors.auth.signupLink).click();
      cy.url().should('include', '/signup');
    });
  });

  describe('Signup', () => {
    it('should allow user to create new account', () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'NewPassword123!',
        displayName: 'New User'
      };

      cy.visit('/signup');
      
      cy.get('[data-testid="display-name-input"]').type(newUser.displayName);
      cy.get('[data-testid="email-input"]').type(newUser.email);
      cy.get('[data-testid="password-input"]').type(newUser.password);
      cy.get('[data-testid="confirm-password-input"]').type(newUser.password);
      
      cy.get('[data-testid="signup-button"]').click();
      
      // Should show success message or redirect to confirmation page
      cy.url().should('match', /(confirmation|success)/);
    });

    it('should validate password requirements', () => {
      cy.visit('/signup');
      
      cy.get('[data-testid="password-input"]').type('weak');
      cy.get('[data-testid="password-error"]')
        .should('be.visible')
        .should('contain', 'Password must be at least 8 characters');
    });

    it('should validate password confirmation', () => {
      cy.visit('/signup');
      
      cy.get('[data-testid="password-input"]').type('StrongPassword123!');
      cy.get('[data-testid="confirm-password-input"]').type('DifferentPassword123!');
      
      cy.get('[data-testid="confirm-password-error"]')
        .should('be.visible')
        .should('contain', 'Passwords do not match');
    });
  });

  describe('Password Reset', () => {
    it('should allow user to request password reset', () => {
      cy.visit('/reset-password');
      
      cy.get('[data-testid="email-input"]').type(E2E_CONFIG.testUser.email);
      cy.get('[data-testid="reset-button"]').click();
      
      cy.get('[data-testid="success-message"]')
        .should('be.visible')
        .should('contain', 'Reset link sent');
    });
  });

  describe('Logout', () => {
    it('should allow user to logout', () => {
      // First login
      testUtils.loginAsTestUser();
      
      // Then logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      // Should redirect to home and show login button
      cy.url().should('eq', `${E2E_CONFIG.baseUrl}/`);
      cy.get('[data-testid="login-button"]').should('be.visible');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users to login', () => {
      // Try to access protected route
      cy.visit('/profile');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });

    it('should allow authenticated users to access protected routes', () => {
      testUtils.loginAsTestUser();
      
      cy.visit('/profile');
      cy.url().should('include', '/profile');
      cy.get('[data-testid="profile-content"]').should('be.visible');
    });
  });

  describe('Session Management', () => {
    it('should maintain session across page refreshes', () => {
      testUtils.loginAsTestUser();
      
      cy.reload();
      
      // Should still be logged in
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should handle expired sessions gracefully', () => {
      testUtils.loginAsTestUser();
      
      // Mock expired session
      cy.window().then((win) => {
        win.localStorage.removeItem('supabase.auth.token');
      });
      
      // Try to access protected resource
      cy.visit('/profile');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible on login page', () => {
      cy.visit('/login');
      cy.injectAxe();
      testUtils.checkA11y();
    });

    it('should support keyboard navigation', () => {
      cy.visit('/login');
      
      // Tab through form elements
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'email-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'password-input');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'submit-button');
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should work on mobile viewport', () => {
      cy.viewport('iphone-x');
      cy.visit('/login');
      
      cy.get(E2E_CONFIG.selectors.auth.loginForm).should('be.visible');
      cy.get(E2E_CONFIG.selectors.auth.emailInput).should('be.visible');
      
      testUtils.takeScreenshot('login-mobile');
    });
  });
});