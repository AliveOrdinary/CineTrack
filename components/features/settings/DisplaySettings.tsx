'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPreferences } from '@/types/preferences';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface DisplaySettingsProps {
  preferences: UserPreferences;
}

export function DisplaySettings({ preferences }: DisplaySettingsProps) {
  const { updateContent } = useUserPreferences();

  const handleItemsPerPageChange = async (items_per_page: number) => {
    try {
      await updateContent({ items_per_page });
    } catch (error) {
      console.error('Failed to update items per page:', error);
    }
  };

  const itemsPerPageOptions = [
    { value: 10, label: '10 items' },
    { value: 20, label: '20 items' },
    { value: 30, label: '30 items' },
    { value: 50, label: '50 items' },
    { value: 100, label: '100 items' }
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-base">Items Per Page</Label>
          <p className="text-sm text-muted-foreground">
            Number of items to display per page in lists and grids
          </p>
          <Select
            value={preferences.items_per_page.toString()}
            onValueChange={(value) => handleItemsPerPageChange(parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {itemsPerPageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
} 