/**
 * E2E tests for content browsing and discovery
 */

import { E2E_CONFIG, testUtils } from '../setup/e2e-setup';

describe('Content Browsing', () => {
  beforeEach(() => {
    testUtils.clearTestData();
    testUtils.seedTestData();
  });

  describe('Homepage', () => {
    it('should display trending content sections', () => {
      cy.visit('/');
      
      // Should show different content sections
      cy.get('[data-testid="trending-movies"]').should('be.visible');
      cy.get('[data-testid="trending-tv"]').should('be.visible');
      cy.get('[data-testid="popular-movies"]').should('be.visible');
      
      // Should display content cards
      cy.get(E2E_CONFIG.selectors.content.movieCard).should('have.length.at.least', 1);
      cy.get(E2E_CONFIG.selectors.content.tvCard).should('have.length.at.least', 1);
    });

    it('should allow navigation to content details', () => {
      cy.visit('/');
      
      // Click on first movie card
      cy.get(E2E_CONFIG.selectors.content.movieCard).first().click();
      
      // Should navigate to movie detail page
      cy.url().should('include', '/movie/');
      cy.get('[data-testid="movie-title"]').should('be.visible');
      cy.get('[data-testid="movie-overview"]').should('be.visible');
    });

    it('should load more content when scrolling', () => {
      cy.visit('/');
      
      // Count initial movie cards
      cy.get(E2E_CONFIG.selectors.content.movieCard).then($cards => {
        const initialCount = $cards.length;
        
        // Scroll to bottom
        cy.scrollTo('bottom');
        
        // Should load more cards
        cy.get(E2E_CONFIG.selectors.content.movieCard)
          .should('have.length.greaterThan', initialCount);
      });
    });
  });

  describe('Search Functionality', () => {
    it('should search for movies and TV shows', () => {
      cy.visit('/');
      
      const searchQuery = 'Inception';
      
      cy.get(E2E_CONFIG.selectors.search.searchInput)
        .type(searchQuery)
        .should('have.value', searchQuery);
      
      cy.get(E2E_CONFIG.selectors.search.searchButton).click();
      
      // Should navigate to search results
      cy.url().should('include', '/search');
      cy.url().should('include', `q=${searchQuery}`);
      
      // Should show results
      cy.get(E2E_CONFIG.selectors.search.searchResults).should('be.visible');
      cy.get('[data-testid="search-result"]').should('have.length.at.least', 1);
    });

    it('should handle empty search gracefully', () => {
      cy.visit('/search');
      
      cy.get(E2E_CONFIG.selectors.search.searchButton).click();
      
      // Should show empty state or stay on same page
      cy.get('[data-testid="empty-search"]').should('be.visible');
    });

    it('should support search filters', () => {
      cy.visit('/search?q=action');
      
      // Apply genre filter
      cy.get('[data-testid="genre-filter"]').select('Action');
      cy.get('[data-testid="apply-filters"]').click();
      
      // URL should include filter parameters
      cy.url().should('include', 'genre=action');
      
      // Results should update
      cy.get('[data-testid="search-result"]').should('exist');
    });

    it('should show search suggestions', () => {
      cy.visit('/');
      
      cy.get(E2E_CONFIG.selectors.search.searchInput).type('Mar');
      
      // Should show dropdown with suggestions
      cy.get('[data-testid="search-suggestions"]').should('be.visible');
      cy.get('[data-testid="suggestion-item"]').should('have.length.at.least', 1);
      
      // Should be able to click on suggestion
      cy.get('[data-testid="suggestion-item"]').first().click();
      cy.url().should('include', '/search');
    });
  });

  describe('Content Detail Pages', () => {
    it('should display comprehensive movie information', () => {
      cy.visit('/movie/550'); // Fight Club (popular test movie)
      
      // Should show movie details
      cy.get('[data-testid="movie-title"]').should('contain', 'Fight Club');
      cy.get('[data-testid="movie-overview"]').should('be.visible');
      cy.get('[data-testid="movie-poster"]').should('be.visible');
      cy.get('[data-testid="movie-backdrop"]').should('be.visible');
      
      // Should show cast and crew
      cy.get('[data-testid="cast-section"]').should('be.visible');
      cy.get('[data-testid="cast-member"]').should('have.length.at.least', 1);
      
      // Should show similar movies
      cy.get('[data-testid="similar-movies"]').should('be.visible');
    });

    it('should display TV show information with seasons', () => {
      cy.visit('/tv/1399'); // Game of Thrones
      
      cy.get('[data-testid="tv-title"]').should('be.visible');
      cy.get('[data-testid="seasons-section"]').should('be.visible');
      cy.get('[data-testid="season-card"]').should('have.length.at.least', 1);
      
      // Should be able to expand season details
      cy.get('[data-testid="season-card"]').first().click();
      cy.get('[data-testid="episode-list"]').should('be.visible');
      cy.get('[data-testid="episode-item"]').should('have.length.at.least', 1);
    });

    it('should show where to watch information', () => {
      cy.visit('/movie/550');
      
      cy.get('[data-testid="watch-providers"]').should('be.visible');
      cy.get('[data-testid="streaming-provider"]').should('exist');
    });

    it('should display user reviews', () => {
      // Assume there are existing reviews
      cy.visit('/movie/550');
      
      cy.get('[data-testid="reviews-section"]').should('be.visible');
      cy.get('[data-testid="review-item"]').should('exist');
      cy.get('[data-testid="review-author"]').should('be.visible');
      cy.get('[data-testid="review-content"]').should('be.visible');
    });
  });

  describe('Genre and Category Browsing', () => {
    it('should browse movies by genre', () => {
      cy.visit('/discover');
      
      cy.get('[data-testid="genre-action"]').click();
      
      cy.url().should('include', 'genre=28'); // Action genre ID
      cy.get('[data-testid="genre-results"]').should('be.visible');
      cy.get(E2E_CONFIG.selectors.content.movieCard).should('have.length.at.least', 1);
    });

    it('should filter content by year', () => {
      cy.visit('/discover');
      
      cy.get('[data-testid="year-filter"]').select('2023');
      cy.get('[data-testid="apply-filters"]').click();
      
      cy.url().should('include', 'year=2023');
      cy.get('[data-testid="filter-results"]').should('be.visible');
    });

    it('should sort content by different criteria', () => {
      cy.visit('/discover');
      
      // Sort by rating
      cy.get('[data-testid="sort-select"]').select('vote_average.desc');
      cy.get('[data-testid="apply-sort"]').click();
      
      cy.url().should('include', 'sort_by=vote_average.desc');
      
      // Verify sorting (first item should have high rating)
      cy.get('[data-testid="content-rating"]').first().should('contain', '8.');
    });
  });

  describe('Trending and Popular Content', () => {
    it('should show trending content for different time periods', () => {
      cy.visit('/trending');
      
      // Default should be week
      cy.get('[data-testid="trending-week"]').should('have.class', 'active');
      cy.get('[data-testid="trending-content"]').should('be.visible');
      
      // Switch to daily trending
      cy.get('[data-testid="trending-day"]').click();
      cy.get('[data-testid="trending-content"]').should('be.visible');
      
      // Content should update (different trending items)
      cy.get(E2E_CONFIG.selectors.content.movieCard).should('exist');
    });

    it('should show popular content categories', () => {
      cy.visit('/popular');
      
      cy.get('[data-testid="popular-movies"]').should('be.visible');
      cy.get('[data-testid="popular-tv"]').should('be.visible');
      cy.get('[data-testid="popular-people"]').should('be.visible');
    });
  });

  describe('Loading States and Error Handling', () => {
    it('should show loading indicators while fetching content', () => {
      // Intercept API calls to add delay
      cy.intercept('GET', '**/api/trending/**', { delay: 2000 }).as('trendingApi');
      
      cy.visit('/');
      
      // Should show loading state
      cy.get('[data-testid="loading-skeleton"]').should('be.visible');
      
      cy.wait('@trendingApi');
      
      // Loading should disappear
      cy.get('[data-testid="loading-skeleton"]').should('not.exist');
      cy.get(E2E_CONFIG.selectors.content.movieCard).should('be.visible');
    });

    it('should handle API errors gracefully', () => {
      // Mock API error
      cy.intercept('GET', '**/api/trending/**', { statusCode: 500 }).as('trendingError');
      
      cy.visit('/');
      
      cy.wait('@trendingError');
      
      // Should show error state
      cy.get('[data-testid="error-message"]').should('be.visible');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should allow retry on error', () => {
      // First request fails, second succeeds
      cy.intercept('GET', '**/api/trending/**', { statusCode: 500 }).as('firstRequest');
      
      cy.visit('/');
      cy.wait('@firstRequest');
      
      // Mock successful retry
      cy.intercept('GET', '**/api/trending/**', { fixture: 'trending-movies.json' }).as('retryRequest');
      
      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@retryRequest');
      
      // Should show content
      cy.get(E2E_CONFIG.selectors.content.movieCard).should('be.visible');
    });
  });

  describe('Performance', () => {
    it('should load initial content quickly', () => {
      const start = Date.now();
      
      cy.visit('/');
      cy.get(E2E_CONFIG.selectors.content.movieCard).should('be.visible');
      
      cy.then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(3000); // Should load within 3 seconds
      });
    });

    it('should implement image lazy loading', () => {
      cy.visit('/');
      
      // Images below the fold should have loading="lazy"
      cy.get('[data-testid="movie-poster"]').should('have.attr', 'loading', 'lazy');
    });
  });
});