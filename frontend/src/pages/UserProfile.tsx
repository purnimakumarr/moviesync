import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from 'react-oidc-context';
import { useTranslation } from 'react-i18next';
import { RootState } from '../redux/store';

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FavoriteIcon from '@mui/icons-material/Favorite';
import TimerIcon from '@mui/icons-material/Timer';
import TvIcon from '@mui/icons-material/Tv';
import LocalMoviesIcon from '@mui/icons-material/LocalMovies';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import PieChart from '../components/userProfile/ListBreakdownPieChart';
import BarGraph from '../components/userProfile/GenreBarGraph';
import BackButton from '../components/common/BackButton';
import EditProfileForm from '../components/userProfile/EditProfileForm';
import IMDbVotesChart from '../components/userProfile/IMDbVotesChart';
import TopLanguagesPieChart from '../components/userProfile/TopLanguagesPieChart';
import ContentTypeDonutChart from '../components/userProfile/ContentTypeDonutChart';
import DecadeDistributionChart from '../components/userProfile/DecadeDistributionChart';
import PeopleWordCloud from '../components/userProfile/PeopleWordCloud';

import { Movie } from '../types';
import { signOutRedirect } from '../auth/authUtils';

const parseMinutes = (runtime: string) => {
  return parseInt(runtime?.replace(/\D/g, ''), 10) || 0;
};

const formatTime = (
  totalMinutes: number,
): { days: number; hours: number; minutes: number } => {
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes };
};

const buildUniqueMovieMap = (movies: Movie[]) => {
  const uniqueMovies = new Map<string, Movie>();

  movies.forEach((movie) => {
    uniqueMovies.set(movie.imdbID, movie);
  });

  return uniqueMovies;
};

const UserProfile = () => {
  const auth = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  const favourites = useSelector((store: RootState) => store.favourites.details);
  const watchLater = useSelector((store: RootState) => store.watch.watchLater);
  const watched = useSelector((store: RootState) => store.watch.watched);

  const numFavourites = Object.keys(favourites).length;
  const numWatchLater = Object.keys(watchLater).length;
  const numWatched = Object.keys(watched).length;

  const { firstName, lastName, userID, loading } = useSelector(
    (store: RootState) => store.user,
  );

  const [openEditProfile, setOpenEditProfile] = useState(false);
  const [openSignOut, setOpenSignOut] = useState(false);

  const handleSignOut = function () {
    setOpenSignOut(false);
    auth.removeUser();
    signOutRedirect();
  };

  const watchedMovies = useMemo(() => Object.values(watched), [watched]);
  const allSavedMovies = useMemo(
    () => [
      ...Object.values(favourites),
      ...Object.values(watched),
      ...Object.values(watchLater),
    ],
    [favourites, watched, watchLater],
  );

  const totalMoviesWatched = useMemo(
    () => watchedMovies.filter((movie) => movie.Type === 'movie').length,
    [watchedMovies],
  );

  const totalShowsWatched = useMemo(
    () => watchedMovies.filter((movie) => movie.Type === 'series').length,
    [watchedMovies],
  );

  const { movieTime, tvTime, totalWatchTime } = useMemo(() => {
    const totalMovieMinutes = watchedMovies
      .filter((movie) => movie.Type === 'movie')
      .reduce((sum, movie) => sum + parseMinutes(movie.Runtime), 0);

    const totalTvMinutes = watchedMovies
      .filter((movie) => movie.Type === 'series')
      .reduce((sum, movie) => {
        const seasons = parseInt(movie.totalSeasons, 10) || 1;
        return sum + parseMinutes(movie.Runtime) * seasons * 10;
      }, 0);

    return {
      tvTime: formatTime(totalTvMinutes),
      movieTime: formatTime(totalMovieMinutes),
      totalWatchTime: formatTime(totalMovieMinutes + totalTvMinutes),
    };
  }, [watchedMovies]);

  const languageCount = useMemo(() => {
    const count: Record<string, number> = {};

    buildUniqueMovieMap(watchedMovies).forEach(({ Language }) => {
      Language?.split(', ')
        .filter(Boolean)
        .forEach((lang) => {
          count[lang] = (count[lang] || 0) + 1;
        });
    });

    return Object.entries(count).map(([language, count]) => ({ language, count }));
  }, [watchedMovies]);

  const genreCount = useMemo(() => {
    const count: Record<string, number> = {};

    buildUniqueMovieMap(allSavedMovies).forEach(({ Genre }) => {
      Genre?.split(', ')
        .filter(Boolean)
        .forEach((genre) => {
          count[genre] = (count[genre] || 0) + 1;
        });
    });

    return count;
  }, [allSavedMovies]);

  const decadeDistribution = useMemo(() => {
    const count: Record<string, number> = {};

    buildUniqueMovieMap(watchedMovies).forEach(({ Year }) => {
      const year = parseInt(Year?.match(/\d{4}/)?.[0] || '', 10);
      if (!year) return;

      const decade = `${Math.floor(year / 10) * 10}s`;
      count[decade] = (count[decade] || 0) + 1;
    });

    return Object.entries(count)
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => parseInt(a.decade, 10) - parseInt(b.decade, 10));
  }, [watchedMovies]);

  const peopleWordCloud = useMemo(() => {
    const count: Record<string, number> = {};

    buildUniqueMovieMap(watchedMovies).forEach(({ Actors, Director }) => {
      `${Actors || ''}, ${Director || ''}`
        .split(',')
        .map((person) => person.trim())
        .filter((person) => person && person !== 'N/A')
        .forEach((person) => {
          count[person] = (count[person] || 0) + 1;
        });
    });

    return Object.entries(count)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 40);
  }, [watchedMovies]);

  const topIMDbVotesCount = useMemo(() => {
    return watchedMovies
      .filter((movie) => movie.imdbVotes && movie.imdbVotes !== 'N/A')
      .sort(
        (a, b) =>
          parseInt(b.imdbVotes.replace(/,/g, ''), 10) -
          parseInt(a.imdbVotes.replace(/,/g, ''), 10),
      )
      .slice(0, 10)
      .map((movie) => ({
        title: movie.Title,
        votes: parseInt(movie.imdbVotes.replace(/,/g, ''), 10),
      }));
  }, [watchedMovies]);

  const renderTimeValue = (time: { days: number; hours: number; minutes: number }) => (
    <Stack direction="row" gap={1.5} justifyContent="center" flexWrap="wrap">
      {[
        { value: time.days, label: t('profile.days') },
        { value: time.hours, label: t('profile.hours') },
        { value: time.minutes, label: t('profile.minutes') },
      ].map((item) => (
        <Box key={item.label} sx={{ minWidth: 68 }}>
          <Typography variant="h5" fontWeight={800}>
            {item.value}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Stack>
  );

  const statCards = [
    { icon: <TvIcon />, label: t('profile.tv_time'), value: renderTimeValue(tvTime) },
    {
      icon: <MovieOutlinedIcon />,
      label: t('profile.movie_time'),
      value: renderTimeValue(movieTime),
    },
    {
      icon: <TimerIcon />,
      label: t('profile.total_watch_time'),
      value: renderTimeValue(totalWatchTime),
    },
    {
      icon: <LocalMoviesIcon />,
      label: t('profile.content_watched'),
      value: (
        <Stack direction="row" gap={3} justifyContent="center">
          <Box>
            <Typography variant="h5" fontWeight={800}>
              {totalShowsWatched}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {t('profile.shows')}
            </Typography>
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              {totalMoviesWatched}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {t('profile.movies')}
            </Typography>
          </Box>
        </Stack>
      ),
    },
  ];

  const collectionCards = [
    {
      icon: <FavoriteIcon sx={{ color: theme.palette.favouriteIcon }} />,
      label: t('profile.favourites'),
      count: numFavourites,
      path: '/favourites',
    },
    {
      icon: <WatchLaterIcon sx={{ color: theme.palette.watchLaterIcon }} />,
      label: t('profile.watch_later'),
      count: numWatchLater,
      path: '/watch-later',
    },
    {
      icon: <CheckCircleIcon sx={{ color: theme.palette.watchedIcon }} />,
      label: t('profile.watched'),
      count: numWatched,
      path: '/watched',
    },
  ];

  const chartCardSx = {
    backgroundColor: theme.palette.background.default,
    border: `2px solid ${theme.palette.primary.main}`,
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
    height: '100%',
  };

  return (
    <>
      <BackButton />
      <Box sx={{ maxWidth: '1600px', margin: 'auto', p: { xs: 2, md: 4 } }}>
        <Card sx={{ ...chartCardSx, mb: 4 }}>
          <CardContent>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              gap={3}
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Avatar
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '2rem', md: '3rem' },
                  backgroundColor: theme.palette.primary.main,
                  border: `2px solid ${theme.palette.secondary.main}`,
                  width: { xs: 96, md: 128 },
                  height: { xs: 96, md: 128 },
                  color: theme.palette.text.tertiary,
                  boxShadow: 4,
                }}
              >
                {firstName && lastName && `${firstName[0][0]}${lastName[0][0]}`}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{ fontSize: 'clamp(1.7rem, 4vw, 3rem)' }}
                >
                  {loading ? '...' : `${firstName || ''} ${lastName || ''}`.trim()}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ overflowWrap: 'anywhere' }}
                >
                  {loading ? '...' : userID}
                </Typography>
              </Box>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                gap={2}
                sx={{ ml: { md: 'auto' }, width: { xs: '100%', sm: 'auto' } }}
              >
                <Button
                  onClick={() => setOpenSignOut(true)}
                  variant="outlined"
                  startIcon={<LogoutIcon />}
                  sx={{ fontWeight: 700 }}
                >
                  {t('profile.sign_out')}
                </Button>
                <Button
                  onClick={() => setOpenEditProfile(true)}
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{ fontWeight: 700 }}
                >
                  {t('profile.edit_profile_details')}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          {collectionCards.map((collection) => (
            <Grid key={collection.path} size={{ xs: 12, md: 4 }}>
              <Card
                component="button"
                onClick={() => navigate(collection.path)}
                sx={{
                  ...chartCardSx,
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'transform 180ms ease',
                  '&:hover': { transform: 'translateY(-3px)' },
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" gap={2}>
                    <Box sx={{ display: 'flex', fontSize: 34 }}>{collection.icon}</Box>
                    <Box>
                      <Typography variant="h6" fontWeight={800}>
                        {collection.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" fontWeight={700}>
                        {collection.count} saved
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Typography variant="h4" sx={{ mb: 3, fontSize: 'clamp(1.4rem, 2vw, 2rem)' }}>
          {t('profile.my_stats')}
        </Typography>
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {statCards.map((stat) => (
            <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={chartCardSx}>
                <CardContent>
                  <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <Box sx={{ color: theme.palette.primary.main, display: 'flex' }}>
                      {stat.icon}
                    </Box>
                    <Typography variant="subtitle1" fontWeight={800}>
                      {stat.label}
                    </Typography>
                  </Stack>
                  {stat.value}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container columns={12} spacing={3} sx={{ alignItems: 'stretch' }}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Card sx={chartCardSx}>
              <CardContent>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
                  {t('profile.favourite_genre_text')}
                </Typography>
                <BarGraph genreCount={genreCount} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 5 }}>
            <Card sx={chartCardSx}>
              <CardContent>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
                  Movies vs. TV Shows
                </Typography>
                <ContentTypeDonutChart
                  movieCount={totalMoviesWatched}
                  seriesCount={totalShowsWatched}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={chartCardSx}>
              <CardContent>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
                  Release Decades
                </Typography>
                <DecadeDistributionChart data={decadeDistribution} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={chartCardSx}>
              <CardContent>
                <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <PersonSearchIcon color="primary" />
                  <Typography variant="h5" fontWeight={800}>
                    Actors & Directors
                  </Typography>
                </Stack>
                <PeopleWordCloud words={peopleWordCloud} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={chartCardSx}>
              <CardContent>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
                  {t('profile.movie_list_breakdown_text')}
                </Typography>
                <PieChart
                  numFavourites={numFavourites}
                  numWatchLater={numWatchLater}
                  numWatched={numWatched}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={chartCardSx}>
              <CardContent>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
                  {t('profile.content_watched_text')}
                </Typography>
                <TopLanguagesPieChart languageCount={languageCount} />
              </CardContent>
            </Card>
          </Grid>
          <Grid size={12}>
            <Card sx={chartCardSx}>
              <CardContent>
                <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <CalendarMonthIcon color="primary" />
                  <Typography variant="h5" fontWeight={800}>
                    {t('profile.imdb_votes_text')}
                  </Typography>
                </Stack>
                <IMDbVotesChart votesData={topIMDbVotesCount} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Dialog
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: theme.palette.background.default,
            borderRadius: '12px',
            color: theme.palette.text.primary,
          },
        }}
        open={openEditProfile}
        onClose={() => setOpenEditProfile(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{t('profile.edit_profile_details')}</DialogTitle>
        <DialogContent>
          <DialogContentText component="div" sx={{ paddingY: 2 }}>
            <EditProfileForm onEditProfileClose={() => setOpenEditProfile(false)} />
          </DialogContentText>
        </DialogContent>
      </Dialog>

      <Dialog
        sx={{
          '& .MuiPaper-root': {
            backgroundColor: theme.palette.background.default,
            borderRadius: '12px',
            color: theme.palette.text.primary,
          },
        }}
        open={openSignOut}
        onClose={() => setOpenSignOut(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('profile.confirm_sign_out')}</DialogTitle>
        <DialogContent>
          <DialogContentText component="div" sx={{ paddingY: 2 }}>
            {t('profile.sign_out_text')}
          </DialogContentText>
          <DialogActions>
            <Button onClick={() => setOpenSignOut(false)} color="primary">
              {t('profile.cancel')}
            </Button>
            <Button
              sx={{
                backgroundColor: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.background.secondary,
                },
              }}
              onClick={handleSignOut}
              variant="contained"
            >
              {t('profile.confirm')}
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserProfile;
