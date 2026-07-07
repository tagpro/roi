import type { ProviderAdapter } from '../types';
import spaceship from './spaceship';

/**
 * Provider registry. The UI renders one tab per entry, so adding a new input
 * format is a matter of writing one adapter module and appending it here.
 */
export const providers: ProviderAdapter[] = [spaceship];

export function getProvider(id: string): ProviderAdapter | undefined {
  return providers.find((p) => p.id === id);
}
