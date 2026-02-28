import { useState, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Trash2, Check } from 'lucide-react';
import clsx from 'clsx';

interface SwipeableTaskRowProps {
  children: React.ReactNode;
  onComplete: () => void;
  onDelete: () => void;
  isCompleted?: boolean;
}

const ACTION_WIDTH = 140; // Width of revealed action area (two buttons)

/**
 * Wraps a task row with swipe-to-reveal action buttons (Delete and Done).
 * Swipe left to reveal, swipe right or tap to hide.
 * Like iOS Mail swipe actions.
 */
export function SwipeableTaskRow({ children, onComplete, onDelete, isCompleted }: SwipeableTaskRowProps) {
  const [revealed, setRevealed] = useState(false);
  const [swiping, setSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      eventData.event.stopPropagation();
      if (eventData.dir === 'Left') {
        setSwiping(true);
        setSwipeOffset(Math.min(eventData.absX, ACTION_WIDTH));
      } else if (eventData.dir === 'Right' && revealed) {
        setSwiping(true);
        setSwipeOffset(Math.max(ACTION_WIDTH - eventData.absX, 0));
      }
    },
    onSwipedLeft: () => {
      setSwiping(false);
      if (swipeOffset > ACTION_WIDTH * 0.4) {
        setRevealed(true);
        setSwipeOffset(ACTION_WIDTH);
      } else {
        setRevealed(false);
        setSwipeOffset(0);
      }
    },
    onSwipedRight: () => {
      setSwiping(false);
      setRevealed(false);
      setSwipeOffset(0);
    },
    delta: 20,
    trackTouch: true,
    trackMouse: false,
    touchEventOptions: { passive: false },
  });

  const handleComplete = useCallback(() => {
    setRevealed(false);
    setSwipeOffset(0);
    onComplete();
  }, [onComplete]);

  const handleDelete = useCallback(() => {
    setRevealed(false);
    setSwipeOffset(0);
    onDelete();
  }, [onDelete]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Action buttons (behind the row) */}
      <div className="absolute inset-y-0 right-0 flex">
        {!isCompleted && (
          <button
            onClick={handleComplete}
            className="w-[70px] flex items-center justify-center bg-emerald-500 text-white rounded-lg"
          >
            <Check className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="w-[70px] flex items-center justify-center bg-red-500 text-white rounded-lg"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Sliding content — its rounded corners create convex curves against action buttons */}
      <div
        {...handlers}
        className={clsx(
          'relative bg-white rounded-lg',
          !swiping && 'transition-transform duration-200 ease-out'
        )}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
