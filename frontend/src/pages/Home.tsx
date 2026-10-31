import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useAuth } from "react-oidc-context";
import { useIsAuthenticated } from "../auth/authHooks";

import { Typography, Button, Stack, Box, useTheme, Card, CardActionArea, Skeleton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CasinoIcon from "@mui/icons-material/Casino";
import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmark";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import InsightsIcon from "@mui/icons-material/Insights";
import Cinema from '../../src/assets/cinema.png';

import AnimatedBackground from "../components/common/AnimatedComponent";
import { RootState } from "../redux/store";
import { getTitle, movieKey, moviePath, posterUrl } from "../utils/tmdb";

const POSTER_STRIP_SIZE = 8;

const Home = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const theme = useTheme();
    const auth = useAuth();
    const isAuthenticated = useIsAuthenticated();
    const featured = useSelector((store: RootState) => store.featured.movies);
    const featuredLoading = useSelector((store: RootState) => store.featured.loading);

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
            <AnimatedBackground />

            {/* Hero */}
            <Stack
                component="section"
                alignItems="center"
                textAlign="center"
                gap={2}
                sx={{ pt: { xs: 5, md: 10 }, pb: { xs: 4, md: 6 } }}
            >
                <Stack direction="row" alignItems="center" justifyContent="center" gap={{ xs: 1.5, md: 2 }}>
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
                    sx={{ fontSize: "clamp(1rem, 2.4vw, 1.5rem)", maxWidth: 640, fontWeight: 500 }}
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
                                border: `2px solid ${theme.palette.primary.main}40`,
                            }}
                        >
                            <CardActionArea
                                // Signed-out visitors are sent to sign in rather than
                                // bounced back here by the protected route.
                                {...(feature.requiresAuth && !isAuthenticated
                                    ? { onClick: () => auth.signinRedirect() }
                                    : { component: Link, to: feature.path })}
                                sx={{ height: '100%', p: { xs: 2, md: 3 }, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 2 }}
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
