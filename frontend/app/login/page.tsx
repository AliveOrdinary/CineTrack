import { Suspense } from 'react';
import LoginForm from './login-form';

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <Suspense fallback={
        <div className="w-full max-w-md bg-gray-900 p-8 rounded-lg shadow-lg border border-gray-800 animate-pulse">
          <div className="h-8 bg-gray-800 rounded mb-6 w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-800 rounded mb-2 w-1/4"></div>
          <div className="h-10 bg-gray-800 rounded mb-4"></div>
          <div className="h-4 bg-gray-800 rounded mb-2 w-1/4"></div>
          <div className="h-10 bg-gray-800 rounded mb-6"></div>
          <div className="h-10 bg-gray-800 rounded w-full"></div>
          <div className="h-6 bg-gray-800 rounded mt-6 w-1/2 mx-auto"></div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
} 