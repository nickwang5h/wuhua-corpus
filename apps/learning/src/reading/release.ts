import releases from '../../content/learning-release.json';
import type {Reading} from './schema';
export function isReleased(reading: Reading) {
  return reading.review.status !== 'withdrawn' && releases.some(r => r.id === reading.id && r.version === reading.version);
}
