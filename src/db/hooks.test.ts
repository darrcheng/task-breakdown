import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('hooks.ts (SYNC-03 guard)', () => {
  const hooksContent = readFileSync(
    resolve(__dirname, 'hooks.ts'),
    'utf-8'
  );

  it('exports only useLiveQuery-based hooks (no firebase/firestore imports)', () => {
    expect(hooksContent).not.toMatch(/from.*firebase|from.*firestore/);
  });

  it('does not contain onSnapshot calls', () => {
    expect(hooksContent).not.toMatch(/onSnapshot/);
  });

  it('still uses useLiveQuery from Dexie', () => {
    expect(hooksContent).toMatch(/useLiveQuery/);
  });
});
