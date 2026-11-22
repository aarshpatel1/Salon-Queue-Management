/**
 * Format seconds into HH:MM:SS if total duration is 1 hour or more,
 * otherwise MM:SS.
 * 
 * Examples:
 *  - 45s => "00:45"
 *  - 14m 20s => "14:20"
 *  - 1h 5m 12s => "01:05:12"
 *  - 2h 0m 0s => "02:00:00"
 */
export const formatTimer = (totalSec) => {
  const sec = Math.max(0, Math.floor(totalSec || 0));
  const hours = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default formatTimer;
