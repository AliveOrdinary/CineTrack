'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

const MAX_VISIBLE_PAGES = 5;

export default function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return null;
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${basePath}?${params.toString()}`);
  };

  const getPageNumbers = () => {
    const pages = [];
    const halfVisible = Math.floor(MAX_VISIBLE_PAGES / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (currentPage - halfVisible < 1) {
        endPage = Math.min(totalPages, MAX_VISIBLE_PAGES);
    }

    if (currentPage + halfVisible > totalPages) {
        startPage = Math.max(1, totalPages - MAX_VISIBLE_PAGES + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center space-x-2 my-8">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={cn("h-9 w-9", { 'opacity-50 cursor-not-allowed': currentPage <= 1 })}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pageNumbers.map((page, index) =>
        typeof page === 'number' ? (
          <Button
            key={`page-${page}`}
            variant={page === currentPage ? "default" : "outline"}
            size="icon"
            onClick={() => handlePageChange(page)}
            className={cn("h-9 w-9", { 
              'font-bold': page === currentPage 
            })}
            aria-label={`Go to page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Button>
        ) : (
          <span key={`ellipsis-${index}`} className="px-1 py-1 text-gray-500">
            ...
          </span>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={cn("h-9 w-9", { 'opacity-50 cursor-not-allowed': currentPage >= totalPages })}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
} 