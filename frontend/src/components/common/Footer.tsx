import { useTranslation } from "react-i18next";
import { Box, Link, Typography, useTheme } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";

import { CREATOR } from "../layout/credits";
import { TAB_BAR_HEIGHT } from "../layout/navLinks";

// Desktop: a solid band at the very bottom of the page. Phones: a quiet line
// of text at the end of the content, kept clear of the fixed tab bar (which
// already provides the coloured edge), so the two never stack.
const Footer = () => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
        <Box
            component="footer"
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
                justifyContent: 'center',
                gap: { xs: 0.25, md: 1.5 },
                textAlign: "center",
                px: 2,
                pt: { xs: 2, md: 2 },
                // On phones the footer owns the space behind the tab bar, so it is
                // always the last thing on the page and touches the bottom edge.
                pb: { xs: `calc(${TAB_BAR_HEIGHT + 12}px + env(safe-area-inset-bottom))`, md: 2 },
                backgroundColor: { xs: 'transparent', md: theme.palette.primary.main },
                color: { xs: theme.palette.text.secondary, md: theme.palette.primary.contrastText },
                borderTop: { xs: `1px solid ${theme.palette.divider}`, md: 'none' },
            }}
        >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                © {new Date().getFullYear()} {t("footer.text")}
            </Typography>
            <Box component="span" aria-hidden sx={{ display: { xs: 'none', md: 'inline' }, opacity: 0.6 }}>·</Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t("footer.created_by")}{' '}
                <Link
                    href={CREATOR.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="inherit"
                    underline="always"
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 800, verticalAlign: 'bottom' }}
                >
                    <GitHubIcon sx={{ fontSize: 16 }} aria-hidden />
                    {CREATOR.name}
                </Link>
            </Typography>
            <Box component="span" aria-hidden sx={{ display: { xs: 'none', md: 'inline' }, opacity: 0.6 }}>·</Box>
            {/* TMDB's API terms require this notice. */}
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
                <Link href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" color="inherit" underline="always" sx={{ fontWeight: 700 }}>
                    TMDB
                </Link>
                {' · '}{t("footer.tmdb_attribution")}
            </Typography>
        </Box>
    );
};

export default Footer;
