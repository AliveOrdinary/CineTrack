import ResetPasswordForm from '@/components/features/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center">
      <h1 className="mb-8 text-3xl font-bold">Reset Your Password</h1>
      <ResetPasswordForm />
      {/* TODO: Add links to Login/Signup pages */}
    </div>
  );
}
