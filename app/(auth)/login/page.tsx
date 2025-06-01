import LoginForm from '@/components/features/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center">
      <h1 className="mb-8 text-3xl font-bold">Login to CineTrack</h1>
      <LoginForm />
    </div>
  );
}
