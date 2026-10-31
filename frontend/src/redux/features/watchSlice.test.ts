import { describe, expect, it } from 'vitest';
import { Movie } from '../../types';
import watchReducer, {
  addWatched,
  addWatchLater,
  clearWatched,
  deleteWatchLater,
  fetchWatched,
} from './watchSlice';

const movie = (id: number): Movie => ({ id, media_type: 'movie', title: `Title ${id}`, poster_path: null });

// State maps are keyed like "movie-1".
const stateWith = (watchLater: number[], watched: number[]) => ({
  ...watchReducer(undefined, { type: 'init' }),
  watchLater: Object.fromEntries(watchLater.map((id) => [`movie-${id}`, movie(id)])),
  watched: Object.fromEntries(watched.map((id) => [`movie-${id}`, movie(id)])),
});

const requestId = 'request-id';

describe('watchSlice', () => {
  it('moves a movie out of watch later when it is marked watched', () => {
    const state = watchReducer(
      stateWith([1], []),
      addWatched.fulfilled(movie(1), requestId, { id: 1, media_type: 'movie' }),
    );
    expect(Object.keys(state.watchLater)).toEqual([]);
    expect(Object.keys(state.watched)).toEqual(['movie-1']);
  });

  it('moves a movie out of watched when it is added to watch later', () => {
    const state = watchReducer(
      stateWith([], [1]),
      addWatchLater.fulfilled(movie(1), requestId, { id: 1, media_type: 'movie' }),
    );
    expect(Object.keys(state.watched)).toEqual([]);
    expect(Object.keys(state.watchLater)).toEqual(['movie-1']);
  });

  it('removes a movie from watch later by id', () => {
    const state = watchReducer(
      stateWith([1, 2], []),
      deleteWatchLater.fulfilled('movie-1', requestId, { id: 1, media_type: 'movie' }),
    );
    expect(Object.keys(state.watchLater)).toEqual(['movie-2']);
  });

  it('clears only the watched list', () => {
    const state = watchReducer(stateWith([1], [2]), clearWatched.fulfilled(undefined, requestId));
    expect(Object.keys(state.watched)).toEqual([]);
    expect(Object.keys(state.watchLater)).toEqual(['movie-1']);
  });

  it('an empty watched response does not wipe the watch later list', () => {
    const state = watchReducer(stateWith([1], [2]), fetchWatched.fulfilled(null as unknown as Movie[], requestId));
    expect(Object.keys(state.watchLater)).toEqual(['movie-1']);
    expect(Object.keys(state.watched)).toEqual([]);
  });
});
