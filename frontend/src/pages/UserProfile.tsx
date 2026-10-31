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
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FavoriteIcon from '@mui/icons-material/Favorite';
import TimerIcon from '@mui/icons-material/Timer';
import StarIcon from '@mui/icons-material/Star';
import EditIcon from '@mui/icons-material/Edit';
import LogoutIcon from '@mui/icons-material/Logout';

import EditProfileForm from '../components/userProfile/EditProfileForm';
import StatTile from '../components/userProfile/StatTile';
import Highlights from '../components/userProfile/Highlights';
import ChartCard from '../components/userProfile/charts/ChartCard';
import RankedBars from '../components/userProfile/charts/RankedBars';
import ColumnChart from '../components/userProfile/charts/ColumnChart';
import { computeProfileStats } from '../utils/profileStats';
import { signOutRedirect } from '../auth/authUtils';

const UserProfile = () => {
  const auth = useAuth();
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  const favourites = useSelector((store: RootState) => store.favourites.details);
  const watchLater = useSelector((store: RootState) => store.watch.watchLater);
  const watched = useSelector((store: RootState) => store.watch.watched);

  const { firstName, lastName, userID, loading } = useSelector(
    (store: RootState) => store.user,
  );
  const listsLoading = useSelector(
    (store: RootState) =>
      store.favourites.loading || store.watch.loadingWatchLater || store.watch.loadingWatched,
  );

  const [openEditProfile, setOpenEditProfile] = useState(false);
  const [openSignOut, setOpenSignOut] = useState(false);

  const handleSignOut = function () {
    setOpenSignOut(false);
    auth.removeUser();
    signOutRedirect();
  };

  const stats = useMemo(
    () =>
      computeProfileStats({
        favourites: Object.values(favourites),
        watchLater: Object.values(watchLater),
        watched: Object.values(watched),
      }),
    [favourites, watchLater, watched],
  );

  const { days, hours, minutes } = stats.watchTime;
  const watchTimeValue = days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`;
  const basedOnSaved = t('profile.based_on_saved', { count: stats.savedCount });

  const tiles = [
    {
      icon: <CheckCircleIcon />,
      accent: theme.palette.watchedIcon,
      label: t('profile.watched'),
      value: stats.watchedCount,
      note: t('profile.watched_split', { movies: stats.watchedMovies, shows: stats.watchedShows }),
      onClick: () => navigate('/watched'),
    },
    {
      icon: <TimerIcon />,
      accent: theme.palette.chart,
      label: t('profile.watch_time'),
      value: watchTimeValue,
      note: t('profile.watch_time_note'),
    },
    {
      icon: <StarIcon />,
      accent: theme.palette.chart2,
      label: t('profile.avg_rating'),
      value: stats.averageRating ?? '–',
      note: t('profile.avg_rating_note', { count: stats.ratedWatchedCount }),
    },
    {
      icon: <FavoriteIcon />,
      accent: theme.palette.favouriteIcon,
      label: t('profile.favourites'),
      value: stats.favouritesCount,
      note: t('profile.open_list'),
      onClick: () => navigate('/favourites'),
    },
    {
      icon: <WatchLaterIcon />,
      accent: theme.palette.watchLaterIcon,
      label: t('profile.watch_later'),
      value: stats.watchLaterCount,
      note:
        stats.watchLaterCount > 0
          ? t('profile.backlog_note', {
              time: stats.backlogTime.days > 0
                ? `${stats.backlogTime.days}d ${stats.backlogTime.hours}h`
                : `${stats.backlogTime.hours}h ${stats.backlogTime.minutes}m`,
            })
          : t('profile.open_list'),
      onClick: () => navigate('/watch-later'),
    },
  ];

  const charts = [
    // Neighbouring cards alternate between the theme's two chart hues.
    { key: 'genres', title: t('profile.chart_genres'), kind: 'ranked', data: stats.genres, hue: theme.palette.chart },
    { key: 'decades', title: t('profile.chart_decades'), kind: 'columns', data: stats.decades, hue: theme.palette.chart2 },
    { key: 'ratings', title: t('profile.chart_ratings'), kind: 'columns', data: stats.ratings, hue: theme.palette.chart },
    { key: 'languages', title: t('profile.chart_languages'), kind: 'ranked', data: stats.languages, hue: theme.palette.chart2 },
    { key: 'directors', title: t('profile.chart_directors'), kind: 'ranked', data: stats.directors, hue: theme.palette.chart },
    { key: 'actors', title: t('profile.chart_actors'), kind: 'ranked', data: stats.actors, hue: theme.palette.chart2 },
  ] as const;

  return (
    <>
      <Box sx={{ pt: { xs: 2, md: 3 } }}>
        <Card
          sx={{
            mb: { xs: 2, md: 3 },
            backgroundColor: theme.palette.background.default,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
          }}
        >
          <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } } }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              gap={{ xs: 2, sm: 2.5 }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Avatar
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.25rem', md: '1.5rem' },
                  backgroundColor: theme.palette.primary.main,
                  width: { xs: 56, md: 64 },
                  height: { xs: 56, md: 64 },
                  color: theme.palette.text.tertiary,
                }}
              >
                {firstName && lastName && `${firstName[0][0]}${lastName[0][0]}`}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h4" component="h1">
                  {loading ? <Skeleton width={180} /> : `${firstName || ''} ${lastName || ''}`.trim()}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, overflowWrap: 'anywhere' }}>
                  {loading ? <Skeleton width={220} /> : userID}
                </Typography>
              </Box>
              <Stack direction="row" gap={1} sx={{ ml: { sm: 'auto' }, flexWrap: 'wrap' }}>
                <Button
                  onClick={() => setOpenSignOut(true)}
                  variant="outlined"
                  startIcon={<LogoutIcon />}
                  sx={{ color: theme.palette.text.primary }}
                >
                  {t('profile.sign_out')}
                </Button>
                <Button
                  onClick={() => setOpenEditProfile(true)}
                  variant="contained"
                  startIcon={<EditIcon />}
                >
                  {t('profile.edit_profile_details')}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Box
          component="section"
          aria-label={t('profile.my_stats')}
          sx={{
            display: 'grid',
            gap: { xs: 1.5, md: 2 },
            // 2 per row on phones, 3 on tablets, all 5 in one row on laptops.
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' },
            mb: { xs: 3, md: 4 },
          }}
        >
          {tiles.map(({ label, ...tile }) => (
            <StatTile key={label} label={label} loading={listsLoading} {...tile} />
          ))}
        </Box>

        <Highlights stats={stats} />

        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          {t('profile.your_taste')}
        </Typography>
        <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: 4 }}>
          {charts.map((chart) => (
            <Grid key={chart.key} size={{ xs: 12, md: 6 }}>
              <ChartCard
                title={chart.title}
                subtitle={basedOnSaved}
                loading={listsLoading}
                isEmpty={chart.data.length === 0}
                emptyText={t('profile.chart_empty')}
                accent={chart.hue}
              >
                {chart.kind === 'ranked' ? (
                  <RankedBars data={[...chart.data]} total={stats.savedCount} caption={chart.title} hue={chart.hue} />
                ) : (
                  <ColumnChart data={[...chart.data]} caption={chart.title} hue={chart.hue} />
                )}
              </ChartCard>
            </Grid>
          ))}
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
