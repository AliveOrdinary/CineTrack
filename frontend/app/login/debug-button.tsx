'use client';

import { useState } from 'react';
import supabaseService from '@/services/supabase';

export default function DebugAuthButton() {
  const [debugInfo, setDebugInfo] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showDirectLogin, setShowDirectLogin] = useState(false);
  
  const checkServerSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      return await response.json();
    } catch (error) {
      console.error('Error checking server session:', error);
      return { error: 'Failed to check server session' };
    }
  };
  
  const handleDebugClick = async () => {
    setLoading(true);
    try {
      // Client-side debug
      const clientDebug = await supabaseService.debugAuth();
      
      // Server-side session check
      const serverSession = await checkServerSession();
      
      setDebugInfo({
        client: clientDebug,
        server: serverSession,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: 'Failed to debug auth state' });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await supabaseService.directLogin(credentials.email, credentials.password);
      setDebugInfo({
        directLoginResult: result,
        timestamp: new Date().toISOString()
      });
      
      if (result.success) {
        // Refresh the page after successful login
        setTimeout(() => {
          window.location.href = '/profile';
        }, 1000);
      }
    } catch (error) {
      console.error('Direct login error:', error);
      setDebugInfo({ error: 'Failed to log in directly' });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mt-6 border-t border-gray-800 pt-6">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleDebugClick}
          disabled={loading}
          className="text-xs text-gray-500 hover:text-gray-400 underline"
        >
          {loading ? 'Checking...' : 'Debug Auth State'}
        </button>
        
        <button
          type="button"
          onClick={() => setShowDirectLogin(!showDirectLogin)}
          className="text-xs text-gray-500 hover:text-gray-400 underline"
        >
          {showDirectLogin ? 'Hide Direct Login' : 'Show Direct Login (Use Existing Accounts)'}
        </button>
      </div>
      
      {showDirectLogin && (
        <form onSubmit={handleDirectLogin} className="mt-4 space-y-3">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 rounded border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-1 px-2 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Direct Login'}
          </button>
        </form>
      )}
      
      {debugInfo && (
        <pre className="mt-2 text-xs text-left bg-gray-800 p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      )}
    </div>
  );
} 