import { Suspense } from "react"
import { AddItemsContent } from "@/components/features/lists/AddItemsContent"

interface AddItemsPageProps {
  params: Promise<{ id: string }>
}

export default async function AddItemsPage({ params }: AddItemsPageProps) {
  const { id } = await params

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Suspense fallback={
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      }>
        <AddItemsContent listId={id} />
      </Suspense>
    </div>
  )
} 