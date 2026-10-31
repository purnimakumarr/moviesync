import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import favouritesReducer from '../../redux/features/favouritesSlice';
import watchReducer from '../../redux/features/watchSlice';
import { Movie } from '../../types';
import MovieActionsBtn from './MovieActionsBtn';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('../../api/axiosConfig', () => ({ axiosPrivate: { post } }));

// Render translation keys as-is so labels are predictable.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const inception: Movie = { id: 27205, media_type: 'movie', title: 'Inception', poster_path: null };

const renderWithStore = () => {
  const store = configureStore({
    reducer: { favourites: favouritesReducer, watch: watchReducer },
  });
  render(
    <Provider store={store}>
      <MovieActionsBtn movie={inception} />
    </Provider>,
  );
  return store;
};

describe('MovieActionsBtn', () => {
  beforeEach(() => {
    post.mockReset();
  });

  it('adds a favourite without sending a user id, then offers removal', async () => {
    post.mockResolvedValue({ data: { movie: inception } });
    const store = renderWithStore();

    await userEvent.click(
      screen.getByRole('button', { name: 'movie_actions_btn.add_to_favourites' }),
    );

    expect(post).toHaveBeenCalledWith(expect.stringMatching(/\/api\/favourite\/add$/), {
      id: 27205,
      media_type: 'movie',
    });
    expect(store.getState().favourites.details).toHaveProperty(['movie-27205']);
    expect(
      await screen.findByRole('button', {
        name: 'movie_actions_btn.remove_from_favourites',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('marking watched moves the movie out of watch later', async () => {
    post.mockResolvedValue({ data: { movie: inception } });
    const store = renderWithStore();

    await userEvent.click(
      screen.getByRole('button', { name: 'movie_actions_btn.add_to_watch_later' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'movie_actions_btn.add_to_watched' }),
    );

    const { watch } = store.getState();
    expect(watch.watchLater).not.toHaveProperty(['movie-27205']);
    expect(watch.watched).toHaveProperty(['movie-27205']);
  });

  it('re-enables the button and keeps state unchanged when the request fails', async () => {
    post.mockRejectedValue(new Error('Network down'));
    const store = renderWithStore();
    const button = screen.getByRole('button', {
      name: 'movie_actions_btn.add_to_favourites',
    });

    await userEvent.click(button);

    expect(store.getState().favourites.details).toEqual({});
    expect(store.getState().favourites.error).toBe('favourites.error_adding_favourite');
    expect(button).toBeEnabled();
  });
});
