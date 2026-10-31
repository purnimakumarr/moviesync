import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'framer-motion';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { visuallyHidden } from '@mui/utils';
import CasinoIcon from '@mui/icons-material/Casino';
import TuneIcon from '@mui/icons-material/Tune';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import PageHeader from '../components/common/PageHeader';
import Wheel from '../components/spinWheel/Wheel';
import WheelFilters from '../components/spinWheel/WheelFilters';
import WinnerReveal from '../components/spinWheel/WinnerReveal';
import ResultPanel from '../components/spinWheel/ResultPanel';
import { axiosPrivate, axiosPublic } from '../api/axiosConfig';
import { useIsAuthenticated } from '../auth/authHooks';
import { RootState } from '../redux/store';
import { WheelPick } from '../types';
import {
  buildWheelSegments,
  ContentTypeFilter,
  countActiveFilters,
  DEFAULT_YEAR_RANGE,
  RecommendationCount,
  filterCandidates,
  getRandomMovies,
  rotationToLand,
  uniqueMovies,
  WheelSegment,
  WHEEL_GENRES,
} from '../utils/spinWheel';
import { getTitle, movieKey } from '../utils/tmdb';

const API_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_BACKEND_URL_PROD
    : import.meta.env.VITE_BACKEND_URL_DEV;

const MAX_MOOD_LENGTH = 200;
// With a mood, fetch the closest few matches per pick and choose randomly
// among them, so spins vary without drifting far from the mood.
const MOOD_POOL_FACTOR = 3;
const MIN_MOOD_POOL = 9;
const SPIN_DURATION_MS = 4200;
const REDUCED_SPIN_DURATION_MS = 300;
const SPIN_TURNS = 5;

type Picks = { movies: WheelPick[]; pool: WheelPick[]; moodApplied: boolean };

export default function SpinWheel() {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuthenticated = Boolean(useIsAuthenticated());
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  // Wide enough for filters, wheel and result side by side.
  const isWide = useMediaQuery(theme.breakpoints.up('lg'));
  const reduceMotion = useReducedMotion();
  const spinDurationMs = reduceMotion ? REDUCED_SPIN_DURATION_MS : SPIN_DURATION_MS;

  const favourites = useSelector((store: RootState) => store.favourites.details);
  const watchLater = useSelector((store: RootState) => store.watch.watchLater);
  const watched = useSelector((store: RootState) => store.watch.watched);

  const savedMovies = useMemo(
    () =>
      uniqueMovies([
        ...Object.values(favourites),
        ...Object.values(watchLater),
        ...Object.values(watched),
      ]),
    [favourites, watchLater, watched],
  );
  const watchedIds = useMemo(() => new Set(Object.keys(watched)), [watched]);

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [type, setType] = useState<ContentTypeFilter>('both');
  const [yearRange, setYearRange] = useState<[number, number]>(DEFAULT_YEAR_RANGE);
  const [excludeWatched, setExcludeWatched] = useState(true);
  const [recommendationCount, setRecommendationCount] = useState<RecommendationCount>(3);
  const [mood, setMood] = useState('');
  const [smartSpin, setSmartSpin] = useState(false);

  const [winners, setWinners] = useState<WheelPick[]>([]);
  const [spinSegments, setSpinSegments] = useState<WheelSegment<WheelPick>[] | null>(null);
  const [rotation, setRotation] = useState(0);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const winnerHeadingRef = useRef<HTMLHeadingElement>(null);
  const revealTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(revealTimer.current), []);

  // Moves focus to the result once it has rendered (an effect runs after the
  // commit, so the heading is guaranteed to be there).
  useEffect(() => {
    if (winners.length > 0) winnerHeadingRef.current?.focus();
  }, [winners]);

  // Before the first spin the wheel shows the user's saved titles.
  const idleSegments = useMemo(() => buildWheelSegments<WheelPick>([], savedMovies), [savedMovies]);
  const segments = spinSegments ?? idleSegments;

  const fallbackCandidates = useMemo(
    () =>
      filterCandidates(savedMovies, {
        genres: selectedGenres,
        type,
        yearRange,
        excludeWatched,
        watchedIds,
      }),
    [excludeWatched, savedMovies, selectedGenres, type, watchedIds, yearRange],
  );

  // Puts the picks on the wheel, spins it so the first pick stops under the
  // pointer, then reveals the result once the animation has finished.
  const spinTo = (picks: WheelPick[], pool: WheelPick[]) => {
    const nextSegments = buildWheelSegments(picks, [...pool, ...savedMovies]);
    const winnerIndex = nextSegments.findIndex(
      (segment) => segment.movie && movieKey(segment.movie) === movieKey(picks[0]),
    );

    setWinners([]);
    setSpinSegments(nextSegments);
    setWinnerIndex(winnerIndex);
    setRotation((current) =>
      rotationToLand(winnerIndex, nextSegments.length, current, reduceMotion ? 0 : SPIN_TURNS),
    );

    revealTimer.current = window.setTimeout(() => {
      setWinners(picks);
      setIsSpinning(false);
    }, spinDurationMs);
  };

  const pickFromSaved = (errorMessage: string) => {
    if (fallbackCandidates.length === 0) {
      setWinners([]);
      setError(errorMessage);
      setIsSpinning(false);
      return;
    }
    spinTo(getRandomMovies(fallbackCandidates, recommendationCount), fallbackCandidates);
  };

  const filters = {
    genres: selectedGenres,
    type,
    fromYear: yearRange[0],
    toYear: yearRange[1],
    mood: mood.trim(),
  };

  // Server-side draw weighted by the user's saved lists.
  const smartSpinPicks = async (): Promise<Picks> => {
    const response = await axiosPrivate.post(`${API_URL}/api/wheel/smart`, {
      ...filters,
      excludeWatched,
      count: recommendationCount,
    });
    const movies: WheelPick[] = response.data.movies ?? [];
    return { movies, pool: [], moodApplied: Boolean(response.data.moodApplied) };
  };

  const randomPicks = async (): Promise<Picks> => {
    const response = await axiosPublic.post(`${API_URL}/api/wheel/candidates`, {
      ...filters,
      exclude: excludeWatched
        ? Object.values(watched).map(({ id, media_type }) => ({ id, media_type }))
        : [],
      limit: filters.mood
        ? Math.max(recommendationCount * MOOD_POOL_FACTOR, MIN_MOOD_POOL)
        : 50,
    });
    const candidates: WheelPick[] = response.data.success ? response.data.movies : [];
    return {
      movies: getRandomMovies(candidates, recommendationCount),
      pool: candidates,
      moodApplied: Boolean(response.data.moodApplied),
    };
  };

  const spin = async () => {
    if (isSpinning) return;
    setError(null);
    setNotice(null);
    setIsSpinning(true);

    try {
      const { movies, pool, moodApplied } =
        smartSpin && isAuthenticated ? await smartSpinPicks() : await randomPicks();

      if (filters.mood && !moodApplied) {
        setNotice(t('spin_wheel.notice_mood_unavailable'));
      }

      if (movies.length === 0) {
        pickFromSaved(t('spin_wheel.error_no_matches'));
        return;
      }

      spinTo(movies, pool);
    } catch {
      pickFromSaved(t('spin_wheel.error_fetch'));
    }
  };

  const activeFilters = countActiveFilters(selectedGenres, type, yearRange);
  const filtersPanel = (
    <WheelFilters
      genreOptions={WHEEL_GENRES}
      genres={selectedGenres}
      onGenresChange={setSelectedGenres}
      count={recommendationCount}
      onCountChange={setRecommendationCount}
      type={type}
      onTypeChange={setType}
      yearRange={yearRange}
      onYearRangeChange={setYearRange}
      excludeWatched={excludeWatched}
      onExcludeWatchedChange={setExcludeWatched}
      canSmartSpin={isAuthenticated}
      smartSpin={smartSpin}
      onSmartSpinChange={setSmartSpin}
    />
  );

  // On md+ screens every panel is exactly the height left under the header,
  // page title and footer, so the page itself never scrolls. 236px covers the
  // app bar, the dense page header, the footer and the container's padding.
  const panelHeight = 'max(440px, calc(100dvh - 236px))';
  // What's left for the wheel after the mood field, Spin button and padding.
  const wheelSize = isDesktop
    ? 'min(100%, 460px, max(240px, calc(100dvh - 450px)))'
    : 'min(84vw, 400px)';

  const panelSx = {
    backgroundColor: theme.palette.background.primary,
    border: `2px solid ${theme.palette.primary.main}40`,
    borderRadius: '16px',
  };
  const desktopPanelSx = isDesktop ? { height: panelHeight, display: 'flex', flexDirection: 'column' as const } : {};

  const [winner, ...runnersUp] = winners;

  const alerts = (
    <>
      {error && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {notice && !error && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {notice}
        </Alert>
      )}
    </>
  );

  return (
    <>
      <PageHeader
        icon={<CasinoIcon color="primary" />}
        title={t('spin_wheel.title')}
        subtitle={t('spin_wheel.subtitle')}
        dense
      />

      <Grid container spacing={{ xs: 2, md: 2.5 }} alignItems="flex-start">
        {isDesktop && (
          <Grid size={{ md: 4, lg: 3 }}>
            <Card sx={{ ...panelSx, ...desktopPanelSx }}>
              <CardContent sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
                <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
                  <TuneIcon color="primary" />
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
                    {t('spin_wheel.filters')}
                  </Typography>
                  {activeFilters > 0 && <Chip size="small" color="primary" label={activeFilters} />}
                </Stack>
                {filtersPanel}
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 8, lg: 5, xl: 4 }}>
          <Card sx={{ ...panelSx, ...desktopPanelSx }}>
            <CardContent
              sx={{
                p: { xs: 2, sm: 2.5 },
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                '&:last-child': { pb: { xs: 2, sm: 2.5 } },
              }}
            >
              <TextField
                label={t('spin_wheel.mood_label')}
                placeholder={t('spin_wheel.mood_placeholder')}
                value={mood}
                onChange={(event) => setMood(event.target.value.slice(0, MAX_MOOD_LENGTH))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') spin();
                }}
                helperText={t('spin_wheel.mood_helper')}
                fullWidth
              />

              <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', py: { xs: 3, md: 2 } }}>
                <Wheel
                  segments={segments}
                  rotation={rotation}
                  durationMs={spinDurationMs}
                  label={t('spin_wheel.wheel_label', { count: segments.length })}
                  size={wheelSize}
                  highlightIndex={winner && !isSpinning ? winnerIndex : null}
                />
              </Box>

              <Stack alignItems="center" gap={1}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CasinoIcon />}
                  onClick={spin}
                  disabled={isSpinning}
                  sx={{ width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 200 } }}
                >
                  {isSpinning ? t('spin_wheel.spinning') : t('spin_wheel.spin')}
                </Button>
                {smartSpin && isAuthenticated && (
                  <Chip
                    icon={<AutoAwesomeIcon />}
                    label={t('spin_wheel.smart_spin_on')}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                )}
                {savedMovies.length === 0 && !spinSegments && (
                  <Typography variant="body2" textAlign="center" sx={{ opacity: 0.8 }}>
                    {t('spin_wheel.empty_wheel')}{' '}
                    <Button size="small" onClick={() => navigate('/search')} sx={{ p: 0.5, minWidth: 0 }}>
                      {t('app.start_searching')}
                    </Button>
                  </Typography>
                )}
              </Stack>

              {!isWide && alerts}
            </CardContent>
          </Card>

          {!isDesktop && (
            <Accordion
              disableGutters
              sx={{ ...panelSx, mt: 2, '&::before': { display: 'none' } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="wheel-filters" id="wheel-filters-header">
                <Stack direction="row" alignItems="center" gap={1}>
                  <TuneIcon color="primary" />
                  <Typography sx={{ fontWeight: 800 }}>{t('spin_wheel.filters')}</Typography>
                  {activeFilters > 0 && <Chip size="small" color="primary" label={activeFilters} />}
                </Stack>
              </AccordionSummary>
              <AccordionDetails id="wheel-filters">{filtersPanel}</AccordionDetails>
            </Accordion>
          )}
        </Grid>

        {isWide && (
          // On very wide screens the result gets the extra room.
          <Grid size={{ lg: 4, xl: 5 }}>
            <Card sx={{ ...panelSx, ...desktopPanelSx }}>
              <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, '&:last-child': { pb: 2.5 } }}>
                {alerts}
                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <ResultPanel ref={winnerHeadingRef} winner={isSpinning ? undefined : winner} runnersUp={runnersUp} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Announces the result to screen readers. */}
      <Box
        role="status"
        aria-live="polite"
        sx={visuallyHidden}
      >
        {winner ? t('spin_wheel.announce', { title: getTitle(winner) }) : ''}
      </Box>

      {winner && !isWide && (
        <WinnerReveal
          ref={winnerHeadingRef}
          winner={winner}
          runnersUp={runnersUp}
          onSpinAgain={spin}
          spinDisabled={isSpinning}
        />
      )}
    </>
  );
}
