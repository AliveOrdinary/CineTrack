// frontend/components/details-sidebar.tsx

// Import Shadcn components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface DetailItemProps {
  label: string;
  value: string | number | undefined | null;
}

function DetailItem({ label, value }: DetailItemProps) {
  if (value === undefined || value === null || value === '') {
    return null; // Don't render if value is missing
  }
  
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-400 mb-0.5">{label}</h3>
      <p className="text-base">{value}</p>
    </div>
  );
}


interface DetailsSidebarProps {
  status?: string;
  originalLanguage?: string;
  budget?: number;
  revenue?: number;
  // Add more props as needed (e.g., networks for TV)
  networks?: { id: number; logo_path: string | null; name: string; origin_country: string }[];
  type?: string; // For TV show type
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
}

export default function DetailsSidebar({ 
  status, 
  originalLanguage, 
  budget, 
  revenue,
  networks,
  type,
  numberOfSeasons,
  numberOfEpisodes
}: DetailsSidebarProps) {
  
  const budgetFormatted = budget && budget > 0 ? `$${budget.toLocaleString()}` : null;
  const revenueFormatted = revenue && revenue > 0 ? `$${revenue.toLocaleString()}` : null;
  
  // 1. Gather Details
  const detailItems = [
    { label: "Status", value: status },
    { label: "Original Language", value: originalLanguage?.toUpperCase() },
    { label: "Budget", value: budgetFormatted },
    { label: "Revenue", value: revenueFormatted },
    { label: "Type", value: type },
    { label: "Seasons", value: numberOfSeasons },
    { label: "Episodes", value: numberOfEpisodes },
  ].filter(item => item.value !== undefined && item.value !== null && item.value !== '');
  
  const hasNetworks = networks && networks.length > 0;

  if (detailItems.length === 0 && !hasNetworks) {
    return null;
  }

  return (
    <Card className="bg-gray-900 border-gray-800 mb-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Details</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3"> 
          {/* 2. Render Details */} 
          {detailItems.map((item, index) => (
            <div key={item.label}> 
              <DetailItem label={item.label} value={item.value} />
              {/* Render separator if not the last item AND networks exist OR there are more items */} 
              {(index < detailItems.length - 1 || (index === detailItems.length - 1 && hasNetworks)) && (
                 <Separator className="my-3 bg-gray-700" />
              )}
            </div>
          ))}
          
          {/* 3. Render Networks */} 
          {hasNetworks && (
             <div> 
               <h3 className="text-sm font-medium text-gray-400 mb-1">Networks</h3>
               <div className="flex flex-wrap gap-1">
                  {networks.map(network => (
                    <Badge key={network.id} variant="secondary" className="px-2 py-0.5">
                      {network.name}
                    </Badge>
                  ))}
               </div>
             </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 