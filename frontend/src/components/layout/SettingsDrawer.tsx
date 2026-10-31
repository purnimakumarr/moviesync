import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'react-oidc-context';

import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import GitHubIcon from '@mui/icons-material/GitHub';

import ThemeSwitcher from '../common/ThemeSwitcher';
import LanguageSwitcher from '../common/LanguageSwitcher';
import { useIsAuthenticated } from '../../auth/authHooks';
import { signOutRedirect } from '../../auth/authUtils';
import { RootState } from '../../redux/store';
import { CREATOR } from './credits';

type SettingsDrawerProps = {
  open: boolean;
  onClose: () => void;
};

// Phone-only settings panel. Navigation lives in the tab bar, so this holds
// only what the tab bar doesn't: account actions, preferences and credits.
const SettingsDrawer = ({ open, onClose }: SettingsDrawerProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const auth = useAuth();
  const isAuthenticated = Boolean(useIsAuthenticated());
  const { firstName, lastName, userID } = useSelector((store: RootState) => store.user);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const ink = theme.palette.iconsColor;
  const sectionSx = { px: 2, pt: 2, pb: 0.5, fontWeight: 800, color: ink, opacity: 0.75 };
  const itemSx = { borderRadius: '12px', color: ink };
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : null;

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderRadius: 0,
            backgroundColor: theme.palette.primary.main,
            width: 'min(20rem, 88vw)',
            pt: 'env(safe-area-inset-top)',
          },
        }}
      >
        {/* One icon column width so every row's text lines up. */}
        <Stack sx={{ height: '100%', p: 1.5, '& .MuiListItemIcon-root': { minWidth: 48 } }}>
          <Stack direction="row" alignItems="center" sx={{ px: 1, pb: 1 }}>
            <Typography variant="h6" component="h2" sx={{ color: ink, flex: 1 }}>
              {t('header.settings')}
            </Typography>
            <IconButton aria-label={t('header.close')} onClick={onClose} sx={{ color: ink }}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Typography variant="overline" component="p" sx={sectionSx}>
            {t('header.account')}
          </Typography>
          <List dense>
            {isAuthenticated ? (
              <>
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/user" onClick={onClose} sx={itemSx}>
                    <ListItemIcon>
                      <Avatar sx={{ width: 34, height: 34, fontSize: '0.875rem', fontWeight: 800, backgroundColor: theme.palette.headerIconsBackground, color: ink }}>
                        {fullName ? `${firstName![0]}${lastName![0]}` : <AccountCircleIcon />}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={fullName ?? t('profile.go_to_profile')}
                      secondary={userID}
                      primaryTypographyProps={{ fontWeight: 700 }}
                      secondaryTypographyProps={{ sx: { color: ink, opacity: 0.75, overflowWrap: 'anywhere' } }}
                    />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton onClick={() => setConfirmSignOut(true)} sx={itemSx}>
                    <ListItemIcon sx={{ color: ink }}><LogoutIcon /></ListItemIcon>
                    <ListItemText primary={t('profile.sign_out')} />
                  </ListItemButton>
                </ListItem>
              </>
            ) : (
              <ListItem disablePadding>
                <ListItemButton onClick={() => auth.signinRedirect()} sx={itemSx}>
                  <ListItemIcon sx={{ color: ink }}><LoginIcon /></ListItemIcon>
                  <ListItemText primary={t('app.sign_in')} />
                </ListItemButton>
              </ListItem>
            )}
          </List>

          <Divider sx={{ my: 1, borderColor: theme.palette.headerIconsBackground }} />
          <Typography variant="overline" component="p" sx={sectionSx}>
            {t('header.preferences')}
          </Typography>
          <List dense>
            <ThemeSwitcher />
            <LanguageSwitcher />
          </List>

          <Box sx={{ mt: 'auto', px: 2, py: 2, color: ink }}>
            <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.85 }}>
              {t('footer.created_by')}{' '}
              <Link
                href={CREATOR.url}
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                underline="always"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontWeight: 800, verticalAlign: 'bottom' }}
              >
                <GitHubIcon sx={{ fontSize: 16 }} aria-hidden />
                {CREATOR.name}
              </Link>
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
              © {new Date().getFullYear()} {t('footer.text')}
            </Typography>
          </Box>
        </Stack>
      </Drawer>

      <Dialog open={confirmSignOut} onClose={() => setConfirmSignOut(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('profile.confirm_sign_out')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('profile.sign_out_text')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSignOut(false)} sx={{ color: theme.palette.text.primary }}>
            {t('profile.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfirmSignOut(false);
              onClose();
              auth.removeUser();
              signOutRedirect();
            }}
          >
            {t('profile.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SettingsDrawer;
