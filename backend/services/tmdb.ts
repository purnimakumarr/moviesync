import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export type MediaType = 'movie' | 'tv';

// A TMDB response object; the app passes these through unchanged.
export type TmdbTitle = { id: number; media_type: MediaType; [key: string]: any };

export const isMediaType = (value: unknown): value is MediaType =>
  value === 'movie' || value === 'tv';

// Logged axios errors include the request URL and params, so the key is
// stripped from failures before they propagate.
const withoutApiKey = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const key = process.env.TMDB_API_KEY;
    if (error.config?.params) delete error.config.params.api_key;
    if (key) error.message = error.message.split(key).join('***');
    // The raw request holds the full URL; it is not needed for debugging.
    delete error.request;
  }
  return error;
};

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 300;

// Dropped connections (ECONNRESET and the like) get no response and are
// worth retrying; HTTP errors such as 404 are not.
const isNetworkError = (error: unknown) =>
  axios.isAxiosError(error) && !error.response;

// Read at call time so tests can set the environment after import.
export const tmdbGet = async (path: string, params: Record<string, unknown> = {}) => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await axios.get(`${process.env.TMDB_URL}/3${path}`, {
        params: { api_key: process.env.TMDB_API_KEY, ...params },
      });
      return response.data;
    } catch (error) {
      if (attempt < MAX_RETRIES && isNetworkError(error)) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
        continue;
      }
      throw withoutApiKey(error);
    }
  }
};

const DETAIL_APPENDS: Record<MediaType, string> = {
  movie: 'credits,release_dates,external_ids',
  tv: 'aggregate_credits,content_ratings,external_ids',
};

// Detail responses do not include media_type, so it is added here.
export const getDetails = async (
  mediaType: MediaType,
  id: number,
): Promise<TmdbTitle | null> => {
  try {
    const data = await tmdbGet(`/${mediaType}/${id}`, {
      append_to_response: DETAIL_APPENDS[mediaType],
    });
    return { ...data, media_type: mediaType };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
};

const releaseDate = (item: any): string =>
  item.release_date || item.first_air_date || '';

export const startYear = (item: any) => releaseDate(item).slice(0, 4);

export type SearchFilters = { query: string; year: string; type: string };

// TMDB always returns 20 results per search page.
export const searchPage = async ({ query, year, type }: SearchFilters, page: number) => {
  const hasYear = /^\d{4}$/.test(year);

  if (isMediaType(type)) {
    const yearParam = type === 'movie' ? 'primary_release_year' : 'first_air_date_year';
    const data = await tmdbGet(`/search/${type}`, {
      query,
      page,
      ...(hasYear ? { [yearParam]: year } : {}),
    });
    return {
      ...data,
      results: data.results.map((item: any) => ({ ...item, media_type: type })),
    };
  }

  // Multi search has no year filter, so the year is applied to each page.
  const data = await tmdbGet('/search/multi', { query, page });
  return {
    ...data,
    results: data.results.filter(
      (item: any) =>
        isMediaType(item.media_type) && (!hasYear || startYear(item) === year),
    ),
  };
};

export const getTrending = async (): Promise<TmdbTitle[]> => {
  const data = await tmdbGet('/trending/all/week');
  return data.results.filter((item: any) => isMediaType(item.media_type));
};

export const discover = async (
  mediaType: MediaType,
  params: Record<string, unknown>,
): Promise<TmdbTitle[]> => {
  const data = await tmdbGet(`/discover/${mediaType}`, params);
  return data.results.map((item: any) => ({ ...item, media_type: mediaType }));
};

// Only used to move IMDb-keyed rows over to TMDB IDs.
export const findByImdbId = async (
  imdbID: string,
): Promise<{ id: number; media_type: MediaType } | null> => {
  const data = await tmdbGet(`/find/${imdbID}`, { external_source: 'imdb_id' });
  if (data.movie_results?.length) return { id: data.movie_results[0].id, media_type: 'movie' };
  if (data.tv_results?.length) return { id: data.tv_results[0].id, media_type: 'tv' };
  return null;
};

const names = (people: { name: string }[] = [], max = Infinity) =>
  Array.from(new Set(people.map((person) => person.name))).slice(0, max).join(', ');

// Plain-text columns of movie_cache, used by SQL filters, Smart Spin and
// embeddings; the full TMDB response is stored alongside them.
export const summarise = (details: TmdbTitle) => {
  const credits = details.credits ?? details.aggregate_credits ?? {};
  const directors =
    details.media_type === 'tv'
      ? details.created_by
      : (credits.crew ?? []).filter((member: any) => member.job === 'Director');

  return {
    title: details.title ?? details.name ?? '',
    year: startYear(details),
    genre: names(details.genres),
    type: details.media_type,
    director: names(directors),
    actors: names(credits.cast, 4),
    plot: details.overview || null,
  };
};
