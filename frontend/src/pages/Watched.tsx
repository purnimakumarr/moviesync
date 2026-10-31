import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import MovieListPage from '../components/lists/MovieListPage';
import { clearErrorWatched, clearWatched } from '../redux/features/watchSlice';
import { AppDispatch, RootState } from '../redux/store';

const Watched = () => {
    const theme = useTheme();
    const dispatch = useDispatch<AppDispatch>();
    const { watched, loadingWatched, errorWatched } = useSelector((state: RootState) => state.watch);
    const onErrorShown = useCallback(() => dispatch(clearErrorWatched()), [dispatch]);

    return (
        <MovieListPage
            ns="watched"
            icon={<CheckCircleIcon sx={{ color: theme.palette.watchedIcon }} />}
            movies={Object.values(watched)}
            loading={loadingWatched}
            error={errorWatched}
            onClear={() => dispatch(clearWatched())}
            onErrorShown={onErrorShown}
        />
    );
};

export default Watched;
