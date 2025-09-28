/**
 * Emotion theme type declarations
 */

import '@emotion/react';
import { type ThemeType } from './theme.js';

declare module '@emotion/react' {
   
  export interface Theme extends ThemeType {}
}
