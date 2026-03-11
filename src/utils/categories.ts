import {
  Briefcase,
  User,
  Heart,
  BookOpen,
  ShoppingCart,
  Folder,
  Star,
  Zap,
  Home,
  Coffee,
  Music,
  Camera,
  Globe,
  Rocket,
  Lightbulb,
  Palette,
  Wrench,
  Phone,
  Mail,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import type { TaskStatus } from '../types';

/**
 * Default category presets matching the database seed data.
 */
export const DEFAULT_CATEGORIES = [
  { name: 'Work', icon: 'briefcase', isDefault: true },
  { name: 'Personal', icon: 'user', isDefault: true },
  { name: 'Health', icon: 'heart', isDefault: true },
  { name: 'Learning', icon: 'book-open', isDefault: true },
  { name: 'Errands', icon: 'shopping-cart', isDefault: true },
] as const;

/**
 * Map of icon string names to lucide-react component references.
 * Used by TaskCard and CategoryManager to render category icons.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  user: User,
  heart: Heart,
  'book-open': BookOpen,
  'shopping-cart': ShoppingCart,
  folder: Folder,
  star: Star,
  zap: Zap,
  home: Home,
  coffee: Coffee,
  music: Music,
  camera: Camera,
  globe: Globe,
  rocket: Rocket,
  lightbulb: Lightbulb,
  palette: Palette,
  wrench: Wrench,
  phone: Phone,
  mail: Mail,
  'map-pin': MapPin,
};

/**
 * Available icon names for the category icon selector.
 */
export const AVAILABLE_ICONS = Object.keys(CATEGORY_ICONS);

/**
 * Status color mapping with ADHD-friendly accessible palette.
 * - todo: neutral, calm (slate)
 * - in-progress: warm, active (amber)
 * - done: positive, complete (emerald)
 */
export const STATUS_COLORS: Record<
  TaskStatus,
  { bg: string; border: string; text: string }
> = {
  todo: {
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    text: 'text-slate-700',
  },
  'in-progress': {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-800',
  },
  done: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
  },
};

/**
 * Detect whether a string is an emoji (vs a Lucide icon name).
 * Emoji strings start with high Unicode codepoints; Lucide names are ASCII.
 */
export function isEmoji(icon: string): boolean {
  if (!icon) return false;
  const code = icon.codePointAt(0);
  return code !== undefined && code > 255;
}

/**
 * Returns the next status in the cycle: todo -> in-progress -> done -> todo
 */
export function getNextStatus(current: TaskStatus): TaskStatus {
  const cycle: TaskStatus[] = ['todo', 'in-progress', 'done'];
  const idx = cycle.indexOf(current);
  return cycle[(idx + 1) % cycle.length];
}
