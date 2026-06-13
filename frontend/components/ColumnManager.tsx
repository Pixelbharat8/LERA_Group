'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  sortable?: boolean;
  width?: string;
}

interface ColumnManagerProps {
  columns: ColumnConfig[];
  onChange: (columns: ColumnConfig[]) => void;
  storageKey?: string;
}

export default function ColumnManager({ columns, onChange, storageKey }: ColumnManagerProps) {
  const [open, setOpen] = useState(false);

  // Toggle column visibility
  const toggleColumn = (columnId: string) => {
    const newColumns = columns.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    );
    onChange(newColumns);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newColumns));
    }
  };

  // Move column up
  const moveColumnUp = (index: number) => {
    if (index === 0) return;
    const newColumns = [...columns];
    [newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]];
    newColumns.forEach((col, i) => col.order = i);
    onChange(newColumns);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newColumns));
    }
  };

  // Move column down
  const moveColumnDown = (index: number) => {
    if (index === columns.length - 1) return;
    const newColumns = [...columns];
    [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
    newColumns.forEach((col, i) => col.order = i);
    onChange(newColumns);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newColumns));
    }
  };

  // Show all columns
  const showAllColumns = () => {
    const newColumns = columns.map(col => ({ ...col, visible: true }));
    onChange(newColumns);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newColumns));
    }
  };

  // Hide all columns (except first one)
  const hideAllColumns = () => {
    const newColumns = columns.map((col, index) => ({ ...col, visible: index === 0 }));
    onChange(newColumns);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newColumns));
    }
  };

  // Reset to default
  const resetColumns = () => {
    const defaultColumns = columns.map((col, index) => ({ 
      ...col, 
      visible: true, 
      order: index 
    }));
    onChange(defaultColumns);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  };

  const visibleCount = columns.filter(c => c.visible).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Columns ({visibleCount}/{columns.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Manage Columns</h4>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={showAllColumns}>
                All
              </Button>
              <Button variant="ghost" size="sm" onClick={hideAllColumns}>
                None
              </Button>
              <Button variant="ghost" size="sm" onClick={resetColumns}>
                Reset
              </Button>
            </div>
          </div>
          
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {columns.map((column, index) => (
              <div 
                key={column.id} 
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded"
              >
                <div className="flex flex-col">
                  <button
                    onClick={() => moveColumnUp(index)}
                    disabled={index === 0}
                    className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => moveColumnDown(index)}
                    disabled={index === columns.length - 1}
                    className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </div>
                <GripVertical className="h-4 w-4 text-gray-400" />
                <Checkbox
                  checked={column.visible}
                  onCheckedChange={() => toggleColumn(column.id)}
                />
                <label className="text-sm flex-1 cursor-pointer" onClick={() => toggleColumn(column.id)}>
                  {column.label}
                </label>
              </div>
            ))}
          </div>
          
          <div className="text-xs text-gray-500 pt-2 border-t">
            Drag to reorder. Click checkbox to show/hide.
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Hook to manage column state with localStorage
export function useColumnManager(
  defaultColumns: Omit<ColumnConfig, 'order'>[],
  storageKey: string
): [ColumnConfig[], (columns: ColumnConfig[]) => void] {
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // ignore
        }
      }
    }
    return defaultColumns.map((col, index) => ({ ...col, order: index }));
  });

  return [columns, setColumns];
}
