import { ListTree } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';

interface ParentBadgeProps {
  taskId: number;
}

export function ParentBadge({ taskId }: ParentBadgeProps) {
  const count = useLiveQuery(
    () => db.tasks.where('parentId').equals(taskId).count(),
    [taskId],
  );

  if (!count || count === 0) return null;

  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-slate-500 bg-slate-100 rounded-full px-1.5 py-0.5">
      <ListTree className="w-3 h-3" />
      {count}
    </span>
  );
}
