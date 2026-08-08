import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import ReplayIcon from '@mui/icons-material/Replay';

import BackButton from '../components/common/BackButton';
import MovieCard from '../components/common/MovieCard';
import { axiosPublic } from '../api/axiosConfig';
import { RootState } from '../redux/store';
import { Movie } from '../types';

const API_URL =
  import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_BACKEND_URL_PROD
    : import.meta.env.VITE_BACKEND_URL_DEV;

type ContentTypeFilter = 'both' | 'movie' | 'series';

const currentYear = new Date().getFullYear();

const uniqueMovies = (movies: Movie[]) => {
  const byId = new Map<string, Movie>();
  movies.forEach((movie) => byId.set(movie.imdbID, movie));
  return Array.from(byId.values());
};

const getStartYear = (year: string) => {
  return parseInt(year?.match(/\d{4}/)?.[0] || '', 10);
};

const RECOMMENDATION_OPTIONS = [1, 3, 5, 7, 10] as const;

type RecommendationCount = (typeof RECOMMENDATION_OPTIONS)[number];

export default function SpinWheel() {
  const theme = useTheme();
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

  const genreOptions = useMemo(() => {
    const genres = new Set<string>();
    savedMovies.forEach((movie) => {
      movie.Genre?.split(', ')
        .filter(Boolean)
        .forEach((genre) => genres.add(genre));
    });
    return Array.from(genres).sort();
  }, [savedMovies]);

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [type, setType] = useState<ContentTypeFilter>('both');
  const [yearRange, setYearRange] = useState<[number, number]>([1980, currentYear]);
  const [excludeWatched, setExcludeWatched] = useState(true);
  // const [candidates, setCandidates] = useState<Movie[]>([]);
  const [winners, setWinners] = useState<Movie[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendationCount, setRecommendationCount] = useState<RecommendationCount>(3);

  const fallbackCandidates = useMemo(() => {
    return savedMovies.filter((movie) => {
      const year = getStartYear(movie.Year);
      const matchesGenre =
        selectedGenres.length === 0 ||
        selectedGenres.some((genre) => movie.Genre?.includes(genre));
      const matchesType = type === 'both' || movie.Type === type;
      const matchesYear = year >= yearRange[0] && year <= yearRange[1];
      const isAllowed = !excludeWatched || !watchedIds.has(movie.imdbID);

      return matchesGenre && matchesType && matchesYear && isAllowed;
    });
  }, [excludeWatched, savedMovies, selectedGenres, type, watchedIds, yearRange]);

  const getRandomMovies = (
    movies: Movie[],
    count: number
  ): Movie[] => {
    const shuffled = [...movies];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, count);
  };

  const spin = async () => {
    setError(null);
    setIsSpinning(true);

    try {
      const response = await axiosPublic.post(`${API_URL}/api/wheel/candidates`, {
        genres: selectedGenres,
        type,
        fromYear: yearRange[0],
        toYear: yearRange[1],
        excludeImdbIDs: excludeWatched ? Array.from(watchedIds) : [],
        limit: 50,
      });

      const backendCandidates = response.data.success ? response.data.movies : [];
      const nextCandidates =
        backendCandidates.length > 0 ? backendCandidates : fallbackCandidates;

      if (nextCandidates.length === 0) {
        setWinners([]);
        // setCandidates([]);
        setError('No matches yet. Search and save more titles, or loosen the filters.');
        setIsSpinning(false);
        return;
      }

      const count = Math.min(
        recommendationCount,
        nextCandidates.length
      );

      const selected = getRandomMovies(nextCandidates, count);

      // setCandidates(nextCandidates);
      window.setTimeout(() => {
        setWinners(selected);
        setIsSpinning(false);
      }, 900);
    } catch {
      if (fallbackCandidates.length === 0) {
        setError('Could not fetch wheel candidates right now.');
        setWinners([]);
        // setCandidates([]);
        setIsSpinning(false);
        return;
      }

      const count = Math.min(
        recommendationCount,
        fallbackCandidates.length
      );

      const selected = getRandomMovies(fallbackCandidates, count);

      // setCandidates(fallbackCandidates);
      window.setTimeout(() => {
        setWinners(selected);
        setIsSpinning(false);
      }, 900);
    }
  };

  return (
    <>
      <BackButton />
      <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 } }}>
        <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 3 }}>
          <CasinoIcon color="primary" fontSize="large" />
          <Typography variant="h4" fontWeight={800}>
            Spin the Wheel
          </Typography>
        </Stack>

        <Card
          sx={{
            backgroundColor: theme.palette.background.default,
            border: `2px solid ${theme.palette.primary.main}`,
            borderRadius: '12px',
            mb: 3,
          }}
        >
          <CardContent>
            <Stack gap={3}>
              <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
                <FormControl fullWidth>
                  <InputLabel id="wheel-genre-label">Genres</InputLabel>
                  <Select
                    labelId="wheel-genre-label"
                    multiple
                    label="Genres"
                    value={selectedGenres}
                    onChange={(event) =>
                      setSelectedGenres(
                        typeof event.target.value === 'string'
                          ? event.target.value.split(',')
                          : event.target.value,
                      )
                    }
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {genreOptions.map((genre) => (
                      <MenuItem key={genre} value={genre}>
                        {genre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="wheel-count-label">
                    Recommendations
                  </InputLabel>

                  <Select
                    labelId="wheel-count-label"
                    label="Recommendations"
                    value={recommendationCount}
                    onChange={(event) =>
                      setRecommendationCount(
                        Number(event.target.value) as RecommendationCount
                      )
                    }
                  >
                    {RECOMMENDATION_OPTIONS.map((count) => (
                      <MenuItem key={count} value={count}>
                        {count}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="wheel-type-label">Type</InputLabel>
                  <Select
                    labelId="wheel-type-label"
                    label="Type"
                    value={type}
                    onChange={(event) => setType(event.target.value as ContentTypeFilter)}
                  >
                    <MenuItem value="both">Movies & TV</MenuItem>
                    <MenuItem value="movie">Movies</MenuItem>
                    <MenuItem value="series">TV Shows</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                  Release year: {yearRange[0]} - {yearRange[1]}
                </Typography>
                <Slider
                  value={yearRange}
                  min={1920}
                  max={currentYear}
                  onChange={(_, value) => setYearRange(value as [number, number])}
                  valueLabelDisplay="auto"
                />
              </Box>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                gap={2}
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={excludeWatched}
                      onChange={(event) => setExcludeWatched(event.target.checked)}
                    />
                  }
                  label="Exclude already watched"
                />
                <Button
                  variant="contained"
                  startIcon={winners.length > 0 ? <ReplayIcon /> : <CasinoIcon />}
                  onClick={spin}
                  disabled={isSpinning}
                  sx={{ ml: { sm: 'auto' }, fontWeight: 800 }}
                >
                  {winners.length > 0 ? 'Spin again' : 'Spin'}
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Stack alignItems="center" gap={3}>
          <Box
            component={motion.div}
            animate={{ rotate: isSpinning ? 1080 : 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            sx={{
              width: { xs: 120, md: 220 },
              aspectRatio: '1 / 1',
              borderRadius: '50%',
              border: `10px solid ${theme.palette.primary.main}`,
              background: `conic-gradient(${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.background.default}, ${theme.palette.primary.main})`,
              display: 'grid',
              placeItems: 'center',
              boxShadow: `0 0 28px ${theme.palette.primary.main}80`,
            }}
          >
            <Typography variant="body1" fontWeight={900} textAlign="center">
              {isSpinning
                ? 'Picking...'
                : `${recommendationCount} recommendation${recommendationCount > 1 ? 's' : ''
                }`}
            </Typography>
          </Box>

          {winners.length > 0 && !isSpinning && (
            <Stack gap={3} alignItems="center" sx={{ width: '100%' }}>
              <Typography variant="h5" fontWeight={800}>
                Tonight's picks
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                gap={3}
                justifyContent="center"
                alignItems="stretch"
                flexWrap="wrap"
              >
                {winners.map((movie) => (
                  <MovieCard
                    key={movie.imdbID}
                    movie={movie}
                  />
                ))}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Box>
    </>
  );
}
