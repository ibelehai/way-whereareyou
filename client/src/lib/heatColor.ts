// Exact implementation from specification
import { PRIMARY_COLOR, lightenColor } from '../theme';

function interpolateColor(
  t: number,
  cold = [59, 130, 246], // blue
  warm = [239, 68, 68]   // red
): string {
  const r = Math.round(cold[0] + t * (warm[0] - cold[0]));
  const g = Math.round(cold[1] + t * (warm[1] - cold[1]));
  const b = Math.round(cold[2] + t * (warm[2] - cold[2]));
  return `rgb(${r}, ${g}, ${b})`;
}

export function heatColor(count: number, min: number, max: number, baseColor: string = PRIMARY_COLOR): string {
  if (count === 0 || max === 0) return lightenColor(baseColor, 0.5);
  const range = Math.max(max - min, 0);
  const t = range > 0 ? (count - min) / range : 0;
  return interpolateColor(Math.min(1, Math.max(0, t)));
}
