export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type ViewMode = 'calendar' | 'list' | 'someday';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type CalendarView = 'month' | 'week';
export type AIProviderName = 'anthropic' | 'gemini';

export type GeminiModelId =
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite'
  | 'gemini-3-flash-preview'
  | 'gemma-3-12b-it'
  | 'gemma-3-27b-it';

export const GEMINI_DEFAULT_MODEL: GeminiModelId = 'gemini-2.5-flash';

export const GEMINI_MODELS: { id: GeminiModelId; label: string; description: string }[] = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Default — balanced speed and quality' },
  { id: 'gemini-2.5-flash-lite', label: 'Flash Lite', description: 'Fastest, lowest cost' },
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', description: 'Frontier-class, preview' },
  { id: 'gemma-3-12b-it', label: 'Gemma 3 12B', description: 'Open model, free tier friendly' },
  { id: 'gemma-3-27b-it', label: 'Gemma 3 27B', description: 'Open model, larger and more capable' },
];

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
  energyLevel?: EnergyLevel | null; // energy tag for ADHD-optimized filtering
  timeEstimate?: number | null; // AI-generated estimate in minutes
  timeEstimateOverride?: number | null; // user-set override in minutes
  isSomeday?: boolean; // true = archived to Someday list, not on calendar
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
