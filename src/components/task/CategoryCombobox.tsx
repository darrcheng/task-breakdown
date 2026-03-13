import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import clsx from 'clsx';
import { db } from '../../db/database';
import { useCategories } from '../../db/hooks';
import { renderCategoryIcon } from '../../utils/categories';

const RECENT_KEY = 'taskbreaker-recent-categories';
const MAX_RECENT = 3;

function getRecentIds(): number[] {
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentId(id: number) {
  const recent = getRecentIds().filter(r => r !== id);
  recent.unshift(id);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

interface CategoryComboboxProps {
  value: number;
  onChange: (id: number) => void;
}

export function CategoryCombobox({ value, onChange }: CategoryComboboxProps) {
  const categories = useCategories();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedCategory = useMemo(
    () => categories?.find(c => c.id === value),
    [categories, value]
  );

  const filtered = useMemo(() => {
    if (!categories) return [];
    const recentIds = getRecentIds();
    let result = [...categories];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }

    // Sort: recent first, then alphabetical
    result.sort((a, b) => {
      const aRecent = recentIds.indexOf(a.id ?? -1);
      const bRecent = recentIds.indexOf(b.id ?? -1);
      if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;
      if (aRecent !== -1) return -1;
      if (bRecent !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [categories, search]);

  const showCreate = useMemo(
    () => search.trim() && !filtered.some(c => c.name.toLowerCase() === search.trim().toLowerCase()),
    [search, filtered]
  );

  const totalOptions = filtered.length + (showCreate ? 1 : 0);

  const handleSelect = useCallback((id: number) => {
    saveRecentId(id);
    onChange(id);
    setSearch('');
    setIsOpen(false);
    setHighlightIndex(-1);
  }, [onChange]);

  const handleCreate = useCallback(async () => {
    const id = await db.categories.add({
      name: search.trim(),
      icon: 'folder',
      isDefault: false,
    });
    saveRecentId(id as number);
    onChange(id as number);
    setSearch('');
    setIsOpen(false);
    setHighlightIndex(-1);
  }, [search, onChange]);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsOpen(false);
      setSearch('');
      setHighlightIndex(-1);
    }, 150);
  }, []);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(0);
    setSearch('');
    setIsOpen(false);
    setHighlightIndex(-1);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => (prev + 1) % totalOptions);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => (prev - 1 + totalOptions) % totalOptions);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          const cat = filtered[highlightIndex];
          if (cat.id) handleSelect(cat.id);
        } else if (highlightIndex === filtered.length && showCreate) {
          handleCreate();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearch('');
        setHighlightIndex(-1);
        break;
    }
  }, [isOpen, totalOptions, highlightIndex, filtered, showCreate, handleSelect, handleCreate]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  return (
    <div className="relative">
      {!isOpen && selectedCategory && (
        <span className="absolute left-2.5 top-2.5 pointer-events-none z-10">
          {renderCategoryIcon(selectedCategory.icon, 'w-4 h-4 text-slate-500')}
        </span>
      )}
      {!isOpen && selectedCategory && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-2.5 p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors z-10"
          aria-label="Clear category"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        value={isOpen ? search : (selectedCategory?.name ?? '')}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => {
          setIsOpen(true);
          setSearch('');
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Select category..."
        className={clsx(
          "w-full py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none",
          !isOpen && selectedCategory ? "pl-8 pr-8" : "px-3"
        )}
      />

      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          {filtered.map((cat, idx) => (
              <div
                key={cat.id}
                role="option"
                aria-selected={cat.id === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (cat.id) handleSelect(cat.id);
                }}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 cursor-pointer text-sm',
                  highlightIndex === idx
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50',
                  cat.id === value && 'font-medium'
                )}
              >
                <span className="flex-shrink-0">{renderCategoryIcon(cat.icon, 'w-4 h-4 text-slate-500')}</span>
                <span>{cat.name}</span>
              </div>
          ))}

          {showCreate && (
            <div
              role="option"
              aria-selected={false}
              onMouseDown={(e) => {
                e.preventDefault();
                handleCreate();
              }}
              onMouseEnter={() => setHighlightIndex(filtered.length)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 cursor-pointer text-sm border-t border-slate-100',
                highlightIndex === filtered.length
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>Create &ldquo;{search.trim()}&rdquo;</span>
            </div>
          )}

          {filtered.length === 0 && !showCreate && (
            <div className="px-3 py-2 text-sm text-slate-400 italic">
              No categories found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
