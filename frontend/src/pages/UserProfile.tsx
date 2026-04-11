import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAuth } from "react-oidc-context";
import { RootState } from "../redux/store";

import { Avatar, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, Typography, useTheme } from "@mui/material";
import Grid from '@mui/material/Grid2';
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined';
import WatchLaterIcon from "@mui/icons-material/WatchLater";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FavoriteIcon from "@mui/icons-material/Favorite";
import TimerIcon from '@mui/icons-material/Timer';
import TvIcon from '@mui/icons-material/Tv';
import LocalMoviesIcon from '@mui/icons-material/LocalMovies';
import EditIcon from '@mui/icons-material/Edit';

import PieChart from "../components/userProfile/ListBreakdownPieChart";
import BarGraph from "../components/userProfile/GenreBarGraph";
import BackButton from "../components/common/BackButton";
import LogoutIcon from '@mui/icons-material/Logout';
import EditProfileForm from "../components/userProfile/EditProfileForm";
import IMDbVotesChart from "../components/userProfile/IMDbVotesChart";
import TopLanguagesPieChart from "../components/userProfile/TopLanguagesPieChart";

import { Movie } from "../types";
import { signOutRedirect } from "../auth/authUtils";
import { useTranslation } from "react-i18next";

const UserProfile = () => {
    const auth = useAuth();
    const { t } = useTranslation();

    const theme = useTheme();
    const navigate = useNavigate();

    const favourites = useSelector((store: RootState) => store.favourites.details);
    const watchLater = useSelector((store: RootState) => store.watch.watchLater);
    const watched = useSelector((store: RootState) => store.watch.watched);

    const numFavourites = useSelector((state: RootState) => Object.keys(state.favourites.details).length);
    const numWatchLater = useSelector((state: RootState) => Object.keys(state.watch.watchLater).length);
    const numWatched = useSelector((state: RootState) => Object.keys(state.watch.watched).length);

    const { firstName, lastName, userID, loading } = useSelector((store: RootState) => store.user);

    const [openEditProfile, setOpenEditProfile] = useState(false);
    const [openSignOut, setOpenSignOut] = useState(false);

    const handleEditProfileClose = function () {
        setOpenEditProfile(false);
    }

    const handleSignOutClose = function () {
        setOpenSignOut(false);
    }

    const handleSignOut = function () {
        handleSignOutClose();
        auth.removeUser();
        signOutRedirect();
    }

    const formatTime = (totalMinutes: number): { days: number, hours: number, minutes: number } => {
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minutes = totalMinutes % 60;

        return { days, hours, minutes };
    };

    const totalMoviesWatched = useMemo(() => {
        return Object.values(watched).filter(movie => movie.Type === "movie").length;
    }, [watched]);

    const totalShowsWatched = useMemo(() => {
        return Object.values(watched).filter(movie => movie.Type === "series").length;
    }, [watched]);

    const { movieTime, tvTime, totalWatchTime } = useMemo(() => {
        const totalMovieMinutes = Object.values(watched)
            .filter(movie => movie.Type === "movie")
            .reduce((sum, movie) => sum + (parseInt(movie.Runtime.replace(/\D/g, ""), 10) || 0), 0);

        const totalTvMinutes = Object.values(watched)
            .filter(movie => movie.Type === "series")
            .reduce((sum, movie) => sum + (parseInt(movie.Runtime.replace(/\D/g, ""), 10) * parseInt(movie.totalSeasons) * 10 || 0), 0);

        return {
            tvTime: formatTime(totalTvMinutes),
            movieTime: formatTime(totalMovieMinutes),
            totalWatchTime: formatTime(totalMovieMinutes + totalTvMinutes),
        }
    }, [watched]);

    const languageCount = useMemo(() => {
        const uniqueMovies = new Map<string, Movie>();

        Object.values(watched).forEach(movie => {
            uniqueMovies.set(movie.imdbID, movie);
        });

        const count: Record<string, number> = {};
        uniqueMovies.forEach(({ Language }) => {
            Language.split(", ").forEach(lang => {
                count[lang] = (count[lang] || 0) + 1;
            });
        });

        return Object.entries(count).map(([language, count]) => ({ language, count }));
    }, [watched]);

    const genreCount = useMemo(() => {
        const uniqueMovies = new Map<string, Movie>();

        [...Object.values(favourites), ...Object.values(watched), ...Object.values(watchLater)].forEach(movie => {
            uniqueMovies.set(movie.imdbID, movie);
        });

        const count: Record<string, number> = {};
        uniqueMovies.forEach(({ Genre }) => {
            Genre.split(", ").forEach(g => {
                count[g] = (count[g] || 0) + 1;
            });
        });

        return count;
    }, [favourites, watched, watchLater]);

    const topIMDbVotesCount = useMemo(() => {
        return Object.values(watched)
            .filter((movie) => movie.imdbVotes)
            .sort((a, b) => parseInt(b.imdbVotes.replace(/,/g, ""), 10) - parseInt(a.imdbVotes.replace(/,/g, ""), 10))
            .slice(0, 10)
            .map((movie) => ({
                title: movie.Title,
                votes: parseInt(movie.imdbVotes.replace(/,/g, "")),
            }));
    }, [watched]);

    return (
        <>
            <BackButton />
            <Box sx={{ maxWidth: '1800px', margin: "auto", textAlign: "center", p: 4 }}>
                <Box sx={{ display: "flex", flexDirection: "row", mb: 6, alignItems: 'center' }}>
                    <Stack direction='row' spacing={4} sx={{ alignItems: 'center' }}>
                        <Avatar sx={{
                            fontWeight: 600,
                            fontSize: '48px',
                            mb: 2,
                            backgroundColor: theme.palette.primary.main,
                            border: `2px solid ${theme.palette.secondary.main}`,
                            width: '128px',
                            height: '128px',
                            color: theme.palette.text.tertiary,
                            boxShadow: 4,
                        }}>
                            {firstName && lastName && `${firstName[0][0]}${lastName[0][0]}`}
                        </Avatar>
                        <Stack direction='column' spacing={1} sx={{ alignItems: 'flex-start' }}>
                            <Typography variant="h4" sx={{ fontSize: "clamp(1.4rem, 4vw, 3rem)" }}>
                                {loading && '...'} {!loading && firstName && `${firstName}`} {' '} {!loading && lastName && `${lastName}`}
                            </Typography>
                            <Typography variant="h6" sx={{ fontSize: "clamp(0.4rem, 4vw, 1rem)" }}>
                                {!loading ? userID : '...'}
                            </Typography>
                        </Stack>
                    </Stack>
                    <Stack direction='row' gap={2} sx={{ marginLeft: 'auto' }}>
                        <Button onClick={() => { setOpenSignOut(true) }} variant="outlined" size="small" sx={{
                            mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, fontSize: { xs: "0.4rem", sm: "0.6rem", md: "0.8rem", lg: "1rem" },
                            padding: { xs: "6px 12px", sm: "8px 16px", md: "10px 20px", lg: "12px 24px" },
                            minWidth: { xs: "60px", sm: "80px", md: "100px", lg: "120px" },
                            fontWeight: 600,
                        }}>
                            <LogoutIcon />
                            {t("profile.sign_out")}
                        </Button>
                        <Button onClick={() => { setOpenEditProfile(true) }} variant="contained" size="small" sx={{
                            mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, fontSize: { xs: "0.4rem", sm: "0.6rem", md: "0.8rem", lg: "1rem" },
                            padding: { xs: "6px 12px", sm: "8px 16px", md: "10px 20px", lg: "12px 24px" },
                            minWidth: { xs: "60px", sm: "80px", md: "100px", lg: "120px" }, fontWeight: 600
                        }}>
                            <EditIcon />
                            {t("profile.edit_profile_details")}
                        </Button>
                    </Stack>
                </Box>

                <Typography variant="h4" sx={{ mb: 4, fontSize: "clamp(1.4rem, 2vw, 2rem)" }}>{t('profile.my_collections')}</Typography>
                <Grid container sx={{ mb: 6 }} spacing={2} justifyContent="center" alignItems='stretch'>
                    <Grid spacing={{ xs: 1 }}>
                        <Button onClick={() => { navigate('/favourites') }} variant='text' sx={{
                            display: 'flex', gap: 1, textTransform: 'none', justifyContent: 'center', alignItems: 'center', "&:hover": {
                                transform: "scale(1.05)",
                                cursor: 'pointer',
                                backgroundColor: 'transparent',
                                fontSize: "clamp(0.8rem, 2vw, 1rem)"
                            }
                        }}>
                            <FavoriteIcon sx={{ width: '24px', height: '24px', color: theme.palette.favouriteIcon }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {t("profile.favourites")} ({numFavourites})
                            </Typography>
                        </Button>
                    </Grid>
                    <Grid spacing={{ xs: 1 }}>
                        <Button onClick={() => { navigate('/watch-later') }} variant='text' sx={{
                            display: 'flex', gap: 1, textTransform: 'none', justifyContent: 'center', alignItems: 'center', "&:hover": {
                                transform: "scale(1.05)",
                                cursor: 'pointer',
                                backgroundColor: 'transparent',
                                fontSize: "clamp(0.8rem, 2vw, 1rem)"
                            }
                        }}>
                            <WatchLaterIcon sx={{ color: theme.palette.watchLaterIcon, width: '24px', height: '24px' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {t('profile.watch_later')} ({numWatchLater})
                            </Typography>
                        </Button>
                    </Grid>

                    <Grid spacing={{ xs: 1 }}>
                        <Button onClick={() => { navigate('/watched') }} variant='text' sx={{
                            display: 'flex', gap: 1, textTransform: 'none', justifyContent: 'center', alignItems: 'center', "&:hover": {
                                transform: "scale(1.05)",
                                cursor: 'pointer',
                                backgroundColor: 'transparent',
                                fontSize: "clamp(0.8rem, 2vw, 1rem)"
                            }
                        }}>
                            <CheckCircleIcon sx={{ width: '24px', height: '24px', color: theme.palette.watchedIcon }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {t('profile.watched')} ({numWatched})
                            </Typography>
                        </Button>
                    </Grid>
                </Grid>

                <Typography variant="h4" sx={{ mb: 4, fontSize: "clamp(1.4rem, 2vw, 2rem)" }}>{t('profile.my_stats')}</Typography>
                <Grid container sx={{ mb: 6 }} spacing={4} justifyContent="center" alignItems='stretch'>
                    <Grid spacing={{ xs: 3 }}>
                        <Card sx={{ backgroundColor: theme.palette.background.default, borderWidth: '2px', borderColor: theme.palette.primary.main, borderStyle: 'solid', boxShadow: "0 4px 10px rgba(0,0,0,0.4)", height: '100%' }}>
                            <CardContent>
                                <Stack direction='row' gap={2} sx={{ mb: 1, paddingBottom: 2, borderBottomWidth: '2px', borderBottomColor: theme.palette.primary.main, borderBottomStyle: 'solid', justifyContent: 'center', alignItems: 'center' }}>
                                    <TvIcon sx={{ width: '36px', height: '36px', color: theme.palette.primary.main }} />
                                    <Typography variant="h6">
                                        {t('profile.tv_time')}
                                    </Typography>
                                </Stack>
                                <Typography variant="h6" sx={{ padding: 2 }}>
                                    <Grid container columns={12} spacing={1} sx={{ xs: 12 }} justifyContent="center">
                                        <Grid size={4}>
                                            <Box component='span'>{tvTime.days}</Box>
                                        </Grid>
                                        <Grid size={4}>
                                            <Box component='span'>{tvTime.hours}</Box>
                                        </Grid>
                                        <Grid size={4}>
                                            <Box component='span'>{tvTime.minutes}</Box>
                                        </Grid>
                                        <Grid size={4}>
                                            <Box component='span'>{t('profile.days')}</Box>
                                        </Grid>
                                        <Grid size={4}>
                                            <Box component='span'>{t('profile.hours')}</Box>
                                        </Grid>
                                        <Grid size={4}>
                                            <Box component='span'>{t('profile.minutes')}</Box>
                                        </Grid>
                                    </Grid>
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid spacing={{ xs: 3 }}>
                        <Card sx={{ backgroundColor: theme.palette.background.default, borderWidth: '2px', borderColor: theme.palette.primary.main, borderStyle: 'solid', boxShadow: "0 4px 10px rgba(0,0,0,0.4)", height: '100%' }}>
                            <CardContent>
                                <Stack direction='row' gap={2} sx={{ mb: 1, paddingBottom: 2, borderBottomWidth: '2px', borderBottomColor: theme.palette.primary.main, borderBottomStyle: 'solid', justifyContent: 'center', alignItems: 'center' }}>
                                    <MovieOutlinedIcon sx={{ width: '36px', height: '36px', color: theme.palette.primary.main }} />
                                    <Typography variant="h6">{t('profile.movie_time')}</Typography>
                                </Stack>
                                <Typography variant="h6" sx={{ padding: 2 }}>
                                    <Grid container columns={12} spacing={1} sx={{ xs: 12 }} justifyContent="center">
                                        <Grid size={4}>
                                            <Box component='span'>{movieTime.days}</Box>
                                        </Grid>
                                        <Grid size={4}>
                                            <Box component='span'>{movieTime.hours}</Box>
                                        </Grid>
                                        <Grid size={4}>
                                            <Box component='span'>{movieTime.minutes}</Box>
                                        </Grid>
                                        <Grid size={4}>
                                            <Box component='span'>{t('profile.days')}</Box>
                                        </Grid>
                                        <Grid size={4}>
                                            <Box component='span'>{t('profile.hours')}</Box>
                                        </Grid>
                                        <Grid size={4}>
                                            <Box component='span'>{t('profile.minutes')}</Box>
                                        </Grid>
                                    </Grid>
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid spacing={{ xs: 3 }}>
                        <Card sx={{ backgroundColor: theme.palette.background.default, borderWidth: '2px', borderColor: theme.palette.primary.main, borderStyle: 'solid', boxShadow: "0 4px 10px rgba(0,0,0,0.4)", height: '100%' }}>
                            <CardContent>
                                <Stack direction='row' gap={2} sx={{ mb: 1, paddingBottom: 2, borderBottomWidth: '2px', borderBottomColor: theme.palette.primary.main, borderBottomStyle: 'solid', justifyContent: 'center', alignItems: 'center' }}>
                                    <TimerIcon sx={{ width: '36px', height: '36px', color: theme.palette.primary.main }} />
                                    <Typography variant="h6">{t('profile.total_watch_time')}</Typography>
                                </Stack>
                                <Typography variant="h6" sx={{ padding: 2 }}>
                                    <Grid container columns={12} spacing={1} sx={{ xs: 12 }} justifyContent="center">
                                        <Grid size={4}>
                                            <Box component='span'>{totalWatchTime.days}</Box>
                                        </Grid>
                                        <Grid size={4}>
                                            <Box component='span'>{totalWatchTime.hours}</Box>
                                        </Grid>
                                        <Grid size={4}>
                                            <Box component='span'>{totalWatchTime.minutes}</Box>
                                        </Grid>
                                        <Grid size={4}>
                                            <Box component='span'>{t('profile.days')}</Box>
                                        </Grid>
                                        <Grid size={4}>
                                            <Box component='span'>{t('profile.hours')}</Box>
                                        </Grid>
                                        <Grid size={4}>
                                            <Box component='span'>{t('profile.minutes')}</Box>
                                        </Grid>
                                    </Grid>
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid spacing={{ xs: 3 }}>
                        <Card sx={{ backgroundColor: theme.palette.background.default, borderWidth: '2px', borderColor: theme.palette.primary.main, borderStyle: 'solid', boxShadow: "0 4px 10px rgba(0,0,0,0.4)", height: '100%' }}>
                            <CardContent>
                                <Stack direction='row' gap={2} sx={{ paddingX: 4, mb: 1, paddingBottom: 2, borderBottomWidth: '2px', borderBottomColor: theme.palette.primary.main, borderBottomStyle: 'solid', justifyContent: 'center', alignItems: 'center' }}>
                                    <LocalMoviesIcon sx={{ width: '36px', height: '36px', color: theme.palette.primary.main }} />
                                    <Typography variant="h6">{t('profile.content_watched')}</Typography>
                                </Stack>
                                <Typography variant="h6" sx={{ padding: 2 }}>
                                    <Grid container columns={12} spacing={1} sx={{ xs: 12 }} justifyContent="center">
                                        <Grid size={6}>
                                            <Box component='span'>{totalShowsWatched}</Box>
                                        </Grid>
                                        <Grid size={6}>
                                            <Box component='span'>{totalMoviesWatched}</Box>
                                        </Grid>
                                        <Grid size={6}>
                                            <Box component='span'>{t('profile.shows')}</Box>
                                        </Grid>
                                        <Grid size={6}>
                                            <Box component='span'>{t('profile.movies')}</Box>
                                        </Grid>
                                    </Grid>
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Grid container columns={12} spacing={3} sx={{ alignItems: 'stretch' }}>
                    <Grid size={12}>
                        <Box sx={{
                            fontWeight: 600,
                            backgroundColor: theme.palette.background.default, borderWidth: '2px', borderColor: theme.palette.primary.main, borderStyle: 'solid',
                            borderRadius: '12px',
                            padding: 6,
                            boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%'
                        }}>
                            <Stack gap={2} display="flex" justifyContent="center" alignItems="center">
                                <Typography variant="h5" fontWeight="bold">
                                    {t('profile.favourite_genre_text')}
                                </Typography>
                                <BarGraph genreCount={genreCount} />
                            </Stack>
                        </Box>
                    </Grid>
                    <Grid size={{ md: 12, lg: 6 }}>
                        <Box sx={{
                            fontWeight: 600,
                            backgroundColor: theme.palette.background.default, borderWidth: '2px', borderColor: theme.palette.primary.main, borderStyle: 'solid',
                            borderRadius: '12px',
                            padding: 6,
                            boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%'
                        }}>
                            <Stack gap={2} display="flex" justifyContent="center" alignItems="center">
                                <Typography variant="h5" fontWeight="bold">
                                    {t('profile.movie_list_breakdown_text')}
                                </Typography>
                                <PieChart numFavourites={numFavourites} numWatchLater={numWatchLater} numWatched={numWatched} />
                            </Stack>
                        </Box>
                    </Grid>
                    <Grid size={{ md: 12, lg: 6 }}>
                        <Box sx={{
                            fontWeight: 600,
                            backgroundColor: theme.palette.background.default, borderWidth: '2px', borderColor: theme.palette.primary.main, borderStyle: 'solid',
                            borderRadius: '12px',
                            padding: 6,
                            boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%'
                        }}>
                            <Stack id='test' gap={2} display="flex" justifyContent="center" alignItems="center">
                                <Typography variant="h5" fontWeight="bold">
                                    {t('profile.content_watched_text')}
                                </Typography>
                                <TopLanguagesPieChart languageCount={languageCount} />
                            </Stack>
                        </Box>
                    </Grid>
                    <Grid size={12}>
                        <Box sx={{
                            fontWeight: 600,
                            backgroundColor: theme.palette.background.default, borderWidth: '2px', borderColor: theme.palette.primary.main, borderStyle: 'solid',
                            borderRadius: '12px',
                            padding: 6,
                            boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%'
                        }}>
                            <Stack gap={2} display="flex" justifyContent="center" alignItems="center">
                                <Typography variant="h5" fontWeight="bold">
                                    {t('profile.imdb_votes_text')}
                                </Typography>
                                <IMDbVotesChart votesData={topIMDbVotesCount} />
                            </Stack>
                        </Box>
                    </Grid>
                </Grid>
            </Box >

            <Dialog sx={{
                "& .MuiPaper-root": {
                    backgroundColor: theme.palette.background.default,
                    borderRadius: '12px',
                    color: theme.palette.text.primary,
                }
            }} open={openEditProfile} onClose={handleEditProfileClose} maxWidth="md" fullWidth>
                <DialogTitle>{t('profile.edit_profile_details')}</DialogTitle>
                <DialogContent>
                    <DialogContentText component='div' sx={{ paddingY: 2 }}>
                        <EditProfileForm onEditProfileClose={handleEditProfileClose} />
                    </DialogContentText>
                </DialogContent>
            </Dialog>

            <Dialog sx={{
                "& .MuiPaper-root": {
                    backgroundColor: theme.palette.background.default,
                    borderRadius: '12px',
                    color: theme.palette.text.primary,
                }
            }} open={openSignOut} onClose={handleSignOutClose} maxWidth="xs" fullWidth>
                <DialogTitle>{t('profile.confirm_sign_out')}</DialogTitle>
                <DialogContent >
                    <DialogContentText component='div' sx={{ paddingY: 2 }}>
                        {t('profile.sign_out_text')}
                    </DialogContentText>
                    <DialogActions>
                        <Button onClick={handleSignOutClose} color="primary">
                            {t('profile.cancel')}
                        </Button>
                        <Button sx={{
                            backgroundColor: theme.palette.primary.main,
                            "&:hover": {
                                backgroundColor: theme.palette.background.secondary
                            }
                        }} onClick={handleSignOut} variant="contained">
                            {t('profile.confirm')}
                        </Button>
                    </DialogActions>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default UserProfile;