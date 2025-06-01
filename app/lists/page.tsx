import { Suspense } from "react";
import { ListsContent } from "@/components/features/lists/ListsContent";

export default function ListsPage() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Lists</h1>
        <p className="text-muted-foreground">
          Create and manage your custom movie and TV show lists
        </p>
      </div>
      
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      }>
        <ListsContent />
      </Suspense>
    </div>
  );
} 