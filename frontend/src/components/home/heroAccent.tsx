import { ReactNode } from 'react';
import { Box } from '@mui/material';
import { alpha, CSSObject, Theme } from '@mui/material/styles';
import { PaletteKey } from '../../theme/palettes';

type HeroAccent = {
    // Decorative layer painted over the hero backdrop, under the text.
    overlay?: ReactNode;
    // Extra styles for the box around the logo and title.
    titleFrameSx?: CSSObject;
    taglineSx?: CSSObject;
};

// Fine noise for a film-grain look, as an inline SVG so nothing is fetched.
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const layer = (sx: CSSObject) => (
    <Box aria-hidden sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...sx }} />
);

// A static flourish per theme so the hero reads as the theme's genre.
// Nothing here animates.
export function heroAccent(palette: PaletteKey, theme: Theme): HeroAccent {
    const primary = theme.palette.primary.main;
    const secondary = theme.palette.secondary.main;

    switch (palette) {
        // Dark Reel: film grain and a heavy vignette.
        case 'horror':
            return {
                overlay: (
                    <>
                        {layer({ backgroundImage: GRAIN, opacity: 0.12, mixBlendMode: 'overlay' })}
                        {layer({ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0, 0, 0, 0.65) 100%)' })}
                    </>
                ),
            };
        // Broadway Lights: a marquee frame of bulbs around the title.
        case 'theatre':
            return {
                titleFrameSx: {
                    position: 'relative',
                    px: { xs: 2.5, md: 4 },
                    py: { xs: 1.5, md: 2 },
                    borderRadius: '16px',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        padding: '8px',
                        borderRadius: 'inherit',
                        background: `radial-gradient(circle, ${primary} 2.5px, ${alpha(primary, 0.35)} 3.5px, transparent 4.5px) 0 0 / 16px 16px`,
                        boxShadow: `inset 0 0 18px ${alpha(primary, 0.25)}`,
                        // Keep only the 8px rim, so the bulbs form a frame.
                        mask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)',
                        WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                        WebkitMaskComposite: 'xor',
                        pointerEvents: 'none',
                    },
                },
            };
        // Timeless: an old title card, with double rules and serif small caps.
        case 'classic':
            return {
                taglineSx: {
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontVariant: 'small-caps',
                    letterSpacing: '0.06em',
                    py: 1,
                    px: 2,
                    borderTop: `3px double ${secondary}`,
                    borderBottom: `3px double ${secondary}`,
                },
            };
        // The light themes get a soft glow in their two accent colours.
        default:
            return {
                overlay: layer({
                    background: `radial-gradient(circle at 15% 20%, ${alpha(primary, 0.22)}, transparent 45%), radial-gradient(circle at 85% 75%, ${alpha(secondary, 0.22)}, transparent 45%)`,
                }),
            };
    }
}
