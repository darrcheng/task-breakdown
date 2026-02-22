import { useState } from 'react';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { db } from '../../db/database';
import { useCategories } from '../../db/hooks';
import { CATEGORY_ICONS, AVAILABLE_ICONS } from '../../utils/categories';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const categories = useCategories();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(AVAILABLE_ICONS[0]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  if (!isOpen) return null;

  const startAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setName('');
    setIcon(AVAILABLE_ICONS[0]);
  };

  const startEdit = (cat: { id?: number; name: string; icon: string }) => {
    if (!cat.id) return;
    setEditingId(cat.id);
    setIsAdding(false);
    setName(cat.name);
    setIcon(cat.icon);
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    if (editingId) {
      await db.categories.update(editingId, {
        name: name.trim(),
        icon,
      });
      setEditingId(null);
    } else {
      await db.categories.add({
        name: name.trim(),
        icon,
        isDefault: false,
      });
      setIsAdding(false);
    }
    setName('');
    setIcon(AVAILABLE_ICONS[0]);
  };

  const handleDelete = async (id: number) => {
    if (confirmDeleteId === id) {
      await db.categories.delete(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setIcon(AVAILABLE_ICONS[0]);
    setConfirmDeleteId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Categories</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {categories?.map((cat) => {
            const IconComponent = CATEGORY_ICONS[cat.icon] || CATEGORY_ICONS['folder'];
            const isEditing = editingId === cat.id;

            if (isEditing) {
              return (
                <div key={cat.id} className="p-3 border border-blue-200 rounded-lg bg-blue-50/50 space-y-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                    placeholder="Category name"
                    autoFocus
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_ICONS.map((iconName) => {
                      const Ic = CATEGORY_ICONS[iconName];
                      return (
                        <button
                          key={iconName}
                          onClick={() => setIcon(iconName)}
                          className={clsx(
                            'p-1.5 rounded-md transition-colors',
                            icon === iconName
                              ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-300'
                              : 'hover:bg-slate-100 text-slate-500'
                          )}
                          title={iconName}
                        >
                          <Ic className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={cat.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 group transition-colors"
              >
                <IconComponent className="w-5 h-5 text-slate-500 flex-shrink-0" />
                <span className="flex-1 text-sm font-medium text-slate-700">
                  {cat.name}
                </span>
                {cat.isDefault && (
                  <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">
                    Default
                  </span>
                )}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Edit category"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => cat.id && handleDelete(cat.id)}
                    className={clsx(
                      'p-1 rounded transition-colors',
                      confirmDeleteId === cat.id
                        ? 'bg-red-100 text-red-600'
                        : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600'
                    )}
                    title={
                      confirmDeleteId === cat.id
                        ? 'Click again to confirm delete'
                        : 'Delete category'
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add form */}
          {isAdding && (
            <div className="p-3 border border-blue-200 rounded-lg bg-blue-50/50 space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none"
                placeholder="Category name"
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_ICONS.map((iconName) => {
                  const Ic = CATEGORY_ICONS[iconName];
                  return (
                    <button
                      key={iconName}
                      onClick={() => setIcon(iconName)}
                      className={clsx(
                        'p-1.5 rounded-md transition-colors',
                        icon === iconName
                          ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-300'
                          : 'hover:bg-slate-100 text-slate-500'
                      )}
                      title={iconName}
                    >
                      <Ic className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isAdding && !editingId && (
          <div className="px-5 py-3 border-t border-slate-200">
            <button
              onClick={startAdd}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 rounded-md hover:bg-blue-50 transition-colors w-full"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
