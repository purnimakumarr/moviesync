import { PaletteOptions } from '@mui/material/styles';

export type PaletteKey = 'classic' | 'fantasy' | 'horror' | 'indie' | 'theatre' | 'melodic_haze';

// Every text/background pairing here meets WCAG AA (4.5:1 for text, 3:1 for
// accents and icons), and each `chart` colour passes the data-viz palette
// checks (lightness band, chroma, >=3:1) against its theme's background.
// `chart2` is the second chart hue; each chart/chart2 pair also passes the
// colour-blind and normal-vision separation checks.
export const PALETTES: Record<PaletteKey, PaletteOptions & { mode: 'light' | 'dark' }> = {
    // Dark Reel: a dark screening room with a crimson accent.
    horror: {
        mode: 'dark',
        primary: { main: '#D1213F', contrastText: '#FFFFFF' },
        secondary: { main: '#F2A65A' },
        background: { default: '#121216', primary: '#1D1D24', secondary: '#2A2A33', paper: '#1D1D24' },
        text: { primary: '#F4F1EC', secondary: '#B9B4AC', tertiary: '#FFFFFF' },
        searchBarBg: '#1D1D24',
        iconsColor: '#FFFFFF',
        iconsBackground: '#2A2A33',
        iconsBackgroundHover: '#8E1028',
        headerIconsBackground: '#8E1028',
        favouriteIcon: '#FF5A6E',
        watchLaterIcon: '#FFC145',
        watchedIcon: '#4CD787',
        chart: '#e66767',
        chart2: '#199e70',
    },
    // Broadway Lights: night-time marquee gold with a stage-red accent.
    theatre: {
        mode: 'dark',
        primary: { main: '#E3A72F', contrastText: '#1A1206' },
        secondary: { main: '#F25C54' },
        background: { default: '#14110F', primary: '#211C18', secondary: '#2E2721', paper: '#211C18' },
        text: { primary: '#F7EFE3', secondary: '#C2B5A3', tertiary: '#1A1206' },
        searchBarBg: '#211C18',
        iconsColor: '#1A1206',
        // iconsColor is dark ink for the gold header; the list buttons sit on
        // dark brown, so they get light icons (12.9:1 instead of 1.3:1).
        listIconColor: '#F7EFE3',
        iconsBackground: '#2E2721',
        iconsBackgroundHover: '#4A3F33',
        headerIconsBackground: '#B98419',
        favouriteIcon: '#FF5A6E',
        watchLaterIcon: '#FFC145',
        watchedIcon: '#4CD787',
        chart: '#c98500',
        chart2: '#9085e9',
    },
    // Timeless: warm film-noir paper, black and classic-Hollywood gold.
    classic: {
        mode: 'light',
        primary: { main: '#1F1F1F', contrastText: '#F6F5F2' },
        secondary: { main: '#9A7614' },
        background: { default: '#F6F5F2', primary: '#FFFFFF', secondary: '#3A3A3A', paper: '#FFFFFF' },
        text: { primary: '#1A1A1A', secondary: '#5A5852', tertiary: '#F6F5F2' },
        searchBarBg: '#FFFFFF',
        iconsColor: '#F6F5F2',
        iconsBackground: '#1F1F1F',
        iconsBackgroundHover: '#444444',
        headerIconsBackground: '#444444',
        favouriteIcon: '#D7263D',
        watchLaterIcon: '#B07400',
        watchedIcon: '#1F8A4C',
        chart: '#2a78d6',
        chart2: '#b07a00',
    },
    // Enchanted: soft lavender with deep violet.
    fantasy: {
        mode: 'light',
        primary: { main: '#5B2A86', contrastText: '#FFFFFF' },
        secondary: { main: '#8F5BD0' },
        background: { default: '#F7F4FB', primary: '#FFFFFF', secondary: '#43205F', paper: '#FFFFFF' },
        text: { primary: '#1E1530', secondary: '#5D5470', tertiary: '#FFFFFF' },
        searchBarBg: '#FFFFFF',
        iconsColor: '#FFFFFF',
        iconsBackground: '#5B2A86',
        iconsBackgroundHover: '#43205F',
        headerIconsBackground: '#43205F',
        favouriteIcon: '#D7263D',
        watchLaterIcon: '#B07400',
        watchedIcon: '#1F8A4C',
        chart: '#7B3FB8',
        chart2: '#d55181',
    },
    // Indie Flick: cream film stock, teal-green and terracotta.
    indie: {
        mode: 'light',
        primary: { main: '#2F5D50', contrastText: '#FFFFFF' },
        secondary: { main: '#C4573C' },
        background: { default: '#F4EFE6', primary: '#FBF8F2', secondary: '#24483E', paper: '#FFFFFF' },
        text: { primary: '#2B2621', secondary: '#6B6158', tertiary: '#FFFFFF' },
        searchBarBg: '#FBF8F2',
        iconsColor: '#FFFFFF',
        iconsBackground: '#2F5D50',
        iconsBackgroundHover: '#1F3F36',
        headerIconsBackground: '#1F3F36',
        favouriteIcon: '#D7263D',
        watchLaterIcon: '#B07400',
        watchedIcon: '#1F8A4C',
        chart: '#1a8a6e',
        chart2: '#C4573C',
    },
    // Scarlet Frames: blush paper with wine red.
    melodic_haze: {
        mode: 'light',
        primary: { main: '#8E1B3A', contrastText: '#FFFFFF' },
        secondary: { main: '#C2416A' },
        background: { default: '#FBF3F4', primary: '#FFFFFF', secondary: '#6B1129', paper: '#FFFFFF' },
        text: { primary: '#2A1218', secondary: '#6E5258', tertiary: '#FFFFFF' },
        searchBarBg: '#FFFFFF',
        iconsColor: '#FFFFFF',
        iconsBackground: '#8E1B3A',
        iconsBackgroundHover: '#6B1129',
        headerIconsBackground: '#6B1129',
        favouriteIcon: '#D7263D',
        watchLaterIcon: '#B07400',
        watchedIcon: '#1F8A4C',
        chart: '#B03052',
        chart2: '#6250d6',
    },
};

// Colours previewed in the theme picker.
export const paletteSwatches = (key: PaletteKey) => {
    const palette = PALETTES[key] as {
        primary: { main: string };
        secondary: { main: string };
        background: { default: string; primary: string };
        headerIconsBackground: string;
    };
    return [palette.primary.main, palette.headerIconsBackground, palette.secondary.main, palette.background.default];
};
