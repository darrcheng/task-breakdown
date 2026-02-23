export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type ViewMode = 'calendar' | 'list';
export type CalendarView = 'month' | 'week';
export type AIProviderName = 'anthropic' | 'gemini';

export interface Task {
  id?: number;
  title: string;
  description: string;
  date: string; // 'YYYY-MM-DD' format, local timezone
  status: TaskStatus;
  categoryId: number;
  parentId?: number; // links subtask to parent task (undefined = root task)
  depth: number; // 0 for root tasks, 1-3 for subtasks
  sortOrder?: number; // ordering within siblings (used for subtask reorder)
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id?: number;
  name: string;
  icon: string; // lucide-react icon name
  isDefault: boolean;
}

export interface AIProviderConfig {
  provider: AIProviderName;
  model: string;
}

export interface AISettings {
  id?: number;
  key: string;
  value: string;
}
