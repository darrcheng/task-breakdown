/**
 * Builds a prompt for subtask generation.
 * The system message is set separately in each provider.
 * This function returns only the user message content.
 */
export function buildSubtaskPrompt(
  taskTitle: string,
  taskDescription: string,
  parentContext: string,
  count: number = 4,
): string {
  const contextSection = parentContext
    ? `\nAdditional context from parent task chain:\n${parentContext}\n`
    : '';

  return `Break down this task into ${count} concrete, actionable subtasks.

**Task:** ${taskTitle}
${taskDescription ? `**Description:** ${taskDescription}` : ''}
${contextSection}
**Rules:**
- Generate exactly ${count} subtasks (between 3-5 is acceptable)
- Each subtask must be specific and actionable — not vague
- Keep titles under 60 characters
- The FIRST subtask should be the easiest step to overcome inertia
- Make subtasks independent when possible (completing one shouldn't block another)
- Avoid meta-tasks like "plan" or "research" — focus on doing

**Output format:** One JSON object per line, each with "title" (string) and "description" (string, 1-2 sentences).

Example output:
{"title": "Buy ingredients at the grocery store", "description": "Get flour, sugar, eggs, butter, and vanilla extract. Check the pantry first to avoid duplicates."}
{"title": "Preheat oven and prep baking sheets", "description": "Set oven to 350F. Line two baking sheets with parchment paper."}

Now generate subtasks for the task above:`;
}

/**
 * Builds a prompt for regeneration that excludes pinned subtask titles.
 * Generates only enough new subtasks to fill the target count.
 */
export function buildRegenerationPrompt(
  taskTitle: string,
  taskDescription: string,
  parentContext: string,
  pinnedTitles: string[],
  newCount: number,
): string {
  const pinnedSection =
    pinnedTitles.length > 0
      ? `\n**Already kept subtasks (do NOT duplicate these):**\n${pinnedTitles.map((t) => `- ${t}`).join('\n')}\n`
      : '';

  return `Break down this task into ${newCount} NEW concrete, actionable subtasks.

**Task:** ${taskTitle}
${taskDescription ? `**Description:** ${taskDescription}` : ''}
${pinnedSection}
${parentContext ? `Additional context:\n${parentContext}\n` : ''}
**Rules:**
- Generate exactly ${newCount} NEW subtasks
- Do NOT repeat or closely duplicate the kept subtasks listed above
- Each subtask must be specific and actionable
- Keep titles under 60 characters
- Focus on different aspects of the task than the kept subtasks

**Output format:** One JSON object per line, each with "title" (string) and "description" (string, 1-2 sentences).

Now generate ${newCount} new subtasks:`;
}
