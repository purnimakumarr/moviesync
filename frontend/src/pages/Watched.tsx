import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from "../redux/store";
import { useTranslation } from 'react-i18next';

import { Typography, Stack, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Box, CircularProgress, useTheme } from '@mui/material';
import Grid from '@mui/material/Grid2';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import MovieCard from '../components/common/MovieCard';
import BackButton from '../components/common/BackButton';
import { useNotification } from '../components/common/Notification';

import { clearWatched, clearErrorWatched } from '../redux/features/watchSlice';

import i18next from 'i18next';

const Watched = () => {
    const { userID } = useSelector((store: RootState) => store.user);

    const [openConfirmModal, setOpenConfirmModal] = useState<boolean>(false);
    const { watched, loadingWatched, errorWatched } = useSelector((state: RootState) => state.watch);
    const numWatched = useSelector((state: RootState) => Object.keys(state.watch.watched).length);

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const theme = useTheme();
    const { notify } = useNotification();

    const { t } = useTranslation();

    useEffect(() => {
        if (errorWatched) {
            notify({
                message: i18next.exists(errorWatched) ? t(errorWatched) : errorWatched,
                severity: 'error',
            });
            dispatch(clearErrorWatched());
        }
    }, [errorWatched, notify, t, dispatch]);

    const handleConfirmClear = () => {
        setOpenConfirmModal(false);
        dispatch(clearWatched(userID))
    };

    return (
        <>
            <BackButton />
            <Stack gap={3} sx={{ width: '100%', maxWidth: "1800px", marginX: 'auto', mb: 8, alignItems: 'center', justifyContent: 'center' }}>
                {!loadingWatched &&
                    <Stack direction='row' gap={2} sx={{ justifyContent: 'center', alignItems: 'center' }}>
                        <CheckCircleIcon sx={{ color: theme.palette.watchedIcon, fontSize: "clamp(1.6rem, 6vw, 2.4rem)" }} />
                        <Typography variant='h4' sx={{ textAlign: 'center', fontWeight: '700', fontSize: "clamp(1.4rem, 6vw, 2rem)" }}>
                            {t("watched.watched")} ({numWatched})
                        </Typography>
                    </Stack>}

                {!loadingWatched && numWatched > 0 &&
                    <Button onClick={() => setOpenConfirmModal(true)} variant='contained' sx={{ height: 'fit-content' }}>{t("watched.clear_watched")}</Button>
                }
            </Stack>

            {
                loadingWatched &&
                <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                    <CircularProgress color="primary" />
                </Box>
            }

            {!loadingWatched && <Grid
                container
                spacing={2}
                sx={{
                    maxWidth: "100%",
                    margin: "1.8rem auto",
                    justifyContent: "center",
                }}
            >
                {numWatched > 0 ?
                    <Grid
                        size={12}
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "1.2rem",
                            justifyContent: 'center',
                            maxWidth: "90%",
                        }}
                    >
                        {(Object.values(watched)).map((movie) => <MovieCard movie={movie} key={movie.imdbID} />)}
                    </Grid> : (
                        <Box>
                            <Typography variant="h6" color="textSecondary" sx={{ textAlign: "center", marginY: 4 }}>{t("watched.no_watched_search")}</Typography>
                            <Button fullWidth variant="contained" size="large" onClick={() => navigate(`/search`)}>{t("app.start_searching")}</Button>
                        </Box>
                    )}
            </Grid>}

            <Dialog sx={{
                "& .MuiPaper-root": {
                    backgroundColor: theme.palette.background.default,
                    borderRadius: '12px',
                    color: theme.palette.text.primary,
                }
            }} open={openConfirmModal} onClose={() => setOpenConfirmModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{t("watched.clear_watched")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{t("watched.confirm_clear_message")}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmModal(false)} color="primary">{t("watched.cancel")}</Button>
                    <Button onClick={handleConfirmClear} sx={{
                        backgroundColor: theme.palette.primary.main,
                        "&:hover": {
                            backgroundColor: theme.palette.background.secondary
                        }
                    }} variant="contained">{t("watched.confirm")}</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default Watched;
