import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useIsAuthenticated } from "../auth/authHooks";
import { useTranslation } from 'react-i18next';

import { Typography, Chip, Box, Stack, Button, Tooltip, useTheme, useMediaQuery, CircularProgress } from "@mui/material";
import Grid from '@mui/material/Grid2';
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import BackButton from "../components/common/BackButton";
import MovieActionsBtn from "../components/common/MovieActionsBtn";

import { axiosPublic } from "../api/axiosConfig";

import { Movie } from '../types';
import noImg from '../assets/no-img.jpg';
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";

import countryToCurrency, { Countries } from "country-to-currency";

const API_URL = import.meta.env.MODE === 'production' ? import.meta.env.VITE_BACKEND_URL_PROD : import.meta.env.VITE_BACKEND_URL_DEV;

const MoviePage = () => {
    const { imdbID } = useParams<{ imdbID: string }>();
    const [movie, setMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { t } = useTranslation();
    const isAuthenticated = useIsAuthenticated();

    const country = useSelector((state: RootState) => state.user.country ? state.user.country : 'IN');

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    useEffect(() => {
        if (!imdbID) return;

        const fetchMovieDetails = async () => {
            try {
                const res = await axiosPublic.post(`${API_URL}/api/getById`, { imdbID });

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
    }, [imdbID]);

    const formattedBoxOffice = useMemo(() => {
        if (!movie?.BoxOffice) return;

        const numericAmount = Number(movie?.BoxOffice.replace(/[^\d.]/g, ''));
        const currency = countryToCurrency[country as Countries] || 'INR';
        const locale = `en-${country}`;

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            maximumFractionDigits: 2,
        }).format(numericAmount);
    }, [country, movie?.BoxOffice]);


    const openIMDB = useCallback(() => {
        window.open(`https://www.imdb.com/title/${movie?.imdbID}`, "_blank");
    }, [movie?.imdbID]);

    if (loading) return <>
        <BackButton />
        <Grid container spacing={4} sx={{ minHeight: "82vh", justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress />
        </Grid >
    </>;
    if (error) return <>
        <BackButton />
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h4" color="error">{t(error)}</Typography>
        </Box>
    </>;

    if (!movie) return null;

    return (
        <>
            <BackButton />
            <Grid container spacing={4} sx={{ marginBottom: '2rem', minHeight: "82vh", justifyContent: 'center', alignItems: 'center' }}>
                {/* Movie Poster */}
                <Grid size={{ md: 12, lg: 4 }} sx={{ display: "flex", justifyContent: "center", padding: '4rem', }}>
                    <Tooltip title={movie.Title}>
                        <img
                            src={movie.Poster !== "N/A" ? movie.Poster : noImg}
                            alt={movie.Title}
                            style={{
                                width: "100%",
                                height: 'auto',
                                boxShadow: `0 0 15px 4px ${theme.palette.primary.main}50`,
                                borderRadius: "12px"
                            }}
                        />
                    </Tooltip>
                </Grid>

                {/* Movie Details */}
                <Grid size={{ md: 12, lg: 8 }} sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <Typography variant={isMobile ? "h5" : "h4"} sx={{ mb: '1rem', fontWeight: 800 }}>
                        {movie.Title} ({movie.Year})
                    </Typography>

                    <Stack direction='row' spacing={2} sx={{
                        flexWrap: 'wrap', mb: '1rem'
                    }}>
                        {
                            movie.Genre !== 'N/A' && movie.Genre.split(',').map(genre => {
                                return <Chip label={genre} key={genre} sx={{ bgcolor: theme.palette.primary.main, fontWeight: 700, color: theme.palette.text.tertiary }} />
                            })
                        }
                    </Stack>

                    <Stack direction='row' spacing={1} sx={{ flexWrap: 'wrap', mb: '2rem', }}>
                        <Typography
                            sx={{
                                width: 'fit-content',
                                fontSize: '1rem',
                                fontWeight: 500,
                            }}
                        >
                            {`${t("movie.escape_reality_for")} ${movie.Runtime}`}
                        </Typography>

                        <Box component='span' sx={{ fontWeight: 600 }}>|</Box>

                        <Typography sx={{
                            width: 'fit-content',
                            fontSize: '1rem',
                            fontWeight: 500,
                        }}>{t('movie.box_office_collection')} {movie?.BoxOffice && formattedBoxOffice}</Typography>
                    </Stack>


                    {/* Action Buttons */}
                    <Stack direction="row" gap={2} sx={{ alignItems: 'center', mb: '2rem', flexWrap: 'wrap' }}>
                        <Tooltip title={t('movie.more_on_imdb')}>
                            <Button
                                sx={{
                                    textTransform: 'none',
                                    backgroundColor: '#FFC107',
                                    color: '#212121',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                variant="contained"
                                onClick={openIMDB}
                            >
                                <OpenInNewIcon fontSize="small" />
                                <span>IMDb</span>
                            </Button>
                        </Tooltip>
                        {isAuthenticated && <MovieActionsBtn movie={movie} />}
                    </Stack>

                    {/* About Section */}
                    <Typography variant={isMobile ? "h6" : "h5"} sx={{ mb: '1rem', fontWeight: 600 }}>{t("movie.about")}</Typography>

                    <Typography variant={isMobile ? "body2" : "body1"} sx={{ mb: '1rem', fontWeight: 500 }}>{movie.Plot}</Typography>

                    {/* Movie Details Grid */}
                    <Grid container spacing={2}>
                        {[
                            { label: "movie.directors", value: movie.Director },
                            { label: "movie.actors", value: movie.Actors },
                            { label: "movie.awards", value: movie.Awards }
                        ].map((item) => (
                            <Grid size={{ sm: 12, md: 4 }} key={item.label} sx={{
                                backgroundColor: theme.palette.background.primary,
                                padding: "1rem",
                                borderRadius: "12px",
                                border: `2px solid ${theme.palette.primary.main}`,
                                width: '100%'
                            }}>
                                <Typography variant={isMobile ? "body2" : "h6"}>{t(item.label)}</Typography>
                                <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 500 }}>{item.value}</Typography>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Ratings Section */}
                    <Typography variant={isMobile ? "h6" : "h5"} sx={{ mt: '2rem', mb: '1rem', fontWeight: 600 }}>{t("movie.ratings")}</Typography>
                    < Grid container spacing={2}>
                        {movie.Ratings.map((rating) => (
                            <Grid size={{ sm: 12, md: 4 }} key={rating.Source} sx={{
                                backgroundColor: theme.palette.background.primary,
                                padding: "1rem",
                                borderRadius: "12px",
                                border: `2px solid ${theme.palette.primary.main}`,
                                width: '100%'
                            }}>
                                <Typography variant={isMobile ? "body2" : "h6"}>{rating.Source}</Typography>
                                <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 500 }}>{rating.Value}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
            </Grid >
        </>
    );
};

export default MoviePage;
