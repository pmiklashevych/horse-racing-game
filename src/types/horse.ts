import type { HorseBreed } from './horse-breed';
import type { HorseColor } from './horse-color';

export interface Horse {
  id: string;
  name: string;
  breed: HorseBreed;
  color: HorseColor;
  condition: number; // 5-100 step 5
}
