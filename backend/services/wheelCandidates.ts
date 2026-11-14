import { embedMovies } from './embeddings';
import {
  discoverPage,
  getGenres,
  MediaType,
  searchKeywordIds,
  summarise,
  TmdbGenre,
  TmdbTitle,
} from './tmdb';

export type WheelFilters = {
  genres?: unknown;
  type?: unknown;
  fromYear?: unknown;
  toYear?: unknown;
  exclude?: unknown;
};

// Keeps random draws to titles people have heard of.
const MIN_VOTES = 50;
const RANDOM_PAGES = 3;
// Pages further down are mostly obscure, however broad the filters are.
const MAX_RANDOM_PAGE = 50;
const MAX_MOOD_TERMS = 4;
const MIN_MOOD_TERM_LENGTH = 3;
const MOOD_STOPWORDS = new Set([
  'about', 'and', 'but', 'for', 'from', 'like', 'movie', 'movies', 'not', 'show',
  'shows', 'some', 'something', 'that', 'the', 'this', 'with', 'want', 'watch',
]);

// Most titles embedded for one mood search; embedding runs on the CPU, so this
// is what bounds how long a mood spin takes.
export const MOOD_POOL_SIZE = 60;

// "movie-550": one string per title, matching the frontend's movieKey.
export const titleKeys = (titles: unknown) =>
  Array.isArray(titles)
    ? titles
        .filter((title) => title && typeof title === 'object')
        .map(({ media_type, id }) => `${media_type}-${id}`)
    : [];

const titleKey = ({ media_type, id }: TmdbTitle) => `${media_type}-${id}`;

const shuffle = <T>(items: T[]): T[] => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const fulfilled = <T>(results: PromiseSettledResult<T>[]) =>
  results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));

const firstRejection = (results: PromiseSettledResult<unknown>[]) =>
  results.find((result): result is PromiseRejectedResult => result.status === 'rejected')?.reason;

// One discover query per media type, plus the genre names its results need.
type DiscoverSource = {
  mediaType: MediaType;
  params: Record<string, unknown>;
  genres: TmdbGenre[];
};

const YEAR_PARAM: Record<MediaType, string> = {
  movie: 'primary_release_date',
  tv: 'first_air_date',
};

const buildSource = async (
  mediaType: MediaType,
  { genres = [], fromYear, toYear }: WheelFilters,
): Promise<DiscoverSource | null> => {
  const genreList = await getGenres(mediaType);
  const requested = Array.isArray(genres) ? genres.map((genre) => String(genre).toLowerCase()) : [];
  // A substring match, so "Action" also finds TV's "Action & Adventure".
  const genreIds = genreList
    .filter(({ name }) => requested.some((genre) => name.toLowerCase().includes(genre)))
    .map(({ id }) => id);

  // None of the requested genres exist for this media type.
  if (requested.length > 0 && genreIds.length === 0) return null;

  return {
    mediaType,
    genres: genreList,
    params: {
      sort_by: 'popularity.desc',
      'vote_count.gte': MIN_VOTES,
      ...(genreIds.length > 0 ? { with_genres: genreIds.join('|') } : {}),
      ...(fromYear ? { [`${YEAR_PARAM[mediaType]}.gte`]: `${Number(fromYear)}-01-01` } : {}),
      ...(toYear ? { [`${YEAR_PARAM[mediaType]}.lte`]: `${Number(toYear)}-12-31` } : {}),
    },
  };
};

// List results only have genre_ids, but the frontend and scoring read genres.
const withGenreNames = (title: TmdbTitle, genres: TmdbGenre[]): TmdbTitle => ({
  ...title,
  genres: (title.genre_ids ?? []).flatMap((id: number) =>
    genres.filter((genre) => genre.id === id),
  ),
});

const fetchPage = async ({ mediaType, params, genres }: DiscoverSource, extra: object) => {
  const { results, total_pages } = await discoverPage(mediaType, { ...params, ...extra });
  return { total_pages, results: results.map((title) => withGenreNames(title, genres)) };
};

// Page 1 says how many pages exist; random ones among those vary each spin.
const fetchRandomTitles = async (source: DiscoverSource): Promise<TmdbTitle[]> => {
  const first = await fetchPage(source, { page: 1 });
  const lastPage = Math.min(first.total_pages, MAX_RANDOM_PAGE);
  const pages = shuffle(Array.from({ length: lastPage }, (_, i) => i + 1)).slice(0, RANDOM_PAGES);

  const others = await Promise.allSettled(
    pages.filter((page) => page !== 1).map((page) => fetchPage(source, { page })),
  );
  const titles = [
    ...(pages.includes(1) ? first.results : []),
    ...fulfilled(others).flatMap((page) => page.results),
  ];
  return titles.length > 0 ? titles : first.results;
};

const moodKeywordIds = async (mood: string) => {
  const terms = mood
    .toLowerCase()
    .split(/[^\p{L}\p{N}-]+/u)
    .filter((term) => term.length >= MIN_MOOD_TERM_LENGTH && !MOOD_STOPWORDS.has(term));
  const lookups = await Promise.allSettled(
    Array.from(new Set(terms)).slice(0, MAX_MOOD_TERMS).map(searchKeywordIds),
  );
  return Array.from(new Set(fulfilled(lookups).flat()));
};

// Filtered titles straight from TMDB. With a mood, titles tagged with its
// keywords come first, then random ones, so rankByMood has plenty to choose
// from even when the words match few keywords.
export const fetchWheelCandidates = async (
  filters: WheelFilters,
  { limit, mood }: { limit: number; mood?: string },
): Promise<TmdbTitle[]> => {
  const mediaTypes: MediaType[] =
    filters.type === 'movie' || filters.type === 'tv' ? [filters.type] : ['movie', 'tv'];

  const built = await Promise.allSettled(
    mediaTypes.map((mediaType) => buildSource(mediaType, filters)),
  );
  const sources = fulfilled(built).flatMap((source) => (source ? [source] : []));
  if (sources.length === 0) {
    // Failed requests are an error; genres that do not apply are just no matches.
    const failure = firstRejection(built);
    if (failure) throw failure;
    return [];
  }

  const keywordIds = mood ? await moodKeywordIds(mood) : [];
  const keywordPages = await Promise.allSettled(
    keywordIds.length > 0
      ? sources.map((source) => fetchPage(source, { page: 1, with_keywords: keywordIds.join('|') }))
      : [],
  );
  const randomPages = await Promise.allSettled(sources.map(fetchRandomTitles));

  const keywordTitles = fulfilled(keywordPages).flatMap((page) => page.results);
  const randomTitles = fulfilled(randomPages).flat();
  if (keywordTitles.length === 0 && randomTitles.length === 0) {
    const failure = firstRejection(randomPages);
    if (failure) throw failure;
  }

  const excluded = new Set(titleKeys(filters.exclude));
  const seen = new Set<string>();
  return [...keywordTitles, ...shuffle(randomTitles)]
    .filter((title) => {
      const key = titleKey(title);
      if (excluded.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
};

// Vectors are normalized, so the dot product is the cosine similarity.
const similarityTo = (a: number[], b: number[]) =>
  a.reduce((sum, value, index) => sum + value * b[index], 0);

// Closest titles by meaning, best first. Titles without a plot are skipped,
// since the plot is the main signal.
export const rankByMood = async (
  titles: TmdbTitle[],
  queryEmbedding: number[],
  limit: number,
): Promise<TmdbTitle[]> => {
  const withPlot = titles.filter((title) => title.overview);
  if (withPlot.length === 0) return [];

  const embeddings = await embedMovies(withPlot.map(summarise));
  return withPlot
    .map((title, index) => ({
      ...title,
      similarity: similarityTo(queryEmbedding, embeddings[index]),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
};
