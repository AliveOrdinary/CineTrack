import { UserSearch } from "@/components/features/social/UserSearch"

export default function DiscoverPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Discover Users</h1>
        <p className="text-muted-foreground">
          Find and follow other movie and TV show enthusiasts to see their reviews and activity.
        </p>
      </div>
      
      <UserSearch />
    </div>
  )
} 