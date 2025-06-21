/**
 * Unit tests for useUser hook
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useUser } from '@/hooks/use-user';

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  })),
}));

import { createClient } from '@/lib/supabase/client';

const mockSupabase = createClient() as jest.Mocked<ReturnType<typeof createClient>>;

describe('useUser Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn(),
        },
      },
    } as any);
  });

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useUser());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBe(null);
  });

  it('fetches and sets user on mount', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: '2024-01-01T00:00:00Z',
    };

    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: mockUser },
      error: null,
    });

    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(mockSupabase.auth.getUser).toHaveBeenCalledTimes(1);
  });

  it('handles getUser error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockError = new Error('Auth error');
    
    mockSupabase.auth.getUser.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useUser());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(consoleSpy).toHaveBeenCalledWith('Error getting user:', mockError);
    
    consoleSpy.mockRestore();
  });

  it('sets up auth state change listener', () => {
    renderHook(() => useUser());
    
    expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('updates user state on auth change', async () => {
    const mockUser = {
      id: '456',
      email: 'new@example.com',
      aud: 'authenticated',
      app_metadata: {},
      user_metadata: {},
      created_at: '2024-01-01T00:00:00Z',
    };

    let authCallback: any;
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    });

    const { result } = renderHook(() => useUser());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simulate auth state change
    authCallback('SIGNED_IN', { user: mockUser });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });
  });

  it('clears user on sign out', async () => {
    let authCallback: any;
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    });

    const { result } = renderHook(() => useUser());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simulate sign out
    authCallback('SIGNED_OUT', null);

    await waitFor(() => {
      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });

  it('unsubscribes from auth changes on unmount', () => {
    const mockUnsubscribe = jest.fn();
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: mockUnsubscribe,
        },
      },
    });

    const { unmount } = renderHook(() => useUser());
    
    unmount();
    
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('handles null session in auth change', async () => {
    let authCallback: any;
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      };
    });

    const { result } = renderHook(() => useUser());

    // Simulate auth change with null session
    authCallback('TOKEN_REFRESHED', null);

    await waitFor(() => {
      expect(result.current.user).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });
});