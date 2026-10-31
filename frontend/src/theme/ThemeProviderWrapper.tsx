import { alpha, createTheme, responsiveFontSizes, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { ThemeContext } from './ThemeContext';
import { PaletteKey, PALETTES } from './palettes';

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
        // Inactive favourite / watch later / watched buttons, when iconsColor
        // (ink for the header and other themed bars) is not legible on them.
        listIconColor?: string;
        iconsBackground: string;
        iconsBackgroundHover: string;
        headerIconsBackground: string;
        searchBarBg: string;
        // Single data hue for charts; validated (lightness, chroma, >=3:1
        // contrast) against this theme's surface.
        chart: string;
        chart2: string;
        background: TypeBackground;
        text: TypeText;
    }
    interface PaletteOptions {
        watchLaterIcon?: string;
        watchedIcon?: string;
        favouriteIcon?: string;
        iconsColor?: string;
        listIconColor?: string;
        iconsBackground?: string;
        iconsBackgroundHover?: string;
        headerIconsBackground?: string;
        searchBarBg?: string;
        chart?: string;
        chart2?: string;
    }
}

const DEFAULT_PALETTE: PaletteKey = 'theatre';

const storedPalette = (): PaletteKey => {
    try {
        const stored = localStorage.getItem('palette');
        return stored && stored in PALETTES ? (stored as PaletteKey) : DEFAULT_PALETTE;
    } catch {
        return DEFAULT_PALETTE;
    }
};

const ThemeProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [palette, setPalette] = useState<PaletteKey>(storedPalette);

    const changePalette = (newPalette: PaletteKey) => {
        setPalette(newPalette);
        try {
            localStorage.setItem('palette', newPalette);
        } catch {
            // Private mode or blocked storage: the choice just won't persist.
        }
    };

    const theme = useMemo(() => {
        const options = PALETTES[palette];
        const isDark = options.mode === 'dark';
        const colours = options as typeof options & {
            primary: { main: string };
            background: { default: string; primary: string };
            text: { primary: string; secondary: string };
        };
        const ink = colours.text.primary;
        // Fields sit on cards, so they take the page colour on dark themes
        // and white on light ones.
        const fieldBg = isDark ? colours.background.default : '#FFFFFF';
        const surface = isDark ? colours.background.primary : '#FFFFFF';
        const accent = colours.primary.main;

        // responsiveFontSizes scales headings down on small screens.
        return responsiveFontSizes(createTheme({
            palette: options,
            // A compact type scale: MUI's defaults (34px page titles, 16px body)
            // felt oversized, especially on laptops.
            typography: {
                fontFamily: "'DM Sans', sans-serif",
                h1: { fontSize: '3rem' },
                h2: { fontSize: '2.25rem' },
                h3: { fontSize: '1.875rem', fontWeight: 800 },
                h4: { fontSize: '1.625rem', fontWeight: 800 },
                h5: { fontSize: '1.25rem', fontWeight: 700 },
                h6: { fontSize: '1.0625rem', fontWeight: 700 },
                body1: { fontSize: '0.9375rem' },
                body2: { fontSize: '0.875rem' },
                button: { fontSize: '0.875rem', fontWeight: 700, textTransform: 'none' },
                overline: { fontSize: '0.75rem' },
            },
            components: {
                MuiCssBaseline: {
                    styleOverrides: {
                        // Visible keyboard focus everywhere, in the theme colour.
                        ':focus-visible': {
                            outline: `3px solid ${accent}`,
                            outlineOffset: '2px',
                        },
                        html: {
                            // Keep anchored content clear of the sticky header.
                            scrollPaddingTop: '80px',
                        },
                    },
                },
                MuiTooltip: {
                    styleOverrides: {
                        // MUI's default 11px tooltip text is hard to read.
                        tooltip: { fontSize: '0.8125rem' },
                    },
                },
                MuiOutlinedInput: {
                    styleOverrides: {
                        root: {
                            backgroundColor: fieldBg,
                            borderRadius: "10px",
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: alpha(ink, isDark ? 0.18 : 0.2),
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: accent,
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: accent,
                            },
                        },
                        input: {
                            color: ink,
                            fontWeight: 500
                        },
                    },
                },
                MuiSelect: {
                    defaultProps: { size: 'small' },
                    styleOverrides: {
                        icon: {
                            color: ink,
                        },
                        root: {
                            backgroundColor: fieldBg,
                            borderRadius: "10px",
                            color: ink,
                        },
                    },
                },
                MuiInputLabel: {
                    styleOverrides: {
                        root: {
                            color: colours.text.secondary,
                            fontWeight: 500,
                            "&.Mui-focused": { color: ink },
                        },
                    },
                },
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            backgroundColor: surface,
                            backgroundImage: 'none',
                            color: ink,
                            borderRadius: "12px",
                        },
                    },
                },
                MuiMenuItem: {
                    styleOverrides: {
                        root: {
                            fontSize: "0.9375rem",
                            color: ink,
                            "&:hover": {
                                backgroundColor: alpha(accent, 0.12),
                            },
                            "&.Mui-selected, &.Mui-selected:hover": {
                                backgroundColor: alpha(accent, 0.2),
                            },
                        },
                    },
                },
                MuiButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: "10px",
                            fontWeight: 700,
                            borderWidth: '2px',
                            boxShadow: 'none',
                        },
                        sizeSmall: { padding: '4px 12px', fontSize: '0.8125rem' },
                        sizeMedium: { padding: '7px 16px' },
                        sizeLarge: { padding: '9px 22px', fontSize: '0.9375rem' },
                    },
                },
                // Compact form controls (40px instead of 56px) everywhere.
                MuiTextField: { defaultProps: { size: 'small' } },
                MuiFormControl: { defaultProps: { size: 'small' } },
                MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
                MuiToolbar: { styleOverrides: { root: { minHeight: 56 } } },
            },
        }));
    }, [palette]);

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


