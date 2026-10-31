import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Box, Typography, useTheme } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import StatTile from '../userProfile/StatTile';
import { RootState } from '../../redux/store';

// Signed-in users' list counts, each leading to its list.
function YourShelf() {
    const { t } = useTranslation();
    const theme = useTheme();
    const navigate = useNavigate();
    const { details: favourites, loading: loadingFavourites } = useSelector((store: RootState) => store.favourites);
    const { watchLater, watched, loadingWatchLater, loadingWatched } = useSelector((store: RootState) => store.watch);

    return (
        <Box component="section" aria-labelledby="home-shelf" sx={{ mb: { xs: 5, md: 8 } }}>
            <Typography id="home-shelf" variant="h4" component="h2" sx={{ fontWeight: 800, mb: 2 }}>
                {t('home.shelf_heading')}
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
                <StatTile
                    icon={<FavoriteIcon />}
                    label={t('header.favourites')}
                    value={Object.keys(favourites).length}
                    accent={theme.palette.favouriteIcon}
                    onClick={() => navigate('/favourites')}
                    loading={loadingFavourites}
                />
                <StatTile
                    icon={<WatchLaterIcon />}
                    label={t('header.watch_later')}
                    value={Object.keys(watchLater).length}
                    accent={theme.palette.watchLaterIcon}
                    onClick={() => navigate('/watch-later')}
                    loading={loadingWatchLater}
                />
                <StatTile
                    icon={<CheckCircleIcon />}
                    label={t('header.watched')}
                    value={Object.keys(watched).length}
                    accent={theme.palette.watchedIcon}
                    onClick={() => navigate('/watched')}
                    loading={loadingWatched}
                />
            </Box>
        </Box>
    );
}

export default YourShelf;
