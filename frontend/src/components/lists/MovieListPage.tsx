import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    useTheme,
} from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import MovieFilterIcon from '@mui/icons-material/MovieFilter';

import { useNotification } from '../common/Notification';
import MovieCard from '../common/MovieCard';
import MovieGrid from '../common/MovieGrid';
import PageHeader from '../common/PageHeader';
import EmptyState from '../common/EmptyState';
import CardSkeleton from '../search/CardSkeleton';
import ListTabs from './ListTabs';
import { Movie } from '../../types';
import { movieKey } from '../../utils/tmdb';

type ListNamespace = 'favourites' | 'watch_later' | 'watched';

type MovieListPageProps = {
    // i18n namespace; keys follow `<ns>.<ns>`, `<ns>.clear_<ns>`, `<ns>.no_<ns>_search`.
    ns: ListNamespace;
    icon: ReactNode;
    movies: Movie[];
    loading: boolean;
    error: string | null;
    onClear: () => void;
    onErrorShown: () => void;
};

// Shared layout for Favourites, Watch Later and Watched.
const MovieListPage = ({ ns, icon, movies, loading, error, onClear, onErrorShown }: MovieListPageProps) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        if (error) {
            notify({
                message: i18next.exists(error) ? t(error) : error,
                severity: 'error',
            });
            onErrorShown();
        }
    }, [error, notify, t, onErrorShown]);

    const handleConfirmClear = () => {
        setConfirmOpen(false);
        onClear();
    };

    return (
        <>
            <ListTabs />
            <PageHeader
                icon={icon}
                title={t(`${ns}.${ns}`)}
                count={loading ? undefined : movies.length}
                actions={!loading && movies.length > 0 && (
                    <Button
                        variant="outlined"
                        startIcon={<DeleteSweepIcon />}
                        onClick={() => setConfirmOpen(true)}
                        sx={{ py: 1 }}
                    >
                        {t(`${ns}.clear_${ns}`)}
                    </Button>
                )}
            />

            {loading && <CardSkeleton count={6} />}

            {!loading && movies.length > 0 && (
                <MovieGrid label={t(`${ns}.${ns}`)}>
                    {movies.map((movie) => (
                        <MovieCard movie={movie} key={movieKey(movie)} />
                    ))}
                </MovieGrid>
            )}

            {!loading && movies.length === 0 && (
                <EmptyState
                    icon={<MovieFilterIcon />}
                    title={t('lists.empty_title')}
                    description={t(`${ns}.no_${ns}_search`)}
                    actionLabel={t('app.start_searching')}
                    onAction={() => navigate('/search')}
                />
            )}

            <Dialog
                sx={{
                    "& .MuiPaper-root": {
                        backgroundColor: theme.palette.background.default,
                        borderRadius: '12px',
                        color: theme.palette.text.primary,
                    }
                }}
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>{t(`${ns}.clear_${ns}`)}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{t(`${ns}.confirm_clear_message`)}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)} color="primary">
                        {t(`${ns}.cancel`)}
                    </Button>
                    <Button
                        sx={{
                            backgroundColor: theme.palette.primary.main,
                            "&:hover": { backgroundColor: theme.palette.background.secondary },
                        }}
                        onClick={handleConfirmClear}
                        variant="contained"
                    >
                        {t(`${ns}.confirm`)}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default MovieListPage;
