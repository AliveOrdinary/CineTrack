import { FollowList } from '@/components/features/social/FollowList';
import { getUserProfile } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface FollowersPageProps {
  params: Promise<{ id: string }>;
}

export default async function FollowersPage({ params }: FollowersPageProps) {
  const { id } = await params;

  try {
    const profile = await getUserProfile(id);

    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href={`/profile/${id}`}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </Link>

          <h1 className="text-3xl font-bold">{profile.display_name || 'User'}'s Followers</h1>
        </div>

        <FollowList userId={id} initialTab="followers" />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
