import { describe, expect, it } from 'vitest';
import { TmdbMovie, TmdbTv } from '../types';
import {
    externalLink,
    getCertification,
    getDirectors,
    getRating,
    getRuntimeMinutes,
    getTitle,
    getTotalRuntimeMinutes,
    getYear,
    movieKey,
    moviePath,
    posterUrl,
} from './tmdb';

const inception: TmdbMovie = {
    id: 27205,
    media_type: 'movie',
    title: 'Inception',
    release_date: '2010-07-15',
    runtime: 148,
    poster_path: '/inception.jpg',
    vote_average: 8.373,
    vote_count: 38000,
    credits: {
        cast: [],
        crew: [
            { id: 1, name: 'Christopher Nolan', job: 'Director', department: 'Directing' },
            { id: 1, name: 'Christopher Nolan', job: 'Writer', department: 'Writing' },
        ],
    },
    release_dates: {
        results: [
            { iso_3166_1: 'US', release_dates: [{ certification: '' }, { certification: 'PG-13' }] },
            { iso_3166_1: 'GB', release_dates: [{ certification: '12A' }] },
        ],
    },
    external_ids: { imdb_id: 'tt1375666' },
};

const got: TmdbTv = {
    id: 1399,
    media_type: 'tv',
    name: 'Game of Thrones',
    first_air_date: '2011-04-17',
    last_air_date: '2019-05-19',
    in_production: false,
    episode_run_time: [],
    last_episode_to_air: { runtime: 80 },
    number_of_episodes: 73,
    poster_path: null,
    created_by: [{ id: 1, name: 'David Benioff' }, { id: 2, name: 'D. B. Weiss' }],
    content_ratings: { results: [{ iso_3166_1: 'US', rating: 'TV-MA' }] },
};

describe('tmdb helpers', () => {
    it('keys and links titles by media type and id', () => {
        expect(movieKey(inception)).toBe('movie-27205');
        expect(moviePath(got)).toBe('/movie/tv/1399');
    });

    it('reads titles and years for movies and shows', () => {
        expect(getTitle(inception)).toBe('Inception');
        expect(getTitle(got)).toBe('Game of Thrones');
        expect(getYear(inception)).toBe('2010');
        expect(getYear(got)).toBe('2011–2019');
        expect(getYear({ ...got, in_production: true })).toBe('2011–');
        expect(getYear({ ...got, last_air_date: '2011-06-19' })).toBe('2011');
        expect(getYear({ ...inception, release_date: '' })).toBeNull();
    });

    it('builds poster URLs and returns null without a poster', () => {
        expect(posterUrl(inception, 'w185')).toBe('https://image.tmdb.org/t/p/w185/inception.jpg');
        expect(posterUrl(got)).toBeNull();
    });

    it('rounds the rating and ignores titles without votes', () => {
        expect(getRating(inception)).toBe(8.4);
        expect(getRating({ ...inception, vote_count: 0 })).toBeNull();
    });

    it('uses creators as the directors of a show', () => {
        expect(getDirectors(inception)).toEqual(['Christopher Nolan']);
        expect(getDirectors(got)).toEqual(['David Benioff', 'D. B. Weiss']);
    });

    it('falls back to the latest episode runtime and counts every episode', () => {
        expect(getRuntimeMinutes(inception)).toBe(148);
        expect(getRuntimeMinutes(got)).toBe(80);
        expect(getTotalRuntimeMinutes(got)).toBe(80 * 73);
    });

    it("prefers the viewer's country certification, then the US one", () => {
        expect(getCertification(inception, 'gb')).toBe('12A');
        expect(getCertification(inception, 'IN')).toBe('PG-13');
        expect(getCertification(got, 'FR')).toBe('TV-MA');
    });

    it('links to IMDb when the IMDb ID is known, otherwise to TMDB', () => {
        expect(externalLink(inception)).toEqual({ site: 'imdb', url: 'https://www.imdb.com/title/tt1375666' });
        expect(externalLink(got)).toEqual({ site: 'tmdb', url: 'https://www.themoviedb.org/tv/1399' });
    });
});
