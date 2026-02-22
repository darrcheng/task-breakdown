import { useDroppable } from '@dnd-kit/core';
import clsx from 'clsx';

interface DroppableDayProps {
  dateStr: string;
  children: React.ReactNode;
  className?: string;
}

export function DroppableDay({ dateStr, children, className }: DroppableDayProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        className,
        isOver && 'bg-blue-50 ring-2 ring-blue-200 ring-inset'
      )}
    >
      {children}
    </div>
  );
}
