import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ListDetailContent } from '@/components/features/lists/ListDetailContent';

interface ListPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListPage({ params }: ListPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-32 bg-muted rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-80 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        }
      >
        <ListDetailContent listId={id} />
      </Suspense>
    </div>
  );
}
