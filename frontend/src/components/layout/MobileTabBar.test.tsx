import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MobileTabBar from './MobileTabBar';

const { auth, signinRedirect } = vi.hoisted(() => ({
  auth: { isAuthenticated: false },
  signinRedirect: vi.fn(),
}));
vi.mock('../../auth/authHooks', () => ({ useIsAuthenticated: () => auth.isAuthenticated }));
vi.mock('react-oidc-context', () => ({ useAuth: () => ({ signinRedirect }) }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <MobileTabBar />
    </MemoryRouter>,
  );

const tabNames = () =>
  Array.from(screen.getByRole('navigation').querySelectorAll('a, button')).map(
    (tab) => tab.textContent,
  );

describe('MobileTabBar', () => {
  beforeEach(() => {
    auth.isAuthenticated = false;
    signinRedirect.mockReset();
  });

  it('shows public destinations and a sign-in tab to visitors', async () => {
    renderAt('/');
    expect(tabNames()).toEqual(['header.home', 'header.featured', 'header.search', 'header.spin_wheel', 'app.sign_in']);

    await userEvent.click(screen.getByRole('button', { name: 'app.sign_in' }));
    expect(signinRedirect).toHaveBeenCalled();
  });

  it('shows the wheel, lists and profile to signed-in users', () => {
    auth.isAuthenticated = true;
    renderAt('/featured');
    expect(tabNames()).toEqual([
      'header.featured',
      'header.search',
      'header.spin',
      'header.lists',
      'header.profile',
    ]);
  });

  it('keeps the Lists tab active on every list page', () => {
    auth.isAuthenticated = true;
    for (const path of ['/favourites', '/watch-later', '/watched']) {
      const { unmount } = renderAt(path);
      expect(screen.getByRole('link', { name: 'header.lists' })).toHaveAttribute('aria-current', 'page');
      unmount();
    }
  });

  it('marks the current page', () => {
    auth.isAuthenticated = true;
    renderAt('/spin-wheel');
    expect(screen.getByRole('link', { name: 'header.spin' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'header.search' })).not.toHaveAttribute('aria-current');
  });
});
