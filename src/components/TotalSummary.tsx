'use client';

import { useState } from 'react';
import { GlobalTotals } from '@/types';
import { useWidgets } from '@/hooks/useWidgets';
import { WidgetComponentProps } from '@/types/wigdet';
import { DraggableCard } from '@/components/DraggableCard';

interface TotalSummaryProps {
  totals: GlobalTotals;
  previousTotal?: number;
  baseCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
}

export function TotalSummary({ totals, previousTotal, baseCurrency = 'USD', onCurrencyChange }: TotalSummaryProps) {
  const componentProps: WidgetComponentProps = {
    totals,
    previousTotal,
    baseCurrency,
    onCurrencyChange,
  };

  const {
    widgets,
    setWidgets,
    availableWidgets,
  } = useWidgets();
  const [draggedCard, setDraggedCard] = useState<string | null>(null);

  const handleDragStart = (widget: string) => setDraggedCard(widget);
  const handleDragEnd = () => setDraggedCard(null);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedCard || draggedCard === targetId) return;

    const draggedWidget = availableWidgets.find((widget) => widget.key === draggedCard);
    const targetWidget = availableWidgets.find((widget) => widget.key === targetId);
    if (!targetWidget || !draggedWidget) return;

    const newWidgets = [...widgets];
    const draggedIndex = newWidgets.findIndex((widget) => widget.key === draggedCard);
    const targetIndex = newWidgets.findIndex((widget) => widget.key === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      newWidgets.splice(draggedIndex, 1);
      newWidgets.splice(targetIndex, 0, draggedWidget);
      setWidgets(newWidgets);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        {widgets && widgets.length > 0 && widgets?.map((widget) => {
          const { key, label, width, component } = widget;
          const Component = component;
          return (
            <DraggableCard
              key={key}
              id={key}
              title={label}
              width={width}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              isDragging={draggedCard === key}
            >
              <Component {...componentProps} />
            </DraggableCard>
          );
        })}
      </div>
    </div>
  );
}
