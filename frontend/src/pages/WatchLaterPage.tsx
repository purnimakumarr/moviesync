import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from "../redux/store";
import { useTranslation } from 'react-i18next';


import { Typography, Stack, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Box, CircularProgress, useTheme } from '@mui/material';
import Grid from '@mui/material/Grid2';
import WatchLaterIcon from "@mui/icons-material/WatchLater";

import Notification from '../components/common/Notification';
import BackButton from '../components/common/BackButton';
import MovieCard from '../components/common/MovieCard';

import { clearWatchLater } from '../redux/features/watchSlice';

import i18next from 'i18next';

const WatchLaterPage = () => {
    const { userID } = useSelector((store: RootState) => store.user);

    const [openConfirmModal, setOpenConfirmModal] = useState<boolean>(false);
    const { watchLater, loadingWatchLater, errorWatchLater } = useSelector((state: RootState) => state.watch);
    const numWatchLater = useSelector((state: RootState) => Object.keys(state.watch.watchLater).length);
    const [open, setOpen] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const theme = useTheme();

    const { t } = useTranslation();

    useEffect(() => {
        if (errorWatchLater) {
            setOpen(true);
        }
    }, [errorWatchLater]);

    const handleConfirmClear = () => {
        setOpenConfirmModal(false);
        dispatch(clearWatchLater(userID));
    };

    return (
        <>
            <BackButton />
            <Stack gap={3} sx={{ width: '100%', maxWidth: "1800px", marginX: 'auto', mb: 8, alignItems: 'center', justifyContent: 'center' }}>
                {!loadingWatchLater &&
                    <Stack direction='row' gap={2} sx={{ justifyContent: 'center', alignItems: 'center' }}>
                        <WatchLaterIcon sx={{ color: theme.palette.watchLaterIcon, fontSize: "clamp(1.6rem, 6vw, 2.4rem)" }} />
                        <Typography variant='h4' sx={{ textAlign: 'center', fontWeight: '700', fontSize: "clamp(1.4rem, 6vw, 2rem)" }}>
                            {t("watch_later.watch_later")} ({numWatchLater})
                        </Typography>
                    </Stack>}

                {
                    numWatchLater > 0 && !loadingWatchLater && <Button onClick={() => setOpenConfirmModal(true)} variant='contained' sx={{ height: 'fit-content' }}>{t("watch_later.clear_watch_later")}</Button>
                }
            </Stack>

            {errorWatchLater && <Notification open={open} message={i18next.exists(errorWatchLater) ? t(errorWatchLater) : errorWatchLater} severity='error' handleClose={() => setOpen(false)} />}

            {
                loadingWatchLater && <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                    <CircularProgress color="primary" />
                </Box>
            }

            {!loadingWatchLater && <Grid
                container
                spacing={2}
                sx={{
                    maxWidth: "100%",
                    margin: "1.8rem auto",
                    justifyContent: "center",
                }}
            >
                {
                    numWatchLater ? <Grid
                        size={12}
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "1.2rem",
                            justifyContent: 'center',
                            maxWidth: "90%",
                        }}
                    >
                        {(Object.values(watchLater)).map((movie) => <MovieCard movie={movie} key={movie.imdbID} />)}
                    </Grid> : (
                        <Box>
                            <Typography variant="h6" color="textSecondary" sx={{ textAlign: "center", marginY: 4 }}>{t("watch_later.no_watch_later_search")}</Typography>
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
                <DialogTitle>{t("watch_later.clear_watch_later")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{t("watch_later.confirm_clear_message")}</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmModal(false)} color="primary">{t("watch_later.cancel")}</Button>
                    <Button onClick={handleConfirmClear} sx={{
                        backgroundColor: theme.palette.primary.main,
                        "&:hover": {
                            backgroundColor: theme.palette.background.secondary
                        }
                    }} variant="contained">{t("watch_later.confirm")}</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default WatchLaterPage;
