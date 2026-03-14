import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { RootState } from './redux/store';
import { useSelector } from 'react-redux';
import { useAuth } from 'react-oidc-context';
import { useIsAuthenticated } from './auth/authHooks';

import { AppBar, Toolbar, Button, Container, IconButton, Box, useTheme, Tooltip, Stack, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, Typography } from '@mui/material';
import LoginIcon from "@mui/icons-material/Login";
import WatchLaterIcon from "@mui/icons-material/WatchLater";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SearchIcon from "@mui/icons-material/Search";
import WhatshotIcon from '@mui/icons-material/Whatshot';
import MenuIcon from "@mui/icons-material/Menu";

import ThemeSwitcher from './components/common/ThemeSwitcher';
import LanguageSwitcher from './components/common/LanguageSwitcher';
import Footer from './components/common/Footer';
import ProfileMenu from './components/common/ProfileMenu';

import Cinema from '../src/assets/cinema.png';

const Layout = () => {
    const theme = useTheme();
    const { t } = useTranslation();

    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;
    const auth = useAuth();
    const isAuthenticated = useIsAuthenticated();

    const { firstName, lastName, userID } = useSelector((store: RootState) => store.user);

    const [drawerOpen, setDrawerOpen] = useState(false);

    const toggleDrawer = (open: boolean) => () => {
        setDrawerOpen(open);
    };

    const publicNavLinks = [
        { path: "/featured", icon: <WhatshotIcon />, label: t("header.featured") },
        { path: "/search", icon: <SearchIcon />, label: t("header.search") },
    ];

    const privateNavLinks = [
        { path: "/favourites", icon: <FavoriteIcon />, label: t("header.favourites") },
        { path: "/watch-later", icon: <WatchLaterIcon />, label: t("header.watch_later") },
        { path: "/watched", icon: <CheckCircleIcon />, label: t("header.watched") },
    ];

    return (
        <>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
                <AppBar position='sticky' sx={{ padding: '0.6rem', borderRadius: '0' }}>
                    <Toolbar sx={{ backgroundColor: theme.palette.primary.main }}>
                        {/* Mobile Menu Button */}
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            onClick={toggleDrawer(true)}
                            sx={{ display: { xs: "block", md: "none" } }}
                        >
                            <MenuIcon />
                        </IconButton>

                        {/* App Title */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                        }}>
                            <Box
                                component="img"
                                src={Cinema}
                                alt="MovieSync Logo"
                                sx={{
                                    width: '5%', height: 'auto', borderRadius: 2
                                }}
                            />
                            <Button
                                sx={{ fontWeight: '600', fontSize: '18px', textTransform: 'none', "&:hover": { backgroundColor: 'inherit' } }}
                                color="inherit"
                                component={Link}
                                to="/"
                            >
                                {t("app.app_title")}
                            </Button>
                        </Box>

                        {/* Desktop Navigation (Hidden on Mobile) */}
                        <Stack direction="row" gap="1rem" sx={{ ml: 'auto', display: { xs: "none", md: "flex" } }}>
                            {publicNavLinks.map(({ path, icon, label }) => (
                                <IconButton key={path} component={Link} to={path} sx={{
                                    transition: '0.4s',
                                    color: theme.palette.iconsColor,
                                    backgroundColor: isActive(path) ? theme.palette.headerIconsBackground : "inherit",
                                    padding: '1rem',
                                    "&:hover": { backgroundColor: theme.palette.headerIconsBackground }
                                }}>
                                    <Tooltip title={label}>{icon}</Tooltip>
                                </IconButton>
                            ))}

                            {isAuthenticated && privateNavLinks.map(({ path, icon, label }) => (
                                <IconButton key={path} component={Link} to={path} sx={{
                                    transition: '0.4s',
                                    color: theme.palette.iconsColor,
                                    backgroundColor: isActive(path) ? theme.palette.headerIconsBackground : "inherit",
                                    padding: '1rem',
                                    "&:hover": { backgroundColor: theme.palette.headerIconsBackground }
                                }}>
                                    <Tooltip title={label}>{icon}</Tooltip>
                                </IconButton>
                            ))}
                            <ThemeSwitcher />
                            <LanguageSwitcher />
                            {isAuthenticated ? (
                                <ProfileMenu firstName={firstName} lastName={lastName} />
                            ) : (
                                <Button variant="text" startIcon={<LoginIcon />} onClick={() => auth.signinRedirect()} sx={{ color: theme.palette.text.tertiary }}>
                                    {t("app.sign_in")}
                                </Button>
                            )}
                        </Stack>
                    </Toolbar>

                    <Drawer PaperProps={{
                        sx: {
                            borderRadius: 0,
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.text.primary,
                            p: '2rem'
                        }
                    }} anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
                        <Box sx={{ width: '18rem' }} role="presentation" onClick={toggleDrawer(false)}>
                            <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold', color: theme.palette.iconsColor }}>
                                {t("header.account")}
                            </Typography>
                            <List>
                                {isAuthenticated ?
                                    <ListItem disablePadding>
                                        <ListItemButton>
                                            <ListItemIcon sx={{ mr: '1rem' }}>
                                                <ProfileMenu firstName={firstName} lastName={lastName} />
                                            </ListItemIcon>
                                            <ListItemText sx={{
                                                color: theme.palette.iconsColor
                                            }} primary={`${firstName && lastName ? `${firstName} ${lastName}` : userID || '...'}`} />
                                        </ListItemButton>
                                    </ListItem>
                                    : (
                                        <ListItem disablePadding>
                                            <ListItemButton onClick={() => auth.signinRedirect()}>
                                                <ListItemIcon sx={{
                                                    color: theme.palette.iconsColor
                                                }}><LoginIcon /></ListItemIcon>
                                                <ListItemText sx={{
                                                    color: theme.palette.iconsColor
                                                }} primary={t("app.sign_in")} />
                                            </ListItemButton>
                                        </ListItem>
                                    )}
                            </List>

                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold', color: theme.palette.iconsColor }}>
                                {t("header.navigation")}
                            </Typography>
                            <List>
                                {publicNavLinks.map(({ path, icon, label }) => (
                                    <ListItem key={path} disablePadding>
                                        <ListItemButton component={Link} to={path}>
                                            <ListItemIcon sx={{
                                                color: theme.palette.iconsColor
                                            }}>{icon}</ListItemIcon>
                                            <ListItemText sx={{
                                                color: theme.palette.iconsColor
                                            }} primary={label} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                                {isAuthenticated && privateNavLinks.map(({ path, icon, label }) => (
                                    <ListItem key={path} disablePadding>
                                        <ListItemButton component={Link} to={path}>
                                            <ListItemIcon sx={{
                                                color: theme.palette.iconsColor
                                            }}>{icon}</ListItemIcon>
                                            <ListItemText sx={{
                                                color: theme.palette.iconsColor
                                            }} primary={label} />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>

                            <Divider sx={{ my: 1 }} />

                            <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: 'bold', color: theme.palette.iconsColor }}>
                                {t("header.preferences")}
                            </Typography>
                            <List>
                                <ThemeSwitcher />
                                <LanguageSwitcher />
                            </List>
                        </Box>
                    </Drawer>
                </AppBar>
                <Container sx={{ flexGrow: 1, overflowY: "auto", maxWidth: { xs: '100%' }, paddingX: '2rem', margin: '0 auto' }}>
                    <Outlet />
                </Container>
                <Footer />
            </Box >
        </>
    )
}

export default Layout;