import SignupForm from '@/components/features/auth/SignupForm';

export default function SignupPage() {
  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center">
      <h1 className="mb-8 text-3xl font-bold">Create your CineTrack Account</h1>
      <SignupForm />
      {/* TODO: Add link to Login page */}
    </div>
  );
}
