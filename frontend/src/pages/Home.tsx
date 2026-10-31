import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useContext, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { useIsAuthenticated } from "../auth/authHooks";

import { Typography, Button, Stack, Box, useTheme, Card, CardActionArea, Skeleton, Chip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import CasinoIcon from "@mui/icons-material/Casino";
import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmark";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import InsightsIcon from "@mui/icons-material/Insights";
import Cinema from '../../src/assets/cinema.png';

import YourShelf from "../components/home/YourShelf";
import { heroAccent } from "../components/home/heroAccent";
import { RootState } from "../redux/store";
import { ThemeContext } from "../theme/ThemeContext";
import { backdropUrl, getTitle, movieKey, moviePath, posterUrl } from "../utils/tmdb";

const POSTER_STRIP_SIZE = 8;

// Shortcuts into the spin wheel, which preselects the genre. Names match WHEEL_GENRES.
const GENRE_SHORTCUTS = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Science Fiction', 'Thriller', 'Animation', 'Documentary', 'Fantasy'];

// Notches cut into both sides, like a ticket stub.
const TICKET_MASK =
    'radial-gradient(circle 11px at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat, ' +
    'radial-gradient(circle 11px at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat';

const Home = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const theme = useTheme();
    const auth = useAuth();
    const isAuthenticated = useIsAuthenticated();
    const featured = useSelector((store: RootState) => store.featured.movies);
    const featuredLoading = useSelector((store: RootState) => store.featured.loading);
    const { selectedPalette } = useContext(ThemeContext);
    const accent = heroAccent(selectedPalette, theme);

    // A different trending backdrop on each visit, fixed for the life of the page.
    const [backdropSeed] = useState(Math.random);
    const heroMovie = useMemo(() => {
        const withBackdrop = featured.filter((movie) => movie.backdrop_path);
        return withBackdrop.length ? withBackdrop[Math.floor(backdropSeed * withBackdrop.length)] : null;
    }, [featured, backdropSeed]);
    const heroBackdrop = heroMovie ? backdropUrl(heroMovie) : null;
    const pageBg = theme.palette.background.default;

    // Primary-coloured text on an outlined button is too faint on dark themes.
    const secondaryCtaSx = {
        color: theme.palette.text.primary,
        borderColor: theme.palette.primary.main,
        '&:hover': { borderColor: theme.palette.primary.main, backgroundColor: `${theme.palette.primary.main}22` },
    };

    const posters = featured
        .filter((movie) => movie.poster_path)
        .slice(0, POSTER_STRIP_SIZE);

    const features = [
        { icon: <CollectionsBookmarkIcon />, title: t("home.feature_lists_title"), body: t("home.feature_lists_body"), path: '/favourites', requiresAuth: true },
        { icon: <CasinoIcon />, title: t("home.feature_wheel_title"), body: t("home.feature_wheel_body"), path: '/spin-wheel', requiresAuth: false },
        { icon: <WhatshotIcon />, title: t("home.feature_trending_title"), body: t("home.feature_trending_body"), path: '/featured', requiresAuth: false },
        { icon: <InsightsIcon />, title: t("home.feature_stats_title"), body: t("home.feature_stats_body"), path: '/user', requiresAuth: true },
    ];

    return (
        <>
            {/* Hero, over a trending title's backdrop that fades into the page */}
            <Box
                component="section"
                sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: { xs: '16px', md: '24px' },
                    mt: { xs: 2, md: 3 },
                    mb: { xs: 4, md: 6 },
                    ...(heroBackdrop && {
                        backgroundImage: `url(${heroBackdrop})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center 25%',
                    }),
                }}
            >
                <Box
                    aria-hidden
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(to bottom, ${alpha(pageBg, 0.72)} 0%, ${alpha(pageBg, 0.82)} 60%, ${pageBg} 100%)`,
                    }}
                />
                {accent.overlay}
                <Stack
                    alignItems="center"
                    textAlign="center"
                    gap={2}
                    sx={{ position: 'relative', px: 2, pt: { xs: 5, md: 10 }, pb: { xs: 5, md: 8 } }}
                >
                    <Stack direction="row" alignItems="center" justifyContent="center" gap={{ xs: 1.5, md: 2 }} sx={accent.titleFrameSx}>
                        <Box
                            component="img"
                            src={Cinema}
                            alt=""
                            sx={{ width: { xs: 52, sm: 72, md: 96 }, height: 'auto', borderRadius: 2 }}
                        />
                        <Typography
                            variant="h1"
                            sx={{
                                fontSize: "clamp(2.4rem, 8vw, 5.5rem)",
                                fontFamily: "Luckiest Guy, DM Sans, sans-serif",
                                color: theme.palette.primary.main,
                                lineHeight: 1,
                            }}
                        >
                            {t("app.app_title")}
                        </Typography>
                    </Stack>
                    <Typography
                        variant="h6"
                        component="p"
                        sx={{ fontSize: "clamp(1rem, 2.4vw, 1.5rem)", maxWidth: 640, fontWeight: 500, ...accent.taglineSx }}
                    >
                        {t("home.tagline")}
                    </Typography>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        gap={1.5}
                        sx={{ mt: 1, width: { xs: '100%', sm: 'auto' }, maxWidth: 360 }}
                    >
                        <Button
                            variant="contained"
                            startIcon={<SearchIcon />}
                            onClick={() => navigate('/search')}
                        >
                            {t("app.start_searching")}
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<CasinoIcon />}
                            onClick={() => navigate('/spin-wheel')}
                            sx={secondaryCtaSx}
                        >
                            {t("header.spin_wheel")}
                        </Button>
                    </Stack>
                </Stack>
                {heroMovie && (
                    <Typography
                        variant="caption"
                        component={Link}
                        to={moviePath(heroMovie)}
                        sx={{
                            position: 'absolute',
                            right: { xs: 12, md: 20 },
                            bottom: { xs: 8, md: 14 },
                            color: theme.palette.text.secondary,
                            textDecoration: 'none',
                            '&:hover': { textDecoration: 'underline' },
                        }}
                    >
                        {t("home.now_trending", { title: getTitle(heroMovie) })}
                    </Typography>
                )}
            </Box>

            {isAuthenticated && <YourShelf />}

            {/* Poster strip: a glimpse of what's trending */}
            {featuredLoading && posters.length === 0 && (
                <Box
                    aria-busy="true"
                    sx={{
                        display: 'grid',
                        gridAutoFlow: 'column',
                        gridAutoColumns: { xs: '38%', sm: '22%', md: 'calc((100% - 7 * 16px) / 8)' },
                        gap: 2,
                        overflow: 'hidden',
                        pb: 1,
                        mb: { xs: 5, md: 8 },
                    }}
                >
                    {[...Array(POSTER_STRIP_SIZE)].map((_, index) => (
                        <Skeleton key={index} variant="rounded" sx={{ height: 'auto', aspectRatio: '2 / 3', borderRadius: '12px' }} />
                    ))}
                </Box>
            )}
            {posters.length > 0 && (
                <Box
                    component="section"
                    aria-label={t("trending.new_and_trending")}
                    sx={{
                        display: 'grid',
                        gridAutoFlow: 'column',
                        gridAutoColumns: { xs: '38%', sm: '22%', md: 'calc((100% - 7 * 16px) / 8)' },
                        gap: 2,
                        overflowX: 'auto',
                        pb: 1,
                        mb: { xs: 5, md: 8 },
                        scrollSnapType: 'x mandatory',
                        // Fade the edges so the strip reads as "more to see".
                        maskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
                    }}
                >
                    {posters.map((movie) => (
                        <Box
                            key={movieKey(movie)}
                            component={Link}
                            to={moviePath(movie)}
                            aria-label={getTitle(movie)}
                            sx={{
                                scrollSnapAlign: 'start',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                boxShadow: `0 0 12px 2px ${theme.palette.primary.main}40`,
                            }}
                        >
                            <Box
                                component="img"
                                src={posterUrl(movie, 'w342') ?? undefined}
                                alt=""
                                loading="lazy"
                                sx={{ display: 'block', width: '100%', aspectRatio: '2 / 3', objectFit: 'cover' }}
                            />
                        </Box>
                    ))}
                </Box>
            )}

            {/* Not sure what to watch? */}
            <Card
                component="section"
                aria-labelledby="home-spin"
                sx={{
                    mb: { xs: 5, md: 8 },
                    p: { xs: 2.5, md: 4 },
                    backgroundColor: theme.palette.background.primary,
                    backgroundImage: `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.16)}, transparent 60%)`,
                    border: `2px solid ${theme.palette.primary.main}40`,
                }}
            >
                <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} gap={{ xs: 2, md: 4 }}>
                    <Box
                        aria-hidden
                        sx={{
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            width: { xs: 64, md: 88 },
                            height: { xs: 64, md: 88 },
                            borderRadius: '50%',
                            color: theme.palette.iconsColor,
                            backgroundColor: theme.palette.primary.main,
                            '& .MuiSvgIcon-root': { fontSize: { xs: 36, md: 48 } },
                        }}
                    >
                        <CasinoIcon />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography id="home-spin" variant="h5" component="h2" sx={{ fontWeight: 800 }}>
                            {t("home.spin_teaser_title")}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5, mb: 2, opacity: 0.85 }}>
                            {t("home.spin_teaser_body")}
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1} aria-label={t("home.pick_a_genre")}>
                            {GENRE_SHORTCUTS.map((genre) => (
                                <Chip
                                    key={genre}
                                    label={genre}
                                    component={Link}
                                    to={`/spin-wheel?genre=${encodeURIComponent(genre)}`}
                                    clickable
                                    variant="outlined"
                                    sx={{ borderColor: `${theme.palette.primary.main}80`, color: theme.palette.text.primary }}
                                />
                            ))}
                        </Stack>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<CasinoIcon />}
                        onClick={() => navigate('/spin-wheel')}
                        sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', md: 'center' } }}
                    >
                        {t("home.spin_teaser_cta")}
                    </Button>
                </Stack>
            </Card>

            {/* What you can do */}
            <Box
                component="section"
                aria-labelledby="home-features"
                sx={{ mb: { xs: 4, md: 8 } }}
            >
                <Typography id="home-features" variant="h4" component="h2" textAlign="center" sx={{ fontWeight: 800, mb: 3 }}>
                    {t("home.features_heading")}
                </Typography>
                <Box sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
                }}>
                    {features.map((feature) => (
                        <Card
                            key={feature.path}
                            sx={{
                                height: '100%',
                                backgroundColor: theme.palette.background.primary,
                                border: `2px dashed ${theme.palette.primary.main}66`,
                                mask: TICKET_MASK,
                                WebkitMask: TICKET_MASK,
                            }}
                        >
                            <CardActionArea
                                // Signed-out visitors are sent to sign in rather than
                                // bounced back here by the protected route.
                                {...(feature.requiresAuth && !isAuthenticated
                                    ? { onClick: () => auth.signinRedirect() }
                                    : { component: Link, to: feature.path })}
                                sx={{ height: '100%', px: { xs: 3, md: 3.5 }, py: { xs: 2, md: 3 }, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 2 }}
                            >
                                <Box
                                    aria-hidden
                                    sx={{
                                        display: 'grid',
                                        placeItems: 'center',
                                        flexShrink: 0,
                                        width: 48,
                                        height: 48,
                                        borderRadius: '14px',
                                        color: theme.palette.iconsColor,
                                        backgroundColor: theme.palette.primary.main,
                                    }}
                                >
                                    {feature.icon}
                                </Box>
                                <Box>
                                    <Typography variant="h6" component="h3" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
                                        {feature.title}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.85 }}>
                                        {feature.body}
                                    </Typography>
                                </Box>
                            </CardActionArea>
                        </Card>
                    ))}
                </Box>
            </Box>
        </>
    );
};

export default Home;
