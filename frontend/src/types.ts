export interface Rating {
  Source: string;
  Value: string;
}

export interface Movie {
  Title: string;
  Year: string;
  Rated: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Actors: string;
  Plot: string;
  Poster: string;
  Ratings: Rating[];
  Awards: string;
  imdbID: string;
  Type: string;
  Released: string;
  Writer: string;
  Language: string;
  Country: string;
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  totalSeasons: string;
}

export type MovieProps = {
  movie: Movie;
};
export interface FeaturedMovie extends Movie {
  tag: string;
}

export type UserMovieArgs = {
  userID: string | null;
  imdbID: string;
};
