import { CrewMember, Movie } from '../types';

// Helpers over TMDB titles: movies and TV shows name the same things
// differently (title/name, release_date/first_air_date, credits/created_by),
// and list results leave out most detail fields.

const IMAGE_BASE = 'https://image.tmdb.org/t/p';

// A TMDB id is only unique within its media type.
export const movieKey = (movie: Pick<Movie, 'id' | 'media_type'>) => `${movie.media_type}-${movie.id}`;

export const moviePath = (movie: Pick<Movie, 'id' | 'media_type'>) => `/movie/${movie.media_type}/${movie.id}`;

export const getTitle = (movie: Movie) => (movie.media_type === 'tv' ? movie.name : movie.title) ?? '';

export const getReleaseDate = (movie: Movie) =>
    (movie.media_type === 'tv' ? movie.first_air_date : movie.release_date) || undefined;

export const getStartYear = (movie: Movie) => {
    const year = parseInt(getReleaseDate(movie)?.slice(0, 4) ?? '', 10);
    return Number.isNaN(year) ? null : year;
};

// "2010" for a movie; "2011–2019" or "2022–" for a show still on air.
export const getYear = (movie: Movie) => {
    const start = getStartYear(movie);
    if (!start || movie.media_type === 'movie') return start ? String(start) : null;
    if (movie.in_production) return `${start}–`;
    const end = parseInt(movie.last_air_date?.slice(0, 4) ?? '', 10);
    return end && end !== start ? `${start}–${end}` : String(start);
};

export type PosterSize = 'w185' | 'w342' | 'w500' | 'w780';

export const posterUrl = (movie: Pick<Movie, 'poster_path'>, size: PosterSize = 'w500') =>
    movie.poster_path ? `${IMAGE_BASE}/${size}${movie.poster_path}` : null;

export const backdropUrl = (movie: Pick<Movie, 'backdrop_path'>, size: 'w780' | 'w1280' = 'w1280') =>
    movie.backdrop_path ? `${IMAGE_BASE}/${size}${movie.backdrop_path}` : null;

// 0–10 audience score; titles without votes have none.
export const getRating = (movie: Movie) =>
    movie.vote_count && movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : null;

export const getGenres = (movie: Movie) => movie.genres?.map((genre) => genre.name) ?? [];

const unique = (names: string[]) => Array.from(new Set(names));

const crew = (movie: Movie): CrewMember[] =>
    (movie.media_type === 'tv' ? movie.aggregate_credits?.crew : movie.credits?.crew) ?? [];

// Shows have creators rather than one director.
export const getDirectors = (movie: Movie) =>
    movie.media_type === 'tv'
        ? unique((movie.created_by ?? []).map((person) => person.name))
        : unique(crew(movie).filter((member) => member.job === 'Director').map((member) => member.name));

export const getWriters = (movie: Movie, max = 4) =>
    unique(crew(movie).filter((member) => member.department === 'Writing').map((member) => member.name)).slice(0, max);

export const getCast = (movie: Movie, max = 4) => {
    const cast = (movie.media_type === 'tv' ? movie.aggregate_credits?.cast : movie.credits?.cast) ?? [];
    return unique(cast.map((member) => member.name)).slice(0, max);
};

// Per episode for a show. Many shows leave episode_run_time empty, so the
// latest episode's runtime is the fallback.
export const getRuntimeMinutes = (movie: Movie) => {
    const minutes =
        movie.media_type === 'tv'
            ? movie.episode_run_time?.[0] ?? movie.last_episode_to_air?.runtime
            : movie.runtime;
    return minutes || null;
};

// Time to watch all of it: every episode of a show.
export const getTotalRuntimeMinutes = (movie: Movie) => {
    const minutes = getRuntimeMinutes(movie) ?? 0;
    return movie.media_type === 'tv' ? minutes * (movie.number_of_episodes || 1) : minutes;
};

// Age rating for the viewer's country, falling back to the US one.
export const getCertification = (movie: Movie, country = 'US') => {
    const forCountry = (code: string) => {
        if (movie.media_type === 'tv') {
            return movie.content_ratings?.results.find((rating) => rating.iso_3166_1 === code)?.rating || null;
        }
        const release = movie.release_dates?.results.find((result) => result.iso_3166_1 === code);
        return release?.release_dates.find((date) => date.certification)?.certification || null;
    };
    return forCountry(country.toUpperCase()) ?? forCountry('US');
};

export const getLanguages = (movie: Movie) => movie.spoken_languages?.map((language) => language.english_name) ?? [];

export const getCountries = (movie: Movie) => movie.production_countries?.map((country) => country.name) ?? [];

// IMDb when TMDB knows the title's IMDb ID, otherwise TMDB's own page.
export const externalLink = (movie: Movie) =>
    movie.external_ids?.imdb_id
        ? { site: 'imdb' as const, url: `https://www.imdb.com/title/${movie.external_ids.imdb_id}` }
        : { site: 'tmdb' as const, url: `https://www.themoviedb.org/${movie.media_type}/${movie.id}` };
