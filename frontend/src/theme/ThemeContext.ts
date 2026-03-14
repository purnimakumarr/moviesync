import React from 'react';

type PaletteKeys =
  | 'classic'
  | 'fantasy'
  | 'horror'
  | 'indie'
  | 'theatre'
  | 'melodic_haze';

interface ThemeContextType {
  changePalette: (newPalette: PaletteKeys) => void;
  selectedPalette: PaletteKeys;
}

export const ThemeContext = React.createContext<ThemeContextType>({
  changePalette: () => {},
  selectedPalette: 'indie',
});
