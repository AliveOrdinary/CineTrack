import UpdatePasswordForm from '@/components/features/auth/UpdatePasswordForm';
import { Suspense } from 'react';

export default function UpdatePasswordPage() {
  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center">
      <h1 className="mb-8 text-3xl font-bold">Update Your Password</h1>
      {/* Wrap with Suspense because UpdatePasswordForm might use useSearchParams */}
      <Suspense fallback={<div>Loading...</div>}>
        <UpdatePasswordForm />
      </Suspense>
    </div>
  );
}
