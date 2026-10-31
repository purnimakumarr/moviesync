import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Box, Container } from '@mui/material';

import AppHeader from './components/layout/AppHeader';
import MobileTabBar from './components/layout/MobileTabBar';
import SettingsDrawer from './components/layout/SettingsDrawer';
import Footer from './components/common/Footer';

const Layout = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        // The page itself scrolls (no inner scroll box), so mobile browsers can
        // collapse their address bar and anchor links behave normally.
        // Column filling the screen: header, content that grows, footer last,
        // so the footer always sits at the bottom edge on short pages.
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
            <AppHeader onOpenSettings={() => setDrawerOpen(true)} />
            <SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
            <Container component="main" maxWidth="xl" sx={{ flexGrow: 1, px: { xs: 2, sm: 3 }, pb: 4 }}>
                <Outlet />
            </Container>
            <Footer />
            <MobileTabBar />
        </Box>
    )
}

export default Layout;
