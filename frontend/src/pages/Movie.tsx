import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useIsAuthenticated } from "../auth/authHooks";
import { useTranslation } from 'react-i18next';

import { Typography, Chip, Box, Stack, Button, useTheme, Skeleton } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import StarIcon from "@mui/icons-material/Star";

import MovieActionsBtn from "../components/common/MovieActionsBtn";

import { axiosPublic } from "../api/axiosConfig";

import { MediaType, Movie } from '../types';
import {
    externalLink, getCast, getCertification, getCountries, getDirectors, getGenres, getLanguages,
    getRating, getReleaseDate, getRuntimeMinutes, getTitle, getWriters, getYear, posterUrl,
} from '../utils/tmdb';
import noImg from '../assets/no-img.jpg';
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

import countryToCurrency, { Countries } from "country-to-currency";

const API_URL = import.meta.env.MODE === 'production' ? import.meta.env.VITE_BACKEND_URL_PROD : import.meta.env.VITE_BACKEND_URL_DEV;

const hasValue = (value?: string | null): value is string => Boolean(value);

const list = (names: string[]) => names.join(', ');

const MoviePage = () => {
    const { mediaType, id } = useParams<{ mediaType: MediaType; id: string }>();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { t, i18n } = useTranslation();
    const isAuthenticated = useIsAuthenticated();

    const country = useSelector((state: RootState) => state.user.country ? state.user.country : 'IN');

    const theme = useTheme();

    useEffect(() => {
        if (!mediaType || !id) return;

        const fetchMovieDetails = async () => {
            try {
                const res = await axiosPublic.post(`${API_URL}/api/getById`, { id: Number(id), media_type: mediaType });

                if (res.data.success) {
                    setMovie(res.data.movie);
                } else {
                    setError("movie.no_movie_found");
                }
            } catch (err) {
                setError("movie.error_fetching_movie_details");
                console.log(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMovieDetails();
    }, [mediaType, id]);

    const revenue = movie?.media_type === 'movie' ? movie.revenue : undefined;
    const formattedBoxOffice = useMemo(() => {
        if (!revenue) return;

        const numericAmount = revenue;
        const currency = countryToCurrency[country as Countries] || 'INR';
        const locale = `en-${country}`;

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            maximumFractionDigits: 2,
        }).format(numericAmount);
    }, [country, revenue]);


    const external = movie ? externalLink(movie) : null;
    const openExternal = useCallback(() => {
        if (external) window.open(external.url, "_blank");
    }, [external]);

    const [plotExpanded, setPlotExpanded] = useState(false);

    // On laptops the page is laid out to fit one screen: everything below the
    // app bar and above the footer (≈160px together with the page padding).
    const fitHeight = { lg: 'calc(100dvh - 160px)' };

    if (loading) return (
        <Box
            aria-busy="true"
            sx={{ display: 'grid', gap: { xs: 3, lg: 5 }, gridTemplateColumns: { xs: '1fr', lg: 'auto 1fr' }, py: { xs: 2, md: 3 }, minHeight: fitHeight }}
        >
            <Skeleton variant="rounded" sx={{ width: { xs: '60%', lg: 'auto' }, maxWidth: 300, mx: { xs: 'auto', lg: 0 }, height: { xs: 'auto', lg: 'min(calc(100dvh - 200px), 600px)' }, aspectRatio: '2 / 3', borderRadius: '12px' }} />
            <Box>
                <Skeleton variant="text" sx={{ fontSize: '2.25rem', width: '70%' }} />
                <Skeleton variant="text" sx={{ width: '40%' }} />
                <Skeleton variant="rounded" sx={{ mt: 3, height: 120, borderRadius: '12px' }} />
            </Box>
        </Box>
    );
    if (error) return (
        <Box sx={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <Typography variant="h5" color="error">{t(error)}</Typography>
        </Box>
    );

    if (!movie) return null;

    const title = getTitle(movie);
    const year = getYear(movie);
    const genres = getGenres(movie);
    const rating = getRating(movie);
    const plot = movie.overview;
    const posterSrc = posterUrl(movie, 'w780') ?? noImg;
    const releaseDate = getReleaseDate(movie);
    const runtime = getRuntimeMinutes(movie);
    const facts = [
        { label: t('movie.rated'), value: getCertification(movie, country) },
        {
            label: t('movie.released'),
            value: releaseDate && new Date(releaseDate).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }),
        },
        { label: t('movie.runtime'), value: runtime ? `${runtime} min` : null },
        { label: t('movie.language'), value: list(getLanguages(movie)) },
        { label: t('movie.country'), value: list(getCountries(movie)) },
        { label: t('movie.box_office'), value: formattedBoxOffice },
    ].filter((fact): fact is { label: string; value: string } => hasValue(fact.value));
    const people = [
        { label: movie.media_type === 'tv' ? t('movie.creators') : t('movie.directors'), value: list(getDirectors(movie)) },
        { label: t('movie.writers'), value: list(getWriters(movie)) },
        { label: t('movie.actors'), value: list(getCast(movie)) },
    ].filter((person) => hasValue(person.value));
    const longPlot = (plot?.length ?? 0) > 320;

    const tileSx = {
        backgroundColor: theme.palette.background.primary,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '12px',
        p: 1.5,
        minWidth: 0,
    };
    const labelSx = { display: 'block', fontWeight: 700, opacity: 0.7, mb: 0.25 };

    return (
        <Box sx={{ position: 'relative', isolation: 'isolate' }}>
            {/* Faint, blurred poster behind the page for atmosphere. */}
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    inset: { xs: '-16px', sm: '-24px' },
                    zIndex: -1,
                    backgroundImage: `url(${posterSrc})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(48px) saturate(1.2)',
                    opacity: theme.palette.mode === 'dark' ? 0.18 : 0.12,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                }}
            />

            <Box
                sx={{
                    display: 'grid',
                    gap: { xs: 3, lg: 5 },
                    gridTemplateColumns: { xs: '1fr', md: 'minmax(220px, 300px) 1fr', lg: 'auto 1fr' },
                    alignItems: { md: 'start', lg: 'center' },
                    py: { xs: 2, md: 3 },
                    minHeight: fitHeight,
                }}
            >
                {/* Poster: height-driven on laptops so it never pushes the page past one screen. */}
                <Box
                    component="img"
                    src={posterSrc}
                    alt={title}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => (e.currentTarget.src = noImg)}
                    sx={{
                        display: 'block',
                        width: { xs: '60%', sm: 260, md: '100%', lg: 'auto' },
                        height: { lg: 'min(calc(100dvh - 200px), 600px)' },
                        maxWidth: { xs: 260, md: 300, lg: 'none' },
                        mx: { xs: 'auto', md: 0 },
                        aspectRatio: '2 / 3',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        boxShadow: `0 12px 40px ${theme.palette.primary.main}40`,
                    }}
                />

                <Stack gap={2} sx={{ minWidth: 0, maxWidth: 900 }}>
                    <Box>
                        <Typography variant="h3" component="h1" sx={{ lineHeight: 1.15 }}>
                            {title} {year && <Box component="span" sx={{ opacity: 0.6, fontWeight: 600 }}>({year})</Box>}
                        </Typography>
                        {genres.length > 0 && (
                            <Stack direction='row' gap={0.75} sx={{ flexWrap: 'wrap', mt: 1.5 }}>
                                {genres.map(genre => (
                                    <Chip label={genre} key={genre} size="small" sx={{ bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText }} />
                                ))}
                            </Stack>
                        )}
                    </Box>

                    <Stack direction="row" gap={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                        {rating !== null && (
                            <Stack direction="row" alignItems="center" gap={0.5} sx={{ mr: 1 }} title={t('movie.tmdb_rating')}>
                                <StarIcon sx={{ color: theme.palette.watchLaterIcon, fontSize: 22 }} />
                                <Typography sx={{ fontWeight: 800, fontSize: '1.125rem' }}>{rating.toFixed(1)}</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>/10 TMDB</Typography>
                            </Stack>
                        )}
                        {external && (
                            <Button
                                sx={external.site === 'imdb'
                                    ? { backgroundColor: '#F5C518', color: '#121212', gap: '6px', '&:hover': { backgroundColor: '#E2B616' } }
                                    : { backgroundColor: '#01B4E4', color: '#0D253F', gap: '6px', '&:hover': { backgroundColor: '#00A2CE' } }}
                                variant="contained"
                                size="small"
                                onClick={openExternal}
                                aria-label={external.site === 'imdb' ? t('movie.more_on_imdb') : t('movie.more_on_tmdb')}
                            >
                                <OpenInNewIcon fontSize="small" />
                                <span>{external.site === 'imdb' ? 'IMDb' : 'TMDB'}</span>
                            </Button>
                        )}
                        {isAuthenticated && <MovieActionsBtn movie={movie} size="small" />}
                    </Stack>

                    {hasValue(plot) && (
                        <Box>
                            <Typography
                                sx={{
                                    lineHeight: 1.65,
                                    maxWidth: '75ch',
                                    ...(longPlot && !plotExpanded && {
                                        display: '-webkit-box',
                                        WebkitLineClamp: 4,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }),
                                }}
                            >
                                {plot}
                            </Typography>
                            {longPlot && (
                                <Button size="small" onClick={() => setPlotExpanded((open) => !open)} sx={{ px: 0, minWidth: 0, mt: 0.5, color: theme.palette.text.primary, textDecoration: 'underline' }}>
                                    {plotExpanded ? t('movie.less') : t('movie.more')}
                                </Button>
                            )}
                        </Box>
                    )}

                    {facts.length > 0 && (
                        <Box
                            component="dl"
                            sx={{
                                m: 0,
                                display: 'grid',
                                gap: 1,
                                gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(6, minmax(0, 1fr))' },
                            }}
                        >
                            {facts.map((fact) => (
                                <Box key={fact.label} sx={tileSx}>
                                    <Typography component="dt" variant="caption" sx={labelSx}>{fact.label}</Typography>
                                    <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: 600 }} noWrap title={fact.value}>{fact.value}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}

                    {people.length > 0 && (
                        <Box
                            component="dl"
                            sx={{ m: 0, display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' } }}
                        >
                            {people.map((person) => (
                                <Box key={person.label} sx={tileSx}>
                                    <Typography component="dt" variant="caption" sx={labelSx}>{person.label}</Typography>
                                    <Typography component="dd" variant="body2" sx={{ m: 0, fontWeight: 600 }}>{person.value}</Typography>
                                </Box>
                            ))}
                        </Box>
                    )}

                </Stack>
            </Box>
        </Box>
    );
};

export default MoviePage;
