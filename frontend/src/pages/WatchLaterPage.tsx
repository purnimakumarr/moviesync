import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material';
import WatchLaterIcon from '@mui/icons-material/WatchLater';

import MovieListPage from '../components/lists/MovieListPage';
import { clearErrorWatchLater, clearWatchLater } from '../redux/features/watchSlice';
import { AppDispatch, RootState } from '../redux/store';

const WatchLaterPage = () => {
    const theme = useTheme();
    const dispatch = useDispatch<AppDispatch>();
    const { watchLater, loadingWatchLater, errorWatchLater } = useSelector((state: RootState) => state.watch);
    const onErrorShown = useCallback(() => dispatch(clearErrorWatchLater()), [dispatch]);

    return (
        <MovieListPage
            ns="watch_later"
            icon={<WatchLaterIcon sx={{ color: theme.palette.watchLaterIcon }} />}
            movies={Object.values(watchLater)}
            loading={loadingWatchLater}
            error={errorWatchLater}
            onClear={() => dispatch(clearWatchLater())}
            onErrorShown={onErrorShown}
        />
    );
};

export default WatchLaterPage;
