import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'react-oidc-context';

import { BottomNavigation, BottomNavigationAction, Paper, useTheme } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LoginIcon from '@mui/icons-material/Login';
import HomeIcon from '@mui/icons-material/Home';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';

import { useIsAuthenticated } from '../../auth/authHooks';
import { NAV_LINKS, TAB_BAR_HEIGHT } from './navLinks';

// Fixed bottom navigation for phones; hidden from md up, where the header
// shows the full navigation.
const MobileTabBar = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const auth = useAuth();
  const isAuthenticated = Boolean(useIsAuthenticated());
  const { pathname } = useLocation();

  const tabs = isAuthenticated
    ? [
        ...NAV_LINKS.filter((link) => link.inTabBar && !link.isList).map((link) => ({
          path: link.path,
          Icon: link.icon,
          label: t(link.shortLabel ?? link.label),
        })),
        // One tab for all three lists; the list pages switch between them.
        { path: '/favourites', Icon: CollectionsBookmarkIcon, label: t('header.lists') },
        { path: '/user', Icon: AccountCircleIcon, label: t('header.profile') },
      ]
    : [
        { path: '/', Icon: HomeIcon, label: t('header.home') },
        ...NAV_LINKS.filter((link) => link.inTabBar && !link.requiresAuth).map((link) => ({
          path: link.path,
          Icon: link.icon,
          label: t(link.label),
        })),
      ];

  const listPaths = NAV_LINKS.filter((link) => link.isList).map((link) => link.path);
  const activePath = listPaths.includes(pathname) ? '/favourites' : pathname;
  const current = tabs.some((tab) => tab.path === activePath) ? activePath : false;

  const actionSx = {
    color: theme.palette.iconsColor,
    minWidth: 0,
    px: 0.5,
    '&.Mui-selected': {
      color: theme.palette.iconsColor,
      '& .MuiSvgIcon-root': {
        backgroundColor: theme.palette.headerIconsBackground,
        borderRadius: '999px',
        px: 1.5,
        width: 'auto',
      },
    },
    '& .MuiBottomNavigationAction-label': {
      fontSize: '0.75rem',
      fontWeight: 700,
      whiteSpace: 'nowrap',
      '&.Mui-selected': { fontSize: '0.75rem' },
    },
  };

  return (
    <Paper
      component="nav"
      aria-label={t('header.navigation')}
      elevation={8}
      sx={{
        display: { xs: 'block', md: 'none' },
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.appBar,
        borderRadius: 0,
        backgroundColor: theme.palette.primary.main,
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        showLabels
        value={current}
        sx={{ height: TAB_BAR_HEIGHT, backgroundColor: 'transparent' }}
      >
        {tabs.map(({ path, Icon, label }) => (
          <BottomNavigationAction
            key={path}
            component={Link}
            to={path}
            value={path}
            label={label}
            icon={<Icon />}
            aria-current={activePath === path ? 'page' : undefined}
            sx={actionSx}
          />
        ))}
        {!isAuthenticated && (
          <BottomNavigationAction
            label={t('app.sign_in')}
            icon={<LoginIcon />}
            onClick={() => auth.signinRedirect()}
            sx={actionSx}
          />
        )}
      </BottomNavigation>
    </Paper>
  );
};

export default MobileTabBar;
