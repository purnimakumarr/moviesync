import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import favouritesReducer from '../../redux/features/favouritesSlice';
import watchReducer from '../../redux/features/watchSlice';
import { TmdbMovie } from '../../types';
import MovieCard from './MovieCard';

const { auth } = vi.hoisted(() => ({ auth: { isAuthenticated: false } }));
vi.mock('../../auth/authHooks', () => ({ useIsAuthenticated: () => auth.isAuthenticated }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const movie: TmdbMovie = {
  id: 603,
  media_type: 'movie',
  title: 'The Matrix',
  release_date: '1999-03-30',
  poster_path: '/matrix.jpg',
};

const renderCard = (overrides: Partial<TmdbMovie> = {}) =>
  render(
    <MemoryRouter>
      <Provider store={configureStore({ reducer: { favourites: favouritesReducer, watch: watchReducer } })}>
        <MovieCard movie={{ ...movie, ...overrides }} />
      </Provider>
    </MemoryRouter>,
  );

describe('MovieCard', () => {
  beforeEach(() => {
    auth.isAuthenticated = false;
  });

  it('shows the full title and year without needing hover', () => {
    renderCard({ title: 'Eternal Sunshine of the Spotless Mind' });
    // Previously cut to 22 characters in JS; now the full title is in the DOM
    // and CSS clamps it visually.
    expect(screen.getByRole('heading', { name: 'Eternal Sunshine of the Spotless Mind' })).toBeVisible();
    expect(screen.getByText('1999')).toBeVisible();
  });

  it('links to the movie page with a descriptive name', () => {
    renderCard();
    expect(screen.getByRole('link', { name: 'The Matrix (1999)' })).toHaveAttribute('href', '/movie/movie/603');
  });

  it('lazy-loads the TMDB poster', () => {
    const { container } = renderCard();
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy');
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w342/matrix.jpg');
  });

  it('shows list buttons only to logged-in users', () => {
    const { unmount } = renderCard();
    expect(screen.queryByRole('button', { name: 'movie_actions_btn.add_to_favourites' })).not.toBeInTheDocument();
    unmount();

    auth.isAuthenticated = true;
    renderCard();
    expect(screen.getByRole('button', { name: 'movie_actions_btn.add_to_favourites' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'movie_actions_btn.add_to_watch_later' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'movie_actions_btn.add_to_watched' })).toBeInTheDocument();
  });

  it('omits a missing year', () => {
    renderCard({ release_date: '' });
    expect(screen.getByRole('link', { name: 'The Matrix' })).toBeInTheDocument();
  });
});
