import { ProfileContent } from "@/components/features/profile/ProfileContent"

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <ProfileContent userId={id} />
    </div>
  )
} 