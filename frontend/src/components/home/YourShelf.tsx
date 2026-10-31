import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Box, Typography, useTheme } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import StatTile from '../userProfile/StatTile';
import { RootState } from '../../redux/store';
import { getTitle, movieKey, moviePath, posterUrl } from '../../utils/tmdb';

const UP_NEXT_SIZE = 3;

// Signed-in users' list counts, plus the next few titles in Watch Later.
function YourShelf() {
    const { t } = useTranslation();
    const theme = useTheme();
    const navigate = useNavigate();
    const { details: favourites, loading: loadingFavourites } = useSelector((store: RootState) => store.favourites);
    const { watchLater, watched, loadingWatchLater, loadingWatched } = useSelector((store: RootState) => store.watch);

    const upNext = Object.values(watchLater)
        .filter((movie) => movie.poster_path)
        .slice(0, UP_NEXT_SIZE);

    return (
        <Box component="section" aria-labelledby="home-shelf" sx={{ mb: { xs: 5, md: 8 } }}>
            <Typography id="home-shelf" variant="h4" component="h2" sx={{ fontWeight: 800, mb: 2 }}>
                {t('home.shelf_heading')}
            </Typography>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: upNext.length ? '1fr 1fr' : '1fr' } }}>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, alignContent: 'start' }}>
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
                {upNext.length > 0 && (
                    <Box>
                        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700, mb: 1 }}>
                            {t('home.up_next')}
                        </Typography>
                        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: `repeat(${UP_NEXT_SIZE}, 1fr)`, maxWidth: 360 }}>
                            {upNext.map((movie) => (
                                <Box
                                    key={movieKey(movie)}
                                    component={Link}
                                    to={moviePath(movie)}
                                    aria-label={getTitle(movie)}
                                    sx={{ borderRadius: '10px', overflow: 'hidden', boxShadow: `0 0 10px 1px ${theme.palette.primary.main}33` }}
                                >
                                    <Box
                                        component="img"
                                        src={posterUrl(movie, 'w185') ?? undefined}
                                        alt=""
                                        loading="lazy"
                                        sx={{ display: 'block', width: '100%', aspectRatio: '2 / 3', objectFit: 'cover' }}
                                    />
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default YourShelf;
