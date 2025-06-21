/**
 * Unit tests for MediaCard component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MediaCard from '@/components/features/content/MediaCard';
import { TmdbMedia } from '@/lib/tmdb/types';

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink({ href, children, ...props }: any) {
    return <a href={href} {...props}>{children}</a>;
  },
}));

describe('MediaCard Component', () => {
  const mockMovieData: TmdbMedia = {
    id: 123,
    title: 'Test Movie',
    overview: 'A test movie description',
    poster_path: '/test-poster.jpg',
    release_date: '2023-01-15',
    vote_average: 8.5,
    vote_count: 1000,
    genre_ids: [28, 12],
    adult: false,
    backdrop_path: '/test-backdrop.jpg',
    original_language: 'en',
    original_title: 'Test Movie Original',
    popularity: 100.5,
    video: false,
    media_type: 'movie'
  };

  const mockTvData: TmdbMedia = {
    id: 456,
    name: 'Test TV Show',
    overview: 'A test TV show description',
    poster_path: '/test-tv-poster.jpg',
    first_air_date: '2022-03-10',
    vote_average: 7.8,
    vote_count: 500,
    genre_ids: [18, 35],
    adult: false,
    backdrop_path: '/test-tv-backdrop.jpg',
    original_language: 'en',
    original_name: 'Test TV Show Original',
    popularity: 75.2,
    origin_country: ['US'],
    media_type: 'tv'
  };

  describe('Movie Rendering', () => {
    it('renders movie data correctly', () => {
      render(<MediaCard media={mockMovieData} />);
      
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
      expect(screen.getByText('2023')).toBeInTheDocument();
      expect(screen.getByText('⭐ 8.5')).toBeInTheDocument();
    });

    it('creates correct movie link', () => {
      render(<MediaCard media={mockMovieData} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/movie/123');
    });

    it('displays movie poster with correct attributes', () => {
      render(<MediaCard media={mockMovieData} />);
      
      const poster = screen.getByAltText('Test Movie poster');
      expect(poster).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w500/test-poster.jpg');
    });

    it('includes proper aria-label for movie', () => {
      render(<MediaCard media={mockMovieData} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'Test Movie, released in 2023, rated 8.5 out of 10. Movie.');
    });
  });

  describe('TV Show Rendering', () => {
    it('renders TV show data correctly', () => {
      render(<MediaCard media={mockTvData} />);
      
      expect(screen.getByText('Test TV Show')).toBeInTheDocument();
      expect(screen.getByText('2022')).toBeInTheDocument();
      expect(screen.getByText('⭐ 7.8')).toBeInTheDocument();
    });

    it('creates correct TV show link', () => {
      render(<MediaCard media={mockTvData} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/tv/456');
    });

    it('includes proper aria-label for TV show', () => {
      render(<MediaCard media={mockTvData} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'Test TV Show, released in 2022, rated 7.8 out of 10. TV Show.');
    });
  });

  describe('Missing Data Handling', () => {
    it('handles missing poster image', () => {
      const mediaWithoutPoster = { ...mockMovieData, poster_path: null };
      render(<MediaCard media={mediaWithoutPoster} />);
      
      expect(screen.getByText('No Image')).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'No poster available for Test Movie' })).toBeInTheDocument();
    });

    it('handles missing title gracefully', () => {
      const mediaWithoutTitle = { ...mockMovieData, title: undefined };
      render(<MediaCard media={mediaWithoutTitle} />);
      
      expect(screen.getByText('Unknown Title')).toBeInTheDocument();
    });

    it('handles missing release date', () => {
      const mediaWithoutDate = { ...mockMovieData, release_date: undefined };
      render(<MediaCard media={mediaWithoutDate} />);
      
      expect(screen.queryByText('2023')).not.toBeInTheDocument();
    });

    it('handles missing rating', () => {
      const mediaWithoutRating = { ...mockMovieData, vote_average: 0 };
      render(<MediaCard media={mediaWithoutRating} />);
      
      expect(screen.queryByText(/⭐/)).not.toBeInTheDocument();
    });

    it('handles undefined rating', () => {
      const mediaWithUndefinedRating = { ...mockMovieData, vote_average: undefined };
      render(<MediaCard media={mediaWithUndefinedRating} />);
      
      expect(screen.queryByText(/⭐/)).not.toBeInTheDocument();
    });
  });

  describe('Media Type Detection', () => {
    it('detects movie type from title property', () => {
      const movieData = { ...mockMovieData, media_type: undefined };
      render(<MediaCard media={movieData} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/movie/123');
    });

    it('detects TV type from name property', () => {
      const tvData = { ...mockTvData, media_type: undefined, title: undefined };
      render(<MediaCard media={tvData} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/tv/456');
    });

    it('shows media type badge when showMediaType is true', () => {
      render(<MediaCard media={mockMovieData} showMediaType={true} />);
      
      expect(screen.getByText('movie')).toBeInTheDocument();
      expect(screen.getByLabelText('Media type: Movie')).toBeInTheDocument();
    });

    it('hides media type badge when showMediaType is false', () => {
      render(<MediaCard media={mockMovieData} showMediaType={false} />);
      
      expect(screen.queryByText('movie')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('has proper semantic structure', () => {
      render(<MediaCard media={mockMovieData} />);
      
      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('link')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('includes rating accessibility label', () => {
      render(<MediaCard media={mockMovieData} />);
      
      expect(screen.getByLabelText('Rating: 8.5 out of 10')).toBeInTheDocument();
    });

    it('includes release year accessibility label', () => {
      render(<MediaCard media={mockMovieData} />);
      
      expect(screen.getByLabelText('Released in 2023')).toBeInTheDocument();
    });

    it('has proper focus management', () => {
      render(<MediaCard media={mockMovieData} />);
      
      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary');
    });
  });

  describe('Visual States', () => {
    it('applies correct CSS classes for styling', () => {
      render(<MediaCard media={mockMovieData} />);
      
      const article = screen.getByRole('article');
      expect(article).toHaveClass('group');
      
      const link = screen.getByRole('link');
      expect(link).toHaveClass('block', 'rounded-lg', 'touch-manipulation');
    });

    it('includes hover and active state classes', () => {
      render(<MediaCard media={mockMovieData} />);
      
      const cardContainer = screen.getByRole('article').querySelector('div');
      expect(cardContainer).toHaveClass('hover:shadow-lg', 'active:scale-95');
    });
  });

  describe('Rating Display', () => {
    it('formats rating to one decimal place', () => {
      const mediaWithPreciseRating = { ...mockMovieData, vote_average: 8.567 };
      render(<MediaCard media={mediaWithPreciseRating} />);
      
      expect(screen.getByText('⭐ 8.6')).toBeInTheDocument();
    });

    it('handles integer ratings', () => {
      const mediaWithIntegerRating = { ...mockMovieData, vote_average: 9 };
      render(<MediaCard media={mediaWithIntegerRating} />);
      
      expect(screen.getByText('⭐ 9.0')).toBeInTheDocument();
    });
  });
});