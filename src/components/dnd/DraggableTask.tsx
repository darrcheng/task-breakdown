import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../../types';

interface DraggableTaskProps {
  task: Task;
  children: React.ReactNode;
}

export function DraggableTask({ task, children }: DraggableTaskProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: `task-${task.id}`,
      data: { task },
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
    cursor: 'grab',
    // Prevent browser default touch behaviors (text selection, callout)
    // so dnd-kit TouchSensor can activate during the 500ms hold delay
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}
