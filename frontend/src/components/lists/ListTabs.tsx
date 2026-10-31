import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Box, Tab, Tabs, useTheme } from '@mui/material';

import { NAV_LINKS } from '../layout/navLinks';
import { RootState } from '../../redux/store';

// Switches between the three lists, so a single "Lists" tab in the phone
// tab bar (and "My Lists" on desktop) reaches all of them.
const ListTabs = () => {
    const theme = useTheme();
    const { t } = useTranslation();
    const { pathname } = useLocation();
    const counts = useSelector((store: RootState) => ({
        '/favourites': Object.keys(store.favourites.details).length,
        '/watch-later': Object.keys(store.watch.watchLater).length,
        '/watched': Object.keys(store.watch.watched).length,
    }));
    const lists = NAV_LINKS.filter((link) => link.isList);

    return (
        <Tabs
            value={lists.some((list) => list.path === pathname) ? pathname : false}
            variant="scrollable"
            scrollButtons={false}
            aria-label={t('header.my_lists')}
            sx={{
                mt: { xs: 1.5, md: 2.5 },
                minHeight: 40,
                borderBottom: `1px solid ${theme.palette.divider}`,
                '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0', backgroundColor: theme.palette.primary.main },
            }}
        >
            {lists.map(({ path, icon: Icon, label }) => (
                <Tab
                    key={path}
                    component={Link}
                    to={path}
                    value={path}
                    icon={<Icon fontSize="small" />}
                    iconPosition="start"
                    label={
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                            {t(label)}
                            <Box
                                component="span"
                                sx={{
                                    minWidth: 22,
                                    px: 0.75,
                                    borderRadius: '999px',
                                    fontSize: '0.75rem',
                                    lineHeight: '20px',
                                    backgroundColor: theme.palette.action.selected,
                                }}
                            >
                                {counts[path as keyof typeof counts]}
                            </Box>
                        </Box>
                    }
                    sx={{
                        minHeight: 40,
                        px: { xs: 1.25, sm: 2 },
                        // Icons are dropped on phones so all three tabs fit.
                        '& .MuiTab-icon': { display: { xs: 'none', sm: 'inline-flex' } },
                        textTransform: 'none',
                        fontWeight: 700,
                        color: theme.palette.text.secondary,
                        '&.Mui-selected': { color: theme.palette.text.primary },
                    }}
                />
            ))}
        </Tabs>
    );
};

export default ListTabs;
