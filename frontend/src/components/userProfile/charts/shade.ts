import { alpha } from '@mui/material/styles';

// Lightest shade for the smallest value. Painted over the card, 0.62 of the
// hue still clears 2:1 contrast on every theme (the ordinal floor), so even
// the shortest bar stays visible.
const MIN_WEIGHT = 0.62;

// More is stronger: darker on light themes, brighter on dark ones.
export const shadeFor = (hue: string, value: number, max: number) =>
    alpha(hue, MIN_WEIGHT + (1 - MIN_WEIGHT) * (max > 0 ? value / max : 0));
