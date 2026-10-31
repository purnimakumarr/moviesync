import React from 'react';
import { PaletteKey } from './palettes';

interface ThemeContextType {
  changePalette: (newPalette: PaletteKey) => void;
  selectedPalette: PaletteKey;
}

export const ThemeContext = React.createContext<ThemeContextType>({
  changePalette: () => {},
  selectedPalette: 'theatre',
});
