import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n/i18n';
import favouritesReducer from '../redux/features/favouritesSlice';
import watchReducer from '../redux/features/watchSlice';
import SpinWheel from './SpinWheel';

const { publicPost, privatePost, auth } = vi.hoisted(() => ({
  publicPost: vi.fn(),
  privatePost: vi.fn(),
  auth: { isAuthenticated: false },
}));

vi.mock('../api/axiosConfig', () => ({
  axiosPublic: { post: publicPost },
  axiosPrivate: { post: privatePost },
}));
vi.mock('../auth/authHooks', () => ({
  useIsAuthenticated: () => auth.isAuthenticated,
}));
// Reduced motion makes the wheel stop after 300 ms instead of ~4 s.
vi.mock('framer-motion', async (importOriginal) => ({
  ...(await importOriginal<typeof import('framer-motion')>()),
  useReducedMotion: () => true,
}));
// Keep the test about the wheel, not card rendering.
vi.mock('../components/common/MovieCard', () => ({
  default: ({ movie }: { movie: { title: string } }) => <div>{movie.title}</div>,
}));

const martian = {
  id: 286217,
  media_type: 'movie',
  title: 'The Martian',
  release_date: '2015-09-30',
  poster_path: null,
  genres: [{ id: 12, name: 'Adventure' }, { id: 18, name: 'Drama' }, { id: 878, name: 'Science Fiction' }],
  overview: 'An astronaut is stranded on Mars.',
  reasons: ['Close match to "space survival"'],
};
const moon = { id: 17431, media_type: 'movie', title: 'Moon', release_date: '2009-06-12', poster_path: null };

const renderWheel = () =>
  render(
    <MemoryRouter>
      <Provider
        store={configureStore({
          reducer: { favourites: favouritesReducer, watch: watchReducer },
        })}
      >
        <SpinWheel />
      </Provider>
    </MemoryRouter>,
  );

const spinButton = () => screen.getByRole('button', { name: 'Spin' });
const findWinner = (title: RegExp) =>
  screen.findByRole('heading', { level: 2, name: title }, { timeout: 2000 });

describe('SpinWheel', () => {
  beforeAll(() => i18n.changeLanguage('en'));

  beforeEach(() => {
    publicPost.mockReset();
    privatePost.mockReset();
    auth.isAuthenticated = false;
  });

  it('sends the mood, lands on the pick and explains why it matched', async () => {
    publicPost.mockResolvedValue({
      data: { success: true, moodApplied: true, movies: [martian] },
    });
    renderWheel();

    await userEvent.type(screen.getByLabelText(/describe a mood/i), 'space survival');
    await userEvent.click(spinButton());

    expect(publicPost).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/wheel\/candidates$/),
      // 3 picks → the closest 9 matches.
      expect.objectContaining({ mood: 'space survival', limit: 9 }),
    );
    const heading = await findWinner(/the martian/i);
    // Focus moves on the next animation frame after the heading renders.
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByText('Close match to "space survival"')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent("Tonight's pick: The Martian");
    // The winner is on the wheel; a single candidate fills all 6 slices.
    const wheel = screen.getByRole('img', { name: /movie wheel with 6 slices/i });
    expect(within(wheel).getAllByText('The Martian')).toHaveLength(6);
  });

  it('shows the other picks as a shortlist', async () => {
    publicPost.mockResolvedValue({
      data: { success: true, moodApplied: false, movies: [martian, moon] },
    });
    renderWheel();

    await userEvent.click(spinButton());

    await findWinner(/the martian|moon/i);
    expect(screen.getByRole('heading', { name: 'Also on the shortlist' })).toBeInTheDocument();
  });

  it('warns when the mood could not be applied', async () => {
    publicPost.mockResolvedValue({
      data: { success: true, moodApplied: false, movies: [martian] },
    });
    renderWheel();

    await userEvent.type(screen.getByLabelText(/describe a mood/i), 'space');
    await userEvent.click(spinButton());

    expect(await screen.findByText(/mood search is unavailable/i)).toBeInTheDocument();
  });

  it('offers Smart Spin only to logged-in users', async () => {
    renderWheel();
    await userEvent.click(screen.getByRole('button', { name: /filters/i }));
    expect(screen.queryByRole('checkbox', { name: /smart spin/i })).not.toBeInTheDocument();
    expect(screen.getByText('Log in to use Smart Spin.')).toBeInTheDocument();
  });

  it('uses the protected Smart Spin endpoint when switched on', async () => {
    auth.isAuthenticated = true;
    privatePost.mockResolvedValue({
      data: {
        success: true,
        moodApplied: false,
        movies: [{ ...martian, reasons: ['Because you saved 2 films by Ridley Scott'] }],
      },
    });
    renderWheel();

    await userEvent.click(screen.getByRole('button', { name: /filters/i }));
    await userEvent.click(screen.getByRole('checkbox', { name: /smart spin/i }));
    await userEvent.click(spinButton());

    expect(publicPost).not.toHaveBeenCalled();
    expect(privatePost).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/wheel\/smart$/),
      expect.objectContaining({ count: 3, excludeWatched: true }),
    );
    await findWinner(/the martian/i);
    expect(screen.getByText('Because you saved 2 films by Ridley Scott')).toBeInTheDocument();
  });

  it('lets guests filter by any genre, not just saved ones', async () => {
    publicPost.mockResolvedValue({ data: { success: true, moodApplied: false, movies: [martian] } });
    renderWheel();

    await userEvent.click(screen.getByRole('button', { name: /filters/i }));
    await userEvent.click(screen.getByRole('combobox', { name: /genre/i }));
    await userEvent.click(await screen.findByRole('option', { name: 'Horror' }));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(spinButton());

    expect(publicPost).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/wheel\/candidates$/),
      expect.objectContaining({ genres: ['Horror'] }),
    );
    await findWinner(/the martian/i);
  });

  it('explains when there is nothing to pick from', async () => {
    publicPost.mockRejectedValue(new Error('Network down'));
    renderWheel();

    await userEvent.click(spinButton());

    expect(
      await screen.findByText('Could not fetch wheel candidates right now.'),
    ).toBeInTheDocument();
    expect(spinButton()).toBeEnabled();
  });
});
