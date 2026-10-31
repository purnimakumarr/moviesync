// Titles are TMDB response objects, passed through by the backend with a
// media_type added. List results (search, featured) carry only the basic
// fields; detail responses add genres, credits, ratings and so on.
export type MediaType = 'movie' | 'tv';

export interface Person {
  id: number;
  name: string;
}

export interface CrewMember extends Person {
  job: string;
  department: string;
}

export interface CastMember extends Person {
  character?: string;
}

interface TmdbBase {
  id: number;
  media_type: MediaType;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview?: string;
  vote_average?: number;
  vote_count?: number;
  original_language?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  spoken_languages?: { iso_639_1: string; english_name: string; name: string }[];
  production_countries?: { iso_3166_1: string; name: string }[];
  external_ids?: { imdb_id?: string | null };
}

export interface TmdbMovie extends TmdbBase {
  media_type: 'movie';
  title: string;
  release_date?: string;
  runtime?: number | null;
  revenue?: number;
  credits?: { cast: CastMember[]; crew: CrewMember[] };
  release_dates?: {
    results: { iso_3166_1: string; release_dates: { certification: string }[] }[];
  };
}

export interface TmdbTv extends TmdbBase {
  media_type: 'tv';
  name: string;
  first_air_date?: string;
  last_air_date?: string | null;
  in_production?: boolean;
  episode_run_time?: number[];
  last_episode_to_air?: { runtime?: number | null } | null;
  number_of_episodes?: number;
  number_of_seasons?: number;
  created_by?: Person[];
  aggregate_credits?: { cast: CastMember[]; crew: CrewMember[] };
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
  origin_country?: string[];
}

export type Movie = TmdbMovie | TmdbTv;

export type MovieProps = {
  movie: Movie;
};

export type FeaturedMovie = Movie & {
  tag: string;
};

// A spin wheel result; reasons explain mood or Smart Spin matches.
export type WheelPick = Movie & {
  reasons?: string[];
  similarity?: number;
};

export type UserMovieArgs = {
  id: number;
  media_type: MediaType;
};
