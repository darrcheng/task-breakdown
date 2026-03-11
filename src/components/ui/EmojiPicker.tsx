import { useState } from 'react';
import { Grid3X3 } from 'lucide-react';
import clsx from 'clsx';
import { CATEGORY_ICONS, AVAILABLE_ICONS, isEmoji } from '../../utils/categories';
import { EMOJI_CATEGORIES } from '../../data/emoji-data';

interface EmojiPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [activeTab, setActiveTab] = useState<string>('icons');

  // Determine if the current value is a Lucide icon name
  const isLucideValue = !isEmoji(value) && AVAILABLE_ICONS.includes(value);

  return (
    <div className="space-y-2">
      {/* Tab row */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-slate-200" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {/* Icons tab */}
        <button
          onClick={() => setActiveTab('icons')}
          className={clsx(
            'flex items-center justify-center px-2.5 py-1.5 text-sm flex-shrink-0 transition-colors',
            activeTab === 'icons'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-slate-400 hover:text-slate-600'
          )}
          title="Icons"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>

        {/* Emoji category tabs */}
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={clsx(
              'flex items-center justify-center px-2.5 py-1.5 text-sm flex-shrink-0 transition-colors',
              activeTab === cat.id
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-slate-400 hover:text-slate-600'
            )}
            title={cat.name}
          >
            <span className="text-base leading-none">{cat.icon}</span>
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="max-h-[250px] overflow-y-auto">
        {activeTab === 'icons' ? (
          <div className="grid grid-cols-8 gap-1">
            {AVAILABLE_ICONS.map((iconName) => {
              const Ic = CATEGORY_ICONS[iconName];
              return (
                <button
                  key={iconName}
                  onClick={() => onChange(iconName)}
                  className={clsx(
                    'p-1.5 rounded-md transition-colors',
                    isLucideValue && value === iconName
                      ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-300'
                      : 'hover:bg-slate-100 text-slate-500'
                  )}
                  title={iconName}
                  type="button"
                >
                  <Ic className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        ) : (
          (() => {
            const emojiCat = EMOJI_CATEGORIES.find((c) => c.id === activeTab);
            if (!emojiCat) return null;
            return (
              <div className="grid grid-cols-8 gap-1">
                {emojiCat.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => onChange(emoji)}
                    className={clsx(
                      'p-1.5 rounded-md transition-colors text-lg leading-none',
                      !isLucideValue && value === emoji
                        ? 'bg-blue-100 ring-2 ring-blue-300'
                        : 'hover:bg-slate-100'
                    )}
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
