/**
 * Trigger haptic feedback on supported devices.
 * Falls back silently on devices without vibration hardware.
 *
 * @param pattern - Vibration duration in ms, or array of [vibrate, pause, vibrate, ...]
 */
export function hapticFeedback(pattern: number | number[] = 10): void {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail — some browsers block vibrate() without user gesture
    }
  }
}
