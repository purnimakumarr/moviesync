import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';

import MovieListPage from '../components/lists/MovieListPage';
import { clearError, clearFavourites } from '../redux/features/favouritesSlice';
import { AppDispatch, RootState } from '../redux/store';

const Favourites = () => {
    const theme = useTheme();
    const dispatch = useDispatch<AppDispatch>();
    const { details, loading, error } = useSelector((state: RootState) => state.favourites);
    const onErrorShown = useCallback(() => dispatch(clearError()), [dispatch]);

    return (
        <MovieListPage
            ns="favourites"
            icon={<FavoriteIcon sx={{ color: theme.palette.favouriteIcon }} />}
            movies={Object.values(details)}
            loading={loading}
            error={error}
            onClear={() => dispatch(clearFavourites())}
            onErrorShown={onErrorShown}
        />
    );
};

export default Favourites;
