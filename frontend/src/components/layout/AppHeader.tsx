import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'react-oidc-context';

import {
  AppBar,
  Badge,
  Box,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import LoginIcon from '@mui/icons-material/Login';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import ThemeSwitcher from '../common/ThemeSwitcher';
import LanguageSwitcher from '../common/LanguageSwitcher';
import ProfileMenu from '../common/ProfileMenu';
import { NavLink, visibleLinks } from './navLinks';
import { useIsAuthenticated } from '../../auth/authHooks';
import { RootState } from '../../redux/store';
import Cinema from '../../assets/cinema.png';

type AppHeaderProps = {
  // Phones: opens the settings panel (navigation is in the tab bar).
  onOpenSettings: () => void;
};

const AppHeader = ({ onOpenSettings }: AppHeaderProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const auth = useAuth();
  const isAuthenticated = Boolean(useIsAuthenticated());
  const { pathname } = useLocation();
  const showLabels = useMediaQuery(theme.breakpoints.up('lg'));
  const { firstName, lastName } = useSelector((store: RootState) => store.user);

  const listCounts = useSelector((store: RootState) => ({
    '/favourites': Object.keys(store.favourites.details).length,
    '/watch-later': Object.keys(store.watch.watchLater).length,
    '/watched': Object.keys(store.watch.watched).length,
  }));

  const [listsAnchor, setListsAnchor] = useState<null | HTMLElement>(null);

  const links = visibleLinks(isAuthenticated);
  const mainLinks = links.filter((link) => !link.isList);
  const listLinks = links.filter((link) => link.isList);
  const isActive = (path: string) => pathname === path;
  const listsActive = listLinks.some((link) => isActive(link.path));

  const navItemSx = (active: boolean) => ({
    color: theme.palette.iconsColor,
    backgroundColor: active ? theme.palette.headerIconsBackground : 'transparent',
    borderRadius: '999px',
    textTransform: 'none',
    fontWeight: 700,
    px: showLabels ? 1.5 : 1,
    py: 0.75,
    minWidth: 0,
    transition: 'background-color 0.2s',
    '&:hover': { backgroundColor: theme.palette.headerIconsBackground },
  });

  const renderLink = ({ path, icon: Icon, label }: NavLink) => {
    const active = isActive(path);
    return showLabels ? (
      <Button
        key={path}
        component={Link}
        to={path}
        startIcon={<Icon />}
        aria-current={active ? 'page' : undefined}
        sx={navItemSx(active)}
      >
        {t(label)}
      </Button>
    ) : (
      <Tooltip key={path} title={t(label)}>
        <IconButton
          component={Link}
          to={path}
          aria-label={t(label)}
          aria-current={active ? 'page' : undefined}
          sx={navItemSx(active)}
        >
          <Icon />
        </IconButton>
      </Tooltip>
    );
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        borderRadius: 0,
        backgroundColor: theme.palette.primary.main,
        borderBottom: `1px solid ${theme.palette.headerIconsBackground}`,
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: { xs: 56, md: 60 }, px: { xs: 1, sm: 2 } }}>
        <Stack
          component={Link}
          to="/"
          direction="row"
          alignItems="center"
          gap={1}
          sx={{ color: theme.palette.iconsColor, textDecoration: 'none', minWidth: 0 }}
        >
          <Box
            component="img"
            src={Cinema}
            alt=""
            sx={{ width: { xs: 28, md: 32 }, height: { xs: 28, md: 32 }, borderRadius: 1.5 }}
          />
          <Typography component="span" sx={{ fontWeight: 800, fontSize: { xs: '1.05rem', md: '1.125rem' } }} noWrap>
            {t('app.app_title')}
          </Typography>
        </Stack>

        <Stack
          component="nav"
          aria-label={t('header.navigation')}
          direction="row"
          alignItems="center"
          gap={showLabels ? 0.5 : 0.25}
          sx={{ ml: 'auto', display: { xs: 'none', md: 'flex' } }}
        >
          {mainLinks.map(renderLink)}

          {listLinks.length > 0 && (
            <>
              <Tooltip title={showLabels ? '' : t('header.my_lists')}>
                <Button
                  aria-label={t('header.my_lists')}
                  aria-haspopup="menu"
                  aria-expanded={Boolean(listsAnchor)}
                  onClick={(event) => setListsAnchor(event.currentTarget)}
                  startIcon={<CollectionsBookmarkIcon />}
                  endIcon={showLabels ? <ExpandMoreIcon /> : undefined}
                  sx={{
                    ...navItemSx(listsActive),
                    '& .MuiButton-startIcon': { mr: showLabels ? 1 : 0, ml: 0 },
                  }}
                >
                  {showLabels && t('header.my_lists')}
                </Button>
              </Tooltip>
              <Menu
                anchorEl={listsAnchor}
                open={Boolean(listsAnchor)}
                onClose={() => setListsAnchor(null)}
              >
                {listLinks.map(({ path, icon: Icon, label }) => (
                  <MenuItem
                    key={path}
                    component={Link}
                    to={path}
                    selected={isActive(path)}
                    onClick={() => setListsAnchor(null)}
                    sx={{ minWidth: 220 }}
                  >
                    <ListItemIcon>
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>{t(label)}</ListItemText>
                    <Badge
                      badgeContent={listCounts[path as keyof typeof listCounts]}
                      color="primary"
                      showZero
                      sx={{ mr: 1 }}
                    />
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}

          <Box sx={{ width: 8 }} />
          <ThemeSwitcher />
          <LanguageSwitcher />
          {isAuthenticated ? (
            <ProfileMenu firstName={firstName} lastName={lastName} />
          ) : (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<LoginIcon />}
              onClick={() => auth.signinRedirect()}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {t('app.sign_in')}
            </Button>
          )}
        </Stack>
        <IconButton
          aria-label={t('header.settings')}
          onClick={onOpenSettings}
          sx={{ display: { xs: 'inline-flex', md: 'none' }, ml: 'auto', color: theme.palette.iconsColor }}
        >
          <SettingsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
