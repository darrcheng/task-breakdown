---
phase: quick
plan: 002
type: execute
wave: 1
depends_on: []
files_modified:
  - src/data/emoji-data.ts
  - src/components/ui/EmojiPicker.tsx
  - src/utils/categories.ts
  - src/components/ui/CategoryManager.tsx
  - src/components/task/CategoryCombobox.tsx
  - src/components/task/TaskCard.tsx
  - src/components/task/SubtaskList.tsx
  - src/components/list/TaskListItem.tsx
  - src/components/overdue/SomedayView.tsx
autonomous: true
requirements: [QUICK-002]
must_haves:
  truths:
    - "First tab shows existing Lucide icons (kept as-is, no migration)"
    - "Additional tabs show emoji categories (Smileys, Animals, Food, Activities, Objects, Symbols, Flags)"
    - "Icon field stores either a Lucide icon name OR an emoji character"
    - "All rendering sites handle both Lucide icons and emojis"
  artifacts:
    - path: "src/data/emoji-data.ts"
      provides: "Emoji dataset organized by category tabs"
    - path: "src/components/ui/EmojiPicker.tsx"
      provides: "Tabbed icon/emoji picker component with Icons tab first"
    - path: "src/utils/categories.ts"
      provides: "Updated with getCategoryIcon helper that renders both Lucide and emoji"
  key_links:
    - from: "src/components/ui/CategoryManager.tsx"
      to: "src/components/ui/EmojiPicker.tsx"
      via: "EmojiPicker rendered inline in add/edit form"
      pattern: "EmojiPicker"
    - from: "src/components/task/TaskCard.tsx"
      to: "src/utils/categories.ts"
      via: "getCategoryIcon helper"
      pattern: "getCategoryIcon"
---

<objective>
Expand the CategoryManager icon picker from a flat Lucide-only grid to a tabbed picker with the existing Lucide icons as the first tab and emoji categories as additional tabs. The `icon` field can store either a Lucide icon name (e.g. "briefcase") or an emoji character (e.g. "🐱"). All rendering sites must handle both types. NO migration of existing data — Lucide icons stay as they are.

Purpose: Give users access to the full emoji library while preserving existing Lucide icons.
Output: Tabbed EmojiPicker component, emoji dataset, updated rendering that handles both icon types.
</objective>

<execution_context>
@C:/Users/JenLab-User/.claude/get-shit-done/workflows/execute-plan.md
@C:/Users/JenLab-User/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/utils/categories.ts
@src/components/ui/CategoryManager.tsx
@src/components/task/CategoryCombobox.tsx
@src/types/index.ts

<interfaces>
<!-- Category type from src/types/index.ts -->
```typescript
export interface Category {
  id?: number;
  name: string;
  icon: string; // Lucide icon name (e.g. "briefcase") OR emoji character (e.g. "🐱")
  isDefault: boolean;
}
```

<!-- Current icon rendering pattern used in ~7 components -->
```typescript
// CURRENT:
import { CATEGORY_ICONS } from '../../utils/categories';
const IconComponent = CATEGORY_ICONS[cat.icon] || CATEGORY_ICONS['folder'];
<IconComponent className="w-5 h-5 text-slate-500" />

// NEW pattern:
import { renderCategoryIcon } from '../../utils/categories';
// returns either <LucideIcon .../> or <span>emoji</span>
{renderCategoryIcon(cat.icon, "w-5 h-5 text-slate-500")}
```

<!-- Components that render category icons (all need updating): -->
- src/components/ui/CategoryManager.tsx — lines 101, 117, 209
- src/components/task/CategoryCombobox.tsx — lines 158, 201
- src/components/task/TaskCard.tsx — lines 26-27
- src/components/task/SubtaskList.tsx — lines 145-146
- src/components/list/TaskListItem.tsx — lines 58-59
- src/components/overdue/SomedayView.tsx — line 19
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create emoji dataset and tabbed IconEmojiPicker component</name>
  <files>src/data/emoji-data.ts, src/components/ui/EmojiPicker.tsx, src/utils/categories.ts</files>
  <action>
**Step 1: Create `src/data/emoji-data.ts`**

Lightweight inline emoji dataset (~300 popular emojis). NO npm packages:

```typescript
export interface EmojiCategory {
  id: string;
  name: string;
  icon: string; // tab icon emoji
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  { id: 'smileys', name: 'Smileys', icon: '😀', emojis: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😋','😜','🤪','😝','🤗','🤭','🤫','🤔','🤐','😐','😑','😶','🙄','😏','😮','🤤','😴','🤒','🤮','🤑','🤠','😈','👿','👻','💀','👽','🤖','🎃','😺'] },
  { id: 'people', name: 'People', icon: '👋', emojis: ['👋','🤚','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','👏','🙌','👐','🤝','🙏','💪','🧠','👀','👁️','💋'] },
  { id: 'animals', name: 'Animals', icon: '🐱', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦅','🦆','🦉','🦇','🐺','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🐢','🐍','🐙','🐠','🐟','🐬','🐳','🦈'] },
  { id: 'food', name: 'Food', icon: '🍕', emojis: ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍒','🍑','🍍','🥝','🍅','🥑','🥦','🥒','🌽','🥕','🥔','🍞','🧀','🍖','🍗','🍔','🍟','🍕','🌭','🥪','🌮','🌯','🍜','🍝','🍣','🍱','🍩','🍪','🎂','🍰','🍫','🍬','☕','🍵','🥤','🍺','🍷'] },
  { id: 'activities', name: 'Activities', icon: '⚽', emojis: ['⚽','🏀','🏈','⚾','🎾','🏐','🎱','🏓','🏸','🥊','🎯','⛳','🏊','🏄','🚴','🏋️','🤸','🎮','🕹️','🎲','🧩','🎭','🎨','🎬','🎤','🎧','🎼','🎹','🎷','🎸','🎻'] },
  { id: 'travel', name: 'Travel', icon: '🚗', emojis: ['🚗','🚕','🚌','🏎️','🚓','🚑','🚒','🚜','🏍️','🚲','🚂','✈️','🚀','🛸','🚁','⛵','🚤','🏠','🏡','🏢','🏥','🏪','🏫','🏰','🗼','🗽','⛪','⛩️'] },
  { id: 'objects', name: 'Objects', icon: '💡', emojis: ['⌚','📱','💻','⌨️','🖥️','📷','📹','📞','📺','🔔','🔑','🔒','💡','🔦','📦','🛒','💰','💳','💎','🔧','🔨','⚙️','🔬','🔭','📡','💊','🧬'] },
  { id: 'symbols', name: 'Symbols', icon: '❤️', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💕','💗','💖','⭐','🌟','💫','✨','⚡','🔥','💥','🎉','🎊','🏆','🥇','🏅','✅','❌','❗','❓','♻️','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪'] },
  { id: 'flags', name: 'Flags', icon: '🏁', emojis: ['🏁','🚩','🎌','🏴','🏳️','🏳️‍🌈','🏴‍☠️','🇺🇸','🇬🇧','🇨🇦','🇦🇺','🇩🇪','🇫🇷','🇮🇹','🇪🇸','🇯🇵','🇰🇷','🇨🇳','🇮🇳','🇧🇷','🇲🇽'] },
];
```

**Step 2: Add `isEmoji` helper to `src/utils/categories.ts`**

Add this function (keep all existing exports unchanged):

```typescript
/**
 * Detect whether a string is an emoji (vs a Lucide icon name).
 * Emoji strings start with high Unicode codepoints; Lucide names are ASCII.
 */
export function isEmoji(icon: string): boolean {
  if (!icon) return false;
  const code = icon.codePointAt(0);
  return code !== undefined && code > 255;
}
```

**Step 3: Create `src/components/ui/EmojiPicker.tsx`**

A tabbed picker component: `EmojiPicker({ value, onChange })`

- **First tab: "Icons"** — renders the existing CATEGORY_ICONS from categories.ts as clickable Lucide icon buttons (same grid as current CategoryManager but inside the tab). Tab icon: use a generic Lucide icon like `<Grid3x3 />` or just the text "Aa".
- **Remaining tabs:** One per EMOJI_CATEGORIES entry, using the category's `icon` emoji as the tab label.
- Below tabs: a scrollable grid (CSS grid, ~8 columns, gap-1).
  - For the Icons tab: render each Lucide icon with its name as key. Clicking calls `onChange(iconName)`.
  - For emoji tabs: render emoji buttons. Clicking calls `onChange(emoji)`.
- The currently selected value (`value`) gets a highlight ring (blue-100 bg + blue-300 ring).
- For the Icons tab, detect selection by matching `value` against AVAILABLE_ICONS. For emoji tabs, match by string equality.
- Max height ~250px with overflow-y-auto on the grid.
- Tailwind styling: slate colors, rounded-md, text-sm tabs.
- Tab row: flex nowrap, overflow-x-auto, hide scrollbar. Active tab: border-b-2 border-blue-500.
- NO external dependencies.
- Use `useState` for active tab, default to "icons" tab.

Import CATEGORY_ICONS and AVAILABLE_ICONS from categories.ts for the first tab. Import EMOJI_CATEGORIES from emoji-data.ts for the rest.
  </action>
  <verify>
    <automated>cd C:/Users/JenLab-User/task-breakdown && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>EmojiPicker component renders with Icons tab (Lucide) first, then emoji tabs. Compiles without errors.</done>
</task>

<task type="auto">
  <name>Task 2: Integrate picker into CategoryManager and update all rendering sites</name>
  <files>src/components/ui/CategoryManager.tsx, src/utils/categories.ts, src/components/task/CategoryCombobox.tsx, src/components/task/TaskCard.tsx, src/components/task/SubtaskList.tsx, src/components/list/TaskListItem.tsx, src/components/overdue/SomedayView.tsx</files>
  <action>
**CRITICAL: No DB migration. No changes to DEFAULT_CATEGORIES. Existing Lucide icon names stay in the database as-is.**

**Step 1: Add `renderCategoryIcon` helper to `src/utils/categories.ts`**

Add a React helper function that handles both icon types:

```typescript
import { createElement } from 'react';

/**
 * Render a category icon — either a Lucide component or an emoji span.
 * @param icon - Lucide icon name or emoji character
 * @param className - Tailwind classes for Lucide icons (ignored for emoji)
 * @param emojiClassName - Optional Tailwind classes for emoji span (defaults to "text-base leading-none")
 */
export function renderCategoryIcon(
  icon: string,
  className: string = 'w-5 h-5 text-slate-500',
  emojiClassName: string = 'text-base leading-none'
): React.ReactNode {
  if (isEmoji(icon)) {
    return createElement('span', { className: emojiClassName, role: 'img' }, icon);
  }
  const IconComponent = CATEGORY_ICONS[icon] || CATEGORY_ICONS['folder'];
  return createElement(IconComponent, { className });
}
```

Note: Use `createElement` instead of JSX since this is a .ts file. Or if the file is already .tsx or can be renamed, use JSX directly. Check the actual file extension first.

**Step 2: Update `src/components/ui/CategoryManager.tsx`**

- Add import: `import { EmojiPicker } from './EmojiPicker'`
- Add import: `import { renderCategoryIcon } from '../../utils/categories'` (keep existing CATEGORY_ICONS import if EmojiPicker needs it passed as prop, but EmojiPicker imports it directly)
- Replace both icon grid blocks (`<div className="flex flex-wrap gap-1.5">...AVAILABLE_ICONS.map...</div>`) in edit and add forms with: `<EmojiPicker value={icon} onChange={setIcon} />`
- Replace `const IconComponent = CATEGORY_ICONS[cat.icon] || CATEGORY_ICONS['folder'];` and `<IconComponent className="w-5 h-5 text-slate-500 flex-shrink-0" />` with: `<span className="flex-shrink-0">{renderCategoryIcon(cat.icon, 'w-5 h-5 text-slate-500')}</span>`
- Default icon value: keep `AVAILABLE_ICONS[0]` (still "briefcase") — this is fine since Lucide icons are still the first tab

**Step 3: Update all other rendering sites**

For each file, replace the Lucide-only pattern with the dual-mode `renderCategoryIcon` helper:

```typescript
// BEFORE:
import { CATEGORY_ICONS } from '../../utils/categories';
const IconComponent = CATEGORY_ICONS[cat.icon] || CATEGORY_ICONS['folder'];
<IconComponent className="w-5 h-5 text-slate-500" />

// AFTER:
import { renderCategoryIcon } from '../../utils/categories';
{renderCategoryIcon(cat.icon, 'w-5 h-5 text-slate-500')}
```

Apply to:
- `src/components/task/CategoryCombobox.tsx` — two icon render sites (selected display + dropdown list)
- `src/components/task/TaskCard.tsx` — card icon display
- `src/components/task/SubtaskList.tsx` — subtask category icon
- `src/components/list/TaskListItem.tsx` — list item icon
- `src/components/overdue/SomedayView.tsx` — someday view icon

In each file:
- Replace `CATEGORY_ICONS` import with `renderCategoryIcon` import from the same path
- Remove the `const IconComponent = CATEGORY_ICONS[...]` line
- Replace `<IconComponent className="..." />` with `{renderCategoryIcon(cat.icon, '...')}`
- Keep the same className string that was on the Lucide icon

Clean up: remove unused CATEGORY_ICONS imports from updated files. Keep CATEGORY_ICONS export in categories.ts (EmojiPicker uses it).
  </action>
  <verify>
    <automated>cd C:/Users/JenLab-User/task-breakdown && npm run build 2>&1 | tail -20</automated>
  </verify>
  <done>Full build succeeds. CategoryManager shows tabbed picker with Icons first tab + emoji tabs. All rendering sites handle both Lucide and emoji icons. No DB migration needed. Existing categories unchanged.</done>
</task>

</tasks>

<verification>
1. `npm run build` completes with no errors
2. Open app, go to CategoryManager — verify first tab shows existing Lucide icons, additional tabs show emojis
3. Edit an existing category — verify its current Lucide icon is highlighted in the Icons tab
4. Pick an emoji from a non-default tab (e.g. Animals "🐱"), save — verify it displays correctly everywhere
5. Create a new category with a Lucide icon — verify it still works as before
6. Verify task cards, list items, combobox, someday view handle both icon types
</verification>

<success_criteria>
- Tabbed picker with Icons tab first (existing Lucide icons) + 9 emoji tabs
- Selecting a Lucide icon stores the icon name string (e.g. "briefcase") — same as before
- Selecting an emoji stores the emoji character (e.g. "🐱")
- All 6 rendering sites handle both types via renderCategoryIcon helper
- No DB migration, no changes to existing data
- No external emoji packages — pure inline dataset
- Build passes cleanly
</success_criteria>

<output>
After completion, create `.planning/quick/002-tabbed-emoji-picker/002-SUMMARY.md`
</output>
