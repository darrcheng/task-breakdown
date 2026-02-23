export interface SubtaskSuggestion {
  title: string;
  description: string;
}

export interface StreamCallbacks {
  onSubtask: (subtask: SubtaskSuggestion) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export interface AIProvider {
  name: string;
  generateSubtasks(
    taskTitle: string,
    taskDescription: string,
    parentContext: string,
    callbacks: StreamCallbacks,
  ): Promise<void>;
  testConnection(): Promise<boolean>;
}
