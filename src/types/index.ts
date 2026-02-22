export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type ViewMode = 'calendar' | 'list';
export type CalendarView = 'month' | 'week';

export interface Task {
  id?: number;
  title: string;
  description: string;
  date: string; // 'YYYY-MM-DD' format, local timezone
  status: TaskStatus;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id?: number;
  name: string;
  icon: string; // lucide-react icon name
  isDefault: boolean;
}
