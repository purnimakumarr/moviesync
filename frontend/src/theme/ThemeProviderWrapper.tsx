import { createTheme, Palette, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { ThemeContext } from './ThemeContext';

declare module "@mui/material/styles" {
    interface TypeBackground {
        primary: string;
        secondary: string;
    }
    interface TypeText {
        primary: string;
        secondary: string;
        tertiary: string;
    }
    interface Palette {
        watchLaterIcon: string;
        watchedIcon: string;
        favouriteIcon: string;
        iconsColor: string;
        iconsBackground: string;
        iconsBackgroundHover: string;
        headerIconsBackground: string;
        searchBarBg: string;
        background: TypeBackground;
        text: TypeText;
    }
    interface PaletteOptions {
        watchLaterIcon?: string;
        watchedIcon?: string;
        favouriteIcon?: string;
        iconsColor?: string;
        iconsBackground?: string;
        iconsBackgroundHover?: string;
        headerIconsBackground?: string;
        searchBarBg?: string;
    }
}

type PaletteKeys = 'classic' | 'fantasy' | 'horror' | 'indie' | 'theatre' | 'melodic_haze';

const palettes: Record<PaletteKeys, object> = {
    fantasy: {
        primary: { main: '#7B1FA2' },
        secondary: { main: '#CFA1E1' },
        searchBarBg: '#FFEBEE',
        iconsColor: '#F3E5F5',
        iconsBackground: '#7B1FA2',
        iconsBackgroundHover: '#4A0E61',
        headerIconsBackground: '#4A0E61',
        background: { default: '#FFEBEE', primary: '#FFDFEF', secondary: '#6A1B9A', paper: '#FFEBEE', },
        text: { primary: '#000000', secondary: '#000000', tertiary: '#ffffff' },
        watchLaterIcon: "#FFD700",
        watchedIcon: "#00C853",
        favouriteIcon: "#FF1744"
    },
    indie: {
        primary: { main: '#795548' },
        secondary: { main: '#FFDCD6' },
        searchBarBg: '#FFEBEE',
        iconsColor: '#EFEBE9',
        iconsBackground: '#4E342E',
        iconsBackgroundHover: "#3E2723",
        headerIconsBackground: '#3E2723',
        background: { default: '#FFEBEE', primary: '#D7CCC8', secondary: '#4E342E', paper: '#FFEBEE' },
        text: { primary: '#121212', secondary: '#121212', tertiary: '#EFEBE9' },
        watchLaterIcon: "#FFD700",
        watchedIcon: "#00C853",
        favouriteIcon: "#FF1744"
    },
    horror: {
        primary: { main: '#B71C1C' },
        secondary: { main: '#DE8585' },
        searchBarBg: '#212121',
        iconsColor: '#ffffff',
        iconsBackground: '#313131',
        iconsBackgroundHover: '#212121',
        headerIconsBackground: '#000000',
        background: { default: '#212121', primary: '#484848', secondary: '#000000', paper: '#212121' },
        text: { primary: '#FFEBEE', secondary: '#FFEBEE', tertiary: '#FFEBEE' },
        watchLaterIcon: "#FFD700",
        watchedIcon: "#00C853",
        favouriteIcon: "#D50000"
    },
    theatre: {
        primary: { main: '#FF9800' },
        secondary: { main: '#FFD699' },
        searchBarBg: '#FFEBEE',
        iconsColor: '#121212',
        iconsBackground: '#FF9800',
        iconsBackgroundHover: "#E68900",
        headerIconsBackground: '#E65100',
        background: { default: '#FFEBEE', primary: '#FFEFD6', secondary: '#FF9800', paper: '#FFEBEE' },
        text: { primary: '#121212', secondary: '#121212', tertiary: '#121212' },
        watchLaterIcon: "#FFD700",
        watchedIcon: "#00C853",
        favouriteIcon: "#D50000"
    },
    classic: {
        primary: { main: '#1B1B1B' },
        secondary: { main: '#A1A1A1' },
        searchBarBg: '#f5f5f5',
        iconsColor: '#D1D1D1',
        iconsBackground: '#252525',
        iconsBackgroundHover: "#000000",
        headerIconsBackground: '#4F4F4F',
        background: { default: '#f5f5f5', primary: '#D1D1D1', secondary: '#4F4F4F', paper: '#f5f5f5' },
        text: { primary: '#1B1B1B', secondary: '#1B1B1B', tertiary: '#D1D1D1' },
        watchLaterIcon: "#FFD700",
        watchedIcon: "#00C853",
        favouriteIcon: "#FF1744"
    },
    melodic_haze: {
        primary: { main: '#3D0301' },
        secondary: { main: '#E9889D' },
        searchBarBg: '#F9E5EB',
        iconsColor: '#F3E5F5',
        iconsBackground: '#630F1C',
        iconsBackgroundHover: '#3D0301',
        headerIconsBackground: '#B03052',
        background: { default: '#FFEBEE', primary: '#F9E5EB', secondary: '#B03052', paper: '#FFEBEE' },
        text: { primary: '#000000', secondary: '#000000', tertiary: '#ffffff' },
        watchLaterIcon: "#FFD700",
        watchedIcon: "#00C853",
        favouriteIcon: "#FF1744"
    }
};

const ThemeProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [palette, setPalette] = useState<PaletteKeys>(() => {
        return localStorage.getItem('palette') as PaletteKeys || 'horror' as PaletteKeys
    });

    const changePalette = (newPalette: PaletteKeys) => {
        setPalette(newPalette);
    };

    const selectedPalette = palettes[palette] as Palette;

    const theme = useMemo(
        () => createTheme({
            palette: {
                ...palettes[palette]
            },
            typography: {
                fontFamily: "'DM Sans', sans-serif",
            },
            components: {
                MuiOutlinedInput: {
                    styleOverrides: {
                        root: {
                            backgroundColor: palette === 'horror' as PaletteKeys ? '#121212' : '#ffffff',
                            borderRadius: "12px",
                            border: 'none',
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: selectedPalette.primary,
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: selectedPalette.primary,
                            },
                        },
                        input: {
                            color: palette === 'horror' as PaletteKeys ? '#ffffff' : '#121212',
                            fontWeight: 500
                        },
                    },
                },
                MuiSelect: {
                    styleOverrides: {
                        icon: {
                            color: palette === 'horror' as PaletteKeys ? '#ffffff' : '#121212',
                        },
                        root: {
                            backgroundColor: palette === 'horror' as PaletteKeys ? '#121212' : '#ffffff',
                            borderRadius: "12px",
                            color: palette === 'horror' as PaletteKeys ? '#ffffff' : '#121212',
                            border: 'none',
                        },
                    },
                },
                MuiInputLabel: {
                    styleOverrides: {
                        root: {
                            color: palette === 'horror' as PaletteKeys ? '#ffffff' : '#121212',
                            fontWeight: 500

                        },
                    },
                },
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            backgroundColor: palette === 'horror' as PaletteKeys ? '#000000' : '#ffffff',
                            color: palette === 'horror' as PaletteKeys ? '#ffffff' : '#121212',
                            borderRadius: "12px",
                        },
                    },
                },
                MuiMenuItem: {
                    styleOverrides: {
                        root: {
                            fontSize: "16px",
                            color: palette === 'horror' as PaletteKeys ? '#ffffff' : '#121212',
                            "&:hover": {
                                backgroundColor: palette === 'horror' as PaletteKeys ? '#000000' : '#ffffff',
                                color: palette === 'horror' as PaletteKeys ? '#ffffff' : '#121212',
                            },
                            "&.Mui-selected": {
                                backgroundColor: palette === 'horror' as PaletteKeys ? '#000000' : '#ffffff',
                                color: palette === 'horror' as PaletteKeys ? '#ffffff' : '#121212',
                            },
                        },
                    },
                },
                MuiButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: "12px",
                            padding: "12px 24px",
                            fontWeight: "bold",
                            borderWidth: '2px',
                        },
                    },
                },
            },
        }),
        [palette, selectedPalette.primary]
    );

    return (
        <ThemeContext.Provider value={{ changePalette, selectedPalette: palette }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

export default ThemeProviderWrapper;


