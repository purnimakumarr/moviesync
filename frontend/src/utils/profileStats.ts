import { Movie } from '../types';
import {
  getCast, getDirectors, getGenres, getLanguages, getRating, getStartYear, getTitle,
  getTotalRuntimeMinutes, movieKey,
} from './tmdb';

export type ChartDatum = { label: string; value: number };

const TOP_GENRES = 8;
const TOP_LANGUAGES = 6;
const TOP_PEOPLE = 5;

export const RATING_BANDS = [
  { label: '< 5', min: 0, max: 5 },
  { label: '5–6', min: 5, max: 6 },
  { label: '6–7', min: 6, max: 7 },
  { label: '7–8', min: 7, max: 8 },
  { label: '8–9', min: 8, max: 9 },
  { label: '9+', min: 9, max: Infinity },
];

const unique = (movies: Movie[]) => Array.from(new Map(movies.map((movie) => [movieKey(movie), movie])).values());

const topCounts = (lists: string[][], limit: number): ChartDatum[] => {
  const counts = new Map<string, number>();
  lists.flat().forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));
  return Array.from(counts, ([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);
};

export const formatDuration = (totalMinutes: number) => {
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const mins = totalMinutes % 60;
  return { days, hours, minutes: mins };
};


export const computeProfileStats = (lists: { favourites: Movie[]; watchLater: Movie[]; watched: Movie[] }) => {
  const watched = unique(lists.watched);
  const watchLater = unique(lists.watchLater);
  const saved = unique([...lists.favourites, ...lists.watchLater, ...lists.watched]);

  const watchedMovies = watched.filter((movie) => movie.media_type === 'movie');
  const watchedShows = watched.filter((movie) => movie.media_type === 'tv');
  const watchMinutes = watched.reduce((sum, movie) => sum + getTotalRuntimeMinutes(movie), 0);
  const backlogMinutes = watchLater.reduce((sum, movie) => sum + getTotalRuntimeMinutes(movie), 0);

  const ratings = saved.map(getRating).filter((rating): rating is number => rating !== null);
  const watchedRatings = watched.map(getRating).filter((rating): rating is number => rating !== null);
  const averageRating = watchedRatings.length
    ? Math.round((watchedRatings.reduce((sum, rating) => sum + rating, 0) / watchedRatings.length) * 10) / 10
    : null;

  const decadeCounts = new Map<number, number>();
  saved.forEach((movie) => {
    const year = getStartYear(movie);
    if (year) decadeCounts.set(Math.floor(year / 10) * 10, (decadeCounts.get(Math.floor(year / 10) * 10) ?? 0) + 1);
  });
  // Every decade between the oldest and newest, so gaps show as gaps.
  const decadeKeys = Array.from(decadeCounts.keys());
  const decades: ChartDatum[] = [];
  if (decadeKeys.length) {
    for (let decade = Math.min(...decadeKeys); decade <= Math.max(...decadeKeys); decade += 10) {
      decades.push({ label: `${decade}s`, value: decadeCounts.get(decade) ?? 0 });
    }
  }

  const genres = topCounts(saved.map(getGenres), TOP_GENRES);
  const directors = topCounts(saved.map(getDirectors), TOP_PEOPLE);
  const favouriteDecade = [...decades].sort((a, b) => b.value - a.value)[0] ?? null;
  const rated = saved
    .map((movie) => ({ title: getTitle(movie), rating: getRating(movie) }))
    .filter((movie): movie is { title: string; rating: number } => movie.rating !== null)
    .sort((a, b) => b.rating - a.rating);
  const dated = saved
    .map((movie) => ({ title: getTitle(movie), year: getStartYear(movie) }))
    .filter((movie): movie is { title: string; year: number } => movie.year !== null)
    .sort((a, b) => a.year - b.year);

  return {
    savedCount: saved.length,
    backlogTime: formatDuration(backlogMinutes),
    // Share of the to-watch pile (watched + watch later) already watched.
    completionRate:
      watched.length + watchLater.length > 0
        ? Math.round((watched.length / (watched.length + watchLater.length)) * 100)
        : null,
    highlights: {
      topGenre: genres[0] ? { ...genres[0], share: Math.round((genres[0].value / saved.length) * 100) } : null,
      favouriteDecade: favouriteDecade && favouriteDecade.value > 0 ? favouriteDecade : null,
      topDirector: directors[0] ?? null,
      highestRated: rated[0] ?? null,
      oldest: dated[0] ?? null,
    },
    watchedCount: watched.length,
    watchedMovies: watchedMovies.length,
    watchedShows: watchedShows.length,
    watchTime: formatDuration(watchMinutes),
    averageRating,
    ratedWatchedCount: watchedRatings.length,
    favouritesCount: unique(lists.favourites).length,
    watchLaterCount: watchLater.length,
    genres,
    languages: topCounts(saved.map(getLanguages), TOP_LANGUAGES),
    directors,
    actors: topCounts(saved.map((movie) => getCast(movie)), TOP_PEOPLE),
    decades,
    ratings: ratings.length
      ? RATING_BANDS.map((band) => ({
          label: band.label,
          value: ratings.filter((rating) => rating >= band.min && rating < band.max).length,
        }))
      : [],
  };
};
