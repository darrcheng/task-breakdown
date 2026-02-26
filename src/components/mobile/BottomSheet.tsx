import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import clsx from 'clsx';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Height as percentage of viewport (default: 85) */
  height?: number;
}

/**
 * Mobile bottom sheet overlay with drag-to-dismiss.
 * Uses CSS transforms for GPU-accelerated dragging.
 * No animation library needed — pure CSS transitions.
 */
export function BottomSheet({ isOpen, onClose, children, height = 85 }: BottomSheetProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Reset drag offset when closing
  useEffect(() => {
    if (!isOpen) {
      setDragOffset(0);
      setIsDragging(false);
    }
  }, [isOpen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const deltaY = e.touches[0].clientY - dragStartY.current;
    // Only allow downward drag (positive deltaY)
    if (deltaY > 0) {
      setDragOffset(deltaY);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    // If dragged more than 30% of sheet height, close it
    const threshold = (window.innerHeight * height) / 100 * 0.3;
    if (dragOffset > threshold) {
      onClose();
    }
    setDragOffset(0);
  }, [dragOffset, height, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={clsx(
          'fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl',
          !isDragging && 'transition-transform duration-300 ease-out'
        )}
        style={{
          height: `${height}dvh`,
          transform: `translateY(${dragOffset}px)`,
        }}
      >
        {/* Drag handle */}
        <div
          className="flex items-center justify-center py-3 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto px-4 pb-[env(safe-area-inset-bottom)]"
          style={{ height: 'calc(100% - 2.5rem)' }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
