import { SvgIconComponent } from '@mui/icons-material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import SearchIcon from '@mui/icons-material/Search';
import CasinoIcon from '@mui/icons-material/Casino';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export type NavLink = {
  path: string;
  icon: SvgIconComponent;
  // i18n key
  label: string;
  // Shorter label for the phone tab bar, when the full one is too long.
  shortLabel?: string;
  requiresAuth: boolean;
  // Grouped under "My lists" in the desktop header.
  isList?: boolean;
  // Shown in the phone tab bar.
  inTabBar?: boolean;
};

// Single source for the header, the drawer and the phone tab bar.
export const NAV_LINKS: NavLink[] = [
  { path: '/featured', icon: WhatshotIcon, label: 'header.featured', requiresAuth: false, inTabBar: true },
  { path: '/search', icon: SearchIcon, label: 'header.search', requiresAuth: false, inTabBar: true },
  {
    path: '/spin-wheel',
    icon: CasinoIcon,
    label: 'header.spin_wheel',
    shortLabel: 'header.spin',
    requiresAuth: false,
    inTabBar: true,
  },
  { path: '/favourites', icon: FavoriteIcon, label: 'header.favourites', requiresAuth: true, isList: true, inTabBar: true },
  { path: '/watch-later', icon: WatchLaterIcon, label: 'header.watch_later', requiresAuth: true, isList: true },
  { path: '/watched', icon: CheckCircleIcon, label: 'header.watched', requiresAuth: true, isList: true },
];

export const visibleLinks = (isAuthenticated: boolean) =>
  NAV_LINKS.filter((link) => isAuthenticated || !link.requiresAuth);

// Tab bar height, reserved at the bottom of the page on phones.
export const TAB_BAR_HEIGHT = 64;
