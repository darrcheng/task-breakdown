import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, StreamCallbacks, SubtaskSuggestion } from './types';
import { buildSubtaskPrompt, buildTimeEstimatePrompt } from '../prompts';

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

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async generateSubtasks(
    taskTitle: string,
    taskDescription: string,
    parentContext: string,
    callbacks: StreamCallbacks,
  ): Promise<void> {
    const prompt = buildSubtaskPrompt(taskTitle, taskDescription, parentContext);

    try {
      const stream = await this.client.messages.stream({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system:
          'You are a task breakdown assistant helping users with ADHD break overwhelming tasks into small, actionable steps. Output each subtask as a separate JSON line with "title" and "description" fields. Do not output anything else.',
        messages: [{ role: 'user', content: prompt }],
      });

      let buffer = '';
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          buffer += event.delta.text;
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
      callbacks.onError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  async estimateTime(
    taskTitle: string,
    taskDescription: string,
    calibrationHint: string,
  ): Promise<number | null> {
    const prompt = buildTimeEstimatePrompt(taskTitle, taskDescription, calibrationHint);
    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 50,
        messages: [{ role: 'user', content: prompt }],
      });
      const content = response.content[0];
      if (content.type !== 'text') return null;
      const text = content.text.trim();
      // Strip markdown code fences if present
      const clean = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(clean);
      if (typeof parsed.minutes === 'number' && parsed.minutes > 0) {
        return parsed.minutes;
      }
      return null;
    } catch {
      return null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return true;
    } catch {
      return false;
    }
  }
}
