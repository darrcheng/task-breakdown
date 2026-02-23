import { GoogleGenAI } from '@google/genai';
import type { AIProvider, StreamCallbacks, SubtaskSuggestion } from './types';
import { buildSubtaskPrompt } from '../prompts';

function parseSubtaskLines(buffer: string): {
  complete: SubtaskSuggestion[];
  remaining: string;
} {
  const lines = buffer.split('\n');
  const remaining = lines.pop() || '';
  const complete: SubtaskSuggestion[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.title) {
        complete.push({
          title: parsed.title,
          description: parsed.description || '',
        });
      }
    } catch {
      // Not valid JSON yet, skip
    }
  }

  return { complete, remaining };
}

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateSubtasks(
    taskTitle: string,
    taskDescription: string,
    parentContext: string,
    callbacks: StreamCallbacks,
  ): Promise<void> {
    const prompt = buildSubtaskPrompt(taskTitle, taskDescription, parentContext);
    const systemPrompt =
      'You are a task breakdown assistant helping users with ADHD break overwhelming tasks into small, actionable steps. Output each subtask as a separate JSON line with "title" and "description" fields. Do not output anything else.';

    try {
      const response = await this.ai.models.generateContentStream({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemPrompt,
        },
      });

      let buffer = '';
      for await (const chunk of response) {
        const text = chunk.text;
        if (text) {
          buffer += text;
          const { complete, remaining } = parseSubtaskLines(buffer);
          for (const subtask of complete) {
            callbacks.onSubtask(subtask);
          }
          buffer = remaining;
        }
      }

      // Parse any remaining buffer
      if (buffer.trim()) {
        const { complete } = parseSubtaskLines(buffer + '\n');
        for (const subtask of complete) {
          callbacks.onSubtask(subtask);
        }
      }

      callbacks.onComplete();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      // CORS-specific error hint for Gemini
      if (
        message.includes('CORS') ||
        message.includes('Failed to fetch') ||
        message.includes('NetworkError')
      ) {
        callbacks.onError(
          new Error(
            'Gemini API may require a CORS proxy for browser usage. Consider using Claude provider instead. Original error: ' +
              message,
          ),
        );
      } else {
        callbacks.onError(
          error instanceof Error ? error : new Error(message),
        );
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: 'Hi',
      });
      return true;
    } catch {
      return false;
    }
  }
}
