import { Suspense } from "react"
import { EditListPageContent } from "@/components/features/lists/EditListPageContent"

interface EditListPageProps {
  params: Promise<{ id: string }>
}

export default async function EditListPage({ params }: EditListPageProps) {
  const { id } = await params

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Suspense fallback={
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-32 bg-muted rounded animate-pulse" />
          <div className="h-12 bg-muted rounded animate-pulse" />
          <div className="h-24 bg-muted rounded animate-pulse" />
        </div>
      }>
        <EditListPageContent listId={id} />
      </Suspense>
    </div>
  )
} 