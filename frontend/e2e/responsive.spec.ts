import { expect, Page, test } from '@playwright/test';

// Common phone, tablet, laptop and desktop sizes.
const VIEWPORTS = [
  { name: 'phone-small', width: 360, height: 740 },
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'laptop-short', width: 1280, height: 720 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'laptop-hd', width: 1366, height: 768 },
  { name: 'laptop-large', width: 1440, height: 900 },
  { name: 'desktop', width: 1920, height: 1080 },
];

const MIN_FONT_PX = 12;

const GENRES = [['Drama', 'Romance'], ['Science Fiction', 'Thriller'], ['Drama', 'Crime'], ['Comedy', 'Drama'], ['Horror'], ['Drama', 'Science Fiction']];
const LANGUAGES = [['English'], ['English', 'French'], ['Korean'], ['Spanish'], ['English', 'Japanese']];
const people = (names: string) => names.split(', ').map((name, id) => ({ id, name }));

// A TMDB details response; every fourth title is a TV show.
const movie = (index: number) => {
  const year = 1972 + ((index * 7) % 50);
  // Long titles are the usual cause of overflow.
  const title = index % 3 === 0 ? 'Eternal Sunshine of the Spotless Mind: Extended Edition' : `Movie ${index}`;
  const director = ['Michel Gondry', 'Bong Joon-ho', 'Greta Gerwig', 'Michel Gondry'][index % 4];
  const cast = people(['Jim Carrey, Kate Winslet', 'Song Kang-ho, Kate Winslet', 'Saoirse Ronan, Timothée Chalamet', 'Jim Carrey, Saoirse Ronan'][index % 4]);
  const shared = {
    id: index,
    poster_path: `/mock-poster/${index}.svg`,
    overview: 'When their relationship turns sour, a couple undergoes a medical procedure to have each other erased from their memories.',
    // Varied data so charts and stats show realistic spreads.
    vote_average: 5.8 + ((index * 37) % 35) / 10,
    vote_count: 4200,
    genres: GENRES[index % 6].map((name, id) => ({ id, name })),
    spoken_languages: LANGUAGES[index % 5].map((english_name) => ({ iso_639_1: '', english_name, name: english_name })),
    production_countries: [{ iso_3166_1: 'US', name: 'United States of America' }],
    external_ids: { imdb_id: `tt${String(index).padStart(7, '0')}` },
  };
  return index % 4 === 0
    ? {
        ...shared,
        media_type: 'tv',
        name: title,
        first_air_date: `${year}-03-01`,
        last_air_date: `${year + 3}-05-01`,
        episode_run_time: [45],
        number_of_episodes: 30,
        created_by: people(director),
        aggregate_credits: { cast, crew: [] },
        content_ratings: { results: [{ iso_3166_1: 'US', rating: 'TV-14' }] },
      }
    : {
        ...shared,
        media_type: 'movie',
        title,
        release_date: `${year}-03-19`,
        runtime: 108,
        revenue: 34400301,
        credits: {
          cast,
          crew: [
            { id: 0, name: director, job: 'Director', department: 'Directing' },
            { id: 1, name: 'Charlie Kaufman', job: 'Screenplay', department: 'Writing' },
          ],
        },
        release_dates: { results: [{ iso_3166_1: 'US', release_dates: [{ certification: 'R' }] }] },
      };
};

const POSTER_HUES = [0, 30, 200, 260, 140, 320];

// A simple generated poster so screenshots resemble real content.
const posterSvg = (index: number) => `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="hsl(${POSTER_HUES[index % POSTER_HUES.length]} 60% 45%)"/>
    <stop offset="1" stop-color="hsl(${POSTER_HUES[index % POSTER_HUES.length]} 60% 15%)"/>
  </linearGradient></defs>
  <rect width="300" height="450" fill="url(#g)"/>
  <text x="150" y="240" font-family="sans-serif" font-size="40" font-weight="700" fill="white" text-anchor="middle">#${index}</text>
</svg>`;

const listMovies = Array.from({ length: 7 }, (_, i) => movie(i + 20));

const mockApi = async (page: Page) => {
  await page.route('**/mock-poster/*.svg', (route) => {
    const index = Number(route.request().url().match(/(\d+)\.svg$/)?.[1] ?? 0);
    route.fulfill({ contentType: 'image/svg+xml', body: posterSvg(index) });
  });
  await page.route('**/mock-api/api/user/create-user', (route) =>
    route.fulfill({ json: { created: false, user: { firstName: 'Ada', lastName: 'Lovelace', country: 'GB' } } }),
  );
  await page.route('**/mock-api/api/favourite/list', (route) => route.fulfill({ json: { movies: listMovies.slice(0, 4) } }));
  await page.route('**/mock-api/api/watch-later/list', (route) => route.fulfill({ json: { movies: listMovies.slice(4, 6) } }));
  await page.route('**/mock-api/api/watched/list', (route) => route.fulfill({ json: { movies: listMovies.slice(6) } }));
  await page.route('**/mock-api/api/wheel/candidates', (route) =>
    route.fulfill({
      json: {
        success: true,
        moodApplied: true,
        movies: Array.from({ length: 9 }, (_, i) => ({ ...movie(i + 40), reasons: ['Close match to "space survival"'] })),
      },
    }),
  );
  await page.route('**/mock-api/api/featured', (route) =>
    route.fulfill({
      json: {
        success: true,
        movies: ['Trending', 'Romcoms', 'Horror Sensations', 'Hidden Gems', 'Sci-Fi & Fantasy Hits'].flatMap((tag, section) =>
          Array.from({ length: 10 }, (_, i) => ({ ...movie(section * 10 + i + 1), tag })),
        ),
      },
    }),
  );
  await page.route('**/mock-api/api/getById', async (route) => {
    const { id } = route.request().postDataJSON();
    route.fulfill({ json: { success: true, movie: movie(Number(id) || 1) } });
  });
  await page.route('**/mock-api/api/search', (route) => {
    const { pageSize = 10 } = route.request().postDataJSON();
    route.fulfill({ json: { success: true, movies: Array.from({ length: pageSize }, (_, i) => movie(i + 1)), totalPages: 5 } });
  });
  await page.route('**/mock-api/api/user/get-country', (route) => route.fulfill({ json: { success: true, country: {} } }));
  // Never talk to the (placeholder) identity provider.
  await page.route('https://auth.example.test/**', (route) => route.abort());
};

const ROUTES: { name: string; path: string; ready: (page: Page) => Promise<void> }[] = [
  {
    name: 'home',
    path: '/',
    ready: (page) => expect(page.getByRole('heading', { level: 1 })).toBeVisible(),
  },
  {
    name: 'featured',
    path: '/featured',
    ready: (page) => expect(page.getByRole('region', { name: /new & trending/i })).toBeVisible(),
  },
  {
    name: 'search',
    path: '/search',
    ready: async (page) => {
      await page.getByLabel(/search title/i).fill('eternal');
      await page.getByRole('button', { name: /^search$/i }).click();
      const results = page.getByRole('region', { name: /search results/i });
      await expect(results).toBeVisible();
      // Laptops ask for 12 results: two full rows of 6.
      const laptop = (page.viewportSize()?.width ?? 0) >= 1200;
      await expect(results.getByRole('article')).toHaveCount(laptop ? 12 : 10);
    },
  },
  {
    name: 'movie',
    path: '/movie/movie/3',
    ready: async (page) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText('Charlie Kaufman')).toBeVisible();
    },
  },
];

// Signed-in pages: a stored, non-expiring OIDC session makes the app treat the
// browser as logged in; every API call is mocked.
const signIn = (page: Page) =>
  page.addInitScript(() => {
    window.localStorage.setItem(
      'oidc.user:https://auth.example.test:e2e-client',
      JSON.stringify({
        id_token: 'e2e',
        access_token: 'e2e',
        token_type: 'Bearer',
        scope: 'openid profile email',
        profile: { sub: 'e2e|user', email: 'ada@example.com', iss: 'https://auth.example.test', aud: 'e2e-client' },
        expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      }),
    );
  });

const SIGNED_IN_ROUTES: typeof ROUTES = [
  {
    name: 'favourites',
    path: '/favourites',
    ready: (page) => expect(page.getByRole('region', { name: /favourites/i })).toBeVisible(),
  },
  {
    name: 'spin-wheel',
    path: '/spin-wheel',
    ready: async (page) => {
      await page.getByLabel(/describe a mood/i).fill('space survival');
      await page.getByRole('button', { name: /^spin$/i }).click();
      await expect(page.getByRole('heading', { level: 2, name: /eternal sunshine|movie/i }).first()).toBeVisible();
      await expect(page.getByRole('status')).toContainText("Tonight's pick");
      // Let the reveal finish fading in before the screenshot.
      await page.waitForTimeout(600);
    },
  },
  {
    name: 'profile',
    path: '/user',
    ready: (page) => expect(page.getByText('ada@example.com')).toBeVisible(),
  },
];

for (const viewport of VIEWPORTS) {
  test.describe(`${viewport.name} (${viewport.width}×${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    // From md (900px) the wheel page is laid out to fit one screen; from lg
    // (1200px) the result sits beside the wheel, so it still fits after a spin.
    if (viewport.width >= 900) {
      test('spin-wheel fits on one screen', async ({ page }) => {
        await mockApi(page);
        await signIn(page);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto('/spin-wheel');
        await expect(page.getByRole('img', { name: /movie wheel/i })).toBeVisible();

        const verticalOverflow = () =>
          page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
        expect(await verticalOverflow(), 'page scrolls before spinning').toBeLessThanOrEqual(0);

        if (viewport.width >= 1200) {
          await page.getByRole('button', { name: /^spin$/i }).click();
          await expect(page.getByRole('status')).toContainText("Tonight's pick");
          await page.waitForTimeout(600);
          expect(await verticalOverflow(), 'page scrolls after spinning').toBeLessThanOrEqual(0);
          await page.screenshot({ path: `e2e/screenshots/spin-wheel-fit-${viewport.name}.png` });
        }
      });
    }

    // Laptops show the whole movie page without scrolling (long title, long
    // plot, every fact, people, three ratings and awards).
    if (viewport.width >= 1200) {
      test('movie page fits on one screen', async ({ page }) => {
        await mockApi(page);
        await page.goto('/movie/movie/3');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
        await page.screenshot({ path: `e2e/screenshots/movie-fit-${viewport.name}.png` });
        expect(overflow, 'movie page scrolls').toBeLessThanOrEqual(0);
      });
    }

    // On a page shorter than the screen the footer must meet the bottom edge,
    // and on phones its text must never sit behind the fixed tab bar.
    for (const { name, path, signedIn } of [
      { name: 'search', path: '/search', signedIn: false },
      // Long page full of charts (each with a hidden data table).
      { name: 'profile', path: '/user', signedIn: true },
    ]) {
    test(`footer sits at the bottom of the screen (${name})`, async ({ page }) => {
      await mockApi(page);
      if (signedIn) await signIn(page);
      await page.goto(path);
      await expect(page.getByRole('contentinfo')).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

      const layout = await page.evaluate(() => {
        const footer = document.querySelector('footer')!.getBoundingClientRect();
        const text = document.querySelector('footer p')!.getBoundingClientRect();
        const tabBar = document.querySelector('nav.MuiPaper-root');
        const tabBarTop = tabBar && getComputedStyle(tabBar).display !== 'none'
          ? tabBar.getBoundingClientRect().top
          : null;
        return { footerBottom: footer.bottom, viewport: window.innerHeight, textBottom: text.bottom, tabBarTop };
      });

      expect(Math.abs(layout.footerBottom - layout.viewport), 'gap under the footer').toBeLessThanOrEqual(1);
      if (layout.tabBarTop !== null) {
        expect(layout.textBottom, 'footer text hidden behind the tab bar').toBeLessThanOrEqual(layout.tabBarTop);
      }
    });
    }

    for (const route of [...ROUTES, ...SIGNED_IN_ROUTES]) {
      test(route.name, async ({ page }) => {
        await mockApi(page);
        if (SIGNED_IN_ROUTES.includes(route)) {
          await signIn(page);
          // Instant spins and no background animation, for stable screenshots.
          await page.emulateMedia({ reducedMotion: 'reduce' });
        }
        await page.goto(route.path);
        await route.ready(page);

        const overflow = await page.evaluate(() => {
          const width = document.documentElement.clientWidth;
          // Content inside a container that scrolls or clips sideways (carousels,
          // poster strips, the decorative background) is fine.
          const insideClippingContainer = (el: Element) => {
            for (let node = el.parentElement; node && node !== document.body; node = node.parentElement) {
              if (getComputedStyle(node).overflowX !== 'visible') return true;
            }
            return false;
          };
          const offenders = Array.from(document.querySelectorAll('body *'))
            .filter((el) => el.getBoundingClientRect().right > width + 1 && !insideClippingContainer(el))
            .slice(0, 5)
            .map((el) => {
              const rect = el.getBoundingClientRect();
              const parents = [];
              for (let node = el.parentElement, i = 0; node && i < 3; node = node.parentElement, i += 1) {
                parents.push(node.tagName.toLowerCase() + (node.getAttribute('role') ? `[role=${node.getAttribute('role')}]` : ''));
              }
              const label = el.getAttribute('aria-label') ?? el.getAttribute('role') ?? '';
              return `${el.tagName.toLowerCase()} ${label} left=${Math.round(rect.left)} right=${Math.round(rect.right)} < ${parents.join(' < ')}`;
            });
          return { scrollWidth: document.documentElement.scrollWidth, width, offenders };
        });
        expect(overflow.offenders, 'elements wider than the viewport').toEqual([]);
        expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.width);

        const tinyText = await page.evaluate((minPx) => {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          const found: string[] = [];
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const parent = node.parentElement;
            if (!parent || !node.textContent?.trim()) continue;
            if (parent.closest('svg, [aria-hidden="true"]')) continue;
            const style = getComputedStyle(parent);
            const rect = parent.getBoundingClientRect();
            const visible = style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
            if (visible && parseFloat(style.fontSize) < minPx) {
              found.push(`${node.textContent.trim().slice(0, 30)} (${style.fontSize})`);
            }
          }
          return found.slice(0, 5);
        }, MIN_FONT_PX);
        expect(tinyText, `text smaller than ${MIN_FONT_PX}px`).toEqual([]);

        await page.screenshot({
          path: `e2e/screenshots/${route.name}-${viewport.name}.png`,
          fullPage: true,
        });
      });
    }
  });
}

// One screenshot per theme for visual review of the palettes.
const THEMES = ['horror', 'theatre', 'classic', 'fantasy', 'indie', 'melodic_haze'];
test.describe('themes', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  for (const themeKey of THEMES) {
    test(themeKey, async ({ page }) => {
      await mockApi(page);
      await signIn(page);
      await page.addInitScript((key) => window.localStorage.setItem('palette', key), themeKey);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/user');
      await expect(page.getByText('ada@example.com')).toBeVisible();
      await page.screenshot({ path: `e2e/screenshots/theme-${themeKey}-profile.png`, fullPage: true });
      await page.goto('/movie/movie/3');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.screenshot({ path: `e2e/screenshots/theme-${themeKey}-movie.png` });
    });
  }
});

// The favourite / watch later / watched buttons must stay legible in every
// theme (icons need 3:1 against their button).
test.describe('list button contrast', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  for (const themeKey of THEMES) {
    test(themeKey, async ({ page }) => {
      await mockApi(page);
      await signIn(page);
      await page.addInitScript((key) => window.localStorage.setItem('palette', key), themeKey);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/movie/movie/3');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const buttons = page.getByRole('button', { name: /add to (favourites|watch later|watched)/i });
      await expect(buttons).toHaveCount(3);

      const ratios = await buttons.evaluateAll((elements) => {
        const channels = (css: string) => (css.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        const luminance = (css: string) => {
          const [r, g, b] = channels(css).map((value) => {
            const c = value / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        return elements.map((element) => {
          const style = getComputedStyle(element);
          const [a, b] = [luminance(style.color), luminance(style.backgroundColor)].sort((x, y) => y - x);
          return (a + 0.05) / (b + 0.05);
        });
      });
      ratios.forEach((ratio) => expect(ratio, `${themeKey} button contrast`).toBeGreaterThanOrEqual(3));

      await buttons.first().screenshot({ path: `e2e/screenshots/list-buttons-${themeKey}.png` });
    });
  }
});

// Viewport (not full-page) shots of the phone chrome, for visual review.
test.describe('phone chrome', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('list page bottom and settings panel', async ({ page }) => {
    await mockApi(page);
    await signIn(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/watch-later');
    await expect(page.getByRole('tab', { name: /watch later/i })).toHaveAttribute('aria-selected', 'true');
    // All three list tabs fit on a phone without scrolling.
    for (const name of [/favourites/i, /watch later/i, /watched/i]) {
      const box = await page.getByRole('tab', { name }).boundingBox();
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.screenshot({ path: 'e2e/screenshots/phone-list-bottom.png' });

    await page.getByRole('button', { name: 'Settings' }).click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
    // Let the slide-in finish before capturing.
    await page.waitForTimeout(500);
    await expect(page.getByRole('link', { name: 'Purnima Kumar' })).toHaveAttribute('href', 'https://github.com/purnimakumarr');
    await page.screenshot({ path: 'e2e/screenshots/phone-settings.png' });
  });
});
